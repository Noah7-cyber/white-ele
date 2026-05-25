import { Classroom } from "../../shared/entities/Classroom";
import { EntityManager, Repository, In } from "typeorm";
import { logger } from "../../shared";
import { AppDataSource } from "../../core";
import { School } from "../../shared/entities/School";
import { Student } from "../../shared/entities/StudentEntity";
import { ClassroomStatus } from "../../shared/entities";
import { StaffClassesAndSubject } from "../../shared/entities/StaffClassesAndSubject";
import { Staff } from "../../shared/entities/Staff";


export interface createClassroomData {
    classroomName: string;
    minimumAge: number;
    maximumAge: number;
    maximumCapacity: number;
    description: string;
    tuitionFee?: number;
    schoolId: number;
    classroomStatus: ClassroomStatus;
    assignedStaffId?: number[];
}

export interface updateClassroomData {
    classroomName?: string;
    minimumAge?: number;
    maximumAge?: number;
    maximumCapacity?: number;
    description?: string;
    tuitionFee?: number;
    schoolId?: number;
    classroomStatus?: ClassroomStatus;
    assignedStaffId?: number[];
}

export interface ClassroomSearchFilters {
    search?: string;
    schoolId?: number;
    staffId?: number;
    classroomStatus?: ClassroomStatus;
    pos?: number;
    delta?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    isSystem?: boolean;
}

export interface ClassroomResponse {
    success: boolean;
    message: string;
    classrooms?: Classroom[];
    pagination?: {
        pos: number;
        delta: number;
        count: number;
    };
}

export interface AssignStudentClassroom {
    classroomId: number;
    studentId: number;
    assignedBy?: number;
    assigned?: Classroom
}

export interface AssignStaffToClassroom {
    classroomId: number;
    staffIds: number[];
}

export interface UpdateStaffAssignment {
    staffId: number;
    previousClassroomId: number;
    newClassroomId: number;
}

export interface ReassignClassroomStaff {
    classroomId: number;
    staffIds: number[];
}

export interface ServiceResponse {
    success: boolean;
    message: string;
    classroom?: Classroom;
    classrooms?: Classroom[];
    pagination?: {
        pos: number;
        delta: number;
        count: number;
    };
}


export class ClassroomService {
    private get classroomRepository(): Repository<Classroom> {
        return AppDataSource.getRepository(Classroom)
    }

    private get studentRepository(): Repository<Student> {
        return AppDataSource.getRepository(Student)
    }

    private get schoolRepository(): Repository<School> {
        return AppDataSource.getRepository(School)
    }

    private get staffRepository(): Repository<Staff> {
        return AppDataSource.getRepository(Staff)
    }

    private get staffClassesAndSubjectRepository(): Repository<StaffClassesAndSubject> {
        return AppDataSource.getRepository(StaffClassesAndSubject)
    }

    async createClassroom(data: createClassroomData): Promise<{ success: boolean; message: string; classroom?: Classroom | undefined }> {
        try {
            // All validation checks before starting transaction
            // Check for the existence of class
            const existingClassrooms = await this.classroomRepository.find({
                where: {
                    classroomName: data.classroomName,
                    schoolId: data.schoolId
                }
            });

            if (existingClassrooms.length > 0) {
                return {
                    success: false,
                    message: "Classroom already exists"
                }
            }

            // Ensure school exists
            const school = await this.schoolRepository.findOne({
                where: { id: data.schoolId }
            });

            if (!school) {
                return {
                    success: false,
                    message: "Invalid schoolId: school not found",
                };
            }

            // Check if school has a maximum capacity set
            await this.validateSchoolCapacityForClassroom(data.schoolId, data.maximumCapacity, school.maximumNumberOfStudents);

            // Validate staff IDs if provided
            const staffIds = data.assignedStaffId || [];
            let staffMembers: Staff[] = [];
            if (Array.isArray(staffIds) && staffIds.length > 0) {
                staffMembers = await this.staffRepository.find({
                    where: {
                        id: In(staffIds),
                        schoolId: data.schoolId,
                    },
                });

                if (staffMembers.length !== staffIds.length) {
                    const foundIds = staffMembers.map((s) => s.id);
                    const missingIds = staffIds.filter((id) => !foundIds.includes(id));
                    return {
                        success: false,
                        message: `Staff/Teacher IDs not found or do not belong to this school: ${missingIds.join(", ")}`,
                    };
                }
            }

            const queryRunner = AppDataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                const classroom = new Classroom({
                    classroomName: data.classroomName,
                    minimumAge: data.minimumAge,
                    maximumAge: data.maximumAge,
                    maximumCapacity: data.maximumCapacity,
                    description: data.description,
                    tuitionFee: data.tuitionFee,
                    schoolId: data.schoolId,
                    classroomStatus: data.classroomStatus || ClassroomStatus.ACTIVE
                });

                const savedClassroom = await queryRunner.manager.save(classroom);

                // Handle staff/teacher assignments if provided
                if (staffMembers.length > 0) {
                    const scsRecords = staffMembers.map((staff) => {
                        return queryRunner.manager.create(StaffClassesAndSubject, {
                            staffId: staff.id,
                            classroomId: savedClassroom.id,
                            subjectId: undefined,
                            curriculumId: undefined,
                        });
                    });

                    await queryRunner.manager.save(StaffClassesAndSubject, scsRecords);
                }

                await queryRunner.commitTransaction();

                return {
                    success: true,
                    message: "Classroom created successfully",
                    classroom: savedClassroom
                }
            } catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            } finally {
                await queryRunner.release();
            }
        } catch (error) {
            logger.error("Error creating classroom:", error)
            console.error("Classroom creation error details:", error);
            return {
                success: false,
                message: `Failed to create classroom, ${error}`
            }
        }
    }

    async getClassroomById(classroomId: number): Promise<{ success: boolean; message: string; classroom?: Classroom | undefined }> {
        try {
            const classroom = await this.classroomRepository
                .createQueryBuilder("classroom")
                .leftJoinAndSelect("classroom.school", "school")
                .leftJoinAndSelect(
                    "classroom.studentsCurrentClass",
                    "studentsCurrentClass",
                    "(studentsCurrentClass.schoolId = classroom.schoolId OR (classroom.schoolId IS NULL AND studentsCurrentClass.schoolId IS NULL))"
                )
                .leftJoinAndSelect("studentsCurrentClass.user", "studentUser")
                .leftJoinAndSelect("studentUser.profile", "studentProfile")
                .leftJoinAndSelect("classroom.staffClassesAndSubject", "staffClassesAndSubject")
                .leftJoinAndSelect("staffClassesAndSubject.subject", "scsSubject")
                .leftJoinAndSelect("staffClassesAndSubject.staff", "scsStaff")
                .leftJoinAndSelect("scsStaff.user", "scsStaffUser")
                .leftJoinAndSelect("scsStaffUser.profile", "scsStaffProfile")
                .leftJoinAndSelect("classroom.curriculums", "curriculums")
                .where("classroom.id = :classroomId", { classroomId })
                .getOne();
            if (!classroom) {
                return {
                    success: false,
                    message: "Classroom not found"
                }
            }

            const formatted = this.formatClassroomRelations(classroom);

            return {
                success: true,
                message: "Classroom retrieved successfully",
                classroom: formatted
            }

        } catch (error) {
            logger.error("Error getting classroom by ID:", error)
            console.error("Classroom creation error details:", error);
            return {
                success: false,
                message: "Failed to create classroom"
            }
        }
    }

    async updateClassroom(classroomId: number, data: updateClassroomData): Promise<{ success: boolean; message: string; classroom?: Classroom | undefined }> {
        try {
            const classroom = await this.classroomRepository.findOne({
                where: { id: classroomId },
                relations: ["school"]
            })

            if (!classroom) {
                return {
                    success: false,
                    message: "Classroom not found"
                }
            }

            if (!data.schoolId) {
                return {
                    success: false,
                    message: "School ID is required",
                };
            }

            const school = await this.schoolRepository.findOne({ where: { id: data.schoolId } });
            if (!school) {
                return {
                    success: false,
                    message: "Invalid schoolId: school not found",
                };
            }

            // Validate capacity only if maximumCapacity is being  
            if (data.maximumCapacity !== undefined) {
                await this.validateSchoolCapacityForClassroom(
                    data.schoolId,
                    data.maximumCapacity,
                    school.maximumNumberOfStudents
                );
            }

            // Extract assignedStaffId before updating other fields
            const { schoolId, assignedStaffId, ...updateFields } = data;

            // Update classroom fields
            Object.assign(classroom, updateFields);
            classroom.schoolId = data.schoolId;

            const updatedClassroom = await this.classroomRepository.save(classroom);

            return {
                success: true,
                message: "Classroom Updated successfully",
                classroom: updatedClassroom
            }

        } catch (error) {
            logger.error("Error updating class:", error)
            return {
                success: false,
                message: "Failed to update class"
            }
        }
    }

    async deleteClassroom(classroomId: number): Promise<{ success: boolean; message: string }> {
        try {
            const classroom = await this.classroomRepository.findOne({
                where: { id: classroomId },
                relations: ["staffClassesAndSubject", "staffClassesAndSubject.staff", "staffClassesAndSubject.staff.user", "staffClassesAndSubject.staff.user.profile", "studentsCurrentClass", "students", "school"]
            })

            if (!classroom) {
                return {
                    success: false,
                    message: "Classroom not found"
                }
            }

            if (classroom.deletedAt) {
                return {
                    success: false,
                    message: "Classroom is already deleted"
                }
            }

            await this.classroomRepository.remove(classroom);

            return {
                success: true,
                message: "Classroom deleted successfully"
            }
        } catch (error) {
            logger.error("Error deleting classroom:", error);
            console.error("Classroom deletion error details:", error);
            return {
                success: false,
                message: "Failed to delete classroom"
            }
        }
    }

    async ListClassroom(filters: ClassroomSearchFilters = {}): Promise<ClassroomResponse> {
        try {
            const {
                search,
                classroomStatus,
                schoolId,
                staffId,
                pos = 0,
                delta = 10,
                isSystem,
                sortBy = "level",
                sortOrder = "ASC"
            } = filters;

            const queryBuilder = this.classroomRepository
                .createQueryBuilder("classroom")
                .leftJoinAndSelect("classroom.school", "school")
                .leftJoinAndSelect(
                    "classroom.studentsCurrentClass",
                    "studentsCurrentClass",
                    "(studentsCurrentClass.schoolId = classroom.schoolId OR (classroom.schoolId IS NULL AND studentsCurrentClass.schoolId IS NULL))"
                )
                .leftJoinAndSelect("studentsCurrentClass.user", "studentUser")
                .leftJoinAndSelect("studentUser.profile", "studentProfile")
                .leftJoinAndSelect("classroom.staffClassesAndSubject", "staffClassesAndSubject")
                .leftJoinAndSelect("staffClassesAndSubject.subject", "scsSubject")
                .leftJoinAndSelect("staffClassesAndSubject.staff", "scsStaff")
                .leftJoinAndSelect("scsStaff.user", "scsStaffUser")
                .leftJoinAndSelect("scsStaffUser.profile", "scsStaffProfile")
                .leftJoinAndSelect("classroom.curriculums", "curriculums")

            if (isSystem) {
                queryBuilder.where("classroom.schoolId IS NULL");
            } else {
                queryBuilder.where("classroom.schoolId = :schoolId", { schoolId });
            }

            if (classroomStatus) {
                queryBuilder.andWhere("classroom.classroomStatus = :classroomStatus", { classroomStatus });
            }

            if (search) {
                queryBuilder.andWhere(
                    "LOWER(classroom.classroomName) LIKE LOWER(:search)",
                    {
                        search: `%${search}%`,
                    }
                );
            }

            if (staffId) {
                queryBuilder.andWhere(
                    'EXISTS (SELECT 1 FROM "staffClassesAndSubject" scs WHERE scs."classroomId" = classroom.id AND scs."staffId" = :staffId)',
                    { staffId }
                );
            }

            const sortFieldMap: { [key: string]: string } = {
                classroomname: "classroom.classroomName",
                classroomName: "classroom.classroomName",
                level: "classroom.minimumAge",
                minimumage: "classroom.minimumAge",
                minimumAge: "classroom.minimumAge",
                maximumage: "classroom.maximumAge",
                maximumAge: "classroom.maximumAge",
                maximumcapacity: "classroom.maximumCapacity",
                maximumCapacity: "classroom.maximumCapacity",
                tuitionfee: "classroom.tuitionFee",
                tuitionFee: "classroom.tuitionFee",
                createdat: "classroom.createdAt",
                createdAt: "classroom.createdAt",
            };

            const sortField = sortFieldMap[sortBy] || "classroom.createdAt";
            queryBuilder.orderBy(sortField, sortOrder);

            queryBuilder.skip(pos).take(delta);

            const [classrooms, count] = await queryBuilder.getManyAndCount();
            const formattedClassrooms = classrooms.map((classroom) => this.formatClassroomRelations(classroom));

            return {
                success: true,
                message: "Classrooms retrieved successfully",
                classrooms: formattedClassrooms,
                pagination: {
                    pos,
                    delta,
                    count,
                },
            };
        } catch (error) {
            logger.error("Error listing classrooms:", error);
            console.error("Classroom listing error details:", error);
            return {
                success: false,
                message: "Failed to retrieve classrooms",
            };
        }
    }

    /**
     * Format school with only necessary fields
     */
    private formatSchool(school: School | undefined): any {
        if (!school) return null;
        return {
            id: school.id,
            schoolName: school.schoolName,
            schoolType: school.schoolType,
        };
    }

    private readonly formatClassroomRelations = (classroom: Classroom): Classroom => {
        // Format school with only necessary fields
        if (classroom.school) {
            (classroom as any).school = this.formatSchool(classroom.school);
        }

        // Extract unique staff members from staffClassesAndSubject for assignedStaff
        const uniqueStaffMap = new Map<number, any>();

        if (classroom.staffClassesAndSubject?.length) {
            classroom.staffClassesAndSubject.forEach((scs) => {
                if (scs.staff && !uniqueStaffMap.has(scs.staff.id)) {
                    // Format staff with user and profile data to match previous format
                    const staffCopy: any = {
                        id: scs.staff.id,
                        userId: scs.staff.userId,
                        staffRole: scs.staff.staffRole,
                        qualification: scs.staff.qualification,
                        startDate: scs.staff.startDate,
                        schoolId: scs.staff.schoolId,
                        notes: scs.staff.notes,
                        daysPerWeek: scs.staff.daysPerWeek,
                        status: scs.staff.status,
                        isSuspended: scs.staff.isSuspended,
                        createdAt: scs.staff.createdAt,
                        updatedAt: scs.staff.updatedAt,
                        deletedAt: scs.staff.deletedAt,
                    };

                    if (scs.staff.user) {
                        // Remove sensitive data - only include safe fields
                        const safeUser: any = {
                            uuid: scs.staff.user.uuid,
                            firstName: scs.staff.user.firstName,
                            lastName: scs.staff.user.lastName,
                            middleName: scs.staff.user.middleName,
                            email: scs.staff.user.email,
                            role: scs.staff.user.role,
                            profile: scs.staff.user.profile ? {
                                id: scs.staff.user.profile.id,
                                suffix: scs.staff.user.profile.suffix,
                                photo: scs.staff.user.profile.photo,
                            } : null,
                        };

                        staffCopy.user = safeUser;
                    }
                    uniqueStaffMap.set(scs.staff.id, staffCopy);
                }
            });
        }

        // Add assignedStaff as a computed property to match previous format
        (classroom as any).assignedStaff = Array.from(uniqueStaffMap.values());

        // Format staffClassesAndSubject - group by subject for cleaner response
        if (classroom.staffClassesAndSubject?.length) {
            const subjectsMap = new Map<number, any>();

            // Filter out records with null subjectId and ensure subject exists
            const validRecords = classroom.staffClassesAndSubject.filter(
                scs => scs.subjectId !== null && scs.subject
            );

            for (const scs of validRecords) {
                if (!scs.subject) continue;

                const subjectId = scs.subject.id;
                if (!subjectsMap.has(subjectId)) {
                    subjectsMap.set(subjectId, {
                        id: scs.subject.id,
                        name: scs.subject.name,
                        description: scs.subject.description,
                        assignedTeachers: [],
                        curriculums: [],
                    });
                }

                const subjectData = subjectsMap.get(subjectId)!;

                // Add unique teacher
                if (scs.staff && !subjectData.assignedTeachers.find((t: any) => t.id === scs.staff!.id)) {
                    const teacherName = scs.staff.user
                        ? `${scs.staff.user.firstName || ''} ${scs.staff.user.lastName || ''}`.trim() || null
                        : null;

                    subjectData.assignedTeachers.push({
                        id: scs.staff.id,
                        name: teacherName,
                        staffRole: scs.staff.staffRole,
                    });
                }

                // Add unique curriculums from the classroom
                if (Array.isArray(classroom.curriculums) && classroom.curriculums.length > 0) {
                    for (const curriculum of classroom.curriculums) {
                        if (!subjectData.curriculums.find((c: any) => c.id === curriculum.id)) {
                            subjectData.curriculums.push({
                                id: curriculum.id,
                                title: curriculum.title,
                                academicYear: curriculum.academicYear,
                                term: curriculum.term,
                            });
                        }
                    }
                }
            }

            // Add formatted staffClassesAndSubject to classroom (grouped by subject)
            (classroom as any).staffClassesAndSubject = Array.from(subjectsMap.values());
        } else {
            // Ensure assignedStaff is always an array
            (classroom as any).assignedStaff = [];
            (classroom as any).staffClassesAndSubject = [];
        }

        if (classroom.studentsCurrentClass?.length) {
            classroom.studentsCurrentClass = classroom.studentsCurrentClass.map((student) => {
                // Remove sensitive student data
                const safeStudent: any = {
                    id: student.id,
                    userId: student.userId,
                    schoolId: student.schoolId,
                    enrolmentDate: student.enrolmentDate,
                    status: student.status,
                    createdAt: student.createdAt,
                    updatedAt: student.updatedAt,
                };

                if (student.user) {
                    // Remove sensitive user data - only include safe fields
                    safeStudent.user = {
                        uuid: student.user.uuid,
                        firstName: student.user.firstName,
                        lastName: student.user.lastName,
                        middleName: student.user.middleName,
                        profile: student.user.profile ? {
                            id: student.user.profile.id,
                            suffix: student.user.profile.suffix,
                            photo: student.user.profile.photo,
                        } : null,
                    };
                }

                return safeStudent;
            });
        }

        // School is already formatted at the beginning of the method

        // Return formatted classroom with only safe data
        const formattedClassroom: any = {
            id: classroom.id,
            classroomName: classroom.classroomName,
            minimumAge: classroom.minimumAge,
            maximumAge: classroom.maximumAge,
            maximumCapacity: classroom.maximumCapacity,
            description: classroom.description,
            tuitionFee: classroom.tuitionFee,
            schoolId: classroom.schoolId,
            classroomStatus: classroom.classroomStatus,
            createdAt: classroom.createdAt,
            updatedAt: classroom.updatedAt,
            deletedAt: classroom.deletedAt,
            school: (classroom as any).school,
            studentsCurrentClass: (classroom as any).studentsCurrentClass || [],
            assignedStaff: (classroom as any).assignedStaff || [],
            staffClassesAndSubject: (classroom as any).staffClassesAndSubject || [],
        };

        return formattedClassroom;
    }

    /**
     * Ensures current enrollment is strictly below maximumCapacity so one more student can be assigned.
     * Pass `manager` when running inside a transaction so counts include pending inserts in that transaction.
     */
    async ensureClassroomHasCapacityForAssignment(
        classroomId: number,
        options?: { excludeStudentId?: number; manager?: EntityManager }
    ): Promise<{ success: true } | { success: false; message: string }> {
        const classroomRepo = options?.manager
            ? options.manager.getRepository(Classroom)
            : this.classroomRepository;
        const studentRepo = options?.manager
            ? options.manager.getRepository(Student)
            : this.studentRepository;

        const classroom = await classroomRepo.findOne({
            where: { id: classroomId, classroomStatus: ClassroomStatus.ACTIVE },
        });
        if (!classroom) {
            return { success: false, message: "Classroom not found or not active" };
        }

        const qb = studentRepo
            .createQueryBuilder("student")
            .where("student.classroomId = :classroomId", { classroomId });
        if (options?.excludeStudentId !== undefined) {
            qb.andWhere("student.id != :excludeStudentId", { excludeStudentId: options.excludeStudentId });
        }
        const currentEnrollment = await qb.getCount();

        if (currentEnrollment >= classroom.maximumCapacity) {
            return {
                success: false,
                message: "Classroom is full. Cannot assign student to this classroom.",
            };
        }
        return { success: true };
    }

    async assignClassroom(data: AssignStudentClassroom): Promise<ServiceResponse> {
        try {

            const classroom = await this.classroomRepository.findOne({
                where: { id: data.classroomId, classroomStatus: ClassroomStatus.ACTIVE },
                relations: ["school"]
            })
            if (!classroom) return { success: false, message: "Classroom not found or not active" }

            const student = await this.studentRepository.findOne({
                where: { id: data.studentId },
                relations: ["currentClassroom", "school"]
            })
            if (!student) return { success: false, message: "Student not found" }

            if (student?.school?.id !== classroom?.school?.id) {
                return {
                    success: false,
                    message: "Student and classroom must belong to the same school",
                };
            }

            const hasBeenInClass = await this.studentRepository
                .createQueryBuilder("student")
                .leftJoin("student.currentClassroom", "classroom")
                .leftJoin("student.classrooms", "historyClassroom")
                .where("student.id = :studentId", { studentId: data.studentId })
                .andWhere("classroom.id = :classroomId", { classroomId: data.classroomId })
                // .andWhere("historyClassroom.id = :classroomId", { classroomId: data.classroomId })
                .getCount();

            if (hasBeenInClass > 0) {
                return {
                    success: false,
                    message: "Student has already been in this classroom",
                };
            }

            const capacityCheck = await this.ensureClassroomHasCapacityForAssignment(data.classroomId);
            if (!capacityCheck.success) {
                return { success: false, message: capacityCheck.message };
            }

            // Assign new classroom
            student.currentClassroom = classroom;
            const updatedStudent = await this.studentRepository.save(student);

            await this.studentRepository
                .createQueryBuilder()
                .relation("classrooms")
                .of(student)
                .add(data.classroomId);


            return {
                success: true,
                message: "Classroom assigned successfully",
                classroom: updatedStudent.currentClassroom
            }
        } catch (error) {
            logger.error("Error assigning classroom:", error);
            console.error("Classroom assignment error details:", error);
            return { success: false, message: "Failed to assign classroom" }
        }
    }

    /**
     * Assign staff to a classroom
     */
    async assignStaffToClassroom(data: AssignStaffToClassroom): Promise<ServiceResponse> {
        try {
            // All validation checks before starting transaction
            // Verify classroom exists
            const classroom = await this.classroomRepository.findOne({
                where: { id: data.classroomId },
                relations: ["school"]
            });

            if (!classroom) {
                return {
                    success: false,
                    message: "Classroom not found"
                };
            }

            // Verify all staff IDs exist and belong to the same school
            const staffMembers = await this.staffRepository.find({
                where: {
                    id: In(data.staffIds),
                    schoolId: classroom.schoolId,
                },
            });

            if (staffMembers.length !== data.staffIds.length) {
                const foundIds = staffMembers.map((s) => s.id);
                const missingIds = data.staffIds.filter((id) => !foundIds.includes(id));
                return {
                    success: false,
                    message: `Staff/Teacher IDs not found or do not belong to this school: ${missingIds.join(", ")}`,
                };
            }

            // Check for existing assignments to avoid duplicates
            const existingAssignments = await this.staffClassesAndSubjectRepository.find({
                where: {
                    classroomId: data.classroomId,
                    staffId: In(data.staffIds),
                },
            });

            const existingStaffIds = existingAssignments.map(a => a.staffId);
            const newStaffIds = data.staffIds.filter(id => !existingStaffIds.includes(id));

            if (newStaffIds.length === 0) {
                return {
                    success: false,
                    message: "All provided staff are already assigned to this classroom",
                };
            }

            // Start transaction only after all validations pass
            const queryRunner = AppDataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                // Create new StaffClassesAndSubject records for staff not already assigned
                const newStaffMembers = staffMembers.filter(s => newStaffIds.includes(s.id));
                const scsRecords = newStaffMembers.map((staff) => {
                    return queryRunner.manager.create(StaffClassesAndSubject, {
                        staffId: staff.id,
                        classroomId: data.classroomId,
                        subjectId: undefined
                    });
                });

                await queryRunner.manager.save(StaffClassesAndSubject, scsRecords);
                logger.info(`Assigned ${scsRecords.length} staff members to classroom ${data.classroomId}`);

                await queryRunner.commitTransaction();

                // Fetch the complete classroom data
                const completeClassroom = await this.getClassroomById(data.classroomId);

                return {
                    success: true,
                    message: `Successfully assigned ${scsRecords.length} staff member(s) to classroom`,
                    classroom: completeClassroom.classroom
                };
            } catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            } finally {
                await queryRunner.release();
            }
        } catch (error) {
            logger.error("Error assigning staff to classroom:", error);
            return {
                success: false,
                message: "Failed to assign staff to classroom"
            };
        }
    }

    /**
     * Update staff assignment - move staff from one classroom to another
     */
    async updateStaffAssignment(data: UpdateStaffAssignment): Promise<ServiceResponse> {
        try {
            // Verify staff exists
            const staff = await this.staffRepository.findOne({
                where: { id: data.staffId },
                relations: ["school"]
            });

            if (!staff) {
                return {
                    success: false,
                    message: "Staff not found"
                };
            }

            // Verify both classrooms exist and belong to the same school
            const [previousClassroom, newClassroom] = await Promise.all([
                this.classroomRepository.findOne({
                    where: { id: data.previousClassroomId },
                    relations: ["school"]
                }),
                this.classroomRepository.findOne({
                    where: { id: data.newClassroomId },
                    relations: ["school"]
                })
            ]);

            if (!previousClassroom) {
                return {
                    success: false,
                    message: "Previous classroom not found"
                };
            }

            if (!newClassroom) {
                return {
                    success: false,
                    message: "New classroom not found"
                };
            }

            if (previousClassroom?.schoolId !== newClassroom?.schoolId || staff?.schoolId !== newClassroom?.schoolId) {
                return {
                    success: false,
                    message: "All entities must belong to the same school"
                };
            }

            // Find existing assignment in previous classroom
            const existingAssignment = await this.staffClassesAndSubjectRepository.findOne({
                where: {
                    staffId: data.staffId,
                    classroomId: data.previousClassroomId,
                },
            });

            if (!existingAssignment) {
                return {
                    success: false,
                    message: "Staff is not assigned to the previous classroom"
                };
            }

            // Check if staff is already assigned to the new classroom
            const existingInNewClassroom = await this.staffClassesAndSubjectRepository.findOne({
                where: {
                    staffId: data.staffId,
                    classroomId: data.newClassroomId,
                },
            });

            if (existingInNewClassroom) {
                return {
                    success: false,
                    message: "Staff is already assigned to the new classroom"
                };
            }

            // Update the assignment
            existingAssignment.classroomId = data.newClassroomId;
            await this.staffClassesAndSubjectRepository.save(existingAssignment);

            logger.info(`Moved staff ${data.staffId} from classroom ${data.previousClassroomId} to ${data.newClassroomId}`);

            // Fetch the updated new classroom
            const completeClassroom = await this.getClassroomById(data.newClassroomId);

            return {
                success: true,
                message: "Staff assignment updated successfully",
                classroom: completeClassroom.classroom
            };
        } catch (error) {
            logger.error("Error updating staff assignment:", error);
            return {
                success: false,
                message: "Failed to update staff assignment"
            };
        }
    }

    /**
     * Reassign classroom staff - clear all existing assignments and assign new ones
     */
    async reassignClassroomStaff(data: ReassignClassroomStaff): Promise<ServiceResponse> {
        try {
            // All validation checks before starting transaction
            // Verify classroom exists
            const classroom = await this.classroomRepository.findOne({
                where: { id: data.classroomId },
                relations: ["school", "staffClassesAndSubject"]
            });

            if (!classroom) {
                return {
                    success: false,
                    message: "Classroom not found"
                };
            }

            // Validate staff IDs if provided
            let staffMembers: Staff[] = [];
            if (Array.isArray(data.staffIds) && data.staffIds.length > 0) {
                // Verify all staff IDs exist and belong to the same school
                staffMembers = await this.staffRepository.find({
                    where: {
                        id: In(data.staffIds),
                        schoolId: classroom.schoolId,
                    },
                });

                if (staffMembers.length !== data.staffIds.length) {
                    const foundIds = staffMembers.map((s) => s.id);
                    const missingIds = data.staffIds.filter((id) => !foundIds.includes(id));
                    return {
                        success: false,
                        message: `Staff/Teacher IDs not found or do not belong to this school: ${missingIds.join(", ")}`,
                    };
                }
            }

            // Start transaction only after all validations pass
            const queryRunner = AppDataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                // Remove all existing StaffClassesAndSubject records for this classroom
                const existingAssignments = classroom.staffClassesAndSubject || [];
                if (existingAssignments.length > 0) {
                    await queryRunner.manager.remove(StaffClassesAndSubject, existingAssignments);
                    logger.info(`Removed ${existingAssignments.length} existing staff assignments from classroom ${data.classroomId}`);
                }

                // Add new staff assignments if provided
                if (staffMembers.length > 0) {
                    // Create new StaffClassesAndSubject records
                    const scsRecords = staffMembers.map((staff) => {
                        return queryRunner.manager.create(StaffClassesAndSubject, {
                            staffId: staff.id,
                            classroomId: data.classroomId,
                            subjectId: undefined,
                            curriculumId: undefined,
                        });
                    });

                    await queryRunner.manager.save(StaffClassesAndSubject, scsRecords);
                    logger.info(`Assigned ${scsRecords.length} staff members to classroom ${data.classroomId}`);
                }

                await queryRunner.commitTransaction();

                // Fetch the complete classroom data
                const completeClassroom = await this.getClassroomById(data.classroomId);

                return {
                    success: true,
                    message: `Successfully reassigned staff to classroom. ${data.staffIds?.length > 0 ? `Assigned ${data.staffIds.length} staff member(s).` : 'All staff assignments cleared.'}`,
                    classroom: completeClassroom.classroom
                };
            } catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            } finally {
                await queryRunner.release();
            }
        } catch (error) {
            logger.error("Error reassigning classroom staff:", error);
            return {
                success: false,
                message: "Failed to reassign classroom staff"
            };
        }
    }

    // Helper function to calculate total capacity of all classrooms in a school
    private async validateSchoolCapacityForClassroom(
        schoolId: number,
        newClassroomCapacity: number,
        schoolMaximumCapacity?: number,
        excludeClassroomId?: number
    ): Promise<void> {

        // If school has no max capacity, no validation needed
        if (!schoolMaximumCapacity) return;

        const existingClassrooms = await this.classroomRepository.find({
            where: { schoolId },
            select: ['id', 'maximumCapacity'],
        });

        // Exclude the current classroom if updating
        const classroomsToCount = excludeClassroomId
            ? existingClassrooms.filter(c => c.id !== excludeClassroomId)
            : existingClassrooms;

        const allocatedCapacity = classroomsToCount.reduce(
            (sum, classroom) => sum + (classroom.maximumCapacity ?? 0),
            0
        );

        const remainingCapacity = schoolMaximumCapacity - allocatedCapacity;

        if (newClassroomCapacity > remainingCapacity) {
            const exceededBy = newClassroomCapacity - remainingCapacity;

            throw new Error(
                `This class can carry ${newClassroomCapacity} students, ` +
                `but only ${remainingCapacity} capacity remaining. ` +
                `${exceededBy} exceed(s) the school limit. ` +
                `School maximum: ${schoolMaximumCapacity}, allocated: ${allocatedCapacity}.`
            );
        }
    }

}

const classroomService = new ClassroomService()
export { classroomService }