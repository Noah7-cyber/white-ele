import { ClassroomActivity } from "../../shared/entities/ClassroomActivity";
import { Student } from "../../shared/entities/StudentEntity";
import { MealType, ActivityType, BathroomType } from "../../shared";
import { AppDataSource } from "../../core";
import { In, Repository } from "typeorm";
import { logger } from "../../shared";
import { User } from "../../shared/entities/User";
import { Classroom } from "../../shared/entities/Classroom";
import { ClassroomStudentActivity } from "../../shared/entities/ClassroomStudentActivity";
import { notificationService } from "../../notification";
import { NotificationType } from "../../shared/entities/Notification";
import { ParentStatus } from "../../shared/entities/EntityEnums";


export interface CreateMealActivityInput {
    activityType: ActivityType.MEAL;
    studentIds: number[];
    creatorId: number;
    classroomId: number;
    creatorType: 'USER' | 'STAFF';
    mealType: MealType;
    timeGiven: string;
    foodItem: string;
    notes?: string;
    notifyParent?: boolean;
}

export interface CreateNapActivityInput {
    activityType: ActivityType.NAP;
    studentIds: number[];
    classroomId: number;
    creatorId: number;
    creatorType: 'USER' | 'STAFF';
    startTime: string;
    endTime?: string;
    notes?: string;
    notifyParent?: boolean;
}

export interface CreateMedicationActivityInput {
    activityType: ActivityType.MEDICATION;
    studentIds: number[];
    creatorId: number;
    classroomId: number;
    creatorType: 'USER' | 'STAFF';
    medicationName: string;
    dosage: string;
    timeGiven: string;
    notes?: string;
    notifyParent?: boolean;
}

export interface CreateBathroomActivityInput {
    activityType: ActivityType.BATHROOM;
    studentIds: number[];
    creatorId: number;
    classroomId: number;
    creatorType: 'USER' | 'STAFF';
    bathroomType: BathroomType;
    time: string;
    notes?: string;
    notifyParent?: boolean;
}

export interface CreateWaterActivityInput {
    activityType: ActivityType.WATER;
    studentIds: number[];
    creatorId: number;
    classroomId: number;
    creatorType: 'USER' | 'STAFF';
    timeGiven: string;
    notes?: string;
    notifyParent?: boolean;
}
export interface CreatePhotoActivityInput {
    activityType: ActivityType.PHOTO;
    studentIds: number[];
    classroomId: number;
    creatorId: number;
    creatorType: 'USER' | 'STAFF';
    photoUrl: string;
    notes?: string;
    notifyParent?: boolean;
}


export type CreateClassroomActivityInput =
    | CreateMealActivityInput
    | CreateNapActivityInput
    | CreateMedicationActivityInput
    | CreateBathroomActivityInput
    | CreateWaterActivityInput
    | CreatePhotoActivityInput;

export interface UpdateClassroomActivityInput {
    activityType?: ActivityType;
    studentId?: number;
    creatorId?: number;
    classroomId?: number;
    mealType?: MealType;
    foodItem?: string;
    photoUrl: string;
    bathroomType?: BathroomType;
    medicationName?: string;
    dosage?: string;
    timeGiven?: string;
    time?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
    notifyParent?: boolean;
}

export interface ClassroomActivityFilters {
    activityType?: ActivityType;
    studentId?: number;
    schoolId?: number;
    classroomId?: number;
    /** Activities in classrooms where this teacher (staff) has a class assignment */
    teacherId?: number;
    creatorId?: number;
    parentId?: number;
    startDate?: Date | string;
    endDate?: Date | string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    pos?: number;
    delta?: number;
}

class ClassroomActivityService {
    private get classroomActivityRepository(): Repository<ClassroomActivity> {
        return AppDataSource.getRepository(ClassroomActivity);
    }

    private get studentRepository(): Repository<Student> {
        return AppDataSource.getRepository(Student);
    }

    private get classroomRepository(): Repository<Classroom> {
        return AppDataSource.getRepository(Classroom);
    }

    private get userRepository(): Repository<User> {
        return AppDataSource.getRepository(User);
    }

    private parseTime(value: any): string | undefined {
        if (!value) return undefined;

        // Accept "HH:mm" or "H:mm"
        const isValid = /^\d{1,2}:\d{2}$/.test(value);
        return isValid ? value : undefined;
    }


    private resetActivitySpecificFields(activity: ClassroomActivity): void {
        activity.mealType = undefined;
        activity.foodItems = undefined;
        activity.bathroomType = undefined;
        activity.medicationName = undefined;
        activity.dosage = undefined;
        activity.endTime = undefined;
        activity.timeGiven = undefined;
        activity.photoUrl = undefined;
    }

    private applyActivityData(
        activity: ClassroomActivity,
        data: CreateClassroomActivityInput | UpdateClassroomActivityInput,
        mode: "create" | "update"
    ): { success: boolean; message?: string } {
        const incomingType = "activityType" in data && data.activityType ? data.activityType : activity.activityType;

        if (mode === "update" && incomingType !== activity.activityType) {
            this.resetActivitySpecificFields(activity);
        }

        activity.activityType = incomingType;

        const assignNotes = () => {
            if (typeof data.notes !== "undefined") {
                activity.notes = data.notes;
            }
            if (typeof data.notifyParent !== "undefined") {
                activity.notifyParent = Boolean(data.notifyParent);
            }
        };

        switch (incomingType) {
            case ActivityType.MEAL: {
                const mealType = ("mealType" in data && data.mealType) ? data.mealType : activity.mealType;
                if (!mealType) {
                    return { success: false, message: "Meal type is required" };
                }

                const foodItem = ("foodItem" in data && data.foodItem !== undefined)
                    ? data.foodItem
                    : activity.foodItems;
                if (!foodItem) {
                    return { success: false, message: "Food item is required" };
                }

                const time = this.parseTime(("timeGiven" in data ? data.timeGiven : undefined) || ("time" in data ? data.time : undefined))
                    || activity.timeGiven
                    || activity.startTime;
                if (!time) {
                    return { success: false, message: "Time given is required" };
                }

                activity.mealType = mealType;
                activity.foodItems = foodItem;
                activity.timeGiven = time;
                activity.startTime = time;
                assignNotes();
                break;
            }
            case ActivityType.NAP: {
                const start = this.parseTime(("startTime" in data ? data.startTime : undefined)) || activity.startTime;
                if (!start) {
                    return { success: false, message: "Start time is required for nap activity" };
                }

                const endProvided = "endTime" in data ? data.endTime : undefined;
                const end = this.parseTime(endProvided) ?? activity.endTime;
                if (end && end < start) {
                    return { success: false, message: "End time cannot be earlier than start time" };
                }

                activity.startTime = start;
                activity.endTime = end;
                activity.timeGiven = undefined;
                assignNotes();
                break;
            }
            case ActivityType.MEDICATION: {
                const medicationName = ("medicationName" in data && data.medicationName !== undefined)
                    ? data.medicationName
                    : activity.medicationName;
                if (!medicationName) {
                    return { success: false, message: "Medication name is required" };
                }

                const dosage = ("dosage" in data && data.dosage !== undefined) ? data.dosage : activity.dosage;
                if (!dosage) {
                    return { success: false, message: "Dosage is required" };
                }

                const time = this.parseTime(("timeGiven" in data ? data.timeGiven : undefined) || ("time" in data ? data.time : undefined))
                    || activity.timeGiven
                    || activity.startTime;
                if (!time) {
                    return { success: false, message: "Time given is required" };
                }

                activity.medicationName = medicationName;
                activity.dosage = dosage;
                activity.timeGiven = time;
                activity.startTime = time;
                assignNotes();
                break;
            }
            case ActivityType.BATHROOM: {
                const bathroomType = ("bathroomType" in data && data.bathroomType !== undefined)
                    ? data.bathroomType
                    : activity.bathroomType;
                if (!bathroomType) {
                    return { success: false, message: "Bathroom type is required" };
                }

                const time = this.parseTime(
                    ("time" in data && data.time)
                        ? data.time
                        : ("timeGiven" in data ? data.timeGiven : undefined)
                ) || activity.timeGiven || activity.startTime;

                if (!time) {
                    return { success: false, message: "Time is required" };
                }

                activity.bathroomType = bathroomType;
                activity.timeGiven = time;
                activity.startTime = time;
                assignNotes();
                break;
            }
            case ActivityType.WATER: {
                const time = this.parseTime(("timeGiven" in data ? data.timeGiven : undefined) || ("time" in data ? data.time : undefined))
                    || activity.timeGiven
                    || activity.startTime;
                if (!time) {
                    return { success: false, message: "Time given is required" };
                }

                activity.timeGiven = time;
                activity.startTime = time;
                assignNotes();
                break;
            }
            case ActivityType.PHOTO: {
                const photoUrl = ("photoUrl" in data && data.photoUrl) ? data.photoUrl : activity.photoUrl;
                if (!photoUrl) {
                    return { success: false, message: "Photo URL is required" };
                }
                activity.photoUrl = photoUrl,
                    assignNotes();
                break;
            }

            default:
                break;

        }

        return { success: true };
    }

    private getPrivateActivityResponse(activity: ClassroomActivity) {
        const base = {
            id: activity.id,
            activityType: activity.activityType,
            notes: activity.notes,
            notifyParent: activity.notifyParent,
            createdAt: activity.createdAt,
            classroom: {
                id: activity.classroomId,
                name: activity.classroom?.classroomName
            },
            creator: {
                id: activity.creatorId,
                name: activity.creator ? `${activity.creator.firstName} ${activity.creator.lastName}` : "Unknown",
                role: activity?.creator?.role,
                profileUrl: activity?.creator?.profile?.photo
            },
            students: activity.studentActivities?.map((csa) => {
                const student = csa.student;
                const user = student?.user;
                return {
                    id: student?.id,
                    name: user ? `${user.firstName} ${user.lastName}` : "Unknown",
                    photoUrl: student?.photoUrl
                };
            }) || []
        };

        let details = {};
        switch (activity.activityType) {
            case ActivityType.MEAL:
                details = {
                    mealType: activity.mealType,
                    foodItems: activity.foodItems,
                    timeGiven: activity.timeGiven
                };
                break;
            case ActivityType.NAP:
                details = {
                    startTime: activity.startTime,
                    endTime: activity.endTime
                };
                break;
            case ActivityType.MEDICATION:
                details = {
                    medicationName: activity.medicationName,
                    dosage: activity.dosage,
                    timeGiven: activity.timeGiven
                };
                break;
            case ActivityType.BATHROOM:
                details = {
                    bathroomType: activity.bathroomType,
                    timeGiven: activity.timeGiven
                };
                break;
            case ActivityType.WATER:
                details = {
                    timeGiven: activity.timeGiven
                };
                break;
            case ActivityType.PHOTO:
                details = {
                    photoUrl: activity.photoUrl
                };
                break;
        }

        return { ...base, ...details };
    }

    private buildActivityNotificationMessage(activity: ClassroomActivity): string {
        const parts: string[] = [];
        switch (activity.activityType) {
            case ActivityType.MEAL:
                parts.push(`${activity.mealType || "meal"} at ${activity.timeGiven || ""}`);
                if (activity.foodItems) parts.push(`- ${activity.foodItems}`);
                break;
            case ActivityType.NAP:
                parts.push(`Nap ${activity.startTime || ""}${activity.endTime ? ` to ${activity.endTime}` : ""}`);
                break;
            case ActivityType.MEDICATION:
                parts.push(`${activity.medicationName || "Medication"} (${activity.dosage || ""}) at ${activity.timeGiven || ""}`);
                break;
            case ActivityType.BATHROOM:
                parts.push(`${activity.bathroomType || "Bathroom"} at ${activity.timeGiven || ""}`);
                break;
            case ActivityType.WATER:
                parts.push(`Water at ${activity.timeGiven || ""}`);
                break;
            case ActivityType.PHOTO:
                parts.push("Photo activity recorded");
                break;
            default:
                parts.push(`${activity.activityType} activity`);
        }
        if (activity.notes) parts.push(`- ${activity.notes}`);
        return parts.join(" ");
    }

    async createActivity(data: CreateClassroomActivityInput): Promise<{ success: boolean; message: string; activities?: any[] }> {
        try {
            if (!data.studentIds || data.studentIds.length === 0) {
                return {
                    success: false,
                    message: "No students provided",
                };
            }

            const classroom = await this.classroomRepository.findOne({
                where: { id: data.classroomId },
            });

            if (!classroom) {
                return {
                    success: false,
                    message: "Classroom not found",
                };
            }

            const creator = await this.userRepository.findOne({ where: { id: data.creatorId } });

            if (!creator) {
                return {
                    success: false,
                    message: "Creator not found",
                };
            }

            const students = await this.studentRepository.find({
                where: {
                    id: In(data.studentIds),
                    schoolId: classroom.schoolId, // Ensure student belongs to the same school as classroom
                },
                relations: ["parents", "parents.user", "user"],
            });

            if (!students.length) {
                return {
                    success: false,
                    message: "No valid students found for this school",
                };
            }

            const savedActivity = await this.classroomActivityRepository.manager.transaction(async manager => {

                //  Create activity
                const activity = manager.create(ClassroomActivity, {
                    activityType: data.activityType,
                    classroomId: data.classroomId,
                    creatorId: data.creatorId,
                    creatorType: data.creatorType,
                    notes: data.notes,
                    notifyParent: data.notifyParent ?? false,
                });

                // Apply type-specific data
                const validation = this.applyActivityData(activity, data, "create");
                if (!validation.success) {
                    throw new Error(validation.message || "Validation failed");
                }

                const saved = await manager.save(activity);

                // Create MANY student activities
                const studentActivities = students.map(student => ({
                    classroomActivity: { id: saved.id },
                    student: { id: student.id },
                }));

                await manager.insert(ClassroomStudentActivity, studentActivities);
                return saved;
            });

            const activities = await this.getActivityById(savedActivity.id);

            if (data.notifyParent && classroom.schoolId) {
                const activityMessage = this.buildActivityNotificationMessage(savedActivity);
                const notificationPromises: Promise<unknown>[] = [];

                for (const student of students) {
                    const studentName = student.user
                        ? `${student.user.firstName} ${student.user.lastName}`.trim()
                        : "Your child";
                    const parents = (student.parents || []).filter(
                        (p) => p.userId && p.status === ParentStatus.ACTIVE
                    );

                    for (const parent of parents) {
                        notificationPromises.push(
                            notificationService.sendNotification({
                                userId: parent.userId,
                                schoolId: classroom.schoolId,
                                title: "New classroom activity recorded",
                                message: `An activity update has been posted for ${studentName}: ${activityMessage}`,
                                type: NotificationType.INFO,
                                sendEmail: true,
                                transactional: true,
                                data: {
                                    activityId: savedActivity.id,
                                    studentId: student.id,
                                    activityType: savedActivity.activityType,
                                    studentName,
                                    activitySummary: activityMessage,
                                },
                            })
                        );
                    }
                }

                const results = await Promise.allSettled(notificationPromises);
                results.forEach((r, i) => {
                    if (r.status === "rejected") {
                        logger.error(`Failed to notify parent #${i}:`, (r as PromiseRejectedResult).reason);
                    }
                });
            }

            return {
                success: true,
                message: `Classroom activity created successfully for ${students.length} student(s)`,
                activities: activities.activity ? [activities.activity] : [],
            };
        } catch (error) {
            logger.error("Error creating classroom activity:", error);
            return {
                success: false,
                message: "Failed to create classroom activity",
            };
        }
    }

    async getActivityById(activityId: number): Promise<{ success: boolean; message: string; activity?: any }> {
        try {
            const activity = await this.classroomActivityRepository
                .createQueryBuilder("ca")
                .leftJoinAndSelect("ca.studentActivities", "csa")
                .leftJoinAndSelect("ca.classroom", "classroom")
                .leftJoinAndSelect("csa.student", "student")
                .leftJoinAndSelect("student.user", "user")
                .leftJoinAndSelect("ca.creator", "creator")
                .leftJoinAndSelect("creator.profile", "creatorProfile")

                .where("ca.id = :activityId", { activityId })
                .withDeleted()
                .getOne();

            if (!activity) {
                return {
                    success: false,
                    message: "Classroom activity not found",
                };
            }

            return {
                success: true,
                message: "Classroom activity retrieved successfully",
                activity: this.getPrivateActivityResponse(activity),
            };
        } catch (error) {
            logger.error("Error fetching classroom activity:", error);
            console.error("the error", error)
            return {
                success: false,
                message: "Failed to fetch classroom activity",
            };
        }
    }

    async listActivities(
        filters: ClassroomActivityFilters = {}
    ): Promise<{ success: boolean; message: string; activities?: any[]; pagination?: { pos: number; delta: number; count: number } }> {
        try {
            const { activityType, classroomId, studentId, teacherId, creatorId, parentId, sortBy = "createdAt", sortOrder = "DESC", pos = 0, delta = 20, schoolId } = filters;

            const queryBuilder = this.classroomActivityRepository
                .createQueryBuilder("activity")
                .leftJoinAndSelect("activity.studentActivities", "csa")
                .leftJoinAndSelect("csa.student", "student")
                .leftJoinAndSelect("student.parents", "parent")
                .leftJoinAndSelect("student.user", "user")
                .leftJoinAndSelect("activity.classroom", "classroom")
                .leftJoinAndSelect("activity.creator", "creator")
                .leftJoinAndSelect("creator.profile", "creatorProfile")



            if (activityType) {
                queryBuilder.andWhere("activity.activityType = :activityType", { activityType });
            }

            if (classroomId) {
                queryBuilder.andWhere("activity.classroomId = :classroomId", { classroomId })
            }

            if (teacherId) {
                queryBuilder.andWhere(
                    `EXISTS (SELECT 1 FROM "staffClassesAndSubject" scs WHERE scs."classroomId" = activity.classroomId AND scs."staffId" = :teacherId)`,
                    { teacherId }
                );
            }

            if (studentId) {
                queryBuilder.andWhere("csa.studentId = :studentId", { studentId });
            }

            if (creatorId) {
                queryBuilder.andWhere("activity.creatorId = :creatorId", { creatorId });
            }
            if (parentId) {
                queryBuilder.andWhere("parent.id = :parentId", { parentId });
            }

            if (schoolId) {
                queryBuilder.andWhere("student.schoolId = :schoolId", { schoolId });
            }

            if (filters.startDate) {  
                const startDate = new Date(filters.startDate);
                startDate.setHours(0, 0, 0, 0);
                queryBuilder.andWhere("activity.createdAt >= :startDate", { startDate });
            }

            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                queryBuilder.andWhere("activity.createdAt <= :endDate", { endDate });
            }

            // Apply sorting
            const sortFieldMap: { [key: string]: string } = {
                createdAt: "activity.createdAt",
                updatedAt: "activity.updatedAt",
            };

            const sortField = sortFieldMap[sortBy] || "activity.createdAt";
            queryBuilder.orderBy(sortField, sortOrder);

            queryBuilder.skip(pos).take(delta);

            const [activities, count] = await queryBuilder.getManyAndCount();

            const message =
                teacherId && count === 0
                    ? "No records for this staff."
                    : "Classroom activities retrieved successfully";

            return {
                success: true,
                message,
                activities: activities.map(a => this.getPrivateActivityResponse(a)),
                pagination: {
                    pos,
                    delta,
                    count,
                },
            };
        } catch (error) {
            logger.error("Error listing classroom activities:", error);
            return {
                success: false,
                message: "Failed to retrieve classroom activities",
            };
        }
    }

    async updateActivity(
        activityId: number,
        data: UpdateClassroomActivityInput
    ): Promise<{ success: boolean; message: string; activity?: ClassroomActivity }> {
        try {

            const activity = await this.classroomActivityRepository.findOne({
                where: { id: activityId },
                relations: ["student", "student.classrooms", "student.parents"],
            });


            if (!activity) {
                return {
                    success: false,
                    message: "Classroom activity not found",
                };
            }

            if (typeof data.creatorId !== "undefined" && data.creatorId !== activity.creatorId) {

                activity.creatorId = data.creatorId;
            }

            const validation = this.applyActivityData(activity, data, "update");
            if (!validation.success) {
                return {
                    success: false,
                    message: validation.message ?? "Invalid activity data",
                };
            }

            if (!activity.startTime) {
                activity.startTime = activity.timeGiven;
            }

            const saved = await this.classroomActivityRepository.save(activity);

            const updated = await this.getActivityById(saved?.id);

            return {
                success: true,
                message: "Classroom activity updated successfully",
                activity: updated.activity,
            };
        } catch (error) {
            logger.error("Error updating classroom activity:", error);
            return {
                success: false,
                message: "Failed to update classroom activity",
            };
        }
    }

    async deleteActivity(activityId: number): Promise<{ success: boolean; message: string }> {
        try {
            const activity = await this.classroomActivityRepository.findOne({ where: { id: activityId } });
            if (!activity) {
                return {
                    success: false,
                    message: "Classroom activity not found",
                };
            }

            await this.classroomActivityRepository.remove(activity);

            return {
                success: true,
                message: "Classroom activity deleted successfully",
            };
        } catch (error) {
            logger.error("Error deleting classroom activity:", error);
            return {
                success: false,
                message: "Failed to delete classroom activity",
            };
        }
    }
}

const classroomActivityService = new ClassroomActivityService();
export { classroomActivityService };
