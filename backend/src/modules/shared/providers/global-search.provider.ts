import { AppDataSource } from "../../core";
import { User } from "../entities/User";
import { AnnouncementStatus, StudentStatus, UserRole } from "../entities/EntityEnums";
import { SearchProvider, SearchParams, SearchResultItem } from "../types/global-search.types";
import { Announcement } from "../entities/Announcement";
import { Assessment } from "../entities/Assessment";
import { Classroom } from "../entities/Classroom";
import { StaffClassesAndSubject } from "../entities/StaffClassesAndSubject";
import { Curriculum } from "../entities/Curriculum";
import { Milestone } from "../entities/Milestone";
import { Parent } from "../entities/Parent";
import { Staff } from "../entities/Staff";
import { Student } from "../entities/StudentEntity";
import { Subject } from "../entities/Subject";

const applySearchFilter = (q: string) => `%${q}%`;

export const adminsProvider: SearchProvider = {
  id: "admin",
  async search({ q, user: _user, schoolId, limit, offset }: SearchParams) {
    const repo = AppDataSource.getRepository(User);
    const baseQuery = repo
      .createQueryBuilder("user")
      .leftJoin("user.profile", "profile")
      .where("user.schoolId = :schoolId", { schoolId })
      .andWhere("user.deletedAt IS NULL")
      .andWhere("user.role IN (:...roles)", {
        roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      });

    baseQuery.andWhere(
      "(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.phone) LIKE LOWER(:search))",
      { search: applySearchFilter(q) }
    );

    const total = await baseQuery.getCount();

    const idRows = await baseQuery
      .select("user.id", "user_id")
      .groupBy("user.id")
      .addGroupBy("user.createdAt")
      .orderBy("user.createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getRawMany();

    const userIds = idRows.map((row: any) => row.user_id);
    if (userIds.length === 0) {
      return { providerId: "admin", items: [], total: 0 };
    }

    const qb = repo
      .createQueryBuilder("user")
      .leftJoin("user.profile", "profile")
      .where("user.id IN (:...userIds)", { userIds })
      .select([
        "user.id AS user_id",
        "user.firstName AS user_firstname",
        "user.lastName AS user_lastname",
        "user.email AS user_email",
        "user.phone AS user_phone",
        "user.role AS user_role",
        "profile.photo AS profile_photo",
        "user.createdAt AS user_createdAt",
      ])
      .orderBy("user.createdAt", "DESC");

    const rows = await qb.getRawMany();
    const itemMap = new Map<number, SearchResultItem>();

    rows.forEach((row: any) => {
      if (itemMap.has(row.user_id)) return;

      const display = {
        firstName: row.user_firstname || "",
        lastName: row.user_lastname || "",
        email: row.user_email || "",
        role: row.user_role || "",
        phone: row.user_phone || null,
        profileUrl: row.profile_photo || null,
      };

      itemMap.set(row.user_id, {
        type: "admin",
        id: row.user_id,
        display,
        timestamp: row.user_createdAt?.toISOString?.() ?? row.user_createdAt,
      });
    });

    return { providerId: "admin", items: Array.from(itemMap.values()).slice(0, limit), total };
  },
};

export const announcementsProvider: SearchProvider = {
  id: "announcement",
  async search({ q, user, schoolId, limit, offset }: SearchParams) {
    const repo = AppDataSource.getRepository(Announcement);
    const baseQuery = repo
      .createQueryBuilder("announcement")
      .where("announcement.schoolId = :schoolId", { schoolId })
      .andWhere("announcement.deletedAt IS NULL");

    if (user.role === "parent" || user.role === "student") {
      baseQuery.andWhere("announcement.announcementStatus = :status", {
        status: AnnouncementStatus.PUBLISHED,
      });
    }

    if (user.role === "staff") {
      baseQuery.andWhere("announcement.announcementStatus != :deletedStatus", {
        deletedStatus: AnnouncementStatus.DELETED,
      });
    }

    baseQuery.andWhere(
      "(LOWER(announcement.subject) LIKE LOWER(:search) OR LOWER(announcement.content) LIKE LOWER(:search))",
      { search: applySearchFilter(q) }
    );

    const total = await baseQuery.getCount();

    const idRows = await baseQuery
      .select("announcement.id", "announcement_id")
      .groupBy("announcement.id")
      .addGroupBy("announcement.createdAt")
      .orderBy("announcement.createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getRawMany();

    const announcementIds = idRows.map((row: any) => row.announcement_id);
    if (announcementIds.length === 0) {
      return { providerId: "announcement", items: [], total: 0 };
    }

    const qb = repo
      .createQueryBuilder("announcement")
      .where("announcement.id IN (:...announcementIds)", { announcementIds })
      .select([
        "announcement.id AS id",
        "announcement.subject AS name",
        "announcement.announcementStatus AS status",
        "announcement.createdAt AS createdAt",
      ])
      .orderBy("announcement.createdAt", "DESC");

    const rows = await qb.getRawMany();
    const items: SearchResultItem[] = rows.map((row) => ({
      type: "announcement",
      id: row.id,
      display: {
        name: row.name,
      },
      timestamp: row.createdAt?.toISOString?.() ?? row.createdAt,
    }));

    return { providerId: "announcement", items, total };
  },
};

export const assessmentsProvider: SearchProvider = {
  id: "assessment",
  async search({ q, user, schoolId, limit, offset }: SearchParams) {
    const repo = AppDataSource.getRepository(Assessment);
    const baseQuery = repo
      .createQueryBuilder("assessment")
      .leftJoin("assessment.subject", "subject")
      .where("assessment.schoolId = :schoolId", { schoolId });

    if (user.role === "staff") {
      if (user.staffId) {
        baseQuery.andWhere("assessment.staffId = :staffId", { staffId: user.staffId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    if (user.role === "parent") {
      if (user.parentId) {
        baseQuery
          .innerJoin("assessment.classrooms", "classroom")
          .innerJoin("classroom.studentsCurrentClass", "student")
          .innerJoin("student.parents", "parent")
          .andWhere("parent.id = :parentId", { parentId: user.parentId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    baseQuery.andWhere(
      "(assessment.title ILIKE :search OR subject.name ILIKE :search)",
      { search: applySearchFilter(q) }
    );

    const total = await baseQuery.getCount();

    const idRows = await baseQuery
      .select("assessment.id", "assessment_id")
      .groupBy("assessment.id")
      .addGroupBy("assessment.createdAt")
      .orderBy("assessment.createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getRawMany();

    const assessmentIds = idRows.map((row: any) => row.assessment_id);
    if (assessmentIds.length === 0) {
      return { providerId: "assessment", items: [], total: 0 };
    }

    const qb = repo
      .createQueryBuilder("assessment")
      .where("assessment.id IN (:...assessmentIds)", { assessmentIds })
      .select([
        "assessment.id AS id",
        "assessment.title AS name",
        "assessment.createdAt AS createdAt",
      ])
      .orderBy("assessment.createdAt", "DESC");

    const rows = await qb.getRawMany();
    const items: SearchResultItem[] = rows.map((row) => ({
      type: "assessment",
      id: row.id,
      display: {
        name: row.name,
      },
      timestamp: row.createdAt?.toISOString?.() ?? row.createdAt,
    }));

    return { providerId: "assessment", items, total };
  },
};

export const classroomsProvider: SearchProvider = {
  id: "classroom",
  async search({ q, user, schoolId, limit, offset }: SearchParams) {
    const repo = AppDataSource.getRepository(Classroom);
    const baseQuery = repo
      .createQueryBuilder("classroom")
      .leftJoin("classroom.studentsCurrentClass", "student")
      .leftJoin("student.parents", "parent")
      .where("classroom.schoolId = :schoolId", { schoolId })
      .andWhere("classroom.deletedAt IS NULL");

    if (user.role === "staff") {
      if (user.staffId) {
        baseQuery
          .leftJoin(StaffClassesAndSubject, "scs", "scs.classroomId = classroom.id")
          .andWhere("scs.staffId = :staffId", { staffId: user.staffId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    if (user.role === "parent") {
      if (user.parentId) {
        baseQuery.andWhere("parent.id = :parentId", { parentId: user.parentId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    baseQuery.andWhere(
      "(LOWER(classroom.classroomName) LIKE LOWER(:search) OR LOWER(classroom.description) LIKE LOWER(:search))",
      { search: applySearchFilter(q) }
    );

    const totalQuery = repo
      .createQueryBuilder("classroom")
      .select("COUNT(DISTINCT classroom.id)", "count")
      .leftJoin("classroom.studentsCurrentClass", "student")
      .leftJoin("student.parents", "parent")
      .where("classroom.schoolId = :schoolId", { schoolId })
      .andWhere("classroom.deletedAt IS NULL");

    if (user.role === "staff") {
      if (user.staffId) {
        totalQuery
          .leftJoin(StaffClassesAndSubject, "scs", "scs.classroomId = classroom.id")
          .andWhere("scs.staffId = :staffId", { staffId: user.staffId });
      } else {
        totalQuery.andWhere("1 = 0");
      }
    }

    if (user.role === "parent") {
      if (user.parentId) {
        totalQuery.andWhere("parent.id = :parentId", { parentId: user.parentId });
      } else {
        totalQuery.andWhere("1 = 0");
      }
    }

    totalQuery.andWhere(
      "(LOWER(classroom.classroomName) LIKE LOWER(:search) OR LOWER(classroom.description) LIKE LOWER(:search))",
      { search: applySearchFilter(q) }
    );

    const totalRes = await totalQuery.getRawOne();
    const total = parseInt(totalRes?.count || "0", 10);

    const idRows = await baseQuery
      .select("classroom.id", "classroom_id")
      .groupBy("classroom.id")
      .addGroupBy("classroom.createdAt")
      .orderBy("classroom.createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getRawMany();

    const classroomIds = idRows.map((row: any) => row.classroom_id);
    if (classroomIds.length === 0) {
      return { providerId: "classroom", items: [], total: 0 };
    }

    const qb = repo
      .createQueryBuilder("classroom")
      .where("classroom.id IN (:...classroomIds)", { classroomIds })
      .select([
        "classroom.id AS id",
        "classroom.classroomName AS name",
        "classroom.createdAt AS createdAt",
      ])
      .orderBy("classroom.createdAt", "DESC");

    const rows = await qb.getRawMany();
    const items: SearchResultItem[] = rows.map((row) => ({
      type: "classroom",
      id: row.id,
      display: {
        name: row.name,
      },
      timestamp: row.createdAt?.toISOString?.() ?? row.createdAt,
    }));

    return { providerId: "classroom", items, total };
  },
};

export const curriculumsProvider: SearchProvider = {
  id: "curriculum",
  async search({ q, user, schoolId, limit, offset }: SearchParams) {
    const repo = AppDataSource.getRepository(Curriculum);
    const baseQuery = repo
      .createQueryBuilder("curriculum")
      .where("curriculum.schoolId = :schoolId", { schoolId });

    if (user.role === "staff") {
      if (user.staffId) {
        baseQuery
          .leftJoin("curriculum.classrooms", "classroom")
          .leftJoin(StaffClassesAndSubject, "scs", "scs.classroomId = classroom.id")
          .andWhere("scs.staffId = :staffId", { staffId: user.staffId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    if (user.role === "parent") {
      if (user.parentId) {
        baseQuery
          .innerJoin("curriculum.classrooms", "classroom")
          .innerJoin("classroom.studentsCurrentClass", "student")
          .innerJoin("student.parents", "parent")
          .andWhere("parent.id = :parentId", { parentId: user.parentId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    baseQuery.andWhere(
      "(LOWER(curriculum.title) LIKE LOWER(:search) OR LOWER(curriculum.description) LIKE LOWER(:search))",
      { search: applySearchFilter(q) }
    );

    const total = await baseQuery.getCount();

    const idRows = await baseQuery
      .select("curriculum.id", "curriculum_id")
      .groupBy("curriculum.id")
      .addGroupBy("curriculum.createdAt")
      .orderBy("curriculum.createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getRawMany();

    const curriculumIds = idRows.map((row: any) => row.curriculum_id);
    if (curriculumIds.length === 0) {
      return { providerId: "curriculum", items: [], total: 0 };
    }

    const qb = repo
      .createQueryBuilder("curriculum")
      .where("curriculum.id IN (:...curriculumIds)", { curriculumIds })
      .select([
        "curriculum.id AS id",
        "curriculum.title AS name",
        "curriculum.createdAt AS createdAt",
      ])
      .orderBy("curriculum.createdAt", "DESC");

    const rows = await qb.getRawMany();
    const items: SearchResultItem[] = rows.map((row) => ({
      type: "curriculum",
      id: row.id,
      display: {
        name: row.name,
      },
      timestamp: row.createdAt?.toISOString?.() ?? row.createdAt,
    }));

    return { providerId: "curriculum", items, total };
  },
};

export const milestonesProvider: SearchProvider = {
  id: "milestone",
  async search({ q, user, schoolId, limit, offset }: SearchParams) {
    const repo = AppDataSource.getRepository(Milestone);
    const baseQuery = repo
      .createQueryBuilder("milestone")
      .where("milestone.schoolId = :schoolId", { schoolId });

    if (user.role === "staff") {
      if (user.staffId) {
        baseQuery
          .leftJoin("milestone.subject", "subject")
          .leftJoin("subject.staffClassesAndSubject", "scs")
          .andWhere("scs.staffId = :staffId", { staffId: user.staffId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    if (user.role === "parent") {
      if (user.parentId) {
        baseQuery
          .innerJoin("milestone.assessment", "assessment")
          .innerJoin("assessment.classrooms", "classroom")
          .innerJoin("classroom.studentsCurrentClass", "student")
          .innerJoin("student.parents", "parent")
          .andWhere("parent.id = :parentId", { parentId: user.parentId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    baseQuery.andWhere("(milestone.title ILIKE :search OR milestone.description ILIKE :search)", {
      search: applySearchFilter(q),
    });

    const total = await baseQuery.getCount();

    const idRows = await baseQuery
      .select("milestone.id", "milestone_id")
      .groupBy("milestone.id")
      .orderBy("milestone.id", "DESC")
      .limit(limit)
      .offset(offset)
      .getRawMany();

    const milestoneIds = idRows.map((row: any) => row.milestone_id);
    if (milestoneIds.length === 0) {
      return { providerId: "milestone", items: [], total: 0 };
    }

    const qb = repo
      .createQueryBuilder("milestone")
      .where("milestone.id IN (:...milestoneIds)", { milestoneIds })
      .select([
        "milestone.id AS id",
        "milestone.title AS name",
      ])
      .orderBy("milestone.id", "DESC");

    const rows = await qb.getRawMany();
    const items: SearchResultItem[] = rows.map((row) => ({
      type: "milestone",
      id: row.id,
      display: {
        name: row.name,
      },
      timestamp: undefined,
    }));

    return { providerId: "milestone", items, total };
  },
};

export const parentsProvider: SearchProvider = {
  id: "parent",
  async search({ q, user, schoolId, limit, offset }: SearchParams) {
    const repo = AppDataSource.getRepository(Parent);
    const baseQuery = repo
      .createQueryBuilder("parent")
      .leftJoin("parent.user", "user")
      .where("parent.schoolId = :schoolId", { schoolId })
      .andWhere("parent.deletedAt IS NULL")
      .andWhere("user.deletedAt IS NULL");

    if (user.role === "parent") {
      if (user.parentId) {
        baseQuery.andWhere("parent.id = :parentId", { parentId: user.parentId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    baseQuery.andWhere(
      "(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.phone) LIKE LOWER(:search))",
      { search: applySearchFilter(q) }
    );

    const total = await baseQuery.getCount();

    const idRows = await baseQuery
      .select("parent.id", "parent_id")
      .groupBy("parent.id")
      .addGroupBy("parent.createdAt")
      .orderBy("parent.createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getRawMany();

    const parentIds = idRows.map((row: any) => row.parent_id);
    if (parentIds.length === 0) {
      return { providerId: "parent", items: [], total: 0 };
    }

    const qb = repo
      .createQueryBuilder("parent")
      .leftJoin("parent.user", "user")
      .leftJoin("user.profile", "profile")
      .where("parent.id IN (:...parentIds)", { parentIds })
      .select([
        "parent.id AS parent_id",
        "user.firstName AS user_firstname",
        "user.lastName AS user_lastname",
        "user.email AS user_email",
        "user.phone AS user_phone",
        "user.role AS user_role",
        "profile.photo AS profile_photo",
        "parent.createdAt AS parent_createdAt",
      ])
      .distinct(true)
      .orderBy("parent.createdAt", "DESC");

    const rows = await qb.getRawMany();
    const itemMap = new Map<number, SearchResultItem>();

    rows.forEach((row: any) => {
      if (itemMap.has(row.parent_id)) return;

      const display = {
        firstName: row.user_firstname || "",
        lastName: row.user_lastname || "",
        email: row.user_email || "",
        role: row.user_role || "",
        phone: row.user_phone || null,
        profileUrl: row.profile_photo || null,
      };

      itemMap.set(row.parent_id, {
        type: "parent",
        id: row.parent_id,
        display,
        timestamp: row.parent_createdAt?.toISOString?.() ?? row.parent_createdAt,
      });
    });

    return { providerId: "parent", items: Array.from(itemMap.values()).slice(0, limit), total };
  },
};

export const staffProvider: SearchProvider = {
  id: "staff",
  async search({ q, user, schoolId, limit, offset }: SearchParams) {
    const repo = AppDataSource.getRepository(Staff);
    const baseQuery = repo
      .createQueryBuilder("teacher")
      .leftJoin("teacher.user", "user")
      .where("teacher.schoolId = :schoolId", { schoolId })
      .andWhere("teacher.deletedAt IS NULL")
      .andWhere("user.deletedAt IS NULL");

    if (user.role === "staff") {
      if (user.staffId) {
        baseQuery.andWhere("teacher.id = :staffId", { staffId: user.staffId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    if (user.role === "parent") {
      baseQuery.andWhere("1 = 0");
    }

    baseQuery.andWhere(
      "(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(user.middleName) LIKE LOWER(:search) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:search) OR LOWER(teacher.staffRole) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.phone) LIKE LOWER(:search))",
      { search: applySearchFilter(q) }
    );

    const total = await baseQuery.getCount();

    const idRows = await baseQuery
      .select("teacher.id", "staff_id")
      .groupBy("teacher.id")
      .addGroupBy("teacher.createdAt")
      .orderBy("teacher.createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getRawMany();

    const staffIds = idRows.map((row: any) => row.staff_id);
    if (staffIds.length === 0) {
      return { providerId: "staff", items: [], total: 0 };
    }

    const qb = repo
      .createQueryBuilder("teacher")
      .leftJoin("teacher.user", "user")
      .leftJoin("user.profile", "profile")
      .where("teacher.id IN (:...staffIds)", { staffIds })
      .select([
        "teacher.id AS staff_id",
        "teacher.staffRole AS staff_role",
        "teacher.status AS staff_status",
        "teacher.createdAt AS staff_createdAt",
        "user.firstName AS user_firstname",
        "user.lastName AS user_lastname",
        "user.email AS user_email",
        "user.phone AS user_phone",
        "user.role AS user_role",
        "profile.photo AS profile_photo",
      ])
      .distinct(true)
      .orderBy("teacher.createdAt", "DESC");

    const rows = await qb.getRawMany();
    const itemMap = new Map<number, SearchResultItem>();

    rows.forEach((row: any) => {
      if (itemMap.has(row.staff_id)) return;


      const display = {
        firstName: row.user_firstname || "",
        lastName: row.user_lastname || "",
        email: row.user_email || "",
        role: row.user_role || "",
        phone: row.user_phone || null,
        profileUrl: row.profile_photo || null,
      };

      itemMap.set(row.staff_id, {
        type: "staff",
        id: row.staff_id,
        display,
        timestamp: row.staff_createdAt?.toISOString?.() ?? row.staff_createdAt,
      });
    });

    return { providerId: "staff", items: Array.from(itemMap.values()).slice(0, limit), total };
  },
};

export const studentsProvider: SearchProvider = {
  id: "student",
  async search({ q, user, schoolId, limit, offset }: SearchParams) {
    const repo = AppDataSource.getRepository(Student);
    const baseQuery = repo
      .createQueryBuilder("student")
      .leftJoin("student.user", "user")
      .where("student.schoolId = :schoolId", { schoolId })
      .andWhere("student.deletedAt IS NULL")
      .andWhere("user.deletedAt IS NULL");

    if (user.role === "staff") {
      baseQuery.andWhere("student.status NOT IN (:...blockedStatuses)", {
        blockedStatuses: [StudentStatus.SUSPENDED, StudentStatus.EXPEL],
      });
      if (user.staffId) {
        baseQuery
          .innerJoin(StaffClassesAndSubject, "scs", "scs.classroomId = student.classroomId")
          .andWhere("scs.staffId = :staffId", { staffId: user.staffId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    if (user.role === "parent") {
      baseQuery.andWhere("student.status NOT IN (:...blockedStatuses)", {
        blockedStatuses: [StudentStatus.SUSPENDED, StudentStatus.EXPEL],
      });
      if (user.parentId) {
        baseQuery
          .innerJoin("student.parents", "parent")
          .andWhere("parent.id = :parentId", { parentId: user.parentId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    baseQuery.andWhere(
      "(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(user.middleName) LIKE LOWER(:search) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:search) OR LOWER(student.admissionNumber) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.phone) LIKE LOWER(:search))",
      { search: applySearchFilter(q) }
    );

    const total = await baseQuery.getCount();

    const idRows = await baseQuery
      .select("student.id", "student_id")
      .groupBy("student.id")
      .addGroupBy("student.createdAt")
      .orderBy("student.createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getRawMany();

    const studentIds = idRows.map((row: any) => row.student_id);
    if (studentIds.length === 0) {
      return { providerId: "student", items: [], total: 0 };
    }

    const qb = repo
      .createQueryBuilder("student")
      .leftJoin("student.user", "user")
      .leftJoin("user.profile", "profile")
      .where("student.id IN (:...studentIds)", { studentIds })
      .orderBy("student.createdAt", "DESC");

    qb.select([
      "student.id AS student_id",
      "student.status AS student_status",
      "student.admissionNumber AS student_reference",
      "student.createdAt AS student_createdAt",
      "user.firstName AS user_firstname",
      "user.lastName AS user_lastname",
      "user.email AS user_email",
      "user.phone AS user_phone",
      "user.role AS user_role",
      "profile.photo AS profile_photo",
    ]);

    const rows = await qb.getRawMany();
    const itemMap = new Map<number, SearchResultItem>();

    rows.forEach((row: any) => {
      if (itemMap.has(row.student_id)) return;

      const display = {
        firstName: row.user_firstname || "",
        lastName: row.user_lastname || "",
        email: row.user_email || "",
        role: row.user_role || "",
        phone: row.user_phone || null,
        profileUrl: row.profile_photo || null,
      };

      itemMap.set(row.student_id, {
        type: "student",
        id: row.student_id,
        display,
        timestamp: row.student_createdAt?.toISOString?.() ?? row.student_createdAt,
      });
    });

    return { providerId: "student", items: Array.from(itemMap.values()).slice(0, limit), total };
  },
};

export const subjectsProvider: SearchProvider = {
  id: "subject",
  async search({ q, user, schoolId, limit, offset }: SearchParams) {
    const repo = AppDataSource.getRepository(Subject);
    const baseQuery = repo
      .createQueryBuilder("subject")
      .leftJoin("subject.curriculum", "curriculum")
      .where("curriculum.schoolId = :schoolId", { schoolId });

    if (user.role === "staff") {
      if (user.staffId) {
        baseQuery
          .leftJoin("subject.staffClassesAndSubject", "scs")
          .andWhere("scs.staffId = :staffId", { staffId: user.staffId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    if (user.role === "parent") {
      if (user.parentId) {
        baseQuery
          .innerJoin("subject.staffClassesAndSubject", "scs")
          .innerJoin("scs.classroom", "classroom")
          .innerJoin("classroom.studentsCurrentClass", "student")
          .innerJoin("student.parents", "parent")
          .andWhere("parent.id = :parentId", { parentId: user.parentId });
      } else {
        baseQuery.andWhere("1 = 0");
      }
    }

    baseQuery.andWhere("(subject.name ILIKE :search OR subject.description ILIKE :search)", {
      search: applySearchFilter(q),
    });

    const total = await baseQuery.getCount();

    const idRows = await baseQuery
      .select("subject.id", "subject_id")
      .groupBy("subject.id")
      .addGroupBy("subject.createdAt")
      .orderBy("subject.createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getRawMany();

    const subjectIds = idRows.map((row: any) => row.subject_id);
    if (subjectIds.length === 0) {
      return { providerId: "subject", items: [], total: 0 };
    }

    const qb = repo
      .createQueryBuilder("subject")
      .where("subject.id IN (:...subjectIds)", { subjectIds })
      .select([
        "subject.id AS id",
        "subject.name AS name",
        "subject.createdAt AS createdAt",
      ])
      .orderBy("subject.createdAt", "DESC");

    const rows = await qb.getRawMany();
    const items: SearchResultItem[] = rows.map((row) => ({
      type: "subject",
      id: row.id,
      display: {
        name: row.name,
      },
      timestamp: row.createdAt?.toISOString?.() ?? row.createdAt,
    }));

    return { providerId: "subject", items, total };
  },
};
