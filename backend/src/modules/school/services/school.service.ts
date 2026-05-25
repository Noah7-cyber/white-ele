import { Repository } from "typeorm";
import { AppDataSource } from "../../core";
import { Admin } from "../../shared/entities/Admin";
import { School } from "../../shared/entities/School";
import { SchoolNotificationSetting } from "../../shared/entities/SchoolNotificationSetting";
import { User } from "../../shared/entities/User";
import { Classroom } from "../../shared/entities/Classroom";
import { SchoolType, UserRole } from "../../shared/entities/EntityEnums";
import { userAssociationService } from "../../shared/services/user-association.service";
import { emailService } from "../../shared/services/email.service";
import { logger } from "../../shared/utils/logger";
import { getSchoolIdsForRole, getSchoolIdsForUser } from "../../shared/utils/user-school";
import { getSchoolPortalUrl, slugify } from "../../shared/services/utils";
import { rolesService } from "../../roles";
import { notificationService } from "../../notification";
import { NotificationPriority, NotificationType } from "../../shared/entities/Notification";

export interface CreateSchoolData {
    schoolName: string;
    userId: number;
    schoolMotto?: string;
    schoolType?: SchoolType;
    schoolLogoUrl?: string;
    address?: string;
    city?: string;
    state?: string;
    subDomain?: string;
    postalCode: string;
    country?: string;
    email?: string;
    phoneNumber?: string;
    studentResumptionTime?: string;
    staffResumptionTime?: string;
    schoolClosingTime?: string;
    staffClosingTime?: string;
    maximumNumberOfStudents: number;
    x?: string;
    facebook?: string;
    tikTok?: string;
    instagram?: string;
    description?: string;
    brandColor?: string;
}

export interface UpdateSchoolData {
    schoolName?: string;
    schoolLogoUrl?: string;
    schoolMotto?: string;
    schoolType?: SchoolType;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    subDomain?: string;
    maximumNumberOfStudents?: number;
    email?: string;
    phoneNumber: string;
    studentResumptionTime?: string;
    staffResumptionTime?: string;
    schoolClosingTime?: string;
    staffClosingTime?: string;
    country: string;
    x?: string;
    facebook?: string;
    tikTok?: string;
    instagram?: string;
    description?: string;
    brandColor?: string;
}

export interface SchoolSearchFilters {
    schoolName?: string;
    pos?: number;
    delta?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}

export interface SchoolResponse {
    success: boolean;
    message: string;
    school?: School;
    admins?: User[];
    schools?: School[];
    pagination?: {
        pos: number;
        delta: number;
        count: number
    }
}

class SchoolService {
    private get schoolRepository(): Repository<School> {
        return AppDataSource.getRepository(School)
    }

    private get userRepository(): Repository<User> {
        return AppDataSource.getRepository(User)
    }

    private get notificationSettingRepository(): Repository<SchoolNotificationSetting> {
        return AppDataSource.getRepository(SchoolNotificationSetting)
    }

    /** Subdomains allow [a-z0-9-] only; must match school.validation regex and DB length 150. */
    private normalizeSubDomainBase(name: string): string {
        let s = slugify(name)
            .replace(/_/g, "")
            .replace(/[^a-z0-9-]+/g, "")
            .replace(/--+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");
        if (!s) {
            s = "school";
        }
        if (s.length > 150) {
            s = s.slice(0, 150).replace(/[^a-z0-9]+$/g, "");
        }
        if (!s) {
            s = "school";
        }
        return s;
    }

    private async ensureUniqueSubDomain(name: string, excludeSchoolId?: number): Promise<string> {
        const maxTotal = 150;
        const base = this.normalizeSubDomainBase(name);

        const isAvailable = async (sub: string): Promise<boolean> => {
            const existing = await this.schoolRepository.findOne({ where: { subDomain: sub } });
            if (!existing) {
                return true;
            }
            if (excludeSchoolId !== undefined && existing.id === excludeSchoolId) {
                return true;
            }
            return false;
        };

        if (await isAvailable(base)) {
            return base;
        }

        let suffix = 2;
        while (suffix < 1_000_000) {
            const suffixStr = `-${suffix}`;
            let prefix = base;
            if (prefix.length + suffixStr.length > maxTotal) {
                prefix = prefix.slice(0, maxTotal - suffixStr.length).replace(/[^a-z0-9]+$/g, "");
                if (!prefix) {
                    prefix = "school";
                }
            }
            const candidate = `${prefix}${suffixStr}`;
            if (await isAvailable(candidate)) {
                return candidate;
            }
            suffix += 1;
        }

        for (let attempt = 0; attempt < 25; attempt++) {
            const emergency = this.normalizeSubDomainBase(
                `school-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
            );
            if (await isAvailable(emergency)) {
                return emergency;
            }
        }

        return this.normalizeSubDomainBase(`school-${Date.now()}-${process.pid}`);
    }

    async createSchool(data: CreateSchoolData): Promise<{ success: boolean; message: string; school?: School | undefined }> {
        try {

            // check if email exists 
            if (data.email) {
                const schoolEmail = await this.schoolRepository.findOne({
                    where: { email: data.email }
                });

                if (schoolEmail) {
                    return {
                        success: false,
                        message: "School with email exists already"
                    };
                }
            }

            // const existingPhoneNumber = await this.schoolRepository.findOne({
            //     where: { phoneNumber: data.phoneNumber }
            // });

            // if (existingPhoneNumber) {
            //     return {
            //         success: false,
            //         message: "School with phone number exists already"
            //     };
            // }

            const creator = await this.userRepository.findOne({
                where: { id: data.userId }
            })

            if (!creator) return {
                success: false,
                message: "School creator not a user"
            }

            // Detect first-time school creators so we can send the welcome in-app notification
            // here instead of at registration time (when no school is known yet).
            let isCreatorsFirstSchool = false;
            try {
                const existingAdminSchoolIds = await getSchoolIdsForRole(
                    AppDataSource.manager,
                    creator.id,
                    UserRole.ADMIN
                );
                isCreatorsFirstSchool = existingAdminSchoolIds.length === 0;
            } catch (firstSchoolCheckError) {
                console.error("Failed to determine if creator is a first-time admin:", firstSchoolCheckError);
            }

            let subDomain = typeof data.subDomain === "string" ? data.subDomain.trim() : "";
            if (!subDomain) {
                subDomain = await this.ensureUniqueSubDomain(data.schoolName || "school");
            } else {
                const existingSubDomain = await this.schoolRepository.findOne({ where: { subDomain } });
                if (existingSubDomain) {
                    return {
                        success: false,
                        message: "Sub domain exists already"
                    };
                }
            }

            const school = this.schoolRepository.create({
                schoolName: data.schoolName,
                schoolMotto: data.schoolMotto,
                schoolLogoUrl: data.schoolLogoUrl,
                schoolType: data.schoolType,
                phoneNumber: data.phoneNumber,
                email: data.email,
                address: data.address,
                city: data.city,
                state: data.state,
                postalCode: data.postalCode,
                maximumNumberOfStudents: data.maximumNumberOfStudents,
                country: data.country,
                schoolClosingTime: data.schoolClosingTime,
                staffClosingTime: data.staffClosingTime,
                staffResumptionTime: data.staffResumptionTime,
                studentResumptionTime: data.studentResumptionTime,
                description: data.description,
                subDomain,
                creator,
                x: data.x,
                facebook: data.facebook,
                tikTok: data.tikTok,
                instagram: data.instagram,
                brandColor: data.brandColor
            })

            await this.schoolRepository.save(school)

            try {
                await rolesService.syncSystemSchoolSuperAdminForSchool(school.id);
            } catch (systemRoleError) {
                console.error("Failed to seed system Super Admin school role:", systemRoleError);
            }

            // If the creator is an admin, ensure an `admin` table record exists now that schoolId is known.
            try {
                await userAssociationService.ensureAssociation(
                    creator,
                    UserRole.ADMIN,
                    school.id
                );
            } catch (adminRecordError) {
                console.error("Failed to ensure admin record:", adminRecordError);
            }

            // First-time admins miss the welcome in-app notification at registration (no schoolId yet).
            // Send it here so they still get one, scoped to the school they just created.
            if (isCreatorsFirstSchool) {
                try {
                    await notificationService.sendNotification({
                        userId: creator.id,
                        schoolId: school.id,
                        title: "Welcome to WhitePenguin",
                        message: `Welcome ${creator.firstName || "there"}! We're glad to have you on board.`,
                        type: NotificationType.INFO,
                        priority: NotificationPriority.MEDIUM,
                    });
                } catch (welcomeNotifError) {
                    console.error("Failed to send welcome notification after school creation:", welcomeNotifError);
                }
            }

            // Send welcome email
            const recipientEmail = creator.email;
            if (recipientEmail) {
                try {
                    const creatorDisplayName = [creator.firstName, creator.lastName].filter(Boolean).join(" ");
                    const subDomain = school.subDomain;
                    // Construct portal URL with subdomain
                    const portalUrl = getSchoolPortalUrl("/admin/dashboard", subDomain);

                    await emailService.sendWelcomeEmail(recipientEmail, creatorDisplayName, data.schoolName, undefined, portalUrl)
                } catch (emailError) {
                    console.error("Failed to send welcome email:", emailError);
                }
                emailService.sendKioskWelcomeEmail(
                    recipientEmail,
                    [creator.firstName, creator.lastName].filter(Boolean).join(" ") || "Administrator",
                    data.schoolName || school.schoolName || "Your Center",
                    school.subDomain
                ).catch((kioskEmailError) => {
                    console.error("Failed to send kiosk welcome email:", kioskEmailError);
                });
            }

            const completeSchoolData = await this.getSchoolById(school.id);

            return {
                success: true,
                message: "School created successfully",
                school: completeSchoolData.school
            }
        } catch (error) {
            logger.error("Error creating school:", error)
            console.error("School creation error details:", error);
            return {
                success: false,
                message: "Failed to create school"
            }
        }
    }


    async getSchoolById(schoolId: number): Promise<SchoolResponse> {
        try {
            const school = await this.schoolRepository.findOne({
                where: { id: schoolId },
                relations: ["students", "teachers", "parents", "classrooms"]
            });

            if (!school) {
                return {
                    success: false,
                    message: "School not found"
                }
            }

            const adminRows = await AppDataSource.getRepository(Admin)
                .createQueryBuilder("admin")
                .leftJoinAndSelect("admin.user", "user")
                .leftJoinAndSelect("user.profile", "profile")
                .where("admin.schoolId = :schoolId", { schoolId })
                .orderBy("user.firstName", "ASC")
                .addOrderBy("user.lastName", "ASC")
                .addOrderBy("admin.createdAt", "DESC")
                .getMany();
            const admins = adminRows.map((a) => a.user).filter(Boolean) as User[];
            const adminsWithRoles = await this.enrichAdminsWithAssignedRoles(schoolId, admins);

            return {
                success: true,
                message: "School retrieved successfully",
                school,
                admins: adminsWithRoles
            }
        } catch (error) {
            logger.error("Error retrieving school:", error);
            console.error("School retrieval error details:", error);
            return {
                success: false,
                message: "Failed to retrieve school"
            }
        }
    }

    private async enrichAdminsWithAssignedRoles(
        schoolId: number,
        admins: User[],
    ): Promise<Array<User & { assignedRoleId?: number | null; assignedRoleName?: string | null }>> {
        await rolesService.syncSystemSchoolSuperAdminForSchool(schoolId);
        return Promise.all(
            admins.map(async (user) => {
                const primary = await rolesService.getPrimaryAssignedRoleForUser(user.id, schoolId);
                return {
                    ...user,
                    assignedRoleId: primary?.id ?? null,
                    assignedRoleName: primary?.name ?? null,
                };
            }),
        );
    }

    async getSchoolByIdForGuard(schoolId: number): Promise<SchoolResponse> {
        try {
            const school = await this.schoolRepository.findOne({
                where: { id: schoolId },
                select: ["id", "subDomain", "schoolName"],
            });

            if (!school) {
                return {
                    success: false,
                    message: "School not found",
                };
            }

            return {
                success: true,
                message: "School retrieved successfully",
                school,
            };
        } catch (error) {
            logger.error("Error retrieving school for guard:", error);
            return {
                success: false,
                message: "Failed to retrieve school",
            };
        }
    }

    async getSchoolBySubDomain(subDomain: string, schoolId?: number): Promise<SchoolResponse> {
        try {
            const where: any = { subDomain };
            if (schoolId) {
                where.id = schoolId;
            }

            const school = await this.schoolRepository.findOne({
                where
            });

            if (!school) {
                return {
                    success: false,
                    message: "School not found"
                }
            }

            return {
                success: true,
                message: "School retrieved successfully",
                school
            }
        } catch (error) {
            logger.error("Error retrieving school by slug:", error);
            return {
                success: false,
                message: "Failed to retrieve school"
            }
        }
    }

    async updateSchool(schoolId: number, data: UpdateSchoolData): Promise<{ success: boolean; message: string; school?: School | undefined }> {
        try {
            const school = await this.schoolRepository.findOne({
                where: { id: schoolId }
            });

            if (!school) {
                return {
                    success: false,
                    message: "School not found"
                }
            }

            if (data.email && data.email !== school.email) {
                const existingSchoolByEmail = await this.schoolRepository.findOne({
                    where: { email: data.email }
                });

                if (existingSchoolByEmail && existingSchoolByEmail.id !== school.id) {
                    return {
                        success: false,
                        message: "Another school with this email already exists"
                    }
                }
            }

            if (data.phoneNumber && data.phoneNumber !== school.phoneNumber) {
                const existingSchoolByPhone = await this.schoolRepository.findOne({
                    where: { phoneNumber: data.phoneNumber }
                });

                if (existingSchoolByPhone && existingSchoolByPhone.id !== school.id) {
                    return {
                        success: false,
                        message: "Another school with this phone number already exists"
                    }
                }
            }

            let resolvedSubDomain = school.subDomain;
            if (data.subDomain !== undefined) {
                const trimmedSub = typeof data.subDomain === "string" ? data.subDomain.trim() : "";
                if (trimmedSub === "") {
                    const nameForSlug = data.schoolName ?? school.schoolName ?? "school";
                    resolvedSubDomain = await this.ensureUniqueSubDomain(nameForSlug, school.id);
                } else if (trimmedSub !== school.subDomain) {
                    const existingSchoolBySubDomain = await this.schoolRepository.findOne({
                        where: { subDomain: trimmedSub }
                    });

                    if (existingSchoolBySubDomain && existingSchoolBySubDomain.id !== school.id) {
                        return {
                            success: false,
                            message: "Another school with this sub domain already exists"
                        }
                    }
                    resolvedSubDomain = trimmedSub;
                } else {
                    resolvedSubDomain = trimmedSub;
                }
            }

            school.schoolName = data.schoolName ?? school.schoolName,
                school.schoolLogoUrl = data.schoolLogoUrl ?? school.schoolLogoUrl,
                school.subDomain = resolvedSubDomain,
                school.phoneNumber = data.phoneNumber ?? school.phoneNumber,
                school.schoolType = data.schoolType ?? school.schoolType,
                school.email = data.email ?? school.email,
                school.city = data.city ?? school.city,
                school.state = data.state ?? school.state,
                school.postalCode = data.postalCode ?? school.postalCode,
                school.maximumNumberOfStudents = data.maximumNumberOfStudents ?? school.maximumNumberOfStudents,
                school.address = data.address ?? school.address,
                school.schoolClosingTime = data.schoolClosingTime ?? school.schoolClosingTime,
                school.staffClosingTime = data.staffClosingTime ?? school.staffClosingTime,
                school.staffResumptionTime = data.staffResumptionTime ?? school.staffResumptionTime,
                school.studentResumptionTime = data.studentResumptionTime ?? school.studentResumptionTime,
                school.address = data.address ?? school.address,
                school.facebook = data.facebook ?? school.facebook,
                school.x = data.x ?? school.x,
                school.tikTok = data.tikTok ?? school.tikTok
            school.instagram = data.instagram ?? school.instagram,
                school.description = data.description ?? school.description
            school.country = data.country ?? school.country,
                school.brandColor = data.brandColor ?? school.brandColor

            const save = await this.schoolRepository.save(school);

            const updatedSchool = await this.schoolRepository.findOne({
                where: { id: save.id },
                relations: []
            });

            return {
                success: true,
                message: "School updated successfully",
                school: updatedSchool!
            }
        } catch (error) {
            logger.error("Error updating school:", error);
            console.error("School update error details:", error);
            return {
                success: false,
                message: "Failed to update school"
            }
        }
    }

    async deleteSchool(schoolId: number): Promise<{ success: boolean; message: string }> {
        try {
            const school = await this.schoolRepository.findOne({
                where: { id: schoolId }
            });

            if (!school) {
                return {
                    success: false,
                    message: "School not found"
                }
            }

            await this.schoolRepository.remove(school);

            return {
                success: true,
                message: "School deleted successfully"
            }
        } catch (error) {
            logger.error("Error deleting school:", error);
            console.error("School deletion error details:", error);
            return {
                success: false,
                message: "Failed to delete school"
            }
        }
    }

    async listSchools(filters: SchoolSearchFilters = {}): Promise<SchoolResponse> {
        try {
            const {
                schoolName,
                pos = 0,
                delta = 10,
                sortBy = "createdAt",
                sortOrder = "DESC"
            } = filters;

            const queryBuilder = this.schoolRepository
                .createQueryBuilder("school")
                .loadRelationCountAndMap("school.studentCount", "school.students")
                .loadRelationCountAndMap("school.teacherCount", "school.teachers")
                .loadRelationCountAndMap("school.parentCount", "school.parents")
                .loadRelationCountAndMap("school.classroomCount", "school.classrooms")
                .loadRelationCountAndMap("school.academicSessionCount", "school.academicSessions");

            if (schoolName) {
                queryBuilder.andWhere("LOWER(school.schoolName) LIKE LOWER(:schoolName)", {
                    schoolName: `%${schoolName}%`
                });
            }

            const sortFieldMap: { [key: string]: string } = {
                schoolName: "school.schoolName",
                createdAt: "school.createdAt",
                updatedAt: "school.updatedAt"
            };

            const sortField = sortFieldMap[sortBy] || "school.createdAt";
            queryBuilder.orderBy(sortField, sortOrder);

            queryBuilder.skip(pos).take(delta);

            const [schools, count] = await queryBuilder.getManyAndCount();

            return {
                success: true,
                message: "Schools retrieved successfully",
                schools,
                pagination: {
                    pos,
                    delta,
                    count
                }
            }
        } catch (error) {
            logger.error("Error listing schools:", error);
            console.error("School listing error details:", error);
            return {
                success: false,
                message: "Failed to retrieve schools"
            }
        }
    }

    async getSchool(userId: number, opts?: { includePaystackSecret?: boolean }): Promise<SchoolResponse> {
        try {
            const schoolIds = await getSchoolIdsForUser(AppDataSource.manager, userId);
            if (schoolIds.length !== 1) {
                return {
                    success: false,
                    message:
                        schoolIds.length === 0
                            ? "School not found for user"
                            : "User belongs to multiple schools; please specify the school context",
                };
            }
            const schoolId = schoolIds[0] as number;

            let school: School | null = null;
            const safeSchoolFields: (keyof School)[] = [
                "id", "schoolName", "schoolMotto", "brandColor", "schoolType", "schoolLogoUrl", "subDomain",
                "postalCode", "city", "state", "address", "country", "email",
                "phoneNumber", "x", "facebook", "tikTok", "instagram",
                "description", "maximumNumberOfStudents", "studentResumptionTime",
                "staffResumptionTime", "schoolClosingTime", "staffClosingTime",
                "PaystackPublicKey", "createdAt", "updatedAt"
            ];
            const selectFields = opts?.includePaystackSecret
                ? ([
                    ...safeSchoolFields,
                    "PaystackSecretKey",
                    "PaystackSecretIv",
                    "PaystackSecretTag",
                ] as (keyof School)[])
                : safeSchoolFields;

            if (schoolId) {
                school = await this.schoolRepository.findOne({
                    where: { id: schoolId },
                    select: selectFields
                });
            }

            if (!school) {
                return {
                    success: false,
                    message: "School not found"
                };
            }

            // Get classroom count separately for efficiency
            const classroomCount = await AppDataSource.getRepository(Classroom)
                .createQueryBuilder("classroom")
                .where("classroom.schoolId = :schoolId", { schoolId: school.id })
                .getCount();

            const adminRows = await AppDataSource.getRepository(Admin)
                .createQueryBuilder("admin")
                .leftJoinAndSelect("admin.user", "user")
                .leftJoinAndSelect("user.profile", "profile")
                .where("admin.schoolId = :schoolId", { schoolId: school.id })
                .orderBy("admin.createdAt", "DESC")
                .getMany();
            const admins = adminRows.map((a) => a.user).filter(Boolean) as User[];
            const adminsWithRoles = await this.enrichAdminsWithAssignedRoles(school.id, admins);

            const schoolWithCount = {
                ...school,
                classroomCount
            } as School;

            return {
                success: true,
                message: "School retrieved successfully",
                school: schoolWithCount,
                admins: adminsWithRoles
            };
        } catch (error) {
            logger.error("Error getting school:", error);
            console.error("School retrieval error details:", error);
            return {
                success: false,
                message: "Failed to retrieve school"
            };
        }
    }

    async getNotificationSettings(schoolId: number): Promise<{ success: boolean; message: string; settings?: SchoolNotificationSetting }> {
        try {
            let settings = await this.notificationSettingRepository.findOne({
                where: { schoolId }
            });

            if (!settings) {
                // Initialize settings if they don't exist
                settings = this.notificationSettingRepository.create({ schoolId });
                await this.notificationSettingRepository.save(settings);
            }

            return {
                success: true,
                message: "Notification settings retrieved successfully",
                settings
            };
        } catch (error) {
            logger.error("Error getting notification settings:", error);
            return {
                success: false,
                message: "Failed to retrieve notification settings"
            };
        }
    }

    async updateNotificationSettings(schoolId: number, data: Partial<SchoolNotificationSetting>): Promise<{ success: boolean; message: string; settings?: SchoolNotificationSetting }> {
        try {
            let settings = await this.notificationSettingRepository.findOne({
                where: { schoolId }
            });

            if (!settings) {
                settings = this.notificationSettingRepository.create({ ...data, schoolId });
            } else {
                Object.assign(settings, data);
            }

            await this.notificationSettingRepository.save(settings);

            return {
                success: true,
                message: "Notification settings updated successfully",
                settings
            };
        } catch (error) {
            logger.error("Error updating notification settings:", error);
            return {
                success: false,
                message: "Failed to update notification settings"
            };
        }
    }
}

const schoolService = new SchoolService();

export { schoolService, SchoolService };
