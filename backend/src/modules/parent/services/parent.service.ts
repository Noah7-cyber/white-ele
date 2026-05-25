import { ParentRepository } from "../../core/ParentRepository";
import { Parent } from "../../shared/entities/Parent";
import { logger, User, AttendanceStatus } from "../../shared";
import { EntityManager, In } from "typeorm";
import { Student } from "../../shared/entities/StudentEntity";
import { Attendance } from "../../shared/entities/Attendance";
import { generateRandomPIN } from "../../shared/services/utils";
import { AppDataSource } from "../../core";
import { ParentStatus } from "../../shared/entities/EntityEnums";
import { emailService } from "../../shared/services/email.service";
import { ClassroomStudentActivity } from "../../shared/entities/ClassroomStudentActivity";
import { PortfolioSection } from "../../shared/entities/PortfolioSection";

interface CreateParentDTO {
  userId: number;
  photoUrl?: string;
  relationship: Parent["relationship"];
  notes?: string;
  suffix?: Parent["suffix"];
  username?: string;
  pin?: string;
  schoolId: number;
  email?: string;
  status?: Parent["status"];
  // other required fields
}

interface ParentFilters {
  search?: string;
  pos?: number;
  delta?: number;
  schoolId?: number;
  classroomId?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

interface ChildImageGalleryItem {
  id: number;
  name: string;
  photoUrl: string | null;
  images: {
    studentProfile: string[];
    classroomActivity: string[];
    portfolio: string[];
  };
  imageCounts: {
    studentProfile: number;
    classroomActivity: number;
    portfolio: number;
    total: number;
  };
}

export class ParentService {
  private parentRepository: ParentRepository;
  constructor() {
    this.parentRepository = new ParentRepository();
  }

  private isLikelyImageUrl(url: string): boolean {
    const trimmed = (url || "").trim();
    if (!trimmed) return false;
    if (trimmed.startsWith("data:image/")) return true;
    const lower = trimmed.toLowerCase();
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg|heic|heif|tiff|ico|jxl)(\?|#|$)/.test(lower);
    if (hasImageExtension) return true;
    return lower.includes("/image/") || lower.includes("images") || lower.includes("photo");
  }

  private uniqueImageUrls(urls: string[]): string[] {
    return Array.from(new Set(urls.filter((u) => this.isLikelyImageUrl(u))));
  }

  async getParentChildImageGallery(userId: number, schoolId: number): Promise<{
    success: boolean;
    message: string;
    children: ChildImageGalleryItem[];
    metadata: { totalChildren: number; totalImages: number };
  }> {
    const studentRepo = AppDataSource.getRepository(Student);
    const csaRepo = AppDataSource.getRepository(ClassroomStudentActivity);
    const portfolioSectionRepo = AppDataSource.getRepository(PortfolioSection);

    const children = await studentRepo
      .createQueryBuilder("student")
      .innerJoin(
        "student.parents",
        "parent",
        "parent.userId = :userId AND parent.schoolId = :schoolId AND parent.deletedAt IS NULL",
        { userId, schoolId }
      )
      .leftJoinAndSelect("student.user", "user")
      .where("student.schoolId = :schoolId", { schoolId })
      .getMany();

    if (children.length === 0) {
      return {
        success: true,
        message: "Image gallery fetched successfully",
        children: [],
        metadata: { totalChildren: 0, totalImages: 0 },
      };
    }

    const studentIds = children.map((c) => c.id);

    const [photoRows, portfolioSections] = await Promise.all([
      csaRepo
        .createQueryBuilder("csa")
        .innerJoin("csa.classroomActivity", "activity")
        .select("csa.studentId", "studentId")
        .addSelect("activity.photoUrl", "photoUrl")
        .where("csa.studentId IN (:...studentIds)", { studentIds })
        .andWhere("activity.photoUrl IS NOT NULL")
        .getRawMany<{ studentId: string; photoUrl: string }>(),
      portfolioSectionRepo
        .createQueryBuilder("section")
        .innerJoinAndSelect("section.portfolio", "portfolio")
        .where("portfolio.studentId IN (:...studentIds)", { studentIds })
        .andWhere("portfolio.schoolId = :schoolId", { schoolId })
        .getMany(),
    ]);

    const photosByStudent = new Map<number, string[]>();
    for (const row of photoRows) {
      const sid = Number(row.studentId);
      const current = photosByStudent.get(sid) ?? [];
      current.push(row.photoUrl);
      photosByStudent.set(sid, current);
    }

    const portfolioByStudent = new Map<number, string[]>();
    for (const section of portfolioSections) {
      const sid = section.portfolio?.studentId;
      if (!sid) continue;
      const current = portfolioByStudent.get(sid) ?? [];
      current.push(...(section.mediaUrls ?? []));
      portfolioByStudent.set(sid, current);
    }

    const resultChildren: ChildImageGalleryItem[] = children.map((child) => {
      const studentProfileUrls = this.uniqueImageUrls(child.photoUrl ? [child.photoUrl] : []);
      const classroomActivityUrls = this.uniqueImageUrls(photosByStudent.get(child.id) ?? []);
      const portfolioUrls = this.uniqueImageUrls(portfolioByStudent.get(child.id) ?? []);

      const imageCounts = {
        studentProfile: studentProfileUrls.length,
        classroomActivity: classroomActivityUrls.length,
        portfolio: portfolioUrls.length,
        total:
          studentProfileUrls.length +
          classroomActivityUrls.length +
          portfolioUrls.length,
      };

      return {
        id: child.id,
        name: `${child.user?.firstName ?? ""} ${child.user?.lastName ?? ""}`.trim() || "Unknown Child",
        photoUrl: child.photoUrl ?? null,
        images: {
          studentProfile: studentProfileUrls,
          classroomActivity: classroomActivityUrls,
          portfolio: portfolioUrls,
        },
        imageCounts,
      };
    });

    return {
      success: true,
      message: "Image gallery fetched successfully",
      children: resultChildren,
      metadata: {
        totalChildren: resultChildren.length,
        totalImages: resultChildren.reduce((sum, child) => sum + child.imageCounts.total, 0),
      },
    };
  }

  async createParent(data: CreateParentDTO, options?: { manager?: EntityManager }): Promise<Parent> {
    try {
      //Fetch the user to ensure it exists
      const user = options?.manager
        ? await options.manager.findOne(User, { where: { id: data.userId } })
        : await this.parentRepository.findUserById(data.userId);
      if (!user) {
        throw new Error(`User with id ${data.userId} not found`);
      }

      // Generate PIN if not provided
      let pinToStore: string | undefined;

      if (!data.pin) {
        // Generate random 4-digit PIN
        pinToStore = generateRandomPIN(4);
      } else {
        // Use provided PIN as-is
        pinToStore = data.pin;
      }

      // Create parent data with plain PIN
      const parentData = {
        ...data,
        email: data.email?.toLowerCase().trim(),
        pin: pinToStore,
        status: data.status || ParentStatus.ACTIVE, // Default to ACTIVE if not provided
      };

      let parent: Parent;
      if (options?.manager) {
        parent = options.manager.create(Parent, { ...parentData, user });
        parent = await options.manager.save(Parent, parent);
      } else {
        parent = await this.parentRepository.create({ ...parentData, user });
      }

      // Attach plain PIN to parent object if it was generated (for response purposes)
      if (!data.pin && pinToStore) {
        (parent as any).generatedPin = pinToStore;
      }

      return parent;
    } catch (error: any) {
      logger?.error?.("Error creating parent:", error);
      throw new Error("Failed to create parent");
    }
  }

  async updateParent(
    parentId: number,
    data: Partial<CreateParentDTO>,
    adminSchoolId: number,
    options?: { manager?: EntityManager }
  ): Promise<Parent> {
    try {
      // Find parent and verify it belongs to admin's school
      let parent = options?.manager
        ? await options.manager.findOne(Parent, {
          where: { id: parentId },
          relations: ["user", "school"],
        })
        : await AppDataSource.getRepository(Parent).findOne({
          where: { id: parentId },
          relations: ["user", "school"],
        });

      if (!parent) {
        throw new Error(`Parent with id ${parentId} not found`);
      }

      const oldEmail = parent.user.email;

      // Verify parent belongs to admin's school
      if (parent.schoolId !== adminSchoolId) {
        throw new Error("Parent does not belong to your school");
      }

      // Remove protected fields that shouldn't be updated
      const updateData = { ...data };
      if ((updateData as any).email) {
        (updateData as any).email = (updateData as any).email.toLowerCase().trim();
      }
      delete (updateData as any).userId;
      delete (updateData as any).schoolId;

      // Update parent fields
      if (updateData.photoUrl !== undefined) parent.photoUrl = updateData.photoUrl;
      if (updateData.relationship !== undefined) parent.relationship = updateData.relationship;
      if (updateData.notes !== undefined) parent.notes = updateData.notes;
      if (updateData.suffix !== undefined) parent.suffix = updateData.suffix;
      if (updateData.username !== undefined) parent.username = updateData.username;
      if (updateData.pin !== undefined) parent.pin = updateData.pin;

      // Update User fields if present
      const anyData = updateData as any;
      if (parent.user && (anyData.firstName || anyData.lastName || anyData.email || anyData.phone || anyData.address)) {
        const userRepository = options?.manager ? options.manager.getRepository(User) : AppDataSource.getRepository(User);

        if (anyData.phone !== undefined) {
          parent.user.phone = anyData.phone;
        }

        if (anyData.email !== undefined) {
          const normalizedEmail = (anyData.email as string).toLowerCase().trim();
          const userWithEmail = await userRepository.findOne({
            where: { email: normalizedEmail }
          });
          if (userWithEmail && userWithEmail.id !== parent.userId) {
            throw new Error("This email address is already registered to another account. Please use a unique identifier.");
          }
          parent.user.email = normalizedEmail;
        }

        if (anyData.firstName !== undefined) parent.user.firstName = anyData.firstName;
        if (anyData.lastName !== undefined) parent.user.lastName = anyData.lastName;
        if (anyData.address !== undefined) parent.user.address = anyData.address;

        if (options?.manager) {
          await options.manager.save(User, parent.user);
        } else {
          await AppDataSource.getRepository(User).save(parent.user);
        }
      }

      // Save parent
      if (options?.manager) {
        parent = await options.manager.save(Parent, parent);
      } else {
        parent = await AppDataSource.getRepository(Parent).save(parent);
      }

      if (parent.user.email !== oldEmail && parent.user.email) {
        const schoolName = parent.school?.schoolName || "the school";
        emailService.sendEmailUpdateNotification(
          parent.user.email,
          `${parent.user.firstName || ""} ${parent.user.lastName || ""}`.trim() || parent.user.email,
          schoolName
        ).catch((err: any) => logger?.error?.("Failed to send email update notification:", err));
      }

      return parent;
    } catch (error: any) {
      logger?.error?.("Error updating parent:", error);
      throw new Error(error.message || "Failed to update parent");
    }
  }

  async updateParentStatus(
    parentId: number,
    status: ParentStatus,
    adminSchoolId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const parent = await this.parentRepository
        .createQueryBuilder("parent")
        .where("parent.id = :parentId", { parentId })
        .andWhere("parent.schoolId = :adminSchoolId", { adminSchoolId })
        .andWhere("parent.deletedAt IS NULL")
        .getOne();

      if (!parent) {
        return { success: false, message: "Parent not found or does not belong to your school" };
      }

      if (parent.status === status) {
        return { success: false, message: `Parent is already in ${status} status` };
      }

      parent.status = status;
      await AppDataSource.getRepository(Parent).save(parent);

      return { success: true, message: `Parent status updated to ${status} successfully` };
    } catch (error: any) {
      logger?.error?.("Error updating parent status:", error);
      throw new Error(error.message || "Failed to update parent status");
    }
  }

  async attachParentToStudent(studentId: number, parentId: number, options?: { manager?: EntityManager }) {
    try {
      if (options?.manager) {
        const student = await options.manager.findOne(Student, {
          where: { id: studentId },
        });

        if (!student) {
          throw new Error("Student not found");
        }

        const parent = await options.manager.findOne(Parent, {
          where: { id: parentId },
        });

        if (!parent) {
          throw new Error("Parent not found");
        }

        const linked = await options.manager
          .createQueryBuilder()
          .relation(Parent, "children")
          .of(parent.id)
          .loadMany();

        if (!linked.some((s) => s.id === student.id)) {
          await options.manager
            .createQueryBuilder()
            .relation(Parent, "children")
            .of(parent.id)
            .add(student.id);
        }

        return (
          (await options.manager.findOne(Student, {
            where: { id: studentId },
            relations: ["parents"],
          })) ?? student
        );
      } else {
        return await this.parentRepository.attachParentToStudent(studentId, parentId);
      }
    } catch (error: any) {
      logger?.error?.("Error attaching parent to student:", error);
      throw new Error(error?.message || "Failed to attach parent to student");
    }
  }

  async attachParentsToStudent(studentId: number, parentIds: number[], options?: { manager?: EntityManager }) {
    const results = [];
    for (const parentId of parentIds) {
      const student = await this.attachParentToStudent(studentId, parentId, options);
      results.push(student);
    }
    return results;
  }

  /**
   * Replaces the student's parent associations with the exact list of parent IDs.
   * Removes parents not in the list and adds new ones. Supports empty list to clear all.
   */
  async replaceStudentParents(
    studentId: number,
    parentIds: number[],
    options?: { manager?: EntityManager }
  ): Promise<void> {
    const manager = options?.manager || AppDataSource.manager;

    const student = await manager.findOne(Student, {
      where: { id: studentId },
      relations: ["parents"],
    });

    if (!student) {
      throw new Error("Student not found");
    }

    if (parentIds.length === 0) {
      student.parents = [];
    } else {
      const parentEntities = await manager.find(Parent, {
        where: { id: In(parentIds) },
      });
      if (parentEntities.length !== parentIds.length) {
        const foundIds = new Set(parentEntities.map((p) => p.id));
        const missing = parentIds.filter((id) => !foundIds.has(id));
        throw new Error(`Parent(s) not found: ${missing.join(", ")}`);
      }
      student.parents = parentEntities;
    }

    await manager.save(Student, student);
  }

  async getParentById(parentId: number): Promise<any> {
    try {
      const parent = await this.parentRepository
        .createQueryBuilder("parent")
        .leftJoinAndSelect("parent.user", "user")
        .leftJoinAndSelect("parent.children", "children")
        .leftJoinAndSelect("children.user", "childUser")
        .leftJoinAndSelect("children.currentClassroom", "currentClassroom")
        .leftJoinAndSelect("children.currentAttendance", "currentAttendance")
        .leftJoinAndSelect("children.previousAttendance", "previousAttendance")
        .where("parent.id = :parentId", { parentId })
        .getOne();

      if (!parent) return null;

      const scopedChildren = (parent.children || []).filter((c: any) => c?.schoolId === parent.schoolId);

      // Calculate attendance percentages for all children
      const attendanceMap = await this.calculateChildrenAttendancePercentages(scopedChildren);
      const children =
        scopedChildren?.map((child) => {
          // Exclude sensitive data from user (password, pin, etc.)
          const { password, ...safeUser } = child.user || {};

          // Format classroom details
          const classroom = child.currentClassroom
            ? {
              id: child.currentClassroom.id,
              classroomName: child.currentClassroom.classroomName,
              minimumAge: child.currentClassroom.minimumAge,
              maximumAge: child.currentClassroom.maximumAge,
              maximumCapacity: child.currentClassroom.maximumCapacity,
              description: child.currentClassroom.description,
              tuitionFee: child.currentClassroom.tuitionFee,
              classroomStatus: child.currentClassroom.classroomStatus,
              schoolId: child.currentClassroom.schoolId,
              createdAt: child.currentClassroom.createdAt,
              updatedAt: child.currentClassroom.updatedAt,
            }
            : null;

          return {
            id: child.id,
            userId: child.userId,
            admissionNumber: child.admissionNumber,
            enrolmentDate: child.enrolmentDate,
            schedule: child.schedule,
            photoUrl: child.photoUrl,
            schoolId: child.schoolId,
            classroomId: child.classroomId,
            status: child.status,
            createdAt: child.createdAt,
            updatedAt: child.updatedAt,
            user: safeUser,
            classroom,
            currentAttendance: child.currentAttendance,
            previousAttendance: child.previousAttendance,
            attendancePercentage: attendanceMap[child.id] || 0,
          };
        }) ?? [];

      // Exclude PIN from response (sensitive data)
      const { pin, ...parentWithoutPin } = parent;

      return {
        ...parentWithoutPin,
        children,
      };
    } catch (error: any) {
      console.error("Error fetching parent by ID:", error);
      throw new Error("Failed to fetch parent");
    }
  }

  /**
   * Get parent with school and children for resend email (admin must belong to same school)
   */
  async getParentWithSchoolForResend(parentId: number, adminSchoolId: number): Promise<{
    parent: Parent;
    schoolName: string;
    studentNames: string;
  } | null> {
    const parent = await this.parentRepository
      .createQueryBuilder("parent")
      .leftJoinAndSelect("parent.user", "user")
      .leftJoinAndSelect("parent.school", "school")
      .leftJoinAndSelect("parent.children", "children", "children.schoolId = parent.schoolId")
      .leftJoinAndSelect("children.user", "childUser")
      .where("parent.id = :parentId", { parentId })
      .andWhere("parent.schoolId = :adminSchoolId", { adminSchoolId })
      .andWhere("parent.deletedAt IS NULL")
      .getOne();

    if (!parent || !parent.user?.email) return null;

    const schoolName = (parent.school as any)?.schoolName || "Your School";
    const children = (parent.children || []).filter((c: any) => c?.schoolId === parent.schoolId);
    const studentNames = children
      .map((c: any) => {
        const u = c.user || c.childUser;
        return u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "";
      })
      .filter(Boolean)
      .join(", ") || "your child";

    return { parent, schoolName, studentNames };
  }

  async kioskVerify(identifier: string | number, pin: string, schoolId: number): Promise<any> {
    try {
      // Build query to find parent by id, username, or email (scoped to school)
      const queryBuilder = this.parentRepository
        .createQueryBuilder("parent")
        .leftJoinAndSelect("parent.user", "user")
        .leftJoinAndSelect("parent.children", "children", "children.schoolId = parent.schoolId")
        .leftJoinAndSelect("children.user", "childUser")
        .leftJoinAndSelect("children.currentClassroom", "currentClassroom")
        .where("parent.deletedAt IS NULL")
        .andWhere("parent.schoolId = :schoolId", { schoolId });

      // Check if identifier is a number (parent id)
      const numericId = typeof identifier === "number" ? identifier : parseInt(identifier as string, 10);

      if (!isNaN(numericId) && numericId > 0) {
        // Search by parent ID
        queryBuilder.andWhere("parent.id = :identifier", { identifier: numericId });
      } else {
        // Search by username or email
        queryBuilder.andWhere("(parent.username = :identifier OR user.email = :identifier)", { identifier: identifier as string });
      }

      const parent = await queryBuilder.getOne();

      if (!parent) {
        return null;
      }

      // Verify PIN (plain text comparison for kiosk)
      if (!parent.pin) {
        return null; // No PIN set for this parent
      }

      // Plain text comparison for kiosk verification
      if (pin !== parent.pin) {
        return null; // Invalid PIN
      }

      const scopedChildren = (parent.children || []).filter((c: any) => c?.schoolId === parent.schoolId);

      // Format response same as getParentById
      const children =
        scopedChildren?.map((child) => {
          // Exclude sensitive data from user (password, pin, etc.)
          const { password, ...safeUser } = child.user || {};

          // Format classroom details
          const classroom = child.currentClassroom
            ? {
              id: child.currentClassroom.id,
              classroomName: child.currentClassroom.classroomName,
              minimumAge: child.currentClassroom.minimumAge,
              maximumAge: child.currentClassroom.maximumAge,
              maximumCapacity: child.currentClassroom.maximumCapacity,
              description: child.currentClassroom.description,
              tuitionFee: child.currentClassroom.tuitionFee,
              classroomStatus: child.currentClassroom.classroomStatus,
              schoolId: child.currentClassroom.schoolId,
              createdAt: child.currentClassroom.createdAt,
              updatedAt: child.currentClassroom.updatedAt,
            }
            : null;

          return {
            id: child.id,
            userId: child.userId,
            admissionNumber: child.admissionNumber,
            enrolmentDate: child.enrolmentDate,
            schedule: child.schedule,
            photoUrl: child.photoUrl,
            schoolId: child.schoolId,
            classroomId: child.classroomId,
            status: child.status,
            createdAt: child.createdAt,
            updatedAt: child.updatedAt,
            user: safeUser,
            classroom,
            currentAttendance: child.currentAttendance,
            previousAttendance: child.previousAttendance,
          };
        }) ?? [];

      // Exclude PIN from response (sensitive data)
      const { pin: _, ...parentWithoutPin } = parent;

      return {
        ...parentWithoutPin,
        children,
      };
    } catch (error: any) {
      logger?.error?.("Error in kiosk verify:", error);
      throw new Error("Failed to verify parent");
    }
  }

  async findParentByUserId(userId: number) {
    return this.parentRepository.findByUserId(userId);
  }

  async getAllParents(filters?: ParentFilters): Promise<{
    success: boolean;
    message: string;
    parents: Parent[];
    pagination?: { pos: number; delta: number; count: number };
    metadata?: {
      totalParents: number;
      multiChildParents: number;
      activeParents: number;
    };
  }> {
    try {
      const schoolId = filters?.schoolId;

      if (!schoolId) {
        throw new Error("schoolId is required");
      }

      // Build base query for metadata counts
      const baseQuery = this.parentRepository
        .createQueryBuilder("parent")
        .where("parent.schoolId = :schoolId", { schoolId })
        .andWhere("parent.deletedAt IS NULL");

      // Get total parents count
      const totalParents = await baseQuery.getCount();

      // Get multiChildParents: parents with more than one student
      // Only count students whose schoolId matches the requesting user's schoolId
      const multiChildParentsResult = await this.parentRepository
        .createQueryBuilder("parent")
        .leftJoin("parent.children", "child")
        .where("parent.schoolId = :schoolId", { schoolId })
        .andWhere("parent.deletedAt IS NULL")
        .andWhere("child.schoolId = :schoolId", { schoolId }) // Only count students from same school
        .select("parent.id")
        .groupBy("parent.id")
        .having("COUNT(child.id) > 1")
        .getRawMany();

      const multiChildParents = multiChildParentsResult.length;

      // Get active parents (where user.isActive = true, scoped to schoolId)
      const activeParents = await this.parentRepository
        .createQueryBuilder("parent")
        .leftJoin("parent.user", "user")
        .where("parent.schoolId = :schoolId", { schoolId })
        .andWhere("parent.deletedAt IS NULL")
        .andWhere("user.isActive = :isActive", { isActive: true })
        .andWhere("user.deletedAt IS NULL")
        .getCount();

      const queryBuilder = this.parentRepository
        .createQueryBuilder("parent")
        .leftJoinAndSelect("parent.user", "user")
        .leftJoin("parent.children", "child", "child.schoolId = :schoolId")
        .addSelect("COUNT(child.id)", "childrenCount")
        .where("parent.schoolId = :schoolId", { schoolId })
        .andWhere("parent.deletedAt IS NULL");

      // Filter by classroomId if provided
      if (filters?.classroomId) {
        queryBuilder.andWhere(qb => {
          const subQuery = qb.subQuery()
            .select("1")
            .from("parent_student", "ps")
            .innerJoin("student", "s", "s.id = ps.studentId")
            .where("ps.parentId = parent.id")
            .andWhere("s.classroomId = :classroomId", { classroomId: filters.classroomId })
            .getQuery();
          return `EXISTS (${subQuery})`;
        });
      }

      queryBuilder.groupBy("parent.id")
        .addGroupBy("user.id");


      // Optional: Search by parent firstName or lastName
      if (filters?.search) {
        const search = filters.search.trim().toLowerCase();
        const nameParts = search.split(" ").filter((p) => p.length > 0);

        if (nameParts.length === 1) {
          // Single word: match first OR last name
          queryBuilder.andWhere("(LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search)", {
            search: `%${nameParts[0]}%`,
          });
        } else if (nameParts.length >= 2) {
          const firstWord = nameParts[0];
          const lastWord = nameParts[nameParts.length - 1];

          // Match both orders: "First Last" OR "Last First"
          queryBuilder.andWhere(
            `(
                            (LOWER(user.firstName) LIKE :firstName AND LOWER(user.lastName) LIKE :lastName)
                            OR
                            (LOWER(user.firstName) LIKE :lastName AND LOWER(user.lastName) LIKE :firstName)
                        )`,
            { firstName: `%${firstWord}%`, lastName: `%${lastWord}%` }
          );
        }
      }

      // Sorting
      const sortByInput = filters?.sortBy || "lastName";
      const sortOrder = filters?.sortOrder || "ASC";

      const sortFieldMap: { [key: string]: string } = {
        firstname: "user.firstName",
        firstName: "user.firstName",
        lastname: "user.lastName",
        lastName: "user.lastName",
        createdat: "parent.createdAt",
        createdAt: "parent.createdAt",
      };

      const sortField = sortFieldMap[sortByInput] || "user.lastName";
      queryBuilder.orderBy(sortField, sortOrder);

      // Add secondary sort for consistent behavior
      if (sortField.includes("user.lastName")) {
        queryBuilder.addOrderBy("user.firstName", sortOrder);
      } else if (sortField.includes("user.firstName")) {
        queryBuilder.addOrderBy("user.lastName", sortOrder);
      }

      const pos = filters?.pos ?? 0;
      const delta = filters?.delta ?? 10;

      const rawResults = await queryBuilder.skip(pos).take(delta).getRawAndEntities();

      const parents = rawResults.entities.map((parent, index) => ({
        ...parent,
        childrenCount: parseInt(rawResults.raw[index].childrenCount) || 0,
      }));

      // Accurate count query (NO pagination, NO grouping issues)
      const countQuery = this.parentRepository
        .createQueryBuilder("parent")
        .leftJoin("parent.user", "user")
        .where("parent.schoolId = :schoolId", { schoolId })
        .andWhere("parent.deletedAt IS NULL");

      if (filters?.classroomId) {
        countQuery.andWhere(qb => {
          const subQuery = qb.subQuery()
            .select("1")
            .from("parent_student", "ps")
            .innerJoin("student", "s", "s.id = ps.studentId")
            .where("ps.parentId = parent.id")
            .andWhere("s.classroomId = :classroomId", { classroomId: filters.classroomId })
            .getQuery();
          return `EXISTS (${subQuery})`;
        });
      }

      if (filters?.search) {
        const search = filters.search.trim().toLowerCase();
        const nameParts = search.split(" ").filter((p) => p.length > 0);

        if (nameParts.length === 1) {
          countQuery.andWhere("(LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search)", {
            search: `%${nameParts[0]}%`,
          });
        } else if (nameParts.length >= 2) {
          const firstWord = nameParts[0];
          const lastWord = nameParts[nameParts.length - 1];
          countQuery.andWhere(
            `(
                            (LOWER(user.firstName) LIKE :firstName AND LOWER(user.lastName) LIKE :lastName)
                            OR
                            (LOWER(user.firstName) LIKE :lastName AND LOWER(user.lastName) LIKE :firstName)
                        )`,
            { firstName: `%${firstWord}%`, lastName: `%${lastWord}%` }
          );
        }
      }

      const count = await countQuery.getCount();



      return {
        success: true,
        message: "Parents retrieved successfully",
        parents,
        pagination: { pos, delta, count },
        metadata: {
          totalParents,
          multiChildParents,
          activeParents,
        },
      };
    } catch (error: any) {
      console.error("Error fetching parents:", error);
      throw new Error("Failed to fetch parents");
    }
  }

  async softDeleteParent(parentId: number, adminSchoolId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Find parent with schoolId check to ensure it belongs to admin's school
      const parent = await this.parentRepository
        .createQueryBuilder("parent")
        .leftJoinAndSelect("parent.user", "user")
        .where("parent.id = :parentId", { parentId })
        .andWhere("parent.schoolId = :adminSchoolId", { adminSchoolId })
        .getOne();

      if (!parent) {
        return { success: false, message: "Parent not found or does not belong to your school" };
      }

      // Check if parent is already soft deleted
      if (parent.deletedAt) {
        return { success: false, message: "Parent is already deleted" };
      }

      const userId = parent.userId;

      // Soft delete the parent record (scoped to schoolId)
      await this.parentRepository.softDelete(parentId);

      // Check if user has other active parent records in other schools
      const otherActiveParents = await this.parentRepository
        .createQueryBuilder("parent")
        .where("parent.userId = :userId", { userId })
        .andWhere("parent.id != :parentId", { parentId })
        .andWhere("parent.deletedAt IS NULL")
        .getCount();

      // If no other active parent records exist, soft delete the user (set deletedAt timestamp).
      // (School membership is modeled on role tables, not the User entity.)
      if (otherActiveParents === 0) {
        const user = parent.user;
        if (user && !user.deletedAt) {
          await this.parentRepository.softDeleteUser(userId);
        }
      }

      return { success: true, message: "Parent deleted successfully" };
    } catch (error: any) {
      logger?.error?.("Error soft deleting parent:", error);
      throw new Error(error.message || "Failed to delete parent");
    }
  }

  async getParentMetrics(schoolId: number): Promise<{
    success: boolean;
    message: string;
    data: {
      totalParents: number;
      parentsWithMultipleChildren: number;
      activeParents: number;
    };
  }> {
    try {
      // Total parents with schoolId matching the user's schoolId
      const totalParents = await this.parentRepository
        .createQueryBuilder("parent")
        .where("parent.schoolId = :schoolId", { schoolId })
        .andWhere("parent.deletedAt IS NULL")
        .getCount();

      // Parents with more than one child (scoped to schoolId)
      // Using groupBy and having, then counting the results
      const parentsWithMultipleChildrenResult = await this.parentRepository
        .createQueryBuilder("parent")
        .leftJoin("parent.children", "child")
        .where("parent.schoolId = :schoolId", { schoolId })
        .andWhere("parent.deletedAt IS NULL")
        .select("parent.id")
        .groupBy("parent.id")
        .having("COUNT(child.id) > 1")
        .getRawMany();

      const parentsWithMultipleChildren = parentsWithMultipleChildrenResult.length;

      // Active parents (where user.isActive = true, scoped to schoolId)
      const activeParents = await this.parentRepository
        .createQueryBuilder("parent")
        .leftJoin("parent.user", "user")
        .where("parent.schoolId = :schoolId", { schoolId })
        .andWhere("parent.deletedAt IS NULL")
        .andWhere("user.isActive = :isActive", { isActive: true })
        .andWhere("user.deletedAt IS NULL")
        .getCount();

      return {
        success: true,
        message: "Parent metrics retrieved successfully",
        data: {
          totalParents,
          parentsWithMultipleChildren,
          activeParents,
        },
      };
    } catch (error: any) {
      logger?.error?.("Error fetching parent metrics:", error);
      throw new Error("Failed to fetch parent metrics");
    }
  }


  /**
  * Calculate attendance percentages for children based on their scheduled days
  */
  private async calculateChildrenAttendancePercentages(
    children: Student[],
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<number, number>> {
    const childrenIds = children.map((child) => child.id);
    const attendanceMap: Record<number, number> = {};

    if (childrenIds.length === 0) {
      return attendanceMap;
    }

    // Get attendance records (present + late counts)
    const attendanceStats = await AppDataSource.getRepository(Attendance)
      .createQueryBuilder("attendance")
      .select([
        "attendance.studentId as studentId",
        `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN attendance.date END) as present`,
        `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN attendance.date END) as late`,
      ])
      .where("attendance.studentId IN (:...childrenIds)", { childrenIds })
      .groupBy("attendance.studentId")
      .getRawMany();

    // Create a map of studentId to attendance counts
    const attendanceCountMap: Record<number, { present: number; late: number }> = {};
    attendanceStats.forEach((stat) => {
      attendanceCountMap[stat.studentid] = {
        present: parseInt(stat.present) || 0,
        late: parseInt(stat.late) || 0,
      };
    });

    // Calculate expected days based on schedule for each child
    children.forEach((child) => {
      const schedule = child.schedule || [];
      const calculationStartDate = startDate || (child.enrolmentDate ? new Date(child.enrolmentDate) : new Date());
      const calculationEndDate = endDate || new Date();

      const dayNameToNumber: Record<string, number> = {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6,
      };

      const scheduledDayNumbers = schedule.map(day => dayNameToNumber[day]).filter(d => d !== undefined);

      // Count expected attendance days from start to end date (no schedule = every calendar day, aligned with analytics)
      let expectedDays = 0;
      const currentDate = new Date(calculationStartDate);
      const useAllCalendarDays = schedule.length === 0 || scheduledDayNumbers.length === 0;

      while (currentDate <= calculationEndDate) {
        if (useAllCalendarDays || scheduledDayNumbers.includes(currentDate.getDay())) {
          expectedDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const counts = attendanceCountMap[child.id] || { present: 0, late: 0 };
      const attended = counts.present + counts.late;
      const percentage = expectedDays > 0 ? parseFloat(((attended / expectedDays) * 100).toFixed(2)) : 0;
      attendanceMap[child.id] = percentage;
    });

    return attendanceMap;
  }
}

export const parentService = new ParentService();
