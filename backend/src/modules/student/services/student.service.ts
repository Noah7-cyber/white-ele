import { StudentRepository } from "../../core/StudentRepository";
import { Student } from "../../shared/entities/StudentEntity";
import { generateAdmissionNumber } from "../../shared/services/utils";
import { logger } from "../../shared";
import { AppDataSource, UserRepository } from "../../core";
import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import { User } from "../../shared/entities/User";
import { Gender, GradingStatus, GradingType, StudentStatus, UserRole } from "../../shared/entities";
import { StudentAction } from "../../shared/entities/StudentStatus";
import { Milestone } from "../../shared/entities/Milestone";
import { StudentAssessmentScore } from "../../shared/entities/StudentAssessmentScore";
import { MILESTONE_NUMERICAL_MAX_SCORE } from "../../shared/utils/grading-display.util";

interface StudentData {
    userId: number;
    admissionNumber?: string;
    enrolmentDate: Date;
    schedule?: string[];
    photoUrl?: string;
    schoolId: number;
    gender?: Gender;
    classroomId?: number;
    status?: StudentStatus;
    tourBookingId?: number;
    formResponseId?: number;
}

interface StudentFilters {
    schoolId: number; // Required: always scope to user's school
    classroomId?: number;
    staffId?: number; // Filter by assigned teacher: only students in classes assigned to this staff
    admissionNumber?: string;
    search?: string;
    status?: StudentStatus;
    pos?: number;
    delta?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}

export interface StudentStatusData {
    studentId: number;
    type?: StudentStatus;
    reason?: string;
    endAt?: Date;
    disciplinarianId?: number;
}

const STUDENT_ID_IN_CHUNK_SIZE = 2000;

export class StudentService {

    private studentRepository: StudentRepository;
    private userRepository: UserRepository;
    private studentActionRepository: Repository<StudentAction>;
    constructor() {
        this.studentRepository = new StudentRepository();
        this.userRepository = new UserRepository();
        this.studentActionRepository = AppDataSource.getRepository(StudentAction);
    }

    /**
     * Shared predicates for list + cohort id queries. Requires `student` + `user` joins when search is used.
     */
    private applyStudentListFilters(
        queryBuilder: SelectQueryBuilder<Student>,
        filters: StudentFilters
    ): void {
        queryBuilder.andWhere("student.schoolId = :schoolId", {
            schoolId: filters.schoolId,
        });

        if (filters?.classroomId) {
            queryBuilder.andWhere("student.classroomId = :classroomId", {
                classroomId: filters.classroomId,
            });
        }

        if (filters?.staffId) {
            queryBuilder.andWhere(
                'EXISTS (SELECT 1 FROM "staffClassesAndSubject" scs WHERE scs."classroomId" = student."classroomId" AND scs."staffId" = :staffId)',
                { staffId: filters.staffId }
            );
        }

        if (filters?.status) {
            queryBuilder.andWhere("student.status = :status", {
                status: filters.status,
            });
            if (filters.status === StudentStatus.EXPEL) {
                queryBuilder.withDeleted();
            }
        }

        if (filters?.search) {
            queryBuilder.andWhere(
                "(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(user.middleName) LIKE LOWER(:search) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:search))",
                { search: `%${filters.search}%` }
            );
        }

        if (filters?.admissionNumber) {
            queryBuilder.andWhere("student.admissionNumber = :admissionNumber", {
                admissionNumber: filters.admissionNumber,
            });
        }
    }

    /**
     * DB-level aggregation: GROUP BY studentId with SUM(score) and COUNT(DISTINCT milestoneId).
     * Scoped by schoolId via join to student (multi-tenant).
     * Same formula as averageDevelopmentPercent on getStudentById.
     */
    async getGradedMilestonePerformancePercentMap(
        schoolId: number,
        studentIds: number[]
    ): Promise<Map<number, number | null>> {
        const result = new Map<number, number | null>();
        studentIds.forEach((id) => result.set(id, null));
        if (studentIds.length === 0) {
            return result;
        }

        const scoreRepo = AppDataSource.getRepository(StudentAssessmentScore);
        for (let i = 0; i < studentIds.length; i += STUDENT_ID_IN_CHUNK_SIZE) {
            const chunk = studentIds.slice(i, i + STUDENT_ID_IN_CHUNK_SIZE);
            const rows = await scoreRepo
                .createQueryBuilder("score")
                .innerJoin("score.student", "student")
                .innerJoin("score.milestone", "milestone")
                .select("score.studentId", "studentId")
                .addSelect("SUM(COALESCE(score.score, 0))", "sumScore")
                .addSelect("COUNT(DISTINCT score.milestoneId)", "milestoneCount")
                .where("student.schoolId = :schoolId", { schoolId })
                .andWhere("score.studentId IN (:...chunk)", { chunk })
                .andWhere("score.milestoneId IS NOT NULL")
                .andWhere("score.status = :status", { status: GradingStatus.COMPLETED })
                .andWhere("(milestone.gradingType IS NULL OR milestone.gradingType = :numerical)", {
                    numerical: GradingType.NUMERICAL_SCORE,
                })
                .groupBy("score.studentId")
                .getRawMany();

            for (const row of rows) {
                const sid = Number(row.studentId);
                const n = Number(row.milestoneCount);
                const sum = Number(row.sumScore);
                if (n <= 0) continue;
                const pct = (sum / (MILESTONE_NUMERICAL_MAX_SCORE * n)) * 100;
                result.set(sid, Math.round(pct * 100) / 100);
            }
        }
        return result;
    }

    /** Mean of per-student % over all filtered students; null excluded, 0% included. */
    private async getCohortAverageGradedMilestonePerformance(
        schoolId: number,
        filters: StudentFilters
    ): Promise<number | null> {
        const qb = this.studentRepository
            .createQueryBuilder("student")
            .leftJoin("student.user", "user")
            .select("student.id", "id");
        this.applyStudentListFilters(qb, filters);
        const raw = await qb.getRawMany();
        const allIds = raw.map((r: { id: string | number }) => Number(r.id));
        if (allIds.length === 0) {
            return null;
        }
        const map = await this.getGradedMilestonePerformancePercentMap(schoolId, allIds);
        const nums = [...map.values()].filter((v): v is number => v !== null);
        if (nums.length === 0) {
            return null;
        }
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        return Math.round(avg * 100) / 100;
    }

    /** All students in the school (schoolId only). Excludes soft-deleted unless caller changes query. */
    private async getTotalStudentsInSchool(schoolId: number): Promise<number> {
        return this.studentRepository
            .createQueryBuilder("student")
            .where("student.schoolId = :schoolId", { schoolId })
            .getCount();
    }

    async createStudent(data: StudentData, options?: { manager?: EntityManager }): Promise<Student> {
        try {

            // Validate schedule days
            const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            if (data.schedule && !data.schedule.every(day => validDays.includes(day))) {
                throw new Error("Schedule contains invalid day(s)");
            }

            // 🔹 FETCH USER: use transaction manager if provided, otherwise use repository
            let user: User | null;
            if (options?.manager) { // 🔹 CHANGED
                user = await options.manager.findOne(User, { where: { id: data.userId } }); // 🔹 CHANGED
            } else {
                // 🔹 Use full User entity from repository instead of partial {id}
                user = await AppDataSource.getRepository(User).findOne({ where: { id: data.userId } }); // 🔹 CHANGED
            }

            if (!user) {
                throw new Error(`User with id ${data.userId} not found`);
            }

            //generate admission number (only if not already provided)
            if (!data.admissionNumber) {
                data.admissionNumber = await generateAdmissionNumber(
                    data.schoolId,
                    this.studentRepository
                );
            }

            // Set default status if not provided
            if (!data.status) {
                data.status = StudentStatus.ACTIVE;
            }

            let student: Student;

            // 🔹 CREATE STUDENT: use manager if provided
            if (options?.manager) { // 🔹 CHANGED
                student = options.manager.create(Student, {
                    ...data,
                    user, // full User entity
                }); // 🔹 CHANGED
                student = await options.manager.save(student); // 🔹 CHANGED
            } else {
                // 🔹 Fallback to repository method with full User entity
                student = await this.studentRepository.create({
                    ...data,
                    user, // 🔹 CHANGED
                });
            }



            return student;
        } catch (error: any) {
            logger?.error?.("Error creating student:", error);
            throw new Error("Failed to create student");
        }

    }

    async getStudentById(id: number) {
        try {
            const student = await this.studentRepository
                .createQueryBuilder("student")
                .leftJoinAndSelect("student.user", "user")
                .leftJoinAndSelect("student.school", "school")
                .leftJoinAndSelect("student.classrooms", "classrooms")
                .leftJoinAndSelect("student.currentClassroom", "currentClassroom")
                .leftJoinAndSelect("student.parents", "parents")
                .leftJoinAndSelect("parents.user", "parentUser")
                .leftJoinAndSelect("student.documents", "documents")
                .leftJoinAndSelect("student.attendances", "attendances")
                .leftJoinAndSelect("student.enrolments", "enrolments")
                .leftJoinAndSelect("student.medicalRecord", "medicalRecord")
                .leftJoinAndSelect("student.emergencyContact", "emergencyContact")
                .leftJoinAndSelect("student.activities", "activities")
                .leftJoinAndSelect("student.studentAssessments", "studentAssessments")
                .leftJoinAndSelect("student.currentAttendance", "currentAttendance")
                .leftJoinAndSelect("student.previousAttendance", "previousAttendance")
                .where("student.id=:id", { id })
                .getOne()

            if (!student) return { success: false, message: "no student found" }

            // Transform the documents to include uploadedBy user info
            if (student.documents && Array.isArray(student.documents)) {
                // Get unique user IDs from documents
                const userIds = [...new Set(
                    student.documents
                        .map((doc: any) => doc.uploadedBy)
                        .filter((id: any) => id !== null && id !== undefined)
                )];

                // Fetch all users at once
                const users = userIds.length > 0
                    ? await AppDataSource.getRepository(User)
                        .createQueryBuilder("user")
                        .select(["user.id", "user.firstName", "user.lastName", "user.email", "user.phone"])
                        .where("user.id IN (:...userIds)", { userIds })
                        .getMany()
                    : [];

                // Create a map for quick lookup
                const userMap = new Map(users.map(u => [u.id, u]));

                // Transform documents
                student.documents = student.documents.map((doc: any) => {
                    if (doc.uploadedBy && userMap.has(doc.uploadedBy)) {
                        const uploadedByUser = userMap.get(doc.uploadedBy);
                        return {
                            ...doc,
                            uploadedBy: {
                                id: uploadedByUser!.id,
                                firstName: uploadedByUser!.firstName,
                                lastName: uploadedByUser!.lastName,
                                email: uploadedByUser!.email,
                                phone: uploadedByUser!.phone
                            }
                        };
                    }
                    return doc;
                });
            }

            // --- Milestone Statistics ---
            const completedGrades = await AppDataSource.getRepository(StudentAssessmentScore)
                .createQueryBuilder("score")
                .leftJoinAndSelect("score.milestone", "milestone")
                .leftJoinAndSelect("milestone.subject", "subject")
                .leftJoinAndSelect("subject.curriculum", "curriculum")
                .where("score.studentId = :id", { id })
                .andWhere("score.milestoneId IS NOT NULL")
                .getMany();

            const completedMilestoneIds = new Set(completedGrades.map(mg => mg.milestoneId));

            completedGrades.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

            let enrolledMilestones: Milestone[] = [];
            const studentClassroomId = student.currentClassroom && student.currentClassroom.id
                ? student.currentClassroom.id
                : null;

            if (studentClassroomId) {
                enrolledMilestones = await AppDataSource.getRepository(Milestone)
                    .createQueryBuilder("milestone")
                    .leftJoinAndSelect("milestone.subject", "subject")
                    .leftJoinAndSelect("subject.curriculum", "curriculum")
                    .leftJoin("curriculum.classrooms", "classroom")
                    .where("classroom.id = :studentClassroomId", { studentClassroomId })
                    .getMany();
            }

            const lastCompletedGrade = completedGrades.length > 0 ? completedGrades[0] : null;

            const gradedPerfMap = await this.getGradedMilestonePerformancePercentMap(student.schoolId, [student.id]);
            const averageDevelopmentPercent = gradedPerfMap.get(student.id) ?? null;

            // Format response to include attendance object and milestones
            const formattedStudent = {
                ...student,
                averageDevelopmentPercent,
                attendance: {
                    currentStatus: student.currentAttendance ? student.currentAttendance.status : "Clocked Out",
                    currentAttendance: student.currentAttendance ? {
                        status: student.currentAttendance?.status,
                        date: student.currentAttendance?.date,
                        timeIn: student.currentAttendance?.timeIn,
                        timeOut: student.currentAttendance?.timeOut,
                    } : null,
                    previousAttendance: student.previousAttendance ? {
                        status: student.previousAttendance?.status,
                        date: student.previousAttendance?.date,
                        timeIn: student.previousAttendance?.timeIn,
                        timeOut: student.previousAttendance?.timeOut,
                    } : null
                },
                milestones: {
                    totalEnrolled: enrolledMilestones.length,
                    totalCompleted: completedGrades.length,
                    enrolled: enrolledMilestones.map(m => ({
                        milestoneId: m.id,
                        title: m.title,
                        subjectName: m.subject?.name ?? null,
                        curriculumName: m.subject?.curriculum?.title ?? null,
                        status: m.status,
                        isCompleted: completedMilestoneIds.has(m.id)
                    })),
                    lastGradedMilestone: lastCompletedGrade ? [{
                        milestoneId: lastCompletedGrade.milestoneId,
                        title: lastCompletedGrade.milestone?.title ?? null,
                        subjectName: lastCompletedGrade.milestone?.subject?.name ?? null,
                        curriculumName: lastCompletedGrade.milestone?.subject?.curriculum?.title ?? null,
                        score: lastCompletedGrade.score,
                        gradeValue: lastCompletedGrade.gradeValue ?? null,
                        date: lastCompletedGrade.createdAt
                    }] : []
                }
            };

            return formattedStudent;
        } catch (error: any) {
            logger?.error?.("Error fetching student by ID:", error);
            throw new Error("Failed to fetch student");
        }

    }

    async getAllStudents(filters: StudentFilters): Promise<{
        success: boolean;
        message: string;
        students?: Student[];

        pagination?: { pos: number; delta: number; count: number };
        /** Cohort milestone metrics (filtered set vs whole school). */
        metaData?: {
            averageDevelopmentPercent: number | null;
            totalStudents: number;
            totalStudentsInSchool: number;
        };
    }> {
        try {
            // Validate that schoolId is provided
            if (!filters?.schoolId) {
                throw new Error("schoolId is required for student queries");
            }

            const queryBuilder = this.studentRepository
                .createQueryBuilder("student")
                .leftJoinAndSelect("student.user", "user")
                .leftJoinAndSelect("student.school", "school")
                .leftJoinAndSelect("student.classrooms", "classrooms")
                .leftJoinAndSelect("student.parents", "parents")
                .leftJoinAndSelect("parents.user", "parentUser")
                .leftJoinAndSelect("student.currentAttendance", "currentAttendance")
                .leftJoinAndSelect("student.previousAttendance", "previousAttendance");

            this.applyStudentListFilters(queryBuilder, filters);

            // Sorting
            const sortBy = filters?.sortBy || "lastName";
            const sortOrder = filters?.sortOrder || "ASC";

            const sortFieldMap: { [key: string]: string } = {
                firstName: "user.firstName",
                lastName: "user.lastName",
                createdAt: "student.createdAt",
                admissionNumber: "student.admissionNumber",
            };

            const sortField = sortFieldMap[sortBy] || "student.createdAt";
            queryBuilder.orderBy(sortField, sortOrder);

            const pos = filters?.pos ?? 0;
            const delta = filters?.delta ?? 10;

            const [students, count] = await queryBuilder.skip(pos).take(delta).getManyAndCount();

            const [cohortAverage, totalStudentsInSchool] = await Promise.all([
                this.getCohortAverageGradedMilestonePerformance(filters.schoolId, filters),
                this.getTotalStudentsInSchool(filters.schoolId),
            ]);

            const formattedStudents = students.map((student) => ({
                ...student,
                attendance: {
                    currentStatus: student.currentAttendance ? student.currentAttendance.status : "Clocked Out",
                    currentAttendance: student.currentAttendance ? {
                        status: student.currentAttendance.status,
                        date: student.currentAttendance.date,
                        timeIn: student.currentAttendance.timeIn,
                        timeOut: student.currentAttendance.timeOut,
                    } : null,
                    previousAttendance: student.previousAttendance ? {
                        status: student.previousAttendance.status,
                        date: student.previousAttendance.date,
                        timeIn: student.previousAttendance.timeIn,
                        timeOut: student.previousAttendance.timeOut,
                    } : null
                }
            }));

            return {
                success: true,
                message: "Students retrieved successfully",
                students: formattedStudents as any,
                pagination: { pos, delta, count },
                metaData: {
                    averageDevelopmentPercent: cohortAverage,
                    totalStudents: count,
                    totalStudentsInSchool,
                },
            };
        } catch (error: any) {
            logger?.error?.(error, error);
            throw new Error("Failed to fetch students");
        }
    }

    async updateStudent(studentId: number, payload: Partial<Student>): Promise<Student> {
        // Ensure student exists
        const student = await this.studentRepository.findById(studentId);
        if (!student) throw new Error(`Student with ID ${studentId} not found`);

        // Validate status enum
        if (payload.status && !Object.values(StudentStatus).includes(payload.status)) {
            throw new Error("Invalid student status value");
        }

        // Remove protected fields
        delete payload.id;
        delete payload.userId;
        delete payload.schoolId;
        delete payload.admissionNumber;

        // Update student
        const updatedStudent = await this.studentRepository.updateById(studentId, payload);

        if (!updatedStudent) throw new Error("Failed to update student");

        return updatedStudent;
    }

    async deleteStudent(studentId: number): Promise<{ success: boolean; message: string }> {

        const student = await this.studentRepository.findById(studentId);

        if (!student) {
            return {
                success: false,
                message: `Student with ID ${studentId} not found`
            }

        }

        await this.studentRepository.softDeleteById(studentId);

        return {
            success: true,
            message: `Student with ID ${studentId} marked as inactive`
        }

    }

    async updateStudentStatus(data: StudentStatusData): Promise<{ success: boolean; message: string }> {

        const student = await this.studentRepository.findById(data.studentId);

        if (!student) {
            return {
                success: false,
                message: `Student with ID ${data.studentId} not found`
            }
        }

        if (!data.disciplinarianId) {
            return {
                success: false,
                message: `Disciplinarian ID is required`
            }
        }

        const disciplinarian = await this.userRepository.findById(data.disciplinarianId);

        if (!disciplinarian) {
            return {
                success: false,
                message: `Disciplinarian with ID ${data.disciplinarianId} not found`
            }
        }

        if (disciplinarian.role !== UserRole.ADMIN && disciplinarian.role !== UserRole.SUPER_ADMIN) {
            return {
                success: false,
                message: `Disciplinarian with ID ${data.disciplinarianId} is not authorized to update student status`
            };
        }

        // Status/type is required - do not assume expel when missing
        if (!data.type) {
            return {
                success: false,
                message: `Status type is required (active, inactive, suspended, or expelled)`
            };
        }

        // Check if student is already in the requested status
        if (student.status === data.type) {
            return {
                success: false,
                message: `Student is already in ${data.type} status`
            };
        }

        // If trying to restore (set to ACTIVE), allow if student is SUSPENDED or INACTIVE
        if (data.type === StudentStatus.ACTIVE) {
            const restorableStatuses = [StudentStatus.SUSPENDED, StudentStatus.INACTIVE];
            if (!restorableStatuses.includes(student.status)) {
                return {
                    success: false,
                    message: `Can only restore students who are suspended or inactive. Current status: ${student.status}`
                };
            }
        }

        // Update student status
        student.status = data.type;

        // Save status change
        await this.studentRepository.updateById(student.id, { status: student.status });

        // Record the action in StudentAction table
        await this.studentActionRepository.save({
            student,
            type: data.type,
            reason: data.reason,
            endAt: data.endAt
        });

        // If expelling the student, also soft delete
        if (data.type === StudentStatus.EXPEL) {
            await this.studentRepository.softDeleteById(student.id);
            return { success: true, message: `Student expelled and removed successfully` };
        }

        return { success: true, message: `Student status updated to ${student.status} successfully` };
    }


}



export const studentService = new StudentService()