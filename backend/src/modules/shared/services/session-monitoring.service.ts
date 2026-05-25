import { AppDataSource } from "../../core/config/database";
import { Session } from "../entities/Session";
import { User } from "../entities/User";
import { emailService } from "./email.service";
import { getEmailTemplateHtml } from "./email-template";
import { securityService } from "./security.service";
import { joinFrontendUrl } from "./utils";

export interface SessionWarning {
  sessionId: number;
  userId: number;
  warningType: "timeout_warning" | "new_device" | "suspicious_activity";
  message: string;
  expiresAt: Date;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  deviceBreakdown: {
    web: number;
    mobile: number;
    tablet: number;
    unknown: number;
  };
  recentLogins: number;
}

export class SessionMonitoringService {
  private sessionRepository = AppDataSource.getRepository(Session);
  private userRepository = AppDataSource.getRepository(User);
  private sessionWarnings = new Map<string, SessionWarning>();

  /**
   * Check for sessions that are about to expire and send warnings
   * Requirement 7.2: Show session timeout warning after 30 minutes of inactivity
   */
  async checkSessionTimeouts(): Promise<void> {
    try {
      const now = new Date();
      const inactivityThreshold = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      const warningThreshold = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes before expiry

      const sessions = await this.sessionRepository.find({
        where: {
          isActive: true,
        },
        relations: ["user"],
      });

      for (const session of sessions) {
        // Check for inactivity timeout warning (30 minutes)
        if (session.lastActivity <= inactivityThreshold) {
          await this.sendInactivityWarning(session);
        }

        // Check for session expiry warning (5 minutes before expiry)
        if (session.expiresAt <= warningThreshold && session.expiresAt > now) {
          await this.sendSessionTimeoutWarning(session);
        }
      }
    } catch (error) {
      console.error("Error checking session timeouts:", error);
    }
  }

  /**
   * Send inactivity warning after 30 minutes of inactivity
   */
  private async sendInactivityWarning(session: Session): Promise<void> {
    try {
      const warningKey = `${session.id}_inactivity`;

      // Don't send duplicate warnings
      if (this.sessionWarnings.has(warningKey)) {
        return;
      }

      const inactiveMinutes = Math.floor((Date.now() - session.lastActivity.getTime()) / (1000 * 60));

      const warning: SessionWarning = {
        sessionId: session.id,
        userId: session.userId,
        warningType: "timeout_warning",
        message: `You have been inactive for ${inactiveMinutes} minutes. Your session will expire soon if you don't take action.`,
        expiresAt: session.expiresAt,
      };

      this.sessionWarnings.set(warningKey, warning);

      // In a real application, you would send this via WebSocket or push notification
      console.log(`Inactivity warning for user ${session.userId}: ${warning.message}`);
    } catch (error) {
      console.error("Error sending inactivity warning:", error);
    }
  }

  /**
   * Send session timeout warning
   */
  private async sendSessionTimeoutWarning(session: Session): Promise<void> {
    try {
      const warningKey = `${session.id}_timeout`;

      // Don't send duplicate warnings
      if (this.sessionWarnings.has(warningKey)) {
        return;
      }

      const timeUntilExpiry = Math.ceil((session.expiresAt.getTime() - Date.now()) / (1000 * 60));

      const warning: SessionWarning = {
        sessionId: session.id,
        userId: session.userId,
        warningType: "timeout_warning",
        message: `Your session will expire in ${timeUntilExpiry} minutes. Please save your work.`,
        expiresAt: session.expiresAt,
      };

      this.sessionWarnings.set(warningKey, warning);

      // In a real application, you would send this via WebSocket or push notification
      console.log(`Session timeout warning for user ${session.userId}: ${warning.message}`);
    } catch (error) {
      console.error("Error sending session timeout warning:", error);
    }
  }

  /**
   * Automatically logout expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = new Date();

      const expiredSessions = await this.sessionRepository.find({
        where: {
          isActive: true,
        },
      });

      const sessionsToDeactivate = expiredSessions.filter((session) => session.expiresAt <= now);

      if (sessionsToDeactivate.length > 0) {
        const sessionIds = sessionsToDeactivate.map((s) => s.id);
        await this.sessionRepository.createQueryBuilder().update().set({ isActive: false }).whereInIds(sessionIds).execute();

        // Log automatic logouts
        for (const session of sessionsToDeactivate) {
          await securityService.logSecurityEvent({
            type: "login_failure", // Using existing type for automatic logout
            userId: session.userId,
            ipAddress: session.ipAddress || "system",
            userAgent: session.userAgent || "system",
            details: {
              eventType: "automatic_logout",
              reason: "session_expired",
              sessionId: session.id,
            },
          });
        }
      }

      return sessionsToDeactivate.length;
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
      return 0;
    }
  }

  /**
   * Send new device login notification
   * Requirement 7.5: Send security notification email when user logs in from new device
   */
  async sendNewDeviceNotification(userId: number, deviceInfo: any, ipAddress: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user?.email) return;

      // Check if this is actually a new device by comparing with recent sessions
      const isNewDevice = await this.isNewDevice(userId, deviceInfo, ipAddress);

      if (!isNewDevice) {
        return; // Don't send notification for known devices
      }

      const recipientName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : "there";
      const bodyContent = `
        <h2 style="color: #444444;">🔒 New Device Login Detected</h2>
        <p>We detected a login to your account from a new device:</p>
        <div style="background-color: #f0f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #e0eded;">
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Device:</strong> ${deviceInfo.browser || "Unknown Browser"} on ${deviceInfo.os || "Unknown OS"}</li>
            <li><strong>Device Type:</strong> ${deviceInfo.type || "Unknown"}</li>
            <li><strong>IP Address:</strong> ${ipAddress}</li>
            <li><strong>Location:</strong> ${this.getLocationFromIP(ipAddress)}</li>
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
          </ul>
        </div>
        <p><strong>If this was you:</strong> You can ignore this message. Your account is secure.</p>
        <p><strong>If this wasn't you:</strong> Your account may be compromised. Please take immediate action:</p>
        <ol>
          <li>Change your password immediately</li>
          <li>Review and terminate suspicious sessions</li>
          <li>Enable two-factor authentication if not already enabled</li>
          <li>Contact our support team</li>
        </ol>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${process.env["FRONTEND_URL"] ? joinFrontendUrl("account/sessions") : "#"}" style="background-color: #0d5c5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Manage Your Sessions</a>
        </p>
        <p style="font-size: 12px; color: #666;">This is an automated security notification.</p>
      `;
      const html = getEmailTemplateHtml({ recipientName, bodyContent });
      await emailService.sendEmail({
        to: user.email,
        subject: "New Device Login Detected - Security Alert",
        html,
      });

      // Log the security event
      await securityService.logSecurityEvent({
        type: "login_success",
        userId,
        ipAddress,
        userAgent: `${deviceInfo.browser} on ${deviceInfo.os}`,
        details: {
          eventType: "new_device_login",
          deviceInfo,
          notificationSent: true,
        },
      });

      // Create warning record
      const warning: SessionWarning = {
        sessionId: 1,
        userId,
        warningType: "new_device",
        message: `New device login: ${deviceInfo.browser || "Unknown"} on ${deviceInfo.os || "Unknown"} from ${this.getLocationFromIP(
          ipAddress
        )}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      this.sessionWarnings.set(`${userId}_new_device_${Date.now()}`, warning);
    } catch (error) {
      console.error("Error sending new device notification:", error);
    }
  }

  /**
   * Check if this is a new device for the user
   */
  private async isNewDevice(userId: number, deviceInfo: any, ipAddress: string): Promise<boolean> {
    try {
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const recentSessions = await this.sessionRepository
        .createQueryBuilder("session")
        .where("session.userId = :userId", { userId })
        .andWhere("session.createdAt >= :last30Days", { last30Days })
        .getMany();

      // Check if we've seen this combination of browser, OS, and IP before
      const deviceSignature = `${deviceInfo.browser}_${deviceInfo.os}_${ipAddress}`;
      const knownDevices = recentSessions.map((session) => `${session.deviceBrowser}_${session.deviceOs}_${session.ipAddress}`);

      return !knownDevices.includes(deviceSignature);
    } catch (error) {
      console.error("Error checking if device is new:", error);
      return true; // Err on the side of caution and send notification
    }
  }

  /**
   * Get session statistics for a user
   */
  async getUserSessionStats(userId: number): Promise<SessionStats> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const allSessions = await this.sessionRepository.find({
        where: { userId },
      });

      const activeSessions = allSessions.filter((s) => s.isActive && s.expiresAt > now);
      const expiredSessions = allSessions.filter((s) => !s.isActive || s.expiresAt <= now);
      const recentLogins = allSessions.filter((s) => s.createdAt >= last24Hours);

      const deviceBreakdown = {
        web: 0,
        mobile: 0,
        tablet: 0,
        unknown: 0,
      };

      activeSessions.forEach((session) => {
        const deviceType = session.deviceType || "unknown";
        if (deviceType in deviceBreakdown) {
          deviceBreakdown[deviceType as keyof typeof deviceBreakdown]++;
        } else {
          deviceBreakdown.unknown++;
        }
      });

      return {
        totalSessions: allSessions.length,
        activeSessions: activeSessions.length,
        expiredSessions: expiredSessions.length,
        deviceBreakdown,
        recentLogins: recentLogins.length,
      };
    } catch (error) {
      console.error("Error getting user session stats:", error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
        deviceBreakdown: { web: 0, mobile: 0, tablet: 0, unknown: 0 },
        recentLogins: 0,
      };
    }
  }

  /**
   * Get active sessions for a user with detailed information
   */
  async getUserActiveSessions(userId: number): Promise<any[]> {
    try {
      const now = new Date();

      const activeSessions = await this.sessionRepository.find({
        where: {
          userId,
          isActive: true,
        },
        order: { lastActivity: "DESC" },
      });

      return activeSessions
        .filter((session) => session.expiresAt > now)
        .map((session) => ({
          id: session.id,
          deviceType: session.deviceType,
          deviceOs: session.deviceOs,
          deviceBrowser: session.deviceBrowser,
          ipAddress: session.ipAddress,
          lastActivity: session.lastActivity,
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
          isCurrentSession: false, // This would be determined by comparing with current session
          location: this.getLocationFromIP(session.ipAddress || ""),
          timeUntilExpiry: Math.max(0, Math.ceil((session.expiresAt.getTime() - Date.now()) / (1000 * 60))),
        }));
    } catch (error) {
      console.error("Error getting user active sessions:", error);
      return [];
    }
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(sessionId: number, userId: number): Promise<boolean> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId, userId },
      });

      if (!session) {
        return false;
      }

      await this.sessionRepository.update(sessionId, { isActive: false });

      // Log session termination
      await securityService.logSecurityEvent({
        type: "login_failure", // Using existing type for manual logout
        userId,
        ipAddress: session.ipAddress || "system",
        userAgent: session.userAgent || "system",
        details: {
          eventType: "manual_session_termination",
          sessionId,
          terminatedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error("Error terminating session:", error);
      return false;
    }
  }

  /**
   * Terminate all sessions for a user except the current one
   */
  async terminateAllOtherSessions(userId: number, currentSessionId?: number): Promise<number> {
    try {
      const sessionsToTerminate = await this.sessionRepository.find({
        where: {
          userId,
          isActive: true,
        },
      });

      const filteredSessions = currentSessionId ? sessionsToTerminate.filter((s) => s.id !== currentSessionId) : sessionsToTerminate;

      if (filteredSessions.length > 0) {
        const sessionIds = filteredSessions.map((s) => s.id);
        await this.sessionRepository.createQueryBuilder().update().set({ isActive: false }).whereInIds(sessionIds).execute();

        // Log bulk session termination
        await securityService.logSecurityEvent({
          type: "login_failure", // Using existing type for bulk logout
          userId,
          ipAddress: "system",
          userAgent: "system",
          details: {
            eventType: "bulk_session_termination",
            terminatedSessions: filteredSessions.length,
            currentSessionPreserved: !!currentSessionId,
          },
        });
      }

      return filteredSessions.length;
    } catch (error) {
      console.error("Error terminating all other sessions:", error);
      return 0;
    }
  }

  /**
   * Get session warnings for a user
   */
  getSessionWarnings(userId: number): SessionWarning[] {
    const userWarnings: SessionWarning[] = [];
    const now = new Date();

    for (const [key, warning] of this.sessionWarnings.entries()) {
      if (warning.userId === userId && warning.expiresAt > now) {
        userWarnings.push(warning);
      } else if (warning.expiresAt <= now) {
        // Clean up expired warnings
        this.sessionWarnings.delete(key);
      }
    }

    return userWarnings;
  }

  /**
   * Parse device info from user agent
   */
  parseDeviceInfo(userAgent?: string): any {
    if (!userAgent) {
      return { type: "web", browser: "Unknown", os: "Unknown" };
    }

    const ua = userAgent.toLowerCase();

    // Determine device type
    let type = "web";
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      type = "mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      type = "tablet";
    }

    // Determine OS
    let os = "Unknown";
    if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("mac")) os = "macOS";
    else if (ua.includes("linux")) os = "Linux";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

    // Determine browser
    let browser = "Unknown";
    if (ua.includes("chrome")) browser = "Chrome";
    else if (ua.includes("firefox")) browser = "Firefox";
    else if (ua.includes("safari")) browser = "Safari";
    else if (ua.includes("edge")) browser = "Edge";
    else if (ua.includes("opera")) browser = "Opera";

    return { type, browser, os };
  }

  /**
   * Simple IP to location mapping (in production, use a proper geolocation service)
   */
  private getLocationFromIP(ipAddress: string): string {
    if (ipAddress === "127.0.0.1" || ipAddress === "::1" || ipAddress.startsWith("192.168.")) {
      return "Local Network";
    }

    // In production, integrate with a geolocation service like MaxMind or IP2Location
    return "Unknown Location";
  }

  /**
   * Start monitoring intervals
   */
  startMonitoring(): void {
    // Check for session timeouts every minute
    setInterval(() => {
      this.checkSessionTimeouts();
    }, 60 * 1000);

    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);

    console.log("Session monitoring started");
  }

  /**
   * Get system-wide session statistics (admin only)
   */
  async getSystemSessionStats(): Promise<any> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const totalSessions = await this.sessionRepository.count();
      const activeSessions = await this.sessionRepository.count({
        where: { isActive: true },
      });

      const recentSessions = await this.sessionRepository
        .createQueryBuilder("session")
        .where("session.createdAt >= :last24Hours", { last24Hours })
        .getCount();

      const deviceStats = await this.sessionRepository
        .createQueryBuilder("session")
        .select("session.deviceType", "deviceType")
        .addSelect("COUNT(*)", "count")
        .where("session.isActive = :isActive", { isActive: true })
        .groupBy("session.deviceType")
        .getRawMany();

      return {
        totalSessions,
        activeSessions,
        recentSessions,
        deviceStats: deviceStats.reduce((acc, stat) => {
          acc[stat.deviceType || "unknown"] = parseInt(stat.count);
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error("Error getting system session stats:", error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        recentSessions: 0,
        deviceStats: {},
      };
    }
  }
}

export const sessionMonitoringService = new SessionMonitoringService();
