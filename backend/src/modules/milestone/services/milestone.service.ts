import { Milestone } from "../../shared/entities/Milestone";
import { AppDataSource } from "../../core";
import { Brackets, Repository, ILike, In } from "typeorm";
import { Subject } from "../../shared/entities/Subject";
import { Curriculum } from "../../shared/entities/Curriculum";
import { GradingType, MilestoneStatus } from "../../shared/entities/EntityEnums";
import { getDisplayGradeValue } from "../../shared/utils/grading-display.util";
import { logger } from "../../shared";
import { Student } from "../../shared/entities/StudentEntity";
import { Duration } from "../../shared/entities/Duration";
import { Classroom } from "../../shared/entities/Classroom";
import { StaffClassesAndSubject } from "../../shared/entities/StaffClassesAndSubject";
import { Staff } from "../../shared/entities/Staff";
import { StudentAssessmentScore } from "../../shared/entities/StudentAssessmentScore";

export interface CreateMilestoneData {
    title: string;
    curriculumId?: number;
    subjectId?: number;
    gradingType?: GradingType;
    startDate?: Date | string;
    endDate?: Date | string;
    schoolId: number;
}


export interface AddMilestoneFromLibraryData {
    milestoneIds: number[];
    schoolId: number;
    classroomId?: number;
    assignedStaffId?: number;
}

export interface AddMilestoneFromLibraryResult {
    createdCurriculums: Curriculum[];
    createdSubjects: Subject[];
    createdMilestones: Milestone[];
    createdPeriods: Duration[];
    assignedStaff?: Staff | null;
}

export interface UpdateMilestoneData {
    title?: string;
    status?: MilestoneStatus;
    milestoneId?: number;
    curriculumId?: number;
    subjectId?: number;
    gradingType?: GradingType;
}

export interface ListMilestonesFilters {
    schoolId: number;
    curriculumId?: number;
    status?: MilestoneStatus | MilestoneStatus[];
    isSystem?: boolean;
    subjectId?: number;
    gradingType?: GradingType;
    startDate?: Date;
    endDate?: Date;
    pos?: number;
    delta?: number;
    search?: string;
    classroomId?: number;
    studentId?: number;
}

export interface MilestoneServiceResponse {
    success: boolean;
    message: string;
    data?: Milestone | Milestone[];
    pagination?: {
        pos: number;
        delta: number;
        total: number;
        totalPages: number;
    };
    metadata?: {
        total: number;
        templates: number;
        custom: number;
    };
}

export class MilestoneService {
    private get milestoneRepo(): Repository<Milestone> {
        return AppDataSource.getRepository(Milestone);
    }

    private get subjectRepo(): Repository<Subject> {
        return AppDataSource.getRepository(Subject);
    }

    async createMilestone(data: CreateMilestoneData): Promise<{ success: boolean, message: string, data?: Milestone }> {
        try {
            const parsedStartDate = data.startDate ? new Date(data.startDate) : undefined;
            const parsedEndDate = data.endDate ? new Date(data.endDate) : undefined;

            if (parsedStartDate && Number.isNaN(parsedStartDate.getTime())) {
                return { success: false, message: "Invalid startDate format" };
            }

            if (parsedEndDate && Number.isNaN(parsedEndDate.getTime())) {
                return { success: false, message: "Invalid endDate format" };
            }

            if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
                return { success: false, message: "endDate cannot be earlier than startDate" };
            }

            const subject = await this.subjectRepo
                .findOne({
                    where: {
                        id: data.subjectId,
                        curriculumId: data.curriculumId
                    }
                });

            if (!subject) {
                return { success: false, message: "Selected subject does not belong to the chosen curriculum" };
            }

            const existingMilestone = await this.milestoneRepo.findOne({
                where: {
                    title: ILike(data.title),
                    subjectId: data.subjectId,
                    schoolId: data.schoolId
                }
            });

            if (existingMilestone) {
                return {
                    success: false,
                    message: "A milestone with this name already exists for this subject"
                };
            }

            const milestone = this.milestoneRepo.create({
                title: data.title,
                gradingType: data.gradingType,
                startDate: parsedStartDate,
                endDate: parsedEndDate,
                subjectId: data.subjectId,
                schoolId: data.schoolId
            });
            await this.milestoneRepo.save(milestone);

            return {
                success: true,
                message: "Milestone created successfully",
                data: milestone
            }
        } catch (error: any) {
            logger.error(error);
            return {
                success: false,
                message: "Failed to create milestone",
                data: error.message
            }
        }
    }

    async getMilestoneById(milestoneId: number): Promise<{ success: boolean, message: string, data?: Milestone }> {
        try {
            const milestone = await this.milestoneRepo.findOne({
                where: { id: milestoneId },
                relations: [
                    'durations',
                    'subject',
                    'subject.curriculum'
                ]
            });

            if (!milestone) {
                return { success: false, message: "Milestone not found" };
            }
            const classroomsBySubject = await this.resolveClassroomsBySubject([milestone]);
            await this.enrichClassroomsWithStudentsForMilestoneDetail(milestone, classroomsBySubject);
            const scsStaffRows = await AppDataSource.getRepository(StaffClassesAndSubject)
                .createQueryBuilder("scs")
                .leftJoinAndSelect("scs.staff", "staff")
                .leftJoinAndSelect("staff.user", "user")
                .where("scs.subjectId = :subjectId", { subjectId: milestone.subjectId })
                .getMany();
            const staffSeen = new Set<number>();
            const staff: Staff[] = [];
            for (const row of scsStaffRows) {
                if (row.staff && !staffSeen.has(row.staff.id)) {
                    staffSeen.add(row.staff.id);
                    staff.push(row.staff);
                }
            }

            return {
                success: true,
                message: "Milestone retrieved successfully",
                data: this.formatMilestoneResponse(milestone, {
                    detailed: true,
                    classroomsBySubject,
                    staff,
                    omitGrades: true
                }) as any
            }
        } catch (error: any) {
            logger.error(error);
            return {
                success: false,
                message: "Failed to retrieve milestone",
                data: error.message
            }
        }
    }

    async listMilestones(filters: ListMilestonesFilters): Promise<MilestoneServiceResponse> {
        try {
            const {
                schoolId, subjectId, curriculumId, status, gradingType,
                search, classroomId, studentId, pos = 1, delta = 10, isSystem,
            } = filters;

            const skip = Math.max(0, (pos - 1) * delta);

            const studentsInClass = classroomId
                ? await AppDataSource.getRepository(Student).find({
                    where: { classroomId, schoolId },
                    relations: ["user"],
                })
                : [];

            const qb = this.milestoneRepo.createQueryBuilder("milestone")
                .leftJoinAndSelect("milestone.subject", "subject")
                .leftJoinAndSelect("subject.curriculum", "curriculum")
                .leftJoinAndSelect("milestone.durations", "durations")
                .leftJoinAndSelect("milestone.school", "school")
                .leftJoinAndSelect("milestone.studentAssessmentScores", "scores")
                .leftJoinAndSelect("scores.student", "scoreStudent")
                .leftJoinAndSelect("scoreStudent.user", "scoreStudentUser");

            // Scope filter
            if (isSystem) {
                qb.where("milestone.schoolId IS NULL");
            } else {
                qb.where("milestone.schoolId = :schoolId", { schoolId });
            }

            if (subjectId) qb.andWhere("milestone.subjectId = :subjectId", { subjectId });
            if (curriculumId) qb.andWhere("subject.curriculumId = :curriculumId", { curriculumId });
            if (status) {
                const statuses = Array.isArray(status) ? status : [status];
                qb.andWhere("milestone.status IN (:...statuses)", { statuses });
            }
            if (gradingType) qb.andWhere("milestone.gradingType = :gradingType", { gradingType });

            if (classroomId) {
                const scsSubQuery = qb.subQuery().select("1").from("staffClassesAndSubject", "scs")
                    .where("scs.classroomId = :classroomId")
                    .andWhere("scs.subjectId = milestone.subjectId")
                    .getQuery();
                const ccSubQuery = qb.subQuery().select("1").from("curriculumClassrooms", "cc")
                    .where("cc.classroomId = :classroomId")
                    .andWhere("cc.curriculumId = subject.curriculumId")
                    .getQuery();
                qb.andWhere(new Brackets(b =>
                    b.where(`EXISTS (${scsSubQuery})`)
                        .orWhere(`EXISTS (${ccSubQuery})`)
                ), { classroomId });
            }

            if (studentId) {
                const classSubQuery = qb.subQuery().select("1").from("student", "s")
                    .innerJoin("staffClassesAndSubject", "scs", "scs.classroomId = s.classroomId")
                    .where("s.id = :studentId", { studentId })
                    .andWhere("scs.subjectId = milestone.subjectId")
                    .getQuery();
                const scoreSubQuery = qb.subQuery().select("1").from("studentAssessmentScore", "sas")
                    .where("sas.milestoneId = milestone.id")
                    .andWhere("sas.studentId = :studentId", { studentId })
                    .getQuery();
                qb.andWhere(new Brackets(b =>
                    b.where(`EXISTS (${classSubQuery})`, { studentId })
                        .orWhere(`EXISTS (${scoreSubQuery})`, { studentId })
                ));
            }

            if (search) {
                qb.andWhere(new Brackets(b =>
                    b.where("milestone.title ILIKE :search", { search: `%${search}%` })
                        .orWhere("subject.name ILIKE :search", { search: `%${search}%` })
                ));
            }

            const [milestones, total] = await qb
                .orderBy("milestone.createdAt", "DESC")
                .skip(skip).take(delta)
                .getManyAndCount();

            const [templatesCount, customCount, classroomsBySubject, staffBySubject] = await Promise.all([
                this.milestoneRepo.createQueryBuilder("m").where("m.schoolId IS NULL").getCount(),
                this.milestoneRepo.createQueryBuilder("m").where("m.schoolId IS NOT NULL").getCount(),
                this.resolveClassroomsBySubject(milestones, classroomId),
                this.resolveStaffBySubjects(milestones, classroomId),
            ]);

            const data = milestones.map(milestone => {
                const grades = this.buildMilestoneGrades(milestone, { classroomId, studentId, studentsInClass });
                const staff = staffBySubject.get(milestone.subjectId!) || [];
                return this.formatMilestoneResponse(milestone, { classroomsBySubject, grades, staff });
            });

            return {
                success: true,
                message: "Milestones retrieved successfully",
                data,
                pagination: { pos, delta, total, totalPages: Math.ceil(total / delta) },
                metadata: {
                    total: templatesCount + customCount,
                    templates: templatesCount,
                    custom: customCount,
                },
            };
        } catch (error: any) {
            logger.error(error);
            return { success: false, message: "Failed to retrieve milestones", data: error.message };
        }
    }

    /**
     * Resolves classrooms for each milestone's subject
     */
    private async resolveClassroomsBySubject(milestones: Milestone[], classroomId?: number): Promise<Map<number, any[]>> {
        const result = new Map<number, any[]>();
        const subjectIds = [...new Set(milestones.map(m => m.subjectId).filter(Boolean))] as number[];
        if (subjectIds.length === 0) return result;

        const subjectToCurriculum = new Map<number, number>();
        for (const m of milestones) {
            const curId = (m.subject as any)?.curriculumId;
            if (m.subjectId && curId != null) {
                subjectToCurriculum.set(m.subjectId, curId);
            }
        }

        const qb = AppDataSource
            .getRepository(StaffClassesAndSubject)
            .createQueryBuilder("scs")
            .leftJoinAndSelect("scs.classroom", "classroom")
            .where("scs.subjectId IN (:...subjectIds)", { subjectIds });

        if (classroomId) {
            qb.andWhere("scs.classroomId = :classroomId", { classroomId });
        }

        const scsRows = await qb.getMany();

        const curriculumIds = [...new Set(subjectToCurriculum.values())];
        let ccRows: { curriculumId: number; classroomId: number }[] = [];
        if (curriculumIds.length > 0) {
            const qbCc = AppDataSource
                .createQueryBuilder()
                .select("cc.curriculumId", "curriculumId")
                .addSelect("cc.classroomId", "classroomId")
                .from("curriculumClassrooms", "cc")
                .where("cc.curriculumId IN (:...curriculumIds)", { curriculumIds });

            if (classroomId) {
                qbCc.andWhere("cc.classroomId = :classroomId", { classroomId });
            }

            ccRows = await qbCc.getRawMany();
        }

        const allClassroomIds = new Set<number>();
        for (const scs of scsRows) {
            if (scs.classroom) allClassroomIds.add(scs.classroom.id);
        }
        for (const row of ccRows) {
            allClassroomIds.add(Number(row.classroomId));
        }

        const studentCounts = await this.getStudentCountsPerClassroom(Array.from(allClassroomIds));

        const classroomEntities =
            allClassroomIds.size > 0
                ? await AppDataSource.getRepository(Classroom).find({
                    where: { id: In([...allClassroomIds]) },
                })
                : [];
        const classroomMap = new Map(classroomEntities.map(c => [c.id, c]));

        for (const sid of subjectIds) {
            const list: any[] = [];
            const seen = new Set<number>();

            for (const scs of scsRows) {
                if (scs.subjectId !== sid) continue;
                const classroom = scs.classroom as Classroom | undefined;
                if (!classroom || seen.has(classroom.id)) continue;
                seen.add(classroom.id);
                list.push({
                    ...this.toClassroomShape(classroom),
                    studentCount: studentCounts.get(classroom.id) || 0,
                });
            }

            const curId = subjectToCurriculum.get(sid);
            if (curId != null) {
                for (const row of ccRows) {
                    if (Number(row.curriculumId) !== curId) continue;
                    const cid = Number(row.classroomId);
                    const c = classroomMap.get(cid);
                    if (!c || seen.has(c.id)) continue;
                    seen.add(c.id);
                    list.push({
                        ...this.toClassroomShape(c),
                        studentCount: studentCounts.get(c.id) || 0,
                    });
                }
            }

            result.set(sid, list);
        }

        return result;
    }

    /**
     * Attaches `students` (id, name, grade, photoUrl, status) to each classroom
     */
    private async enrichClassroomsWithStudentsForMilestoneDetail(
        milestone: Milestone,
        classroomsBySubject: Map<number, any[]>
    ): Promise<void> {
        const subjectId = milestone.subjectId;
        if (!subjectId || milestone.schoolId == null) return;

        const classrooms = classroomsBySubject.get(subjectId);
        if (!classrooms?.length) return;

        const classroomIds = classrooms.map((c: any) => c.id).filter(Boolean);
        if (classroomIds.length === 0) return;

        const students = await AppDataSource.getRepository(Student).find({
            where: { classroomId: In(classroomIds), schoolId: milestone.schoolId },
            relations: ["user"],
        });

        const studentIds = students.map(s => s.id);
        const scoreMap = new Map<number, StudentAssessmentScore>();
        if (studentIds.length > 0) {
            const scores = await AppDataSource.getRepository(StudentAssessmentScore).find({
                where: { milestoneId: milestone.id, studentId: In(studentIds) },
            });
            for (const sc of scores) scoreMap.set(sc.studentId, sc);
        }

        const byClassroom = new Map<number, Student[]>();
        for (const s of students) {
            const cid = s.classroomId;
            if (cid == null || !classroomIds.includes(cid)) continue;
            const arr = byClassroom.get(cid) ?? [];
            arr.push(s);
            byClassroom.set(cid, arr);
        }

        for (const row of classrooms) {
            const list = byClassroom.get(row.id) ?? [];
            row.students = list.map(s => {
                const studentScore = scoreMap.get(s.id);
                return {
                    id: s.id,
                    name: `${s.user?.firstName ?? ""} ${s.user?.lastName ?? ""}`.trim(),
                    grade: getDisplayGradeValue(milestone.gradingType, studentScore),
                    score: studentScore?.score ?? null,
                    observation: studentScore?.observation ?? null,
                    photoUrl: s.photoUrl ?? null,
                    status: s.status,
                };
            });
        }
    }

    private async resolveStaffBySubjects(milestones: Milestone[], classroomId?: number): Promise<Map<number, any[]>> {
        const result = new Map<number, any[]>();
        const subjectIds = [...new Set(milestones.map(m => m.subjectId).filter(Boolean))];
        if (subjectIds.length === 0) return result;

        const qb = AppDataSource.getRepository(StaffClassesAndSubject)
            .createQueryBuilder("scs")
            .leftJoinAndSelect("scs.staff", "staff")
            .leftJoinAndSelect("staff.user", "user")
            .where("scs.subjectId IN (:...subjectIds)", { subjectIds });

        if (classroomId) {
            qb.andWhere("scs.classroomId = :classroomId", { classroomId });
        }

        const scsRows = await qb.getMany();

        for (const row of scsRows) {
            if (!row.subjectId || !row.staff) continue;
            const list = result.get(row.subjectId) || [];
            if (!list.some(s => s.id === row.staff!.id)) {
                list.push(row.staff);
            }
            result.set(row.subjectId, list);
        }
        return result;
    }

    private async getStudentCountsPerClassroom(classroomIds: number[]): Promise<Map<number, number>> {
        if (classroomIds.length === 0) return new Map();
        const counts = await AppDataSource.getRepository(Student)
            .createQueryBuilder("student")
            .select("student.classroomId", "classroomId")
            .addSelect("COUNT(student.id)", "count")
            .where("student.classroomId IN (:...classroomIds)", { classroomIds })
            .groupBy("student.classroomId")
            .getRawMany();

        return new Map(counts.map(c => [Number(c.classroomId), Number(c.count)]));
    }

    /** Builds the grades array for a milestone depending on filter context. */
    private buildMilestoneGrades(
        milestone: Milestone,
        ctx: { classroomId?: number; studentId?: number; studentsInClass: Student[] }
    ): any[] {
        const { classroomId, studentId, studentsInClass } = ctx;

        if (classroomId) {
            if (studentsInClass.length === 0) return [];
            const scoresMap = new Map(
                (milestone.studentAssessmentScores ?? []).map(s => [s.studentId, s])
            );
            return studentsInClass.map(student => {
                const score = scoresMap.get(student.id);
                return {
                    id: score?.id ?? null,
                    studentId: student.id,
                    studentName: `${student.user?.firstName ?? ''} ${student.user?.lastName ?? ''}`.trim(),
                    admissionNumber: student.admissionNumber ?? null,
                    gradeValue: getDisplayGradeValue(milestone.gradingType, score ?? null),
                    score: score?.score ?? null,
                    observation: score?.observation ?? null,
                    status: score?.status ?? 'NOT_GRADED',
                };
            });
        }

        if (studentId) {
            const s = milestone.studentAssessmentScores?.find(s => s.studentId === studentId);
            if (!s) return [];
            return [{
                id: s.id,
                studentId: s.studentId,
                studentName: s.student?.user
                    ? `${s.student.user.firstName ?? ''} ${s.student.user.lastName ?? ''}`.trim()
                    : null,
                admissionNumber: s.student?.admissionNumber ?? null,
                gradeValue: getDisplayGradeValue(milestone.gradingType, s),
                score: s.score ?? null,
                observation: s.observation ?? null,
                status: s.status,
            }];
        }

        // Default: all scores attached to the milestone
        return (milestone.studentAssessmentScores ?? []).map(score => ({
            id: score.id,
            studentId: score.studentId,
            studentName: score.student?.user
                ? `${score.student.user.firstName ?? ''} ${score.student.user.lastName ?? ''}`.trim()
                : null,
            admissionNumber: score.student?.admissionNumber ?? null,
            gradeValue: getDisplayGradeValue(milestone.gradingType, score),
            score: score.score ?? null,
            observation: score.observation ?? null,
            status: score.status,
        }));
    }

    /** Maps a Classroom entity to the standard shape used in responses. */
    private toClassroomShape(c: Classroom) {
        return { id: c.id, name: c.classroomName, minimumAge: c.minimumAge, maximumAge: c.maximumAge };
    }

    private formatMilestoneResponse(
        milestone: Milestone,
        options: {
            detailed?: boolean,
            classroomsBySubject?: Map<number, any[]>,
            grades?: any[],
            staff?: any[],
            omitGrades?: boolean
        } = {}
    ): any {
        const { detailed = false, classroomsBySubject, grades, staff, omitGrades = false } = options;
        const formatted: any = {
            id: milestone.id,
            schoolId: milestone.schoolId ?? null,
            title: milestone.title,
            description: milestone.description,
            gradingType: milestone.gradingType,
            status: milestone.status,
            startDate: milestone.startDate,
            endDate: milestone.endDate,
            createdAt: milestone.createdAt,
            updatedAt: milestone.updatedAt,
        };

        // Include subject info
        if (milestone.subject) {
            formatted.subject = {
                id: milestone.subject.id,
                name: milestone.subject.name,
                curriculumId: milestone.subject.curriculumId,
                ...(detailed && {
                    description: milestone.subject.description,
                    minimumAge: milestone.subject.minimumAge,
                    maximumAge: milestone.subject.maximumAge,
                    duration: milestone.subject.duration,
                    skills: milestone.subject.skills,
                    subjectSchedule: milestone.subject.subjectSchedule,
                })
            };

            // Include curriculum info if available
            if ((milestone.subject as any).curriculum) {
                const curriculum = (milestone.subject as any).curriculum;
                formatted.curriculum = {
                    id: curriculum.id,
                    title: curriculum.title,
                    academicYear: curriculum.academicYear,
                    term: curriculum.term,
                    ...(detailed && { description: curriculum.description })
                };
            }

            // Classrooms: use the pre-fetched map when available, fall back to inline join data
            if (classroomsBySubject) {
                formatted.classrooms = classroomsBySubject.get(milestone.subject.id) ?? [];
            } else if (!detailed) {
                // Inline fallback for basic response if map not provided
                const scsRows: any[] = (milestone.subject as any).staffClassesAndSubject || [];
                const classroomsMap = new Map<number, any>();
                for (const scs of scsRows) {
                    if (scs.classroom && !classroomsMap.has(scs.classroom.id)) {
                        classroomsMap.set(scs.classroom.id, this.toClassroomShape(scs.classroom));
                    }
                }
                formatted.classrooms = Array.from(classroomsMap.values());
            }
        }

        // Durations (periods) directly linked to this milestone
        if (milestone.durations && milestone.durations.length > 0) {
            formatted.durations = milestone.durations.map((d: any) => ({
                id: d.id,
                name: d.durationName,
                schoolId: d.schoolId ?? null,
            }));
        } else {
            formatted.durations = [];
        }

        // Student assessment scores (grades) — omitted for get-by-id when omitGrades is true
        if (!omitGrades) {
            if (grades) {
                formatted.grades = grades;
            } else if (milestone.studentAssessmentScores && milestone.studentAssessmentScores.length > 0) {
                formatted.grades = milestone.studentAssessmentScores.map(score => ({
                    id: score.id,
                    studentId: score.studentId,
                    studentName: score.student?.user
                        ? `${score.student.user.firstName || ''} ${score.student.user.lastName || ''}`.trim()
                        : null,
                    admissionNumber: score.student?.admissionNumber ?? null,
                    gradeValue: getDisplayGradeValue(milestone.gradingType, score),
                    score: score.score ?? null,
                    observation: score.observation ?? null,
                    status: score.status,
                    ...(detailed && {
                        observation: score.observation, // override to null-safe if needed, but here it's original
                        gradedById: score.gradedById,
                        createdAt: score.createdAt,
                        updatedAt: score.updatedAt,
                        student: score.student ? {
                            id: score.student.id,
                            firstName: score.student.user?.firstName || null,
                            lastName: score.student.user?.lastName || null,
                            email: score.student.user?.email || null,
                            admissionNumber: score.student.admissionNumber ?? null,
                        } : null,
                    })
                }));
            } else {
                formatted.grades = [];
            }
        }

        if (staff || detailed) {
            formatted.staff = (staff || []).map(s => ({
                id: s.id,
                name: s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() : null,
                email: s.user?.email || null,
                photoUrl: s.user?.photoUrl || null
            }));
        }

        if (detailed && !omitGrades) {
            formatted.totalGrades = formatted.grades?.length || 0;
        }

        return formatted;
    }

    async updateMilestone(milestoneId: number, data: UpdateMilestoneData): Promise<{ success: boolean, message: string, data?: Milestone }> {
        try {
            const milestone = await this.milestoneRepo.findOne({ where: { id: milestoneId } });


            if (!milestone) {
                return { success: false, message: "Milestone not found" };
            }

            const incomingTitle = data.title;
            const incomingSubjectId = data.subjectId ?? milestone.subjectId;

            // Check for duplicate title if it's changing or subject is changing (case-insensitive)
            if (incomingTitle && (incomingTitle !== milestone.title || incomingSubjectId !== milestone.subjectId)) {
                const existing = await this.milestoneRepo.findOne({
                    where: {
                        title: ILike(incomingTitle),
                        subjectId: incomingSubjectId,
                        schoolId: milestone.schoolId
                    }
                });

                if (existing && existing.id !== milestone.id) {
                    return { success: false, message: "A milestone with this name already exists for this subject" };
                }
            }

            if (data.title !== undefined) milestone.title = data.title;
            if (data.status !== undefined) milestone.status = data.status;
            if (data.gradingType !== undefined) milestone.gradingType = data.gradingType;
            if (data.subjectId !== undefined) milestone.subjectId = data.subjectId;

            const updatedMilestone = await this.milestoneRepo.save(milestone);

            if (!updatedMilestone) {
                return {
                    success: false,
                    message: "Failed to update milestone"
                };
            }
            return {
                success: true,
                message: "Milestone updated successfully",
                data: updatedMilestone
            };

        } catch (error: any) {
            logger.error(error);
            return { success: false, message: "Failed to update milestone", data: error.message };
        }
    }

    async deleteMilestone(milestoneId: number): Promise<{ success: boolean, message: string, data?: Milestone }> {
        try {
            const milestone = await this.milestoneRepo.findOne({ where: { id: milestoneId } });
            if (!milestone) {
                return { success: false, message: "Milestone not found" };
            }
            const deletedMilestone = await this.milestoneRepo.delete(milestoneId);
            if (!deletedMilestone) {
                return {
                    success: false,
                    message: "Failed to delete milestone",
                };
            }
            return {
                success: true,
                message: "Milestone deleted successfully",
                data: milestone
            };
        }

        catch (error: any) {
            logger.error(error);
            return { success: false, message: "Failed to delete milestone", data: error.message };
        }
    }

    async addMilestoneFromLibrary(data: AddMilestoneFromLibraryData): Promise<{ success: boolean, message: string, data?: AddMilestoneFromLibraryResult | string }> {
        try {
            const uniqueMilestoneIds = Array.from(new Set((data.milestoneIds || []).map(Number).filter(id => Number.isInteger(id) && id > 0)));

            if (uniqueMilestoneIds.length === 0) {
                return { success: false, message: "milestoneIds must be a non-empty array of numbers" };
            }

            return await AppDataSource.transaction(async manager => {
                const milestoneRepo = manager.getRepository(Milestone);
                const subjectRepo = manager.getRepository(Subject);
                const curriculumRepo = manager.getRepository(Curriculum);

                const libraryMilestones = await milestoneRepo
                    .createQueryBuilder("milestone")
                    .leftJoinAndSelect("milestone.subject", "subject")
                    .leftJoinAndSelect("subject.curriculum", "curriculum")
                    .leftJoinAndSelect("curriculum.classrooms", "classrooms")
                    .leftJoinAndSelect("milestone.durations", "durations")
                    .where("milestone.id IN (:...ids)", { ids: uniqueMilestoneIds })
                    .getMany();

                if (libraryMilestones.length !== uniqueMilestoneIds.length) {
                    const found = new Set(libraryMilestones.map(m => m.id));
                    const missing = uniqueMilestoneIds.filter(id => !found.has(id));
                    return {
                        success: false,
                        message: `Some library milestones were not found: ${missing.join(", ")}`,
                    };
                }

                const nonLibrary = libraryMilestones.filter(m => m.schoolId != null && m.schoolId !== data.schoolId);
                if (nonLibrary.length > 0) {
                    return {
                        success: false,
                        message: `Some milestones are not library milestones and do not belong to your school: ${nonLibrary.map(m => m.id).join(", ")}`,
                    };
                }

                const invalidRelations = libraryMilestones.filter(m => !m.subject || !(m.subject as any).curriculum);
                if (invalidRelations.length > 0) {
                    return {
                        success: false,
                        message: `Some library milestones are missing subject/curriculum relations: ${invalidRelations.map(m => m.id).join(", ")}`,
                    };
                }

                // Map library curriculum -> school curriculum (by curriculumId)
                const curriculumIdMap = new Map<number, number>();
                // Map library subject -> school subject (by subjectId)
                const subjectIdMap = new Map<number, number>();

                const createdCurriculums: Curriculum[] = [];
                const createdSubjects: Subject[] = [];
                const createdMilestones: Milestone[] = [];
                const createdPeriods: Duration[] = [];

                const libraryCurriculums = new Map<number, Curriculum>();
                const librarySubjects = new Map<number, Subject>();
                const classroomRepo = manager.getRepository(Classroom);
                const staffRepo = manager.getRepository(Staff);

                let assignedStaff: Staff | null = null;
                if (data.assignedStaffId) {
                    assignedStaff = await staffRepo.findOne({
                        where: { id: data.assignedStaffId },
                        relations: ["user"]
                    });
                }

                for (const m of libraryMilestones) {
                    const subj = m.subject as any as Subject;
                    const cur = (subj as any).curriculum as Curriculum;
                    if (subj?.id) librarySubjects.set(subj.id, subj);
                    if (cur?.id) libraryCurriculums.set(cur.id, cur);
                }

                // Create/reuse curriculums and their classrooms for this school
                for (const [libCurriculumId, libCurriculum] of libraryCurriculums.entries()) {
                    let curriculum = await curriculumRepo.findOne({
                        where: {
                            title: ILike(libCurriculum.title),
                            schoolId: data.schoolId,
                        },
                        relations: ["classrooms"]
                    });

                    if (!curriculum) {
                        curriculum = await curriculumRepo.save(
                            curriculumRepo.create({
                                title: libCurriculum.title,
                                description: libCurriculum.description,
                                academicYear: libCurriculum.academicYear,
                                term: libCurriculum.term,
                                startDate: libCurriculum.startDate,
                                endDate: libCurriculum.endDate,
                                attachmentUrl: (libCurriculum as any).attachmentUrl ?? [],
                                schoolId: data.schoolId,
                            })
                        );
                        createdCurriculums.push(curriculum);
                    }

                    curriculumIdMap.set(libCurriculumId, curriculum.id);

                    // If a classroomId was passed, ensure the curriculum is linked to it
                    if (data.classroomId) {
                        const hasClassroom = curriculum.classrooms?.some(c => c.id === data.classroomId);
                        if (!hasClassroom) {
                            const classroom = await classroomRepo.findOneBy({ id: data.classroomId });
                            if (classroom) {
                                curriculum.classrooms = [...(curriculum.classrooms || []), classroom];
                                await curriculumRepo.save(curriculum);
                            }
                        }
                    }
                }

                // Create/reuse subjects for mapped curriculums
                for (const [libSubjectId, libSubject] of librarySubjects.entries()) {
                    const libCurriculum = (libSubject as any).curriculum as Curriculum | undefined;
                    const libCurriculumId = libCurriculum?.id ?? libSubject.curriculumId;

                    if (!libCurriculumId) {
                        return { success: false, message: `Library subject ${libSubjectId} is missing curriculumId` };
                    }

                    const mappedCurriculumId = curriculumIdMap.get(libCurriculumId);
                    if (!mappedCurriculumId) {
                        return { success: false, message: `Failed to map library curriculum ${libCurriculumId} for subject ${libSubjectId}` };
                    }

                    const existing = await subjectRepo.findOne({
                        where: {
                            name: ILike(libSubject.name),
                            curriculumId: mappedCurriculumId,
                        },
                    });

                    let targetSubject: Subject;
                    if (existing) {
                        subjectIdMap.set(libSubjectId, existing.id);
                        targetSubject = existing;
                    } else {
                        targetSubject = await subjectRepo.save(
                            subjectRepo.create({
                                curriculumId: mappedCurriculumId,
                                name: libSubject.name,
                                description: libSubject.description,
                                attachmentsUrl: libSubject.attachmentsUrl,
                                subjectSchedule: libSubject.subjectSchedule,
                                minimumAge: libSubject.minimumAge,
                                maximumAge: libSubject.maximumAge,
                                duration: libSubject.duration,
                                skills: libSubject.skills,
                                schoolId: data.schoolId
                            })
                        );

                        subjectIdMap.set(libSubjectId, targetSubject.id);
                        createdSubjects.push(targetSubject);
                    }

                    // If classroomId is provided, link the subject to the classroom (and staff if provided)
                    if (data.classroomId) {
                        const scsRepo = manager.getRepository(StaffClassesAndSubject);
                        const existingScs = await scsRepo.findOne({
                            where: {
                                subjectId: targetSubject.id,
                                classroomId: data.classroomId,
                                staffId: data.assignedStaffId
                            }
                        });

                        if (!existingScs) {
                            await scsRepo.save(
                                scsRepo.create({
                                    subjectId: targetSubject.id,
                                    classroomId: data.classroomId,
                                    staffId: data.assignedStaffId
                                })
                            );
                        }
                    }
                }

                // Create/reuse milestones for mapped subjects
                for (const libMilestone of libraryMilestones) {
                    const libSubjectId = (libMilestone.subject as any as Subject).id;
                    const mappedSubjectId = subjectIdMap.get(libSubjectId);

                    if (!mappedSubjectId) {
                        return { success: false, message: `Failed to map library subject ${libSubjectId} for milestone ${libMilestone.id}` };
                    }

                    const existing = await milestoneRepo.findOne({
                        where: {
                            title: ILike(libMilestone.title),
                            subjectId: mappedSubjectId,
                            schoolId: data.schoolId,
                        },
                    });

                    if (existing) {
                        continue;
                    }

                    const created = await milestoneRepo.save(
                        milestoneRepo.create({
                            title: libMilestone.title,
                            description: libMilestone.description,
                            gradingType: libMilestone.gradingType,
                            startDate: libMilestone.startDate,
                            endDate: libMilestone.endDate,
                            subjectId: mappedSubjectId,
                            schoolId: data.schoolId,
                        })
                    );

                    createdMilestones.push(created);

                    // Create durations (Periods) if they exist in the library milestone
                    if (libMilestone.durations && libMilestone.durations.length > 0) {
                        const durationRepo = manager.getRepository(Duration);
                        for (const libDuration of libMilestone.durations) {
                            const createdDuration = await durationRepo.save(
                                durationRepo.create({
                                    durationName: libDuration.durationName,
                                    subjectId: mappedSubjectId,
                                    milestoneId: created.id,
                                    schoolId: data.schoolId,
                                })
                            );
                            createdPeriods.push(createdDuration);
                        }
                    }
                }

                const payload: AddMilestoneFromLibraryResult = {
                    createdCurriculums: createdCurriculums.map(c => {
                        delete (c as any).classrooms;
                        return c;
                    }),
                    createdSubjects,
                    createdMilestones,
                    createdPeriods,
                    assignedStaff,
                };

                return {
                    success: true,
                    message: "Milestones imported successfully",
                    data: payload,
                };
            });
        } catch (error: any) {
            logger.error(error);
            return {
                success: false,
                message: "Failed to import milestones from library",
                data: error.message,
            };
        }
    }
}