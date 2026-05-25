import { Request, Response } from "express";
import { AppDataSource } from "../../core/config/database";
import { ActivityLog } from "../entities/ActivityLog";
import { ActivityLogPriority } from "../entities/EntityEnums";
import { Between, FindOptionsWhere } from "typeorm";
import { logger } from "../utils/logger";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export class ActivityLogController {
  /**
   * Get activity logs with pagination and filters
   * GET /api/v1/activity-logs
   */
  async getActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        pos = "0",
        delta = "10",
        userId,
        resource,
        action,
        startDate,
        endDate,
        search,
        sortBy = "createdAt",
        sortOrder = "DESC",
      } = req.query;

      // Parse pagination parameters
      const posNumber = parseInt(pos as string);
      const deltaNumber = parseInt(delta as string);

      if (isNaN(posNumber) || posNumber < 0) {
        res.status(400).json({
          success: false,
          message: "Invalid position. Must be a non-negative integer.",
        });
        return;
      }

      if (isNaN(deltaNumber) || deltaNumber < 1 || deltaNumber > 100) {
        res.status(400).json({
          success: false,
          message: "Invalid delta. Must be between 1 and 100.",
        });
        return;
      }

      // Build query filters
      const where: FindOptionsWhere<ActivityLog> = {};

      // Filter by userId
      if (userId) {
        const userIdNumber = parseInt(userId as string);
        if (!isNaN(userIdNumber)) {
          where.userId = userIdNumber;
        }
      }

      // Filter by resource
      if (resource) {
        where.resource = resource as string;
      }

      // Filter by action
      if (action) {
        where.action = action as string;
      }

      // Filter by date range
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          where.createdAt = Between(start, end);
        }
      } else if (startDate) {
        const start = new Date(startDate as string);
        if (!isNaN(start.getTime())) {
          where.createdAt = Between(start, new Date());
        }
      } else if (endDate) {
        const end = new Date(endDate as string);
        if (!isNaN(end.getTime())) {
          where.createdAt = Between(new Date(0), end);
        }
      }

      // Build query
      const activityLogRepository = AppDataSource.getRepository(ActivityLog);
      const queryBuilder = activityLogRepository.createQueryBuilder("log");

      // Only return high-priority activity logs
      queryBuilder.andWhere("log.priority = :priority", { priority: ActivityLogPriority.HIGH });

      // Apply filters
      if (where.userId) {
        queryBuilder.andWhere("log.userId = :userId", { userId: where.userId });
      }

      if (where.resource) {
        queryBuilder.andWhere("log.resource = :resource", { resource: where.resource });
      }

      if (where.action) {
        queryBuilder.andWhere("log.action = :action", { action: where.action });
      }

      if (where.createdAt) {
        const dateRange = where.createdAt as any;
        if (dateRange._type === "between") {
          queryBuilder.andWhere("log.createdAt BETWEEN :start AND :end", {
            start: dateRange._value[0],
            end: dateRange._value[1],
          });
        }
      }

      // Search in title or description
      if (search) {
        queryBuilder.andWhere("(log.title LIKE :search OR log.description LIKE :search)", {
          search: `%${search}%`,
        });
      }

      // Add sorting
      const validSortFields = ["createdAt", "resource", "action", "userId"];
      const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : "createdAt";
      const order = sortOrder === "ASC" ? "ASC" : "DESC";

      queryBuilder.orderBy(`log.${sortField}`, order);

      // Add pagination
      queryBuilder.skip(posNumber).take(deltaNumber);

      // Execute query
      const [logs, count] = await queryBuilder.getManyAndCount();

      res.status(200).json({
        success: true,
        message: "Activity logs retrieved successfully",
        logs: logs.map((log) => ({
          id: log.id,
          userId: log.userId,
          resource: log.resource,
          action: log.action,
          title: log.title,
          description: log.description,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          priority: log.priority,
          createdAt: log.createdAt,
        })),
        pagination: {
          pos: posNumber,
          delta: deltaNumber,
          count,
        },
      });
    } catch (error) {
      logger.error("Get activity logs controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve activity logs",
      });
    }
  }

  /**
   * Get activity log by ID
   * GET /api/v1/activity-logs/:id
   */
  async getActivityLogById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const logId = parseInt(id || "0");

      if (isNaN(logId)) {
        res.status(400).json({
          success: false,
          message: "Invalid activity log ID",
        });
        return;
      }

      const activityLogRepository = AppDataSource.getRepository(ActivityLog);
      const log = await activityLogRepository.findOne({
        where: { id: logId },
        relations: ["user"],
      });

      if (!log) {
        res.status(404).json({
          success: false,
          message: "Activity log not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Activity log retrieved successfully",
        log: {
          id: log.id,
          userId: log.userId,
          user: log.user
            ? {
                id: log.user.id,
                name: log.user.lastName,
                email: log.user.email,
              }
            : null,
          resource: log.resource,
          action: log.action,
          title: log.title,
          description: log.description,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          priority: log.priority,
          createdAt: log.createdAt,
        },
      });
    } catch (error) {
      logger.error("Get activity log by ID controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve activity log",
      });
    }
  }

  /**
   * Get activity log statistics
   * GET /api/v1/activity-logs/stats
   */
  async getActivityLogStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate, userId, resource } = req.query;

      const activityLogRepository = AppDataSource.getRepository(ActivityLog);
      const queryBuilder = activityLogRepository.createQueryBuilder("log");

      // Apply filters
      if (userId) {
        const userIdNumber = parseInt(userId as string);
        if (!isNaN(userIdNumber)) {
          queryBuilder.andWhere("log.userId = :userId", { userId: userIdNumber });
        }
      }

      if (resource) {
        queryBuilder.andWhere("log.resource = :resource", { resource: resource as string });
      }

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          queryBuilder.andWhere("log.createdAt BETWEEN :start AND :end", { start, end });
        }
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Get count by resource
      const byResource = await activityLogRepository
        .createQueryBuilder("log")
        .select("log.resource", "resource")
        .addSelect("COUNT(*)", "count")
        .groupBy("log.resource")
        .getRawMany();

      // Get count by action
      const byAction = await activityLogRepository
        .createQueryBuilder("log")
        .select("log.action", "action")
        .addSelect("COUNT(*)", "count")
        .groupBy("log.action")
        .getRawMany();

      // Get most active users
      const mostActiveUsers = await activityLogRepository
        .createQueryBuilder("log")
        .select("log.userId", "userId")
        .addSelect("COUNT(*)", "count")
        .where("log.userId IS NOT NULL")
        .groupBy("log.userId")
        .orderBy("count", "DESC")
        .limit(10)
        .getRawMany();

      // Get recent activity (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const recentCount = await activityLogRepository
        .createQueryBuilder("log")
        .where("log.createdAt >= :oneDayAgo", { oneDayAgo })
        .getCount();

      res.status(200).json({
        success: true,
        message: "Activity log statistics retrieved successfully",
        data: {
          total,
          last24Hours: recentCount,
          byResource: byResource.map((item) => ({
            resource: item.resource,
            count: parseInt(item.count),
          })),
          byAction: byAction.map((item) => ({
            action: item.action,
            count: parseInt(item.count),
          })),
          mostActiveUsers: mostActiveUsers.map((item) => ({
            userId: item.userId,
            activityCount: parseInt(item.count),
          })),
        },
      });
    } catch (error) {
      logger.error("Get activity log stats controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve activity log statistics",
      });
    }
  }
}

export const activityLogController = new ActivityLogController();
