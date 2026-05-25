/**
 * End-to-end test for the daily / weekly activity report pipeline (checkout → PDF → parent email).
 * Run: npm run test:daily-report
 *
 * No Postman required — exercises sendActivitySummaryOnCheckout with realistic fixtures,
 * real PDF HTML assembly, and mocked email / Puppeteer.
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { activitySummaryService } from "../services/activity-summary.service";
import { pdfService } from "../../shared/services/pdf.service";
import { emailService } from "../../shared/services/email.service";
import { studentService } from "../../student/services/student.service";
import { Student } from "../../shared/entities/StudentEntity";
import { ClassroomActivity } from "../../shared/entities/ClassroomActivity";
import { Milestone } from "../../shared/entities/Milestone";
import {
  ActivityType,
  GradingStatus,
  GradingType,
  MealType,
  MilestoneStatus,
  Skills,
} from "../../shared/entities/EntityEnums";
import { mapMilestonesToLearningRows } from "../utils/daily-activity-report-learning.mapper";
import { buildDailyActivityPdfModel } from "../utils/daily-activity-report.mapper";

const STUDENT_ID = 101;
const SCHOOL_ID = 10;
const ATTENDANCE_ID = 501;

function buildTestStudent(schedule?: string[]): Student {
  return {
    id: STUDENT_ID,
    schoolId: SCHOOL_ID,
    classroomId: 5,
    schedule: schedule ?? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    user: { firstName: "Ada", lastName: "Okonkwo" },
    school: {
      schoolName: "Sunshine Nursery",
      subDomain: "sunshine",
      brandColor: "#008080",
    },
    parents: [
      {
        user: { email: "parent@example.com", firstName: "Chioma", lastName: "Okonkwo" },
      },
    ],
  } as Student;
}

function buildTestActivities(): ClassroomActivity[] {
  const now = new Date();
  return [
    {
      id: 1,
      activityType: ActivityType.MEAL,
      mealType: MealType.BREAKFAST,
      foodItems: "Oatmeal and banana",
      timeGiven: "8:30 AM",
      createdAt: now,
    },
    {
      id: 2,
      activityType: ActivityType.WATER,
      timeGiven: "10:00 AM",
      notes: "Full cup",
      createdAt: now,
    },
  ] as ClassroomActivity[];
}

function buildTestMilestones(): Milestone[] {
  return [
    {
      id: 1,
      title: "Identify letters A–M",
      status: MilestoneStatus.ACTIVE,
      gradingType: GradingType.NUMERICAL_SCORE,
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-05-31"),
      subjectId: 10,
      subject: {
        id: 10,
        name: "Literacy",
        description: "Letter recognition and sounds",
        skills: [Skills.LITERACY, Skills.COGNITIVE],
        curriculum: { title: "Spring Term 2026" },
      },
      studentAssessmentScores: [
        {
          studentId: STUDENT_ID,
          status: GradingStatus.GRADED,
          score: 2,
          gradeValue: "2",
        },
      ],
    },
    {
      id: 2,
      title: "Trace letters",
      status: MilestoneStatus.ACTIVE,
      gradingType: GradingType.FIVE_LEVEL_SCALE,
      startDate: new Date("2026-05-10"),
      endDate: new Date("2026-05-20"),
      subjectId: 10,
      subject: {
        id: 10,
        name: "Literacy",
        description: "Letter recognition and sounds",
        skills: [Skills.LITERACY, Skills.COGNITIVE],
        curriculum: { title: "Spring Term 2026" },
      },
      studentAssessmentScores: [
        {
          studentId: STUDENT_ID,
          status: GradingStatus.IN_PROGRESS,
        },
      ],
    },
  ] as Milestone[];
}

function maybeSaveArtifact(name: string, html: string): void {
  if (process.env["SAVE_E2E_ARTIFACTS"] !== "1") return;
  const dir = join(process.cwd(), "test-output");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), html, "utf-8");
}

describe("Daily activity report e2e", () => {
  let capturedEmail: {
    periodType?: string;
    pdfFilename?: string;
    pdfBuffer?: Buffer;
  } = {};
  let capturedHtml = "";

  beforeEach(() => {
    capturedEmail = {};
    capturedHtml = "";

    jest.spyOn(activitySummaryService, "resolveTeacherName" as never).mockResolvedValue("Mrs. Bello" as never);
    jest.spyOn(activitySummaryService, "fetchActivitiesForStudent").mockResolvedValue(buildTestActivities());
    jest.spyOn(studentService, "getGradedMilestonePerformancePercentMap").mockResolvedValue(
      new Map([[STUDENT_ID, 66.67]])
    );

    jest.spyOn(pdfService, "generatePDFFromHTML").mockImplementation(async (html: string) => {
      capturedHtml = html;
      maybeSaveArtifact("daily-activity-report-e2e.html", html);
      return Buffer.from(html, "utf-8");
    });

    jest.spyOn(emailService, "sendActivitySummaryEmail").mockImplementation(async (opts) => {
      capturedEmail = {
        periodType: opts.periodType,
        pdfFilename: opts.pdfFilename,
        pdfBuffer: opts.pdfBuffer,
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("generates a daily report PDF with attendance, learning, grade, and performance on checkout", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-13T14:00:00.000Z")); // Wednesday

    jest.spyOn(activitySummaryService, "fetchAttendanceRowsForReport").mockResolvedValue([
      { status: "Present", clockIn: "8:02 AM", clockOut: "3:45 PM" },
    ]);
    jest.spyOn(activitySummaryService, "fetchMilestonesForReport").mockResolvedValue(buildTestMilestones());

    await activitySummaryService.sendActivitySummaryOnCheckout(buildTestStudent(), {
      attendanceId: ATTENDANCE_ID,
    });

    expect(capturedEmail.periodType).toBe("daily");
    expect(capturedEmail.pdfFilename).toMatch(/^Daily_Activity_Report_/);
    expect(capturedEmail.pdfBuffer).toBeDefined();
    expect(capturedEmail.pdfBuffer!.length).toBeGreaterThan(0);

    expect(capturedHtml).toContain("I. Attendance");
    expect(capturedHtml).toContain("II. Learning");
    expect(capturedHtml).toContain("Status</th>");
    expect(capturedHtml).toContain("Present");
    expect(capturedHtml).toContain("8:02 AM");
    expect(capturedHtml).toContain("3:45 PM");
    expect(capturedHtml).toContain("Literacy");
    expect(capturedHtml).toContain("Spring Term 2026");
    expect(capturedHtml).toContain("Identify letters A–M");
    expect(capturedHtml).toContain("Overall development: 66.67%");
    expect(capturedHtml).toContain("Oatmeal and banana");
    expect(capturedHtml).toMatch(/rowspan="2"/);
    expect(capturedHtml).toContain("Graded");
    expect(capturedHtml).toContain("66.67%");
    expect(capturedHtml).not.toContain("{{attendanceTableBody}}");
  });

  it("generates a weekly report with multi-day attendance on the last scheduled weekday", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-08T14:00:00.000Z")); // Friday

    jest.spyOn(activitySummaryService, "fetchAttendanceRowsForReport").mockResolvedValue([
      { date: "2026-05-04", status: "Present", clockIn: "8:00 AM", clockOut: "3:40 PM" },
      { date: "2026-05-05", status: "Late", clockIn: "8:10 AM", clockOut: "3:50 PM" },
      { date: "2026-05-06", status: "—", clockIn: "—", clockOut: "—" },
      { date: "2026-05-07", status: "Present", clockIn: "8:05 AM", clockOut: "3:42 PM" },
      { date: "2026-05-08", status: "Present", clockIn: "8:02 AM", clockOut: "3:45 PM" },
    ]);
    jest.spyOn(activitySummaryService, "fetchMilestonesForReport").mockResolvedValue(buildTestMilestones());

    await activitySummaryService.sendActivitySummaryOnCheckout(buildTestStudent(), {
      attendanceId: ATTENDANCE_ID,
    });

    expect(capturedEmail.periodType).toBe("weekly");
    expect(capturedEmail.pdfFilename).toMatch(/^Weekly_Activity_Report_/);
    expect(capturedHtml).toContain("Weekly Activity Report");
    expect(capturedHtml).toContain("Date</th>");
    expect(capturedHtml).toContain("2026-05-04");
    expect(capturedHtml).toContain("2026-05-08");
    expect(capturedHtml).toContain("Late");
  });

  it("maps learning rows with grade only when graded and performance for numerical milestones", () => {
    const rows = mapMilestonesToLearningRows(buildTestMilestones(), STUDENT_ID);

    expect(rows).toHaveLength(2);
    const gradedRow = rows[0]!;
    const inProgressRow = rows[1]!;
    expect(gradedRow.grade).toBe("2");
    expect(gradedRow.performance).toBe("66.67%");
    expect(gradedRow.milestoneStatus).toBe("Graded");
    expect(inProgressRow.grade).toBe("—");
    expect(inProgressRow.performance).toBe("—");
    expect(inProgressRow.milestoneStatus).toBe("In progress");
    expect(gradedRow.subjectRowSpan).toBe(2);
    expect(inProgressRow.subjectRowSpan).toBe(0);
  });

  it("builds a complete PDF model from activities, attendance, and learning data", async () => {
    const model = buildDailyActivityPdfModel(buildTestActivities(), {
      childFullName: "Ada Okonkwo",
      schoolName: "Sunshine Nursery",
      teacherName: "Mrs. Bello",
      isWeekly: false,
      dateRangeLabel: "2026-05-13",
      galleryUrl: "https://sunshine.example/parent",
      attendanceRows: [{ status: "Present", clockIn: "8:02 AM", clockOut: "3:45 PM" }],
      learningRows: mapMilestonesToLearningRows(buildTestMilestones(), STUDENT_ID),
      overallDevelopmentPercent: 66.67,
    });

    jest.spyOn(pdfService, "generatePDFFromHTML").mockImplementation(async (html: string) => {
      capturedHtml = html;
      return Buffer.from(html, "utf-8");
    });

    const buffer = await pdfService.generateDailyActivityReportPDF({
      school: { schoolName: "Sunshine Nursery", brandColor: "#008080" },
      model,
    });

    expect(buffer.length).toBeGreaterThan(0);
    expect(capturedHtml).toContain("III. Nutrition");
    expect(capturedHtml).toContain("Status</th>");
    expect(capturedHtml).toContain("Clock in");
    expect(capturedHtml).toContain("Perf.");
  });
});
