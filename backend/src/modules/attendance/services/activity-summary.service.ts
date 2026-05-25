import { Brackets, Repository } from "typeorm";
import { AppDataSource } from "../../core";
import { ActivityType } from "../../shared";
import { Attendance } from "../../shared/entities/Attendance";
import { ClassroomActivity } from "../../shared/entities/ClassroomActivity";
import { Milestone } from "../../shared/entities/Milestone";
import { MilestoneStatus, AttendanceStatus } from "../../shared/entities/EntityEnums";
import { Student } from "../../shared/entities/StudentEntity";
import { Parent } from "../../shared/entities/Parent";
import { pdfService, type AttendancePdfRow } from "../../shared/services/pdf.service";
import { getNigeriaStartOfDay, getNigeriaEndOfDay, getNigeriaDayName } from "../../shared/utils/date-util";
import { formatDateKey } from "../../shared/utils/date-util";
import { logger } from "../../shared/utils/logger";
import { emailService } from "../../shared/services/email.service";
import { buildDailyActivityPdfModel } from "../utils/daily-activity-report.mapper";
import { mapMilestonesToLearningRows } from "../utils/daily-activity-report-learning.mapper";
import { StaffClassesAndSubject } from "../../shared/entities/StaffClassesAndSubject";
import { getSchoolPortalUrl } from "../../shared/services/utils";
import { studentService } from "../../student/services/student.service";

export interface ActivitySummaryData {
  meals: string[];
  naps: { startTime: string; endTime?: string }[];
  pottyDiapers: string[];
  photoUrls: string[];
}

/**
 * Get the Monday (start of week) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if today is the student's last scheduled day of the week.
 * Student.schedule is e.g. ["Monday","Tuesday","Wednesday","Thursday","Friday"]
 */
export function isLastScheduledDayOfWeek(schedule?: string[]): boolean {
  if (!schedule || schedule.length === 0) return false;
  const todayName = getNigeriaDayName(new Date());
  const normalizedSchedule = schedule.map((d) => d.trim().toLowerCase());
  const todayNorm = todayName.toLowerCase();
  if (!normalizedSchedule.includes(todayNorm)) return false;
  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const todayIndex = dayOrder.indexOf(todayNorm);
  const lastScheduledIndex = Math.max(...normalizedSchedule.map((d) => dayOrder.indexOf(d)));
  return todayIndex === lastScheduledIndex;
}

function sanitizeFilenamePart(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "report";
}

function formatTimeForDisplay(time?: string | null): string {
  if (!time?.trim()) return "—";
  const parts = time.trim().split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return time.trim();
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

function formatAttendanceStatusLabel(status?: AttendanceStatus | null): string {
  if (!status) return "—";
  switch (status) {
    case AttendanceStatus.PRESENT:
      return "Present";
    case AttendanceStatus.ABSENT:
      return "Absent";
    case AttendanceStatus.LATE:
      return "Late";
    case AttendanceStatus.LEAVE:
      return "Leave";
    case AttendanceStatus.EXCUSED:
      return "Excused";
    default:
      return String(status).replace(/_/g, " ");
  }
}

function pickBestAttendanceLog(logs: Attendance[]): Attendance | undefined {
  if (!logs.length) return undefined;
  const withBoth = logs.find((l) => l.timeIn && l.timeOut);
  if (withBoth) return withBoth;
  return logs[logs.length - 1];
}

class ActivitySummaryService {
  private get studentRepository(): Repository<Student> {
    return AppDataSource.getRepository(Student);
  }

  private get classroomActivityRepository(): Repository<ClassroomActivity> {
    return AppDataSource.getRepository(ClassroomActivity);
  }

  private get attendanceRepository(): Repository<Attendance> {
    return AppDataSource.getRepository(Attendance);
  }

  private get milestoneRepository(): Repository<Milestone> {
    return AppDataSource.getRepository(Milestone);
  }

  /**
   * Parent portal gallery URL (uses shared getSchoolPortalUrl).
   */
  private buildParentGalleryUrl(subDomain?: string): string {
    return getSchoolPortalUrl("/parent/dashboard", subDomain);
  }

  private async resolveTeacherName(student: Student, attendanceId?: number): Promise<string> {
    try {
      // 1. Try to get teacher from attendance record
      if (attendanceId) {
        const row = await this.attendanceRepository.findOne({
          where: { id: attendanceId },
          relations: ["teacher", "teacher.user"],
        });
        const u = row?.teacher?.user;
        if (u) {
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
          if (name) return name;
        }
      }

      // 2. Fallback to assigned classroom teacher
      const classroomId = student.classroomId || student.currentClassroom?.id;
      if (classroomId) {
        const staffClassRepo = AppDataSource.getRepository(StaffClassesAndSubject);
        const staffAssignment = await staffClassRepo.findOne({
          where: { classroomId },
          relations: ["staff", "staff.user"],
        });
        const u = staffAssignment?.staff?.user;
        if (u) {
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
          if (name) return name;
        }
      }

      return "—";
    } catch (e) {
      logger.warn("resolveTeacherName failed", { studentId: student.id, attendanceId, e });
      return "—";
    }
  }

  async fetchActivitiesForStudent(
    studentId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ClassroomActivity[]> {
    return this.classroomActivityRepository
      .createQueryBuilder("activity")
      .innerJoin("activity.studentActivities", "csa")
      .where("csa.studentId = :studentId", { studentId })
      .andWhere("activity.createdAt >= :startDate", { startDate })
      .andWhere("activity.createdAt <= :endDate", { endDate })
      .orderBy("activity.createdAt", "ASC")
      .getMany();
  }

  async fetchAttendanceRowsForReport(
    student: Student,
    startDate: Date,
    endDate: Date,
    isWeekly: boolean
  ): Promise<AttendancePdfRow[]> {
    if (!student.schoolId) return [];

    const logs = await this.attendanceRepository
      .createQueryBuilder("attendance")
      .where("attendance.studentId = :studentId", { studentId: student.id })
      .andWhere("(attendance.schoolId = :schoolId OR attendance.schoolId IS NULL)", {
        schoolId: student.schoolId,
      })
      .andWhere("attendance.date >= :startDate", { startDate: formatDateKey(startDate) })
      .andWhere("attendance.date <= :endDate", { endDate: formatDateKey(endDate) })
      .orderBy("attendance.date", "ASC")
      .addOrderBy("attendance.createdAt", "ASC")
      .getMany();

    const logsByDate = logs.reduce<Record<string, Attendance[]>>((acc, log) => {
      const key = formatDateKey(log.date);
      (acc[key] = acc[key] || []).push(log);
      return acc;
    }, {});

    if (!isWeekly) {
      const todayKey = formatDateKey(endDate);
      const best = pickBestAttendanceLog(logsByDate[todayKey] || []);
      return [
        {
          status: formatAttendanceStatusLabel(best?.status),
          clockIn: formatTimeForDisplay(best?.timeIn),
          clockOut: formatTimeForDisplay(best?.timeOut),
        },
      ];
    }

    const schedule = (
      student.schedule?.length
        ? student.schedule
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    ).map((d) => d.trim().toLowerCase());

    const rows: AttendancePdfRow[] = [];
    const cur = new Date(startDate.getTime());
    const endDay = new Date(endDate.getTime());

    while (cur <= endDay) {
      const dayName = getNigeriaDayName(cur).toLowerCase();
      if (schedule.includes(dayName)) {
        const key = formatDateKey(cur);
        const best = pickBestAttendanceLog(logsByDate[key] || []);
        rows.push({
          date: formatDateKey(cur),
          status: formatAttendanceStatusLabel(best?.status),
          clockIn: formatTimeForDisplay(best?.timeIn),
          clockOut: formatTimeForDisplay(best?.timeOut),
        });
      }
      cur.setDate(cur.getDate() + 1);
    }

    return rows;
  }

  async fetchMilestonesForReport(student: Student, startDate: Date, endDate: Date): Promise<Milestone[]> {
    const schoolId = student.schoolId;
    if (!schoolId) return [];

    const classroomId = student.classroomId || student.currentClassroom?.id;
    const reportStart = formatDateKey(startDate);
    const reportEnd = formatDateKey(endDate);

    const qb = this.milestoneRepository
      .createQueryBuilder("milestone")
      .leftJoinAndSelect("milestone.subject", "subject")
      .leftJoinAndSelect("subject.curriculum", "curriculum")
      .leftJoinAndSelect(
        "milestone.studentAssessmentScores",
        "score",
        "score.studentId = :studentId",
        { studentId: student.id }
      )
      .where("milestone.schoolId = :schoolId", { schoolId })
      .andWhere("milestone.status != :draft", { draft: MilestoneStatus.DRAFT })
      .andWhere("(milestone.startDate IS NULL OR milestone.startDate <= :reportEnd)", { reportEnd })
      .andWhere("(milestone.endDate IS NULL OR milestone.endDate >= :reportStart)", { reportStart });

    const scoreSubQuery = qb
      .subQuery()
      .select("1")
      .from("studentAssessmentScore", "sas")
      .where("sas.milestoneId = milestone.id")
      .andWhere("sas.studentId = :studentId")
      .getQuery();

    if (classroomId) {
      const scsSubQuery = qb
        .subQuery()
        .select("1")
        .from("staffClassesAndSubject", "scs")
        .where("scs.classroomId = :classroomId")
        .andWhere("scs.subjectId = milestone.subjectId")
        .getQuery();
      const ccSubQuery = qb
        .subQuery()
        .select("1")
        .from("curriculumClassrooms", "cc")
        .where("cc.classroomId = :classroomId")
        .andWhere("cc.curriculumId = subject.curriculumId")
        .getQuery();

      qb.andWhere(
        new Brackets((b) =>
          b
            .where(`EXISTS (${scsSubQuery})`)
            .orWhere(`EXISTS (${ccSubQuery})`)
            .orWhere(`EXISTS (${scoreSubQuery})`)
        ),
        { classroomId, studentId: student.id }
      );
    } else {
      qb.andWhere(`EXISTS (${scoreSubQuery})`, { studentId: student.id });
    }

    return qb.orderBy("subject.name", "ASC").addOrderBy("milestone.startDate", "ASC").getMany();
  }

  /**
   * Aggregate classroom activities for a student within a date range.
   * Returns structured data for legacy callers.
   */
  async getActivitySummaryForStudent(
    studentId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ActivitySummaryData> {
    const result: ActivitySummaryData = {
      meals: [],
      naps: [],
      pottyDiapers: [],
      photoUrls: [],
    };

    try {
      const activities = await this.fetchActivitiesForStudent(studentId, startDate, endDate);

      for (const a of activities) {
        switch (a.activityType) {
          case ActivityType.MEAL:
            if (a.foodItems) {
              const mealLabel = a.mealType
                ? `${a.mealType}: ${a.foodItems}${a.timeGiven ? ` (${a.timeGiven})` : ""}`
                : a.foodItems;
              result.meals.push(mealLabel);
            }
            break;
          case ActivityType.NAP:
            if (a.startTime) {
              result.naps.push({
                startTime: a.startTime,
                endTime: a.endTime || undefined,
              });
            }
            break;
          case ActivityType.BATHROOM:
            if (a.bathroomType) {
              const label = `${a.bathroomType}${a.timeGiven ? ` at ${a.timeGiven}` : ""}`;
              result.pottyDiapers.push(label);
            }
            break;
          case ActivityType.PHOTO:
            if (a.photoUrl) {
              result.photoUrls.push(a.photoUrl);
            }
            break;
          default:
            break;
        }
      }
    } catch (error) {
      logger.error("Failed to fetch activity summary for student", { studentId, error });
    }

    return result;
  }

  /**
   * Get daily activity summary (for a single day)
   */
  async getDailySummary(studentId: number, date: Date): Promise<ActivitySummaryData> {
    const start = getNigeriaStartOfDay(date);
    const end = getNigeriaEndOfDay(date);
    return this.getActivitySummaryForStudent(studentId, start, end);
  }

  /**
   * Get weekly activity summary (from Monday of the week to the given date)
   */
  async getWeeklySummary(studentId: number, throughDate: Date): Promise<ActivitySummaryData> {
    const weekStart = getWeekStart(throughDate);
    const end = getNigeriaEndOfDay(throughDate);
    return this.getActivitySummaryForStudent(studentId, weekStart, end);
  }

  /**
   * Ensure parents (with user emails) are loaded even when relations were omitted on the student entity.
   */
  private async resolveParentsWithEmail(student: Student): Promise<Parent[]> {
    const hasEmail = (p: Parent) => Boolean(p.user?.email?.trim());
    let parents = (student.parents ?? []).filter(hasEmail);

    const needsReload =
      parents.length === 0 ||
      (student.parents ?? []).some((p) => Boolean(p.userId) && !hasEmail(p)) ||
      !student.user ||
      !student.school;

    if (needsReload || !student.user || !student.school) {
      const reloaded = await this.studentRepository.findOne({
        where: { id: student.id },
        relations: ["parents", "parents.user", "school", "user"],
      });
      if (reloaded) {
        student.parents = reloaded.parents;
        student.school = student.school ?? reloaded.school;
        student.user = student.user ?? reloaded.user;
        parents = (reloaded.parents ?? []).filter(hasEmail);
      }
    }

    return parents;
  }

  private async fetchReportDataForCheckout(
    student: Student,
    startDate: Date,
    endDate: Date,
    isWeekly: boolean
  ): Promise<{
    activities: ClassroomActivity[];
    attendanceRows: AttendancePdfRow[];
    learningRows: ReturnType<typeof mapMilestonesToLearningRows>;
    overallDevelopmentPercent: number | null;
  }> {
    const [activitiesResult, attendanceResult, milestonesResult, perfResult] = await Promise.allSettled([
      this.fetchActivitiesForStudent(student.id, startDate, endDate),
      this.fetchAttendanceRowsForReport(student, startDate, endDate, isWeekly),
      this.fetchMilestonesForReport(student, startDate, endDate),
      student.schoolId
        ? studentService.getGradedMilestonePerformancePercentMap(student.schoolId, [student.id])
        : Promise.resolve(new Map<number, number | null>()),
    ]);

    const activities = activitiesResult.status === "fulfilled" ? activitiesResult.value : [];
    const attendanceRows = attendanceResult.status === "fulfilled" ? attendanceResult.value : [];
    const milestones = milestonesResult.status === "fulfilled" ? milestonesResult.value : [];
    const perfMap =
      perfResult.status === "fulfilled" ? perfResult.value : new Map<number, number | null>();

    if (activitiesResult.status === "rejected") {
      logger.error("Daily report: failed to fetch activities", {
        studentId: student.id,
        error: activitiesResult.reason,
      });
    }
    if (attendanceResult.status === "rejected") {
      logger.error("Daily report: failed to fetch attendance", {
        studentId: student.id,
        error: attendanceResult.reason,
      });
    }
    if (milestonesResult.status === "rejected") {
      logger.error("Daily report: failed to fetch milestones", {
        studentId: student.id,
        error: milestonesResult.reason,
      });
    }
    if (perfResult.status === "rejected") {
      logger.error("Daily report: failed to fetch performance", {
        studentId: student.id,
        error: perfResult.reason,
      });
    }

    return {
      activities,
      attendanceRows,
      learningRows: mapMilestonesToLearningRows(milestones, student.id),
      overallDevelopmentPercent: perfMap.get(student.id) ?? null,
    };
  }

  /**
   * Send activity summary email to all parents when a child is checked out.
   * Daily: when any checkout. Weekly: when checkout is on student's last scheduled day of the week.
   */
  async sendActivitySummaryOnCheckout(student: Student, options?: { attendanceId?: number }): Promise<void> {
    const parents = await this.resolveParentsWithEmail(student);
    if (parents.length === 0) {
      logger.warn("Activity summary skipped: no parent with email", { studentId: student.id });
      return;
    }

    const school = student.school;
    const subDomain = school?.subDomain;
    const centerName = school?.schoolName || "Your Center";
    const childFirstName = student.user?.firstName || "Your child";
    const childFullName = student.user
      ? [student.user.firstName, student.user.lastName].filter(Boolean).join(" ").trim() || "Student"
      : "Student";

    const today = new Date();
    const isWeekly = isLastScheduledDayOfWeek(student.schedule);

    const startDate = isWeekly ? getWeekStart(today) : getNigeriaStartOfDay(today);
    const endDate = getNigeriaEndOfDay(today);

    const dateOrPeriod = isWeekly
      ? `${formatDateKey(startDate)} – ${formatDateKey(today)}`
      : formatDateKey(today);

    const teacherName = await this.resolveTeacherName(student, options?.attendanceId);

    const galleryUrl = this.buildParentGalleryUrl(subDomain);

    const { activities, attendanceRows, learningRows, overallDevelopmentPercent } =
      await this.fetchReportDataForCheckout(student, startDate, endDate, isWeekly);

    const pdfModel = buildDailyActivityPdfModel(activities, {
      childFullName,
      schoolName: centerName,
      teacherName,
      isWeekly,
      dateRangeLabel: dateOrPeriod,
      galleryUrl,
      attendanceRows,
      learningRows,
      overallDevelopmentPercent,
    });

    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await pdfService.generateDailyActivityReportPDF({
        school: school ?? {},
        model: pdfModel,
      });
    } catch (e) {
      logger.error("Daily activity PDF generation failed; sending email without attachment", {
        studentId: student.id,
        error: e,
      });
    }

    const safeChild = sanitizeFilenamePart(childFirstName);
    const safeDate = sanitizeFilenamePart(dateOrPeriod.replace(/\s+/g, "_"));
    const pdfFilename = `${isWeekly ? "Weekly" : "Daily"}_Activity_Report_${safeChild}_${safeDate}.pdf`;

    const emailPromises = parents.map((parent) =>
      emailService.sendActivitySummaryEmail({
        parentEmail: parent.user!.email!,
        parentName: parent.user
          ? [parent.user.firstName, parent.user.lastName].filter(Boolean).join(" ") || "Parent"
          : "Parent",
        childFirstName,
        centerName,
        periodType: isWeekly ? "weekly" : "daily",
        dateOrPeriod,
        subDomain,
        pdfBuffer,
        pdfFilename,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    results.forEach((result, i) => {
      if (result.status === "rejected") {
        logger.error("Activity summary email failed", {
          parentEmail: parents[i]?.user?.email,
          studentId: student.id,
          error: result.reason,
        });
      }
    });
  }
}

export const activitySummaryService = new ActivitySummaryService();
