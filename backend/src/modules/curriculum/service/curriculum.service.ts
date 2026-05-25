import { Curriculum } from "../../shared/entities/Curriculum";
import { AppDataSource } from "../../core";
import { User } from "../../shared/entities";
import { SelectQueryBuilder, ILike, IsNull } from "typeorm";
import { Classroom } from "../../shared/entities/Classroom";
import { School } from "../../shared/entities/School";
import { Subject } from "../../shared/entities/Subject";
import { Milestone } from "../../shared/entities/Milestone";
import { Assessment } from "../../shared/entities/Assessment";
import { Skills } from "../../shared/entities/EntityEnums";


export interface CreateCurriculumData {
  title: string;
  academicYear?: string;
  attachmentUrl: {
    name: string,
    url: string
  }[];
  description: string;
  schoolId: number;
  creatorId: number;
}

export interface UpdateCurriculumData {
  id: number;
  title?: string;
  description?: string;
  attachmentUrl?: {
    name: string,
    url: string
  }[];
}

export interface CurriculumFilters {
  schoolId?: number;
  isSystem?: boolean;
  pos?: number;
  delta?: number;
  search?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface CurriculumResponseData
  extends Omit<Curriculum, "creator" | "school"> {
  classIds: number[];
  creator: Pick<User, "id" | "firstName" | "lastName" | "email"> | null;
  school: Pick<School, "id" | "schoolName" | "schoolType"> | null;
  subjectCount?: number;
  subjects?: any[]; // Basic {id, name} for lists, detailed for single view
}

export interface SubjectData {
  id: number;
  name: string;
  description: string | null;
  attachments: {
    url: string;
    name: string;
  }[];
  skills: Skills[];
  milestoneCount: number;
  assessmentCount: number;
  minimumAge: number;
  maximumAge: number;
  teacher: {
    id: number;
    name: string | null;
    classrooms: { id: number; name: string }[];
  } | null;
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  curriculum?: CurriculumResponseData;
  curriculums?: CurriculumResponseData[];
  subjects?: SubjectData[];
  pagination?: {
    pos: number;
    delta: number;
    count: number;
  };
  metadata?: {
    total: number;
    templates: number;
    custom: number;
  };
}


class CurriculumService {
  private curriculumRepo = AppDataSource.getRepository(Curriculum);

  /* -------------------------------- CREATE -------------------------------- */

  async createCurriculum(data: CreateCurriculumData): Promise<ServiceResponse> {
    try {
      return await AppDataSource.transaction(async manager => {
        const creator = await manager.getRepository(User).findOne({
          where: { id: data.creatorId },
        });

        if (!creator) {
          return { success: false, message: "Creator not found" };
        }

        const existing = await manager
          .getRepository(Curriculum)
          .findOne({
            where: {
              title: ILike(data.title),
              schoolId: data.schoolId
            }
          });

        if (existing) {
          return {
            success: false,
            message: "Curriculum title already exists for this school",
          };
        }

        const curriculum = manager.create(Curriculum, {
          ...(data.academicYear ? { academicYear: data.academicYear } : {}),
          title: data.title,
          attachmentUrl: data.attachmentUrl,
          description: data.description,
          creatorId: data.creatorId,
          schoolId: data.schoolId,
        });

        const saved = await manager.save(curriculum);

        const curriculumResponse = await this.buildCurriculumResponse(saved.id, manager, true);

        return {
          success: true,
          message: "Curriculum created successfully",
          curriculum: curriculumResponse,
        };
      });
    } catch (error: any) {
      console.error("Error in createCurriculum service:", error);
      return {
        success: false,
        message: error?.message || "Failed to create curriculum",
      };
    }
  }

  /* ------------------------------- GET ALL --------------------------------- */

  async getAllCurriculums(
    filters: CurriculumFilters
  ): Promise<ServiceResponse> {
    const {
      schoolId,
      search,
      pos = 0,
      isSystem,
      delta = 10,
      sortOrder = "DESC",
    } = filters;

    const qb = this.curriculumRepo
      .createQueryBuilder("c")
      .leftJoinAndSelect("c.creator", "creator")
      .leftJoinAndSelect("c.school", "school");

    if (isSystem) {
      qb.where("c.schoolId IS NULL");
    } else {
      qb.where("c.schoolId = :schoolId", { schoolId });
    }

    if (search) {
      qb.andWhere(
        "(LOWER(c.title) LIKE LOWER(:q) OR LOWER(c.description) LIKE LOWER(:q))",
        { q: `%${search}%` }
      );
    }

    qb.orderBy("c.createdAt", sortOrder).skip(pos).take(delta);

    const [rows, count] = await qb.getManyAndCount();

    const [templatesCount, customCount] = await Promise.all([
      this.curriculumRepo
        .createQueryBuilder("c")
        .where("c.schoolId IS NULL")
        .getCount(),
      this.curriculumRepo
        .createQueryBuilder("c")
        .where("c.schoolId IS NOT NULL")
        .getCount(),
    ]);

    const responses = await Promise.all(
      rows.map(c => this.buildCurriculumResponse(c.id, undefined, true))
    );

    return {
      success: true,
      message: "Curriculums retrieved successfully",
      curriculums: responses,
      pagination: { pos, delta, count },
      metadata: {
        total: templatesCount + customCount,
        templates: templatesCount,
        custom: customCount,
      },
    };
  }

  /* ------------------------------ GET ONE ---------------------------------- */

  async getCurriculumById(
    curriculumId: number,
    schoolId: number,
    isSystem?: boolean
  ): Promise<ServiceResponse> {
    const curriculum = await this.curriculumRepo.findOne({
      where: isSystem
        ? { id: curriculumId, schoolId: IsNull() }
        : { id: curriculumId, schoolId },
      relations: ["creator", "school"],
    });

    if (!curriculum) {
      return { success: false, message: "Curriculum not found" };
    }

    return {
      success: true,
      message: "Curriculum retrieved successfully",
      curriculum: await this.buildCurriculumResponse(curriculumId, undefined, true),
    };
  }

  /* ------------------------------- UPDATE ---------------------------------- */

  async updateCurriculum(
    curriculumId: number,
    data: UpdateCurriculumData
  ): Promise<ServiceResponse> {
    return AppDataSource.transaction(async manager => {
      const curriculum = await manager.getRepository(Curriculum).findOne({
        where: { id: curriculumId },
        relations: ["subjects"] // Load existing classrooms
      });

      if (!curriculum) {
        return { success: false, message: "Curriculum not found" };
      }

      if (data.title && data.title !== curriculum.title) {
        const existing = await manager.getRepository(Curriculum).findOne({
          where: {
            title: ILike(data.title),
            schoolId: curriculum.schoolId
          }
        });
        if (existing && existing.id !== curriculum.id) {
          return {
            success: false,
            message: "Curriculum title already exists for this school"
          };
        }
      }

      curriculum.title = data.title ?? curriculum.title;
      curriculum.attachmentUrl = data.attachmentUrl ?? curriculum.attachmentUrl;
      curriculum.description = data.description ?? curriculum.description;

      await manager.save(curriculum);

      const curriculumResponse = await this.buildCurriculumResponse(curriculumId, manager, true);

      return {
        success: true,
        message: "Curriculum updated successfully",
        curriculum: curriculumResponse,
      };
    });
  }

  /* ------------------------------- DELETE ---------------------------------- */

  async deleteCurriculum(
    curriculumId: number,
    schoolId: number
  ): Promise<ServiceResponse> {
    const result = await this.curriculumRepo.delete({
      id: curriculumId,
      schoolId,
    });

    if (!result.affected) {
      return { success: false, message: "Curriculum not found" };
    }

    return { success: true, message: "Curriculum deleted successfully" };
  }

  /* ------------------------------ HELPERS ---------------------------------- */

  /**
   * Sync subjects for a curriculum:
   * - UPDATE subjects with IDs
   * - CREATE subjects without IDs
   * - DELETE subjects not in the payload
   */


  private async buildCurriculumResponse(
    curriculumId: number,
    manager?: any,
    includeDetails: boolean = false
  ): Promise<CurriculumResponseData> {
    const curriculumRepo = manager ? manager.getRepository(Curriculum) : this.curriculumRepo;

    const curriculum = await curriculumRepo.findOneOrFail({
      where: { id: curriculumId },
      relations: ["creator", "school", "classrooms"],
    });

    // Get classrooms from the many-to-many relationship
    const classes = curriculum.classrooms || [];
    const classroomIds = classes.map((c: Classroom) => {
      return {
        id: c.id,
        name: c.classroomName,
      };
    });

    // Count subjects linked to this curriculum
    const subjectCount = await (manager ? manager.getRepository(Subject) : AppDataSource.getRepository(Subject))
      .createQueryBuilder("s")
      .select("COUNT(s.id)", "count")
      .where("s.curriculumId = :curriculumId", { curriculumId })
      .getRawOne();

    // Destructure to exclude classrooms from the spread
    const { classrooms, ...curriculumData } = curriculum;

    return {
      ...curriculumData,
      classIds: classroomIds,
      creator: curriculum.creator
        ? {
          id: curriculum.creator.id,
          firstName: curriculum.creator.firstName,
          lastName: curriculum.creator.lastName,
          email: curriculum.creator.email,
        }
        : null,
      school: curriculum.school
        ? {
          id: curriculum.school.id,
          schoolName: curriculum.school.schoolName,
          schoolType: curriculum.school.schoolType,
        }
        : null,
      subjectCount: Number(subjectCount?.count ?? 0),
      subjects: includeDetails
        ? await this.getCurriculumSubjects(curriculumId, manager)
        : await this.getSubjectsWithTeacher(curriculumId, manager),
    };
  }

  private async getSubjectsWithTeacher(
    curriculumId: number,
    manager?: any
  ): Promise<any[]> {
    const subjectRepo = manager ? manager.getRepository(Subject) : AppDataSource.getRepository(Subject);
    const userRepo = manager ? manager.getRepository(User) : AppDataSource.getRepository(User);

    const subjects = await subjectRepo
      .createQueryBuilder("subject")
      .leftJoinAndSelect("subject.staffClassesAndSubject", "scs")
      .leftJoinAndSelect("scs.staff", "staff")
      .leftJoinAndSelect("staff.user", "user")
      .where("subject.curriculumId = :curriculumId", { curriculumId })
      .getMany();

    // Get unique user IDs from subjects
    const userIds = new Set<number>();
    const subjectTeacherMap = new Map<number, any>();

    for (const subject of subjects) {
      if (subject.staffClassesAndSubject && subject.staffClassesAndSubject.length > 0) {
        // Get the first teacher assigned to this subject
        const firstScs = subject.staffClassesAndSubject[0];
        if (firstScs.staff && firstScs.staff.user) {
          userIds.add(firstScs.staff.user.id);
          subjectTeacherMap.set(subject.id, firstScs.staff.user.id);
        }
      }
    }

    // Fetch all users at once
    const users = userIds.size > 0
      ? await userRepo
        .createQueryBuilder("user")
        .select(["user.id", "user.firstName", "user.lastName", "user.email", "user.phone"])
        .where("user.id IN (:...userIds)", { userIds: Array.from(userIds) })
        .getMany()
      : [];

    // Create a map for quick lookup
    const userMap = new Map<number, User>(users.map((u: User) => [u.id, u]));

    // Transform subjects to include teacher user info
    return subjects.map((subject: Subject) => {
      const result: any = {
        id: subject.id,
        name: subject.name,
        description: subject.description,
        attachments: subject.attachmentsUrl || [],
        skills: subject.skills || [],
      };

      const teacherUserId = subjectTeacherMap.get(subject.id);
      if (teacherUserId && userMap.has(teacherUserId)) {
        const teacherUser = userMap.get(teacherUserId)!;
        result.teacher = {
          id: teacherUser.id,
          firstName: teacherUser.firstName,
          lastName: teacherUser.lastName,
          email: teacherUser.email,
          phone: teacherUser.phone,
        };
      } else {
        result.teacher = null;
      }

      return result;
    });
  }

  private async getCurriculumSubjects(
    curriculumId: number,
    manager?: any
  ): Promise<SubjectData[]> {
    const subjectRepo = manager ? manager.getRepository(Subject) : AppDataSource.getRepository(Subject);

    const subjects = await subjectRepo
      .createQueryBuilder("subject")
      .leftJoinAndSelect("subject.staffClassesAndSubject", "scs")
      .leftJoinAndSelect("scs.staff", "staff")
      .leftJoinAndSelect("staff.user", "user")
      .leftJoinAndSelect("scs.classroom", "classroom")
      .where("subject.curriculumId = :curriculumId", { curriculumId })
      .getMany();

    const map = new Map<number, SubjectData>();
    const subjectIds: number[] = [];

    for (const subjectEntity of subjects) {
      const subjectDetail: SubjectData = {
        id: subjectEntity.id,
        name: subjectEntity.name,
        milestoneCount: 0,
        assessmentCount: 0,
        minimumAge: subjectEntity.minimumAge,
        maximumAge: subjectEntity.maximumAge,
        teacher: null,
        description: subjectEntity.description,
        attachments: subjectEntity.attachmentsUrl || [],
        skills: subjectEntity.skills || [],
      };

      if (subjectEntity.staffClassesAndSubject && subjectEntity.staffClassesAndSubject.length > 0) {
        const assignedTeacher = subjectEntity.staffClassesAndSubject[0];
        if (assignedTeacher.staff) {
          const classrooms: { id: number; name: string, minimumAge: number, maximumAge: number }[] = [];

          for (const row of subjectEntity.staffClassesAndSubject) {
            if (row.staff?.id === assignedTeacher.staff.id && row.classroom) {
              if (!classrooms.some((c: any) => c.id === row.classroom!.id)) {
                classrooms.push({
                  id: row.classroom.id,
                  name: row.classroom.classroomName,
                  minimumAge: row.classroom.minimumAge,
                  maximumAge: row.classroom.maximumAge,
                });
              }
            }
          }

          subjectDetail.teacher = {
            id: assignedTeacher.staff.id,
            name: assignedTeacher.staff.user
              ? `${assignedTeacher.staff.user.firstName} ${assignedTeacher.staff.user.lastName}`.trim()
              : null,
            classrooms,
          };
        }
      }

      map.set(subjectEntity.id, subjectDetail);
      subjectIds.push(subjectEntity.id);
    }

    if (subjectIds.length > 0) {
      const counts = await subjectRepo.createQueryBuilder("s")
        .where("s.id IN (:...subjectIds)", { subjectIds })
        .select("s.id", "id")
        .addSelect((subQuery: SelectQueryBuilder<any>) => {
          return subQuery
            .select("COUNT(m.id)", "count")
            .from(Milestone, "m")
            .where("m.subjectId = s.id");
        }, "milestoneCount")
        .addSelect((subQuery: SelectQueryBuilder<any>) => {
          return subQuery
            .select("COUNT(a.id)", "count")
            .from(Assessment, "a")
            .where("a.subjectId = s.id");
        }, "assessmentCount")
        .getRawMany();

      for (const row of counts) {
        const subject = map.get(Number(row.id));
        if (subject) {
          subject.milestoneCount = Number(row.milestoneCount || 0);
          subject.assessmentCount = Number(row.assessmentCount || 0);
        }
      }
    }

    return Array.from(map.values());
  }
}

export const curriculumService = new CurriculumService();
