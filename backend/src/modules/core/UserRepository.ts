import { Repository } from "typeorm";
import { AppDataSource } from "./config/database";
import { User } from "../shared/entities/User";
import { ActivityLog } from "../shared/entities/ActivityLog";
import { ActivityLogEntry } from "../user/services/account.service";

export class UserRepository {
  private repository: Repository<User>;
  private activityLogRepository: Repository<ActivityLog>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
    this.activityLogRepository = AppDataSource.getRepository(ActivityLog);
  }

  async findAll(): Promise<User[]> {
    return this.repository.find({
      where: { isActive: true },
      select: ["id", "email", "firstName", "lastName", "createdAt", "updatedAt"],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.repository.findOne({
      where: { id, isActive: true },
      select: [
        "id",
        "uuid",
        "email",
        "firstName",
        "lastName",
        "middleName",
        "role",
        "isActive",
        "lastLogin",
        "phone",
        "emailVerified",
        "phoneVerified",
        "mfaEnabled",
        "enableEmailNotification",
        "enableSmsNotification",
        "enableInAppNotification",
        "createdAt",
        "updatedAt",
      ],
      relations: ["profile", "profile.country", ]// declare relationships "parent", "staff",
    });
  }     

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email, isActive: true },
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email, isActive: true },
      select: [
        "uuid",
        "email",
        "password",
        "firstName",
        "lastName",
        "middleName",
        "role",
        "emailVerified",
        "phoneVerified",
        "loginAttempts",
        "lockedUntil",
        "mfaEnabled",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.repository.findOne({
      where: { phone, isActive: true },
    });
  }

  async findByPhoneWithPassword(phone: string): Promise<User | null> {
    return this.repository.findOne({
      where: { phone, isActive: true },
      select: [
        "id",
        "email",
        "phone",
        "password",
        "firstName",
        "lastName",
        "middleName",
        "role",
        "emailVerified",
        "phoneVerified",
        "loginAttempts",
        "lockedUntil",
        "mfaEnabled",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User | null> {
    await this.repository.update(id, userData);
    // Use findOne without isActive filter since we might be updating isActive field
    return this.repository.findOne({
      where: { id },
      select: ["id", "email", "firstName", "lastName","middleName", "role", "isActive", "mfaEnabled", "lastLogin", "phone", "createdAt", "updatedAt"],
    });
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected !== 0;
  }

  async findByEmailWithMFA(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email, isActive: true },
      select: [
        "id",
        "email",
        "phone",
        "firstName",
        "lastName",
        "middleName",
        "role",
        "emailVerified",
        "phoneVerified",
        "mfaEnabled",
        "mfaSecret",
        "backupCodes",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  async findByPhoneWithMFA(phone: string): Promise<User | null> {
    return this.repository.findOne({
      where: { phone, isActive: true },
      select: [
        "id",
        "email",
        "phone",
        "firstName",
        "lastName",
        "middleName",
        "role",
        "emailVerified",
        "phoneVerified",
        "mfaEnabled",
        "mfaSecret",
        "backupCodes",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  async findByIdWithPassword(id: number): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      select: [
        "id",
        "email",
        "phone",
        "password",
        "firstName",
        "lastName",
        "middleName",
        "role",
        "emailVerified",
        "phoneVerified",
        "mfaEnabled",
        "passwordHistory",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  async findByIdWithPasswordReset(id: number): Promise<User | null> {
    return this.repository.findOne({
      where: { id, isActive: true },
      select: [
        "id",
        "email",
        "phone",
        "password",
        "firstName",
        "lastName",
        "middleName",
        "role",
        "emailVerified",
        "phoneVerified",
        "passwordHistory",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  // Account management methods

  async findInactiveUsers(cutoffDate: Date): Promise<User[]> {
    return this.repository
      .createQueryBuilder("user")
      .where("user.isActive = :isActive", { isActive: true })
      .andWhere("(user.lastLogin IS NULL OR user.lastLogin < :cutoffDate)", { cutoffDate })
      .select(["user.id", "user.email", "user.firstName", "user.lastName", "user.lastLogin"])
      .getMany();
  }

  async findDeactivatedUsers(cutoffDate: Date): Promise<User[]> {
    return this.repository
      .createQueryBuilder("user")
      .where("user.isActive = :isActive", { isActive: false })
      .andWhere("user.updatedAt < :cutoffDate", { cutoffDate })
      .select(["user.id", "user.email", "user.firstName", "user.lastName", "user.updatedAt"])
      .getMany();
  }

  async hardDelete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  // Activity log methods

  async createActivityLog(logEntry: Omit<ActivityLogEntry, "id">): Promise<ActivityLog> {
    const activityLog = this.activityLogRepository.create(logEntry);
    return this.activityLogRepository.save(activityLog);
  }

  async getUserActivityLogs(userId: number, delta: number = 10, pos: number = 0): Promise<ActivityLogEntry[]> {
    const logs = await this.activityLogRepository.find({
      where: { userId: Number(userId) },
      order: { createdAt: "DESC" },
      take: delta,
      skip: pos,
    });

    return logs.map(
      (log) =>
        ({
          id: log.id,
          userId: log.userId,
          resource: log.resource,
          action: log.action,
          title: log.title,
          description: log.description,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
        } as ActivityLogEntry)
    );
  }

  async getActivityLogs(options: {
    delta: number;
    pos: number;
    userId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ logs: ActivityLogEntry[]; count: number }> {
    const queryBuilder = this.activityLogRepository.createQueryBuilder("log");

    if (options.userId) {
      queryBuilder.andWhere("log.userId = :userId", { userId: Number(options.userId) });
    }

    if (options.action) {
      queryBuilder.andWhere("log.action = :action", { action: options.action });
    }

    if (options.startDate) {
      queryBuilder.andWhere("log.createdAt >= :startDate", { startDate: options.startDate });
    }

    if (options.endDate) {
      queryBuilder.andWhere("log.createdAt <= :endDate", { endDate: options.endDate });
    }

    const [logs, count] = await queryBuilder.orderBy("log.createdAt", "DESC").take(options.delta).skip(options.pos).getManyAndCount();

    return {
      logs: logs.map(
        (log) =>
          ({
            id: log.id,
            userId: log.userId,
            resource: log.resource,
            action: log.action,
            title: log.title,
            description: log.description,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            createdAt: log.createdAt,
          } as ActivityLogEntry)
      ),
      count,
    };
  }
}
