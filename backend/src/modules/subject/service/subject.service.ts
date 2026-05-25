import { Subject } from "../../shared/entities/Subject";
import { EntityManager, In, ILike, Brackets } from "typeorm";
import { AppDataSource } from "../../core";
import { StaffClassesAndSubject } from "../../shared/entities/StaffClassesAndSubject";
import { Staff } from "../../shared/entities/Staff";
import { Curriculum } from "../../shared/entities/Curriculum";
import { Classroom } from "../../shared/entities/Classroom";
import { Skills, TermEnum } from "../../shared/entities/EntityEnums";
import { Repository } from "typeorm";
import { logger } from "../../shared/utils/logger";
import { Parent } from "../../shared/entities/Parent";
import { emailService } from "../../shared/services/email.service";
import { notificationService } from "../../notification";
import { NotificationType } from "../../shared/entities/Notification";



export interface SubjectFilters {
    isSystem?: boolean;
    pos?: number;
    delta?: number;
    search?: string;
    schoolId: number;
    academicYear?: string;
    term?: TermEnum;
    skills?: Skills[];
    subjectSchedule?: {
        day: string;
        startTime: string;
        endTime: string;
    }[];
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}

export interface CreateSubjectData {
    curriculumId?: number;
    name?: string;
    title?: string;
    assignedTeacher: number;
    classroomIds: number[];
    minimumAge?: number;
    maximumAge?: number;
    duration?: number;
    skills?: Skills[];
    subjectSchedule?: {
        day: string;
        startTime: string;
        endTime: string;
    }[];
    description?: string;
    attachmentsUrl?: {
        url: string;
        name: string;
    }[];
    creatorId: number;
    schoolId: number;
}

export interface SubjectServiceResponse {
    success: boolean;
    message: string;
    pagination?: {
        pos: number;
        delta: number;
        count: number;
    };
    subjects?: Subject[];
    minAge?: number;
    maxAge?: number;
    metadata?: {
        total: number;
        templates: number;
        custom: number;
    };
}

export interface UpdateSubjectData {
    name?: string;
    title?: string;
    curriculumId?: number;
    classroomIds?: number[];
    assignedTeacher?: number;
    minimumAge?: number;
    maximumAge?: number;
    duration?: number;
    description?: string;
    skills?: Skills[];
    subjectSchedule?: {
        day: string;
        startTime: string;
        endTime: string;
    }[];
}

class SubjectService {

    private get subjectRepository(): Repository<Subject> {
        return AppDataSource.getRepository(Subject);
    }

    private get staffClassesAndSubjectRepo(): Repository<StaffClassesAndSubject> {
        return AppDataSource.getRepository(StaffClassesAndSubject);
    }



    async createSubject(
        curriculumId: number,
        subject: CreateSubjectData,
        manager: EntityManager
    ): Promise<{ success: boolean; message: string, data?: Subject }> {
        try {
            const curriculum = await manager.getRepository(Curriculum).findOne({
                where: { id: curriculumId },
                relations: ["school"]
            });

            if (!curriculum) {
                throw new Error("Curriculum not found");
            }

            const subjectRepo = manager.getRepository(Subject);
            const scsRepo = manager.getRepository(StaffClassesAndSubject);
            const staffRepo = manager.getRepository(Staff);

            const classroomRepo = manager.getRepository(Classroom);
            const classroomIds = Array.from(new Set(subject.classroomIds || []));

            if (!subject.assignedTeacher) {
                throw new Error("Assigned teacher is required");
            }

            if (classroomIds.length === 0) {
                throw new Error("Classrooms must be assigned");
            }

            // Validate classrooms belong to the same school
            if (classroomIds.length > 0) {
                const classrooms = await classroomRepo.find({
                    where: {
                        id: In(classroomIds),
                        schoolId: curriculum.schoolId,
                    },
                });

                if (classrooms.length !== classroomIds.length) {
                    const foundIds = classrooms.map((c) => c.id);
                    const missingIds = classroomIds.filter((id) => !foundIds.includes(id));
                    throw new Error(`Classrooms not found or do not belong to this school: ${missingIds.join(", ")}`);
                }
            }

            // staff validation - ensure staff belong to the same school
            const assignedStaff = await staffRepo.findOne({
                where: {
                    id: subject.assignedTeacher,
                    schoolId: curriculum.schoolId,
                },
                relations: ["user"]
            });

            if (!assignedStaff) {
                throw new Error("Assigned teacher not found");
            }

            const nameToUse = subject.title || subject.name;
            if (!nameToUse) {
                throw new Error("Subject name or title is required");
            }

            // Check for duplicate subject name in the same curriculum (case-insensitive)
            const existingSubject = await subjectRepo.findOne({
                where: {
                    name: ILike(nameToUse),
                    curriculumId: curriculum.id
                }
            });

            if (existingSubject) {
                return {
                    success: false,
                    message: `Subject with name "${nameToUse}" already exists in this curriculum`
                };
            }

            const createdSubject = await subjectRepo.save(
                subjectRepo.create({
                    curriculumId: curriculum.id,
                    name: nameToUse,
                    description: subject.description,
                    attachmentsUrl: subject.attachmentsUrl,
                    subjectSchedule: subject.subjectSchedule,
                    minimumAge: subject.minimumAge,
                    maximumAge: subject.maximumAge,
                    duration: subject.duration,
                    skills: subject.skills,
                    schoolId: curriculum.schoolId,
                })
            );

            const scsRecords = classroomIds.map((classroomId) =>
                scsRepo.create({
                    subjectId: createdSubject.id,
                    classroomId,
                    staffId: assignedStaff.id,
                })
            );

            if (scsRecords.length > 0) {
                await scsRepo.save(scsRecords);
            }

            // notify parents of students in the affected classrooms about the new subject plus the curriculum the subject belongs to and the assigned teacher
            const parents = await manager
                .getRepository(Parent)
                .createQueryBuilder("parent")
                .innerJoin("parent.children", "children")
                .leftJoinAndSelect("parent.user", "user")
                .where("children.classroomId IN (:...classroomIds)", { classroomIds })
                .andWhere("children.schoolId = :schoolId", { schoolId: curriculum.schoolId })
                .getMany();

            const uniqueEmails = Array.from(
                new Set(
                    parents
                        .map(p => p.user?.email?.toLowerCase().trim())
                        .filter((email): email is string => !!email)
                )
            );

            await Promise.allSettled(
                uniqueEmails.map(email =>
                    emailService.sendNewSubjectAddedEmail(
                        email,
                        "Parent",
                        createdSubject.name,
                        curriculum.title,
                        `${assignedStaff.user.firstName} ${assignedStaff.user.lastName}`,
                        createdSubject.description,
                        curriculum.school?.schoolName!
                    )
                )
            );

            // Send persistent in-app notifications to parents
            try {
                const parentUserIds = parents
                    .map(p => p.userId)
                    .filter((id): id is number => !!id);

                if (parentUserIds.length > 0) {
                    await notificationService.sendBulkNotifications({
                        userIds: parentUserIds,
                        schoolId: curriculum.schoolId!,
                        title: "New Subject Added",
                        message: `A new subject "${createdSubject.name}" has been added to the ${curriculum.title} curriculum.`,
                        type: NotificationType.INFO,
                        metadata: {
                            relatedEntityType: "subject",
                            relatedEntityId: createdSubject.id,
                        }
                    });
                }
            } catch (notifError) {
                logger.error("Failed to send bulk subject notifications to parents", notifError);
            }

            // duplicate the notification for the assigned teacher
            if (assignedStaff.user?.email) {
                await emailService.sendNewSubjectAssignedEmail(
                    assignedStaff.user.email,
                    `${assignedStaff.user.firstName} ${assignedStaff.user.lastName}`,
                    createdSubject.name,
                    curriculum.title,
                    createdSubject.description || "",
                    curriculum.school?.schoolName || "School Administration"
                ).catch(err => logger.error("Failed to send email to assigned teacher", err));

                // Send persistent in-app notification to teacher
                if (assignedStaff.userId) {
                    await notificationService.sendNotification({
                        userId: assignedStaff.userId,
                        schoolId: curriculum.schoolId!,
                        title: "New Subject Assigned",
                        message: `You have been assigned to teach "${createdSubject.name}" in the ${curriculum.title} curriculum.`,
                        type: NotificationType.INFO,
                        data: {
                            relatedEntityType: "subject",
                            relatedEntityId: createdSubject.id,
                        },
                    }).catch(err => logger.error("Failed to send subject notification to teacher", err));
                }
            }

            return {
                success: true,
                message: "Subject created successfully",
                data: createdSubject,
            };
        } catch (error) {
            logger.error("Error creating subject:", error);
            console.error("Subject creation error details:", error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to create subject",
            };
        }
    }


    async listAllSubjects(filters: SubjectFilters): Promise<SubjectServiceResponse> {
        try {
            const {
                pos = 0,
                delta = 10,
                search,
                academicYear,
                schoolId,
                term,
                isSystem,
                sortBy = "createdAt",
                sortOrder = "DESC",
            } = filters;

            const query = this.subjectRepository.createQueryBuilder("subject")
                .leftJoinAndSelect("subject.staffClassesAndSubject", "scs")
                .leftJoinAndSelect("scs.staff", "staff")
                .leftJoinAndSelect("staff.user", "staffUser")
                .leftJoinAndSelect("scs.classroom", "classroom")
                .leftJoinAndSelect("subject.curriculum", "curriculum")
                .leftJoinAndSelect("subject.milestonesInSubject", "milestones")
                .leftJoinAndSelect("subject.assessments", "assessments")
                .leftJoinAndSelect("subject.durations", "durations")
                .leftJoinAndSelect("durations.milestone", "durationMilestone")

            if (isSystem) {
                query.where("curriculum.schoolId IS NULL");
            } else {
                query.where("curriculum.schoolId = :schoolId", { schoolId });
            }


            if (search) {
                query.andWhere(
                    new Brackets(qb => {
                        qb.where(`"subject"."name" ILIKE :search`)
                            .orWhere(`"subject"."description" ILIKE :search`)
                            .orWhere(`CAST("subject"."skills" AS TEXT) ILIKE :search`)
                            .orWhere(`CAST("subject"."subjectSchedule" AS TEXT) ILIKE :search`);
                    }),
                    { search: `%${search}%` }
                );
            }


            if (academicYear) {
                query.andWhere("curriculum.academicYear = :academicYear", { academicYear });
            }

            if (term) {
                query.andWhere("curriculum.term = :term", { term });
            }


            // Apply sorting
            const sortFieldMap: { [key: string]: string } = {
                name: "subject.name",
                createdAt: "subject.createdAt",
                updatedAt: "subject.updatedAt",
            };

            const sortField = sortFieldMap[sortBy] || "subject.createdAt";
            query.orderBy(sortField, sortOrder);

            query.skip(pos).take(delta);

            const [subjects, count] = await query.getManyAndCount();

            // Get absolute min and max age for the school
            const ageStatsQb = this.subjectRepository.createQueryBuilder("subject")
                .leftJoin("subject.curriculum", "curriculum")
                .select("MIN(subject.minimumAge)", "minAge")
                .addSelect("MAX(subject.maximumAge)", "maxAge");

            if (isSystem) {
                ageStatsQb.where("curriculum.schoolId IS NULL");
            } else {
                ageStatsQb.where("curriculum.schoolId = :schoolId", { schoolId });
            }


            // Meta counts: templates (system, no schoolId) vs custom (school-scoped)
            const [templatesCount, customCount] = await Promise.all([
                this.subjectRepository
                    .createQueryBuilder("subject")
                    .leftJoin("subject.curriculum", "curriculum")
                    .where("curriculum.schoolId IS NULL")
                    .getCount(),
                this.subjectRepository
                    .createQueryBuilder("subject")
                    .leftJoin("subject.curriculum", "curriculum")
                    .where("curriculum.schoolId IS NOT NULL")
                    .getCount(),
            ]);

            // Format subjects for cleaner response
            const formattedSubjects = subjects.map(subject => this.formatSubjectResponse(subject));

            return {
                success: true,
                message: "Subjects retrieved successfully",
                subjects: formattedSubjects,
                pagination: {
                    pos,
                    delta,
                    count,
                },
                metadata: {
                    total: templatesCount + customCount,
                    templates: templatesCount,
                    custom: customCount,
                },
            };
        } catch (error) {
            logger.error("Error listing subjects:", error);
            console.error("Subject listing error details:", error);
            return {
                success: false,
                message: "Failed to retrieve subjects"
            };
        }
    }

    async getSubjectById(subjectId: number): Promise<{ success: boolean; message: string; data?: any }> {
        try {
            const subject = await this.subjectRepository.findOne({
                where: { id: subjectId },
                relations: [
                    "staffClassesAndSubject",
                    "staffClassesAndSubject.staff",
                    "staffClassesAndSubject.staff.user",
                    "staffClassesAndSubject.classroom",
                    "staffClassesAndSubject.classroom.curriculums",
                    "milestonesInSubject",
                    "assessments",
                    "durations",
                    "durations.milestone",
                ]
            });

            if (!subject) {
                return { success: false, message: "Subject not found" };
            }

            return {
                success: true,
                message: "Subject retrieved successfully",
                data: this.formatSubjectResponse(subject)
            };
        } catch (error: any) {
            return { success: false, message: error.message || "Failed to retrieve subject" };
        }
    }

    /**
     * Update a subject with its basic info
     */

    async updateSubject(subjectId: number, data: UpdateSubjectData): Promise<{ success: boolean; message: string; subject?: Subject }> {
        try {

            const subject = await this.subjectRepository.findOne({ where: { id: subjectId } });

            if (!subject) {
                return { success: false, message: "Subject not found" };
            }

            const incomingName = data.title || data.name;

            // Check for duplicate name if name is changing (case-insensitive)
            if (incomingName && incomingName !== subject.name) {
                const existing = await this.subjectRepository.findOne({
                    where: {
                        name: ILike(incomingName),
                        curriculumId: data.curriculumId ?? subject.curriculumId
                    }
                });

                if (existing && existing.id !== subject.id) {
                    return { success: false, message: `Subject with name "${incomingName}" already exists in this curriculum` };
                }
            }

            if (incomingName !== undefined) subject.name = incomingName;
            if (data.curriculumId !== undefined) subject.curriculumId = data.curriculumId;
            if (data.description !== undefined) subject.description = data.description;
            if (data.subjectSchedule !== undefined) subject.subjectSchedule = data.subjectSchedule;
            if (data.minimumAge !== undefined) subject.minimumAge = data.minimumAge;
            if (data.maximumAge !== undefined) subject.maximumAge = data.maximumAge;
            if (data.duration !== undefined) subject.duration = data.duration;
            if (data.skills !== undefined) subject.skills = data.skills;

            await this.subjectRepository.save(subject);

            const scsRepo = this.staffClassesAndSubjectRepo;
            const classroomRepo = AppDataSource.getRepository(Classroom);

            if (data.classroomIds) {
                const classroomIds = Array.from(new Set(data.classroomIds));
                const classrooms = await classroomRepo.find({ where: { id: In(classroomIds) } });
                if (classrooms.length !== classroomIds.length) {
                    throw new Error("Some classrooms are invalid or don't belong to this subject");
                }

                const existingStaffLink = await scsRepo.findOne({ where: { subjectId: subject.id } });
                const staffId = data.assignedTeacher ?? existingStaffLink?.staffId;

                if (!staffId) {
                    throw new Error("Assigned teacher is required to update classrooms");
                }

                await scsRepo.delete({ subjectId: subject.id });

                const scsRecords = classroomIds.map((classroomId) =>
                    scsRepo.create({
                        subjectId: subject.id,
                        classroomId,
                        staffId,
                    })
                );
                if (scsRecords.length > 0) {
                    await scsRepo.save(scsRecords);
                }
            } else if (data.assignedTeacher) {
                const existingRecords = await scsRepo.find({ where: { subjectId: subject.id } });
                if (existingRecords.length === 0) {
                    throw new Error("No classroom assignments found for this subject");
                }

                for (const record of existingRecords) {
                    record.staffId = data.assignedTeacher;
                }
                await scsRepo.save(existingRecords);
            }
            return {
                success: true,
                message: "Subject updated successfully",
                subject: subject
            }
                ;
        } catch (error: any) {
            logger.error(error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to update subject",
            };
        }
    }

    /**
     * Update a subject with its relations (teacher and classrooms)
     * Used during curriculum updates
     */
    async updateSubjectWithRelations(
        subjectId: number,
        subjectData: Partial<Subject>,
        teacherId: number,
        classroomIds: number[],
        curriculumId: number,
        manager: EntityManager
    ): Promise<void> {
        const subjectRepo = manager.getRepository(Subject);
        const scsRepo = manager.getRepository(StaffClassesAndSubject);
        const staffRepo = manager.getRepository(Staff);
        const classroomRepo = manager.getRepository(Classroom);

        // Update subject basic info
        const subject = await subjectRepo.findOne({ where: { id: subjectId } });
        if (!subject) {
            throw new Error(`Subject with ID ${subjectId} not found`);
        }

        Object.assign(subject, subjectData);
        subject.curriculumId = curriculumId; // Ensure correct curriculum linkage
        await subjectRepo.save(subject);

        // Get curriculum to validate school
        const curriculum = await manager.getRepository(Curriculum).findOne({
            where: { id: curriculumId },
        });

        if (!curriculum) {
            throw new Error("Curriculum not found");
        }

        // Validate and get classrooms
        let classrooms: Classroom[] = [];
        if (classroomIds.length > 0) {
            // Get classrooms that belong to this curriculum via junction table
            const curriculumClassroomIds = await manager
                .createQueryBuilder()
                .select("cc.classroomId", "classroomId")
                .from("curriculum_classrooms", "cc")
                .where("cc.curriculumId = :curriculumId", { curriculumId })
                .andWhere("cc.classroomId IN (:...classroomIds)", { classroomIds })
                .getRawMany();

            const validClassroomIds = curriculumClassroomIds.map((row: any) => row.classroomId);

            if (validClassroomIds.length !== classroomIds.length) {
                throw new Error("Some classrooms are invalid or don't belong to this curriculum");
            }

            classrooms = await classroomRepo.find({
                where: {
                    id: In(validClassroomIds),
                },
            });
        }

        // Validate and get staff member
        let staffMember: Staff | null = null;
        if (teacherId) {
            staffMember = await staffRepo.findOne({
                where: {
                    id: teacherId,
                    schoolId: curriculum.schoolId,
                },
            });

            if (!staffMember) {
                throw new Error(`Teacher with ID ${teacherId} is invalid or doesn't belong to this school`);
            }
        }

        // Delete existing SCS records for this subject in this curriculum's classrooms
        const curriculumClassroomsQuery = await manager
            .createQueryBuilder()
            .select("cc.classroomId", "id")
            .from("curriculum_classrooms", "cc")
            .where("cc.curriculumId = :curriculumId", { curriculumId })
            .getRawMany();
        const curriculumClassroomIds = curriculumClassroomsQuery.map((row: any) => row.id);

        if (curriculumClassroomIds.length > 0) {
            await scsRepo
                .createQueryBuilder()
                .delete()
                .where("subjectId = :subjectId", { subjectId })
                .andWhere("classroomId IN (:...classroomIds)", { classroomIds: curriculumClassroomIds })
                .execute();
        }

        // Create new SCS records
        const recordsToCreate = [];
        if (staffMember) {
            for (const classroom of classrooms) {
                const scsRecord = scsRepo.create({
                    subjectId: subject.id,
                    classroomId: classroom.id,
                    staffId: staffMember.id,
                });
                recordsToCreate.push(scsRecord);
            }
        }

        if (recordsToCreate.length > 0) {
            await scsRepo.save(recordsToCreate);
        }
    }

    async removeSubject(subjectId: number) {
        return await this.subjectRepository.delete(subjectId);
    }

    /**
     * Format subject response with grouped curriculums, teachers, classrooms, and specific assignments
     */
    private formatSubjectResponse(subject: Subject): any {
        const durations = (subject.durations || []).map(({ subjectId, ...d }: any) => ({
            ...d,
            milestone: d.milestone ? (({ subjectId: _msSubjectId, schoolId: _msSchoolId, ...ms }: any) => ms)(d.milestone) : undefined,
        }));

        const periodsMap = new Map<string, any>();
        for (const d of durations) {
            const periodName = (d.durationName || "").toString().trim();
            if (!periodName) continue;

            if (!periodsMap.has(periodName)) {
                periodsMap.set(periodName, { name: periodName, milestones: [] as any[] });
            }

            if (d.milestone) {
                periodsMap.get(periodName).milestones.push(d.milestone);
            }
        }

        const formatted: any = {
            id: subject.id,
            name: subject.name,
            description: subject.description,
            curriculum: (subject as any).curriculum ? {
                id: (subject as any).curriculum.id,
                title: (subject as any).curriculum.title,
                academicYear: (subject as any).curriculum.academicYear,
                term: (subject as any).curriculum.term,
            } : { id: subject.curriculumId },
            ageRange: {
                minimumAge: subject.minimumAge,
                maximumAge: subject.maximumAge
            },
            skills: subject.skills || [],
            duration: subject.duration,
            schedule: subject.subjectSchedule || [],
            attachments: subject.attachmentsUrl || [],

            // Clean up milestones and assessments (remove redundant parent IDs)
            milestones: (subject.milestonesInSubject || []).map(({ subjectId, schoolId, ...m }) => m),
            assessments: (subject.assessments || []).map(({ subjectId, ...a }) => a),
            periods: Array.from(periodsMap.values()),

            createdAt: subject.createdAt,
            updatedAt: subject.updatedAt,
        };

        if (subject.staffClassesAndSubject && subject.staffClassesAndSubject.length > 0) {
            const teachersMap = new Map<number, any>();

            for (const scs of subject.staffClassesAndSubject) {
                if (scs.staff) {
                    if (!teachersMap.has(scs.staff.id)) {
                        const teacherName = scs.staff.user
                            ? `${scs.staff.user.firstName || ''} ${scs.staff.user.lastName || ''}`.trim() || null
                            : null;

                        teachersMap.set(scs.staff.id, {
                            id: scs.staff.id,
                            name: teacherName,
                            role: scs.staff.staffRole,
                            classrooms: [],
                        });
                    }

                    const teacher = teachersMap.get(scs.staff.id);
                    if (scs.classroom && !teacher.classrooms.some((c: any) => c.id === scs.classroom!.id)) {
                        teacher.classrooms.push({
                            id: scs.classroom.id,
                            name: scs.classroom.classroomName,
                        });
                    }
                }
            }
            formatted.teacherAssignments = Array.from(teachersMap.values());
        } else {
            formatted.teacherAssignments = [];
        }

        return formatted;
    }
}

export const subjectService = new SubjectService();
