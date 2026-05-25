import { Repository, In, Brackets } from "typeorm";
import { AppDataSource } from "../../core";
import { Assessment } from "../../shared/entities/Assessment";
import { AssessmentStatus, AssessmentType, GradingStatus, MilestoneStatus, TermEnum, UserRole } from "../../shared/entities/EntityEnums";
import { logger } from "../../shared/utils/logger";
import { Subject } from "../../shared/entities/Subject";
import { User } from "../../shared";
import { Classroom } from "../../shared/entities/Classroom";
import { Staff } from "../../shared/entities/Staff";
import { Student } from "../../shared/entities/StudentEntity";
import { StudentAssessmentScore } from "../../shared/entities/StudentAssessmentScore";
import { Milestone } from "../../shared/entities/Milestone";
import { GradingType } from "../../shared/entities/EntityEnums";
import { notificationService } from "../../notification";
import { NotificationType } from "../../shared/entities/Notification";

export interface CreateAssessmentData {
    title: string;
    assessmentType: AssessmentType;
    subjectId: number;
    scoreType: 'percentage' | 'points';
    totalScore: number;
    academicYear: string;
    term: TermEnum;
    dateAssigned: Date;
    dueDate?: Date;
    assignedStaffId: number;
    classroomIds: number[];
    description?: string;
    attachmentsUrl?: string[];
    schoolId: number;
    creatorId: number;
}

export interface UpdateAssessmentData {
    title?: string;
    assessmentType?: AssessmentType;
    totalScore?: number;
    dateAssigned?: Date;
    dueDate?: Date;
    description?: string;
    status?: AssessmentStatus;
    attachmentsUrl?: string[];
}

export interface AssessmentFilters {
    schoolId: number;
    page?: number;
    limit?: number;
    search?: string;
    classroomsId?: number;
    dateAssigned?: Date;
    dueDate?: Date;
    creatorId?: number;
    subjectId?: number;
    teacherId?: number;
    academicYear?: string;
    term?: TermEnum;
    status?: AssessmentStatus;
    type?: AssessmentType;
    startDate?: Date;
    endDate?: Date;
    minScore?: number;
    maxScore?: number;
}

export interface RecordAssessmentScoreData {
    assessmentId?: number;
    milestoneId?: number;
    schoolId: number;
    studentIds: number[];
    grades?: (number | string)[];
    observations?: string[];
    gradedById: number;
}

export interface AssessmentServiceResponse {
    success: boolean;
    message: string;
    data?: any;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export class AssessmentService {
    private get assessmentRepo(): Repository<Assessment> {
        return AppDataSource.getRepository(Assessment);
    }

    private get subjectRepo(): Repository<Subject> {
        return AppDataSource.getRepository(Subject);
    }

    private get staffRepo(): Repository<Staff> {
        return AppDataSource.getRepository(Staff);
    }

    private get studentRepo(): Repository<Student> {
        return AppDataSource.getRepository(Student);
    }

    private get assessmentScoreRepo(): Repository<StudentAssessmentScore> {
        return AppDataSource.getRepository(StudentAssessmentScore);
    }

    private get classroomsRepo(): Repository<Classroom> {
        return AppDataSource.getRepository(Classroom);
    }

    private get milestoneRepo(): Repository<Milestone> {
        return AppDataSource.getRepository(Milestone);
    }

    private get usersRepo(): Repository<User> {
        return AppDataSource.getRepository(User);
    }




    async createAssessment(data: CreateAssessmentData): Promise<AssessmentServiceResponse> {
        try {
            const creator = await this.usersRepo.findOne({
                where: { id: data.creatorId },
                relations: ["admin", "teacher"],
            });
            if (!creator) {
                return {
                    success: false,
                    message: "Creator not found"
                };
            }

            const isPrivileged = [UserRole.ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN].includes(creator.role);
            const hasSchoolAccess =
                creator.role === UserRole.STAFF
                    ? !!creator.teacher?.some((t) => t.schoolId === data.schoolId)
                    : creator.role === UserRole.ADMIN || creator.role === UserRole.SUPER_ADMIN
                        ? !!creator.admin?.some((a) => a.schoolId === data.schoolId)
                        : false;

            if (!isPrivileged || !hasSchoolAccess) {
                return {
                    success: false,
                    message: "Staff or Admin privileges required to create assessment."
                };
            }

            const subject = await this.subjectRepo.findOne({
                where: { id: data.subjectId },
                relations: ["curriculum"]
            });

            if (!subject) {
                return {
                    success: false,
                    message: "Subject not found"
                };
            }

            if (subject.curriculum && subject.curriculum.schoolId !== data.schoolId) {
                return {
                    success: false,
                    message: "Subject does not belong to the specified school"
                };
            }

            const assignedStaff = await this.staffRepo.findOne({
                where: { id: data.assignedStaffId, schoolId: data.schoolId }
            });

            if (!assignedStaff) {
                return {
                    success: false,
                    message: "Assigned teacher not found or does not belong to this school"
                };
            }

            const classrooms = await this.classroomsRepo.find({
                where: {
                    id: In(data.classroomIds),
                    schoolId: data.schoolId
                }
            });

            if (!classrooms || classrooms.length === 0) {
                return {
                    success: false,
                    message: "No valid classrooms found"
                };
            }

            if (classrooms.length !== data.classroomIds.length) {
                return {
                    success: false,
                    message: "One or more classrooms not found"
                };
            }

            const assessment = this.assessmentRepo.create({
                title: data.title,
                assessmentType: data.assessmentType,
                totalScore: data.totalScore,
                academicYear: data.academicYear,
                term: data.term,
                dateAssigned: data.dateAssigned,
                dueDate: data.dueDate,
                staffId: data.assignedStaffId,
                description: data.description,
                attachmentsUrl: data.attachmentsUrl,
                schoolId: data.schoolId,
                subjectId: data.subjectId,
                creatorId: data.creatorId,
                classrooms: classrooms,
            });

            const savedAssessment = await this.assessmentRepo.save(assessment);

            return {
                success: true,
                message: "Assessment created successfully",
                data: savedAssessment
            };
        } catch (error: any) {
            logger.error("Error creating assessment:", error);
            return {
                success: false,
                message: error.message || "Failed to create assessment"
            };
        }
    }

    async listAssessments(filters: AssessmentFilters): Promise<AssessmentServiceResponse> {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                schoolId,
                classroomsId,
                subjectId,
                teacherId,
                academicYear,
                term,
                creatorId,
                status,
                type,
                dateAssigned,
                dueDate,
                startDate,
                endDate,
                minScore,
                maxScore
            } = filters;

            const skip = (page - 1) * limit;

            const queryBuilder = this.assessmentRepo.createQueryBuilder("assessment")
                .leftJoinAndSelect("assessment.classrooms", "classroom")
                .leftJoinAndSelect("assessment.assignedStaff", "staff")
                .leftJoinAndSelect("staff.user", "staffUser")
                .leftJoinAndSelect("assessment.subject", "subject")
                .leftJoinAndSelect("assessment.creator", "creator")
                .leftJoinAndSelect("assessment.studentAssessments", "studentAssessmentDetail")
                .leftJoinAndSelect("studentAssessmentDetail.student", "scoreStudent")
                .leftJoinAndSelect("scoreStudent.user", "scoreStudentUser")
                .leftJoinAndSelect("scoreStudent.currentClassroom", "scoreStudentClass")
                .addSelect(subQuery => {
                    return subQuery
                        .select("COUNT(DISTINCT sac.id)", "count")
                        .from(StudentAssessmentScore, "sac")
                        .where("sac.assessmentId = assessment.id");
                }, "assessmentSubmissionCount")
                .addSelect(subQuery => {
                    return subQuery
                        .select("COUNT(DISTINCT s.id)", "count")
                        .from(Student, "s")
                        .innerJoin("s.currentClassroom", "c")
                        .innerJoin("c.assessments", "a")
                        .where("a.id = assessment.id");
                }, "assessmentTotalStudents");

            if (classroomsId) queryBuilder.andWhere("classroom.id = :classroomsId", { classroomsId });
            if (subjectId) queryBuilder.andWhere("assessment.subjectId = :subjectId", { subjectId });
            if (teacherId || filters.teacherId) queryBuilder.andWhere("assessment.staffId = :teacherId", { teacherId: teacherId || filters.teacherId });
            if (academicYear) queryBuilder.andWhere("assessment.academicYear = :academicYear", { academicYear });
            if (term) queryBuilder.andWhere("assessment.term = :term", { term });
            if (creatorId) queryBuilder.andWhere("assessment.creatorId = :creatorId", { creatorId });
            if (status) queryBuilder.andWhere("assessment.status = :status", { status });
            if (type) queryBuilder.andWhere("assessment.assessmentType = :type", { type });
            if (dateAssigned) queryBuilder.andWhere("assessment.dateAssigned = :dateAssigned", { dateAssigned });
            if (dueDate) queryBuilder.andWhere("assessment.dueDate = :dueDate", { dueDate });
            if (schoolId) queryBuilder.andWhere("assessment.schoolId = :schoolId", { schoolId });

            if (search) {
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where("assessment.title ILIKE :search", { search: `%${search}%` })
                        .orWhere("subject.name ILIKE :search", { search: `%${search}%` })
                        .orWhere("staffUser.firstName ILIKE :search", { search: `%${search}%` })
                        .orWhere("staffUser.lastName ILIKE :search", { search: `%${search}%` });
                }));
            }

            if (startDate && endDate) {
                queryBuilder.andWhere("assessment.dateAssigned BETWEEN :startDate AND :endDate", { startDate, endDate });
            }

            // Filter by score range
            if (minScore !== undefined || maxScore !== undefined) {
                queryBuilder.andWhere(qb => {
                    const subQuery = qb.subQuery()
                        .select("1")
                        .from(StudentAssessmentScore, "sas")
                        .where("sas.assessmentId = assessment.id");

                    if (minScore !== undefined) {
                        subQuery.andWhere("sas.score >= :minScore", { minScore });
                    }
                    if (maxScore !== undefined) {
                        subQuery.andWhere("sas.score <= :maxScore", { maxScore });
                    }

                    return "EXISTS " + subQuery.getQuery();
                });
            }

            queryBuilder.orderBy("assessment.createdAt", "DESC")
                .skip(skip)
                .take(limit);

            const [assessments, total] = await queryBuilder.getManyAndCount();

            let rawResults: Array<{ assessment_id: number; assessmentSubmissionCount: string; assessmentTotalStudents: string }> = [];
            if (assessments.length > 0) {
                const ids = assessments.map((a) => a.id);
                rawResults = await this.assessmentRepo
                    .createQueryBuilder("assessment")
                    .select("assessment.id", "assessment_id")
                    .addSelect(
                        (subQuery) =>
                            subQuery
                                .select("COUNT(DISTINCT sac.id)", "count")
                                .from(StudentAssessmentScore, "sac")
                                .where("sac.assessmentId = assessment.id"),
                        "assessmentSubmissionCount"
                    )
                    .addSelect(
                        (subQuery) =>
                            subQuery
                                .select("COUNT(DISTINCT s.id)", "count")
                                .from(Student, "s")
                                .innerJoin("s.currentClassroom", "c")
                                .innerJoin("c.assessments", "a")
                                .where("a.id = assessment.id"),
                        "assessmentTotalStudents"
                    )
                    .where("assessment.id IN (:...ids)", { ids })
                    .getRawMany();
            }

            const assessmentsWithStats = assessments.map((a) => {
                const raw = rawResults.find((r) => r.assessment_id === a.id);
                return this.formatAssessmentResponse(a, raw);
            });

            // Metadata summary - contextually filtered but status/type independent
            const summaryQuery = this.assessmentRepo.createQueryBuilder("assessment")
                .leftJoin("assessment.classrooms", "classroom")
                .leftJoin("assessment.subject", "subject")
                .leftJoin("assessment.assignedStaff", "staff")
                .leftJoin("staff.user", "staffUser")
                .where("assessment.schoolId = :schoolId", { schoolId });

            if (classroomsId) summaryQuery.andWhere("classroom.id = :classroomsId", { classroomsId });
            if (subjectId) summaryQuery.andWhere("assessment.subjectId = :subjectId", { subjectId });
            if (teacherId || filters.teacherId) summaryQuery.andWhere("assessment.staffId = :teacherId", { teacherId: teacherId || filters.teacherId });
            if (academicYear) summaryQuery.andWhere("assessment.academicYear = :academicYear", { academicYear });
            if (term) summaryQuery.andWhere("assessment.term = :term", { term });
            if (creatorId) summaryQuery.andWhere("assessment.creatorId = :creatorId", { creatorId });
            if (dateAssigned) summaryQuery.andWhere("assessment.dateAssigned = :dateAssigned", { dateAssigned });
            if (dueDate) summaryQuery.andWhere("assessment.dueDate = :dueDate", { dueDate });

            if (search) {
                summaryQuery.andWhere(new Brackets(qb => {
                    qb.where("assessment.title ILIKE :search", { search: `%${search}%` })
                        .orWhere("subject.name ILIKE :search", { search: `%${search}%` })
                        .orWhere("staffUser.firstName ILIKE :search", { search: `%${search}%` })
                        .orWhere("staffUser.lastName ILIKE :search", { search: `%${search}%` });
                }));
            }

            if (startDate && endDate) {
                summaryQuery.andWhere("assessment.dateAssigned BETWEEN :startDate AND :endDate", { startDate, endDate });
            }

            const [completed, pending, observations, drafts, archived] = await Promise.all([
                summaryQuery.clone().andWhere("assessment.status = :status", { status: AssessmentStatus.GRADED }).getCount(),
                summaryQuery.clone().andWhere("assessment.status IN (:...statuses)", { statuses: [AssessmentStatus.ASSIGNED, AssessmentStatus.SUBMITTED] }).getCount(),
                summaryQuery.clone().andWhere("assessment.assessmentType = :type", { type: AssessmentType.OBSERVATION }).getCount(),
                summaryQuery.clone().andWhere("assessment.status = :status", { status: AssessmentStatus.DRAFT }).getCount(),
                summaryQuery.clone().andWhere("assessment.status = :status", { status: AssessmentStatus.ARCHIVED }).getCount()
            ]);

            return {
                success: true,
                message: "Assessments retrieved successfully",
                data: {
                    assessments: assessmentsWithStats,
                    metadata: {
                        completed,
                        pending,
                        observations,
                        drafts,
                        archived,
                        total
                    }
                },
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error: any) {
            logger.error("Error retrieving assessments:", error);
            return {
                success: false,
                message: "Failed to retrieve assessments"
            };
        }
    }

    async getAssessmentById(id: number, schoolId: number): Promise<AssessmentServiceResponse> {
        try {
            const queryBuilder = this.assessmentRepo.createQueryBuilder("assessment")
                .leftJoinAndSelect("assessment.classrooms", "classroom")
                .leftJoinAndSelect("assessment.assignedStaff", "staff")
                .leftJoinAndSelect("staff.user", "staffUser")
                .leftJoinAndSelect("assessment.subject", "subject")
                .leftJoinAndSelect("assessment.creator", "creator")
                .leftJoinAndSelect("assessment.studentAssessments", "studentAssessmentDetail")
                .leftJoinAndSelect("classroom.studentsCurrentClass", "classroomStudent")
                .leftJoinAndSelect("classroomStudent.user", "classroomStudentUser")
                .leftJoinAndSelect("classroomStudent.currentClassroom", "classroomStudentClass")
                .addSelect(subQuery => {
                    return subQuery
                        .select("COUNT(DISTINCT sac.id)", "count")
                        .from(StudentAssessmentScore, "sac")
                        .where("sac.assessmentId = assessment.id");
                }, "assessmentSubmissionCount")
                .addSelect(subQuery => {
                    return subQuery
                        .select("COUNT(DISTINCT s.id)", "count")
                        .from(Student, "s")
                        .innerJoin("s.currentClassroom", "c")
                        .innerJoin("c.assessments", "a")
                        .where("a.id = assessment.id");
                }, "assessmentTotalStudents")
                .where("assessment.id = :id", { id })
                .andWhere("assessment.schoolId = :schoolId", { schoolId });

            const assessment = await queryBuilder.getOne();
            const raw = await queryBuilder.getRawOne();

            if (!assessment) {
                return {
                    success: false,
                    message: "Assessment not found"
                };
            }

            const formattedResponse = this.formatAssessmentResponse(assessment, raw);

            return {
                success: true,
                message: "Assessment retrieved successfully",
                data: formattedResponse
            };
        } catch (error: any) {
            logger.error("Error retrieving assessment:", error);
            return {
                success: false,
                message: "Failed to retrieve assessment"
            };
        }
    }

    async updateAssessment(id: number, schoolId: number, data: UpdateAssessmentData): Promise<AssessmentServiceResponse> {
        try {
            const assessment = await this.assessmentRepo.findOne({ where: { id, schoolId } });
            if (!assessment) {
                return { success: false, message: "Assessment not found" };
            }

            Object.assign(assessment, data);
            const updatedAssessment = await this.assessmentRepo.save(assessment);

            return {
                success: true,
                message: "Assessment updated successfully",
                data: updatedAssessment
            };
        } catch (error: any) {
            logger.error("Error updating assessment:", error);
            return { success: false, message: "Failed to update assessment" };
        }
    }

    async deleteAssessment(id: number, schoolId: number): Promise<AssessmentServiceResponse> {
        try {
            const assessment = await this.assessmentRepo.findOne({ where: { id, schoolId } });
            if (!assessment) {
                return { success: false, message: "Assessment not found" };
            }

            await this.assessmentRepo.remove(assessment);

            return {
                success: true,
                message: "Assessment deleted successfully"
            };
        } catch (error: any) {
            logger.error("Error deleting assessment:", error);
            return { success: false, message: "Failed to delete assessment" };
        }
    }


    async recordAssessmentScore(data: RecordAssessmentScoreData): Promise<AssessmentServiceResponse> {
        try {

            const students = await this.studentRepo.find({
                where: {
                    id: In(data.studentIds),
                    schoolId: data.schoolId
                }
            });

            if (students.length !== data.studentIds.length) {
                return { success: false, message: "One or more students not found" };
            }
            if (!data.milestoneId) {
                return { success: false, message: "Milestone ID is required" };
            }

            const arrayFields: (keyof RecordAssessmentScoreData)[] = ['grades', 'observations'];
            for (const field of arrayFields) {
                const arr = data[field] as any[];
                if (arr && arr.length !== data.studentIds.length) {
                    return {
                        success: false,
                        message: `Number of students must match number of ${field}`
                    };
                }
            }

            // Verify grader exists and has proper authorization to grade assessments   
            const grader = await this.usersRepo.findOne({ where: { id: data.gradedById } });
            if (!grader) {
                return { success: false, message: "Grader user not found" };
            }

            const milestone = await this.milestoneRepo.findOne({
                where: { id: data.milestoneId, schoolId: data.schoolId }
            });

            if (!milestone) {
                return { success: false, message: "Milestone not found" };
            }

            // Grading type validation for milestones
            const { gradingType } = milestone;
            if (!data.grades || data.grades.length === 0) {
                if (gradingType !== GradingType.OBSERVATION) {
                    return { success: false, message: "Grades are required for this milestone" };
                }
            } else {
                if (gradingType === GradingType.NUMERICAL_SCORE) {
                    if (data.grades.some(g => typeof g !== 'number')) {
                        return { success: false, message: "Numerical scores are required for this milestone" };
                    }
                }
            }

            if (gradingType === GradingType.OBSERVATION && (!data.observations || data.observations.length === 0)) {
                return { success: false, message: "Observations are required for this milestone's grading type" };
            }

            // Role-based authorization
            if (grader.role === UserRole.STAFF) {
                // Staff can only grade students in their assigned classrooms
                const staff = await this.staffRepo.findOne({
                    where: { userId: grader.id },
                    relations: ['staffClassesAndSubject']
                });

                if (!staff) {
                    return { success: false, message: "Staff record not found" };
                }

                const staffClassroomIds = staff.staffClassesAndSubject
                    ?.map(scs => scs.classroomId)
                    .filter((id): id is number => id !== undefined) || [];

                if (staffClassroomIds.length === 0) {
                    return { success: false, message: "You are not assigned to any classrooms" };
                }

                const unauthorizedStudents = students.filter(student => {
                    if (!student.classroomId) return true;
                    return !staffClassroomIds.includes(student.classroomId);
                });

                if (unauthorizedStudents.length > 0) {
                    const ids = unauthorizedStudents.map(s => s.id).join(', ');
                    return {
                        success: false,
                        message: `Not authorized to grade students [${ids}] - they are not in your assigned classrooms`
                    };
                }
            } else if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(grader.role)) {
                return { success: false, message: "Not authorized to grade students" };
            }


            const whereConditions: any[] = [];
            if (data.assessmentId) {
                whereConditions.push({ assessmentId: data.assessmentId, studentId: In(data.studentIds) });
            }
            if (data.milestoneId) {
                whereConditions.push({ milestoneId: data.milestoneId, studentId: In(data.studentIds) });
            }

            const existingScores = await this.assessmentScoreRepo.find({
                where: whereConditions
            });

            const existingScoresMap = new Map<number, StudentAssessmentScore>();
            existingScores.forEach(s => {
                const current = existingScoresMap.get(s.studentId);
                if (!current || (data.assessmentId && s.assessmentId === data.assessmentId)) {
                    existingScoresMap.set(s.studentId, s);
                }
            });

            // Create or update assessment scores
            const assessmentScores = data.studentIds.map((studentId, index) => {
                const existingScore = existingScoresMap.get(studentId);
                const scoreData: any = {
                    studentId: studentId,
                    gradedBy: { id: data.gradedById } as User,
                    status: GradingStatus.COMPLETED
                };

                if (data.assessmentId) scoreData.assessmentId = data.assessmentId;
                if (data.milestoneId) scoreData.milestoneId = data.milestoneId;

                // Strictly map fields based on gradingType (or allow all for assessments)
                const gType = milestone?.gradingType;

                if (data.grades) {
                    const gradeVal = data.grades[index];
                    if (!gType || gType === GradingType.NUMERICAL_SCORE) {
                        scoreData.score = typeof gradeVal === 'number' ? gradeVal : parseFloat(gradeVal as string);
                    } else if (gType === GradingType.TWO_LEVEL || gType === GradingType.FIVE_LEVEL_SCALE) {
                        scoreData.gradeValue = String(gradeVal);
                    }
                }

                // Observations are always allowed
                if (data.observations) scoreData.observation = data.observations[index];

                if (existingScore) {
                    return this.assessmentScoreRepo.merge(existingScore, scoreData);
                } else {
                    return this.assessmentScoreRepo.create(scoreData) as unknown as StudentAssessmentScore;
                }
            });

            const savedAssessmentScores = await this.assessmentScoreRepo.save(assessmentScores);

            // Send email and in-app notifications to parents for milestone grading
            if (milestone) {
                const teacherName = grader ? `${grader.firstName} ${grader.lastName}` : 'Teacher';
                const subjectName = milestone?.subject?.name || 'Unknown Subject';

                const notificationPromises: Promise<any>[] = [];

                // Map studentId -> savedAssessmentScore for quick lookup
                const scoreMap = new Map<number, StudentAssessmentScore>();
                savedAssessmentScores.forEach((score, idx) => {
                    const studentId = data.studentIds[idx];
                    if (studentId == null) return;
                    scoreMap.set(studentId, score);
                });

                for (const student of students) {
                    if (!student.user) continue;

                    const studentName = `${student.user.firstName} ${student.user.lastName}`;
                    const score = scoreMap.get(student.id);

                    if (!score) continue;

                    const parents = await this.getParentEmailsForStudent(student.id);
                    if (!parents || parents.length === 0) continue;

                    for (const parent of parents) {
                        notificationPromises.push(
                            notificationService.sendNotification({
                                userId: parent.id,
                                schoolId: data.schoolId,
                                title: "Milestone Graded",
                                message: `Dear ${parent.name || 'Parent'},\n\n${studentName} has been graded for the milestone: "${milestone.title}" in ${subjectName}.\n\nGrade: ${score.gradeValue || score.score || 'N/A'}\nComment: ${score.observation || 'No comment'}\n- ${teacherName}`,
                                type: NotificationType.INFO,
                                sendEmail: true,
                                data: {
                                    studentId: student.id,
                                    milestoneId: milestone.id,
                                    score: score.score,
                                    grade: score.gradeValue
                                }
                            })
                        );
                    }
                }

                // Execute all notifications concurrently, log errors but do not block grading
                const results = await Promise.allSettled(notificationPromises);
                results.forEach((result, idx) => {
                    if (result.status === 'rejected') {
                        logger.error(`Failed to send notification #${idx}:`, result.reason);
                    }
                });
            }

            // If all students for this milestone are graded, mark milestone and assessment as completed
            if (milestone) {
                let expectedStudentIds = Array.from(new Set(data.studentIds));

                if (milestone.subjectId) {
                    const subject = await this.subjectRepo.findOne({
                        where: { id: milestone.subjectId },
                        relations: ["staffClassesAndSubject"]
                    });

                    const classroomIds = subject?.staffClassesAndSubject
                        ?.map(scs => scs.classroomId)
                        .filter((id): id is number => id !== undefined) || [];

                    if (classroomIds.length > 0) {
                        const classroomStudents = await this.studentRepo.find({
                            select: ["id"],
                            where: {
                                schoolId: data.schoolId,
                                classroomId: In(classroomIds)
                            }
                        });
                        expectedStudentIds = classroomStudents.map(s => s.id);
                    }
                }

                const uniqueExpectedIds = Array.from(new Set(expectedStudentIds));
                if (uniqueExpectedIds.length > 0) {
                    const gradedCount = await this.assessmentScoreRepo.count({
                        where: {
                            milestoneId: milestone.id,
                            status: GradingStatus.COMPLETED,
                            studentId: In(uniqueExpectedIds)
                        }
                    });

                    if (gradedCount >= uniqueExpectedIds.length) {
                        if (milestone.status !== MilestoneStatus.COMPLETED) {
                            milestone.status = MilestoneStatus.COMPLETED;
                            await this.milestoneRepo.save(milestone);
                        }

                        if (milestone.assessmentId) {
                            await this.assessmentRepo.update(
                                { id: milestone.assessmentId, schoolId: data.schoolId },
                                { gradingStatus: GradingStatus.COMPLETED, status: AssessmentStatus.GRADED }
                            );
                        }
                    }
                }
            }

            const context = data.assessmentId ? "Assessment" : "Milestone";
            return {
                success: true,
                message: `${context} scores recorded successfully`,
                data: savedAssessmentScores
            };
        } catch (error: any) {
            logger.error(`Error recording grading score:`, error);
            const context = data.assessmentId ? "assessment" : "milestone";
            return {
                success: false,
                message: `Failed to record ${context} score`,
                data: error.message
            };
        }
    }

    /*  Helper methods
    
    */

    private formatAssessmentResponse(assessment: Assessment, raw?: any): any {
        const submissionCount = raw?.assessmentSubmissionCount ? parseInt(raw.assessmentSubmissionCount) : (assessment.studentAssessments?.length || 0);
        const totalStudents = raw?.assessmentTotalStudents ? parseInt(raw.assessmentTotalStudents) : 0;

        const scoresMap = new Map();
        assessment.studentAssessments?.forEach(sa => {
            scoresMap.set(sa.studentId, sa);
        });

        const studentScores: any[] = [];
        const processedStudents = new Set();

        // Include students from classrooms (for detail view if loaded) 
        assessment.classrooms?.forEach(classroom => {
            classroom.studentsCurrentClass?.forEach(student => {
                if (!processedStudents.has(student.id)) {
                    const sa = scoresMap.get(student.id);
                    studentScores.push({
                        studentId: student.id,
                        studentName: student.user ? `${student.user.firstName} ${student.user.lastName}` : "Unknown Student",
                        classroomName: classroom.classroomName,
                        score: sa?.score ?? null,
                        status: sa?.status ?? AssessmentStatus.ASSIGNED
                    });
                    processedStudents.add(student.id);
                }
            });
        });

        // Include any remaining students who have scores (covers history/edge cases)
        assessment.studentAssessments?.forEach(sa => {
            if (!processedStudents.has(sa.studentId)) {
                studentScores.push({
                    studentId: sa.studentId,
                    studentName: sa.student?.user ? `${sa.student.user.firstName} ${sa.student.user.lastName}` : "Unknown Student",
                    classroomName: sa.student?.currentClassroom?.classroomName,
                    score: sa.score,
                    status: sa.status
                });
                processedStudents.add(sa.studentId);
            }
        });

        return {
            id: assessment.id,
            title: assessment.title,
            assessmentType: assessment.assessmentType,
            status: assessment.status,
            totalScore: assessment.totalScore,
            academicYear: assessment.academicYear,
            term: assessment.term,
            dateAssigned: assessment.dateAssigned,
            dueDate: assessment.dueDate,
            description: assessment.description,
            attachmentsUrl: assessment.attachmentsUrl,
            subject: assessment.subject ? { id: assessment.subject.id, name: assessment.subject.name } : null,
            assignedStaff: assessment.assignedStaff ? {
                id: assessment.assignedStaff.id,
                firstName: assessment.assignedStaff.user?.firstName,
                lastName: assessment.assignedStaff.user?.lastName
            } : null,
            classrooms: assessment.classrooms?.map(c => ({ id: c.id, name: c.classroomName })),
            creator: assessment.creator ? {
                id: assessment.creator.id,
                firstName: assessment.creator.firstName,
                lastName: assessment.creator.lastName
            } : null,
            submissionCount,
            totalStudents,
            scores: studentScores,
            createdAt: assessment.createdAt
        };

    }

    /**
     * Helper function to get parent emails for a student
     */
    private async getParentEmailsForStudent(studentId: number): Promise<Array<{ id: number; email: string; name: string }>> {
        try {
            const student = await this.studentRepo.findOne({
                where: { id: studentId },
                relations: ['parents', 'parents.user']
            });

            if (!student || !student.parents) {
                return [];
            }

            return student.parents
                .filter((parent: any) => parent.user)
                .map((parent: any) => ({
                    id: parent.user.id,
                    email: parent.user.email,
                    name: `${parent.user.firstName} ${parent.user.lastName}`
                }));
        } catch (error) {
            logger.error(`Error fetching parent data for student ${studentId}:`, error);
            return [];
        }

    }
}

export const assessmentService = new AssessmentService();
