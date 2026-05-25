import { Repository } from "typeorm";
import { AppDataSource } from "../../core/config/database";
import { Session } from "../../shared/entities/Session";
import { DeviceInfo, SessionData } from "../types/types";
import { authConfig } from "./config";

export class SessionService {
  private sessionRepository: Repository<Session>;

  constructor() {
    this.sessionRepository = AppDataSource.getRepository(Session);
  }

  /**
   * Create a new session atomically
   */
  async createSession(userId: number, deviceInfo: DeviceInfo): Promise<SessionData> {
    const expiresAt = new Date(Date.now() + authConfig.session.expiresIn * 1000);

    // Check user session limit
    await this.enforceSessionLimit(userId);

    const sessionData: any = {
      userId,
      deviceType: deviceInfo.type,
      deviceOs: deviceInfo.os,
      deviceBrowser: deviceInfo.browser,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      isActive: true,
      lastActivity: new Date(),
      expiresAt,
    };

    const session = this.sessionRepository.create(sessionData);
    const savedSession = (await this.sessionRepository.save(session)) as unknown as Session;

    return {
      id: savedSession.id,
      userId: savedSession.userId,
      deviceInfo,
      isActive: savedSession.isActive,
      lastActivity: savedSession.lastActivity,
      expiresAt: savedSession.expiresAt,
      createdAt: savedSession.createdAt,
    };
  }

  /**
   * Validate session atomically (check + update activity)
   */
  async validateSession(sessionId: number): Promise<SessionData | null> {
    // Get session from database
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, isActive: true },
    });

    if (!session || new Date() > session.expiresAt) {
      return null;
    }

    // Update last activity atomically
    const now = new Date();
    await this.sessionRepository.update(sessionId, {
      lastActivity: now,
    });

    return {
      id: sessionId,
      userId: session.userId,
      deviceInfo: {
        type: session.deviceType || "web",
        os: session.deviceOs,
        browser: session.deviceBrowser,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      },
      isActive: session.isActive,
      lastActivity: now,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    };
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(sessionId: number): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      select: ["id", "userId"],
    });

    if (!session) {
      return false;
    }

    // Update database
    const result = await this.sessionRepository.update(sessionId, {
      isActive: false,
    });

    if (result.affected === 0) {
      return false;
    }

    return true;
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllUserSessions(userId: number): Promise<number> {
    // Get all active sessions
    const sessions = await this.sessionRepository.find({
      where: { userId, isActive: true },
      select: ["id"],
    });

    if (sessions.length === 0) {
      return 0;
    }

    // Update database
    const result = await this.sessionRepository.update({ userId, isActive: true }, { isActive: false });

    return result.affected || 0;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: number): Promise<SessionData[]> {
    const sessions = await this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { lastActivity: "DESC" },
    });

    return sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      deviceInfo: {
        type: (session.deviceType || "web") as "web" | "mobile" | "tablet",
        os: session.deviceOs || undefined,
        browser: session.deviceBrowser || undefined,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
      },
      isActive: session.isActive,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    }));
  }

  /**
   * Enforce session limit per user
   */
  private async enforceSessionLimit(userId: number): Promise<void> {
    const activeSessions = await this.sessionRepository.count({
      where: { userId, isActive: true },
    });

    if (activeSessions >= authConfig.session.maxSessionsPerUser) {
      // Remove oldest sessions
      const oldestSessions = await this.sessionRepository.find({
        where: { userId, isActive: true },
        order: { lastActivity: "ASC" },
        take: activeSessions - authConfig.session.maxSessionsPerUser + 1,
        select: ["id"],
      });

      for (const session of oldestSessions) {
        await this.terminateSession(session.id);
      }
    }
  }

  /**
   * Parse device info from user agent
   */
  parseDeviceInfo(userAgent?: string, ipAddress?: string): DeviceInfo {
    const deviceInfo: DeviceInfo = {
      type: "web",
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    };

    if (!userAgent) {
      return deviceInfo;
    }

    const ua = userAgent.toLowerCase();

    // Determine device type
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      deviceInfo.type = "mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      deviceInfo.type = "tablet";
    }

    // Determine OS
    if (ua.includes("windows")) deviceInfo.os = "Windows";
    else if (ua.includes("mac")) deviceInfo.os = "macOS";
    else if (ua.includes("linux")) deviceInfo.os = "Linux";
    else if (ua.includes("android")) deviceInfo.os = "Android";
    else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) deviceInfo.os = "iOS";

    // Determine browser
    if (ua.includes("chrome")) deviceInfo.browser = "Chrome";
    else if (ua.includes("firefox")) deviceInfo.browser = "Firefox";
    else if (ua.includes("safari")) deviceInfo.browser = "Safari";
    else if (ua.includes("edge")) deviceInfo.browser = "Edge";
    else if (ua.includes("opera")) deviceInfo.browser = "Opera";

    return deviceInfo;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({ isActive: false })
      .where("expiresAt < :now", { now: new Date() })
      .andWhere("isActive = :isActive", { isActive: true })
      .execute();

    return result.affected || 0;
  }

  /**
   * Get session statistics for a user
   */
  async getUserSessionStats(userId: number): Promise<{
    totalSessions: number;
    activeSessions: number;
    deviceBreakdown: Record<string, number>;
  }> {
    const sessions = await this.sessionRepository.find({
      where: { userId },
    });

    const activeSessions = sessions.filter((s) => s.isActive && new Date() <= s.expiresAt);

    const deviceBreakdown: Record<string, number> = {};
    activeSessions.forEach((session) => {
      const deviceType = session.deviceType || "unknown";
      deviceBreakdown[deviceType] = (deviceBreakdown[deviceType] || 0) + 1;
    });

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      deviceBreakdown,
    };
  }
}

export const sessionService = new SessionService();
