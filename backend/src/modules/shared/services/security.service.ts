import { AppDataSource } from "../../core/config/database";
import { User } from "../entities/User";
import { Session } from "../../shared/entities/Session";
import { ActivityLog } from "../../shared/entities/ActivityLog";
import { SecurityEvent as SecurityEventEntity } from "../entities/SecurityEvent";
import { emailService } from "./email.service";
import { getEmailTemplateHtml } from "./email-template";

export interface SecurityEventInput {
  type: string;
  userId?: number;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: any;
  details?: any;
}

export interface DeviceInfo {
  type: "web" | "mobile" | "tablet" | "unknown";
  os: string;
  browser: string;
}

export class SecurityService {
  private userRepository = AppDataSource.getRepository(User);
  private sessionRepository = AppDataSource.getRepository(Session);
  private activityLogRepository = AppDataSource.getRepository(ActivityLog);
  private securityEventRepository = AppDataSource.getRepository(SecurityEventEntity);

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEventInput): Promise<void> {
    try {
      // Log to SecurityEvent entity
      const securityEvent = this.securityEventRepository.create({
        eventType: event.type,
        userId: event.userId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        deviceInfo: event.deviceInfo ? JSON.stringify(event.deviceInfo) : undefined,
        details: event.details ? JSON.stringify(event.details) : undefined,
      });
      await this.securityEventRepository.save(securityEvent);

      // Also log to ActivityLog for backward compatibility
      const activityLogData: Partial<ActivityLog> = {
        resource: "security",
        action: event.type,
        title: `Security Event: ${event.type}`,
        description: event.details ? JSON.stringify(event.details) : undefined,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        userId: event.userId,
      };

      const activityLog = this.activityLogRepository.create(activityLogData);
      await this.activityLogRepository.save(activityLog);
    } catch (error) {
      console.error("Error logging security event:", error);
    }
  }

  /**
   * Detect new device login based on device type, OS, and browser
   */
  async detectNewDeviceLogin(userId: number, deviceInfo: DeviceInfo, ipAddress: string): Promise<boolean> {
    try {
      // Check if we've seen this device type/OS/browser combination before for this user
      const existingSession = await this.sessionRepository.findOne({
        where: {
          userId,
          deviceType: deviceInfo.type as any,
          deviceOs: deviceInfo.os,
          deviceBrowser: deviceInfo.browser,
        },
      });

      const isNewDevice = !existingSession;

      if (isNewDevice) {
        // Log new device login
        await this.logSecurityEvent({
          type: "suspicious_activity",
          userId,
          ipAddress,
          userAgent: `${deviceInfo.browser} on ${deviceInfo.os}`,
          details: {
            eventType: "new_device_login",
            deviceInfo,
          },
        });

        // Send notification
        await this.sendNewDeviceNotification(userId, deviceInfo, ipAddress);
      }

      return isNewDevice;
    } catch (error) {
      console.error("Error detecting new device login:", error);
      return false;
    }
  }

  /**
   * Send new device login notification
   */
  private async sendNewDeviceNotification(userId: number, deviceInfo: DeviceInfo, ipAddress: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user?.email) return;

      const recipientName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : "there";
      const bodyContent = `
        <h2 style="color: #444444;">New Device Login</h2>
        <p>We detected a login to your account from a new device:</p>
        <ul>
          <li><strong>Device:</strong> ${deviceInfo.browser} on ${deviceInfo.os}</li>
          <li><strong>IP Address:</strong> ${ipAddress}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>If this was you, you can ignore this message. If you don't recognize this login, please:</p>
        <ol>
          <li>Change your password immediately</li>
          <li>Review your account activity</li>
          <li>Contact support if needed</li>
        </ol>
      `;
      const html = getEmailTemplateHtml({ recipientName, bodyContent });
      await emailService.sendEmail({
        to: user.email,
        subject: "New Device Login Detected",
        html,
      });
    } catch (error) {
      console.error("Error sending new device notification:", error);
    }
  }

  /**
   * Check for suspicious login patterns
   */
  async checkSuspiciousLoginPattern(identifier: string, ipAddress: string): Promise<boolean> {
    try {
      // Find user by email or phone
      let user: User | null = null;
      if (identifier.includes("@")) {
        user = await this.userRepository.findOne({ where: { email: identifier } });
      } else {
        user = await this.userRepository.findOne({ where: { phone: identifier } });
      }

      if (!user) return false;

      // Check for multiple failed logins in the last hour
      const recentFailures = await this.activityLogRepository.count({
        where: {
          userId: user.id,
          action: "login_failure",
        },
      });

      // Check for logins from multiple IPs in short time
      const recentLogins = await this.activityLogRepository.find({
        where: {
          userId: user.id,
          action: "login_success",
        },
        select: ["ipAddress"],
      });

      const uniqueIPs = new Set(recentLogins.map((log) => log.ipAddress));
      const multipleIPs = uniqueIPs.size > 3;

      const isSuspicious = recentFailures >= 5 || multipleIPs;

      if (isSuspicious) {
        await this.logSecurityEvent({
          type: "suspicious_activity",
          userId: user.id,
          ipAddress,
          userAgent: "system",
          details: {
            eventType: "suspicious_login_pattern",
            recentFailures,
            uniqueIPCount: uniqueIPs.size,
            multipleIPs,
          },
        });
      }

      return isSuspicious;
    } catch (error) {
      console.error("Error checking suspicious login pattern:", error);
      return false;
    }
  }

  /**
   * Get user security summary
   */
  async getUserSecuritySummary(userId: number): Promise<any> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      // Get recent activity
      const recentActivity = await this.activityLogRepository.find({
        where: {
          userId,
        },
        order: { createdAt: "DESC" },
        take: 10,
      });

      // Get active sessions
      const activeSessions = await this.sessionRepository.find({
        where: {
          userId,
          isActive: true,
        },
        order: { lastActivity: "DESC" },
      });

      // Count security events
      const securityEvents = await this.activityLogRepository.count({
        where: {
          userId,
          action: "suspicious_activity",
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          mfaEnabled: user.mfaEnabled,
          lastLogin: user.lastLogin,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        },
        recentActivity,
        activeSessions: activeSessions.map((session) => ({
          id: session.id,
          deviceType: session.deviceType,
          deviceOS: session.deviceOs,
          deviceBrowser: session.deviceBrowser,
          ipAddress: session.ipAddress,
          lastActivity: session.lastActivity,
          createdAt: session.createdAt,
        })),
        securityMetrics: {
          securityEventsCount: securityEvents,
          activeSessionsCount: activeSessions.length,
          mfaEnabled: user.mfaEnabled,
        },
      };
    } catch (error) {
      console.error("Error getting user security summary:", error);
      throw error;
    }
  }

  /**
   * Parse device info from user agent
   */
  parseDeviceInfo(userAgent: string): DeviceInfo {
    const ua = userAgent.toLowerCase();

    // Detect device type
    let type: DeviceInfo["type"] = "unknown";
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      type = "mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      type = "tablet";
    } else if (ua.includes("mozilla") || ua.includes("chrome") || ua.includes("safari")) {
      type = "web";
    }

    // Detect OS
    let os = "Unknown";
    if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("mac")) os = "macOS";
    else if (ua.includes("linux")) os = "Linux";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

    // Detect browser
    let browser = "Unknown";
    if (ua.includes("chrome")) browser = "Chrome";
    else if (ua.includes("firefox")) browser = "Firefox";
    else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
    else if (ua.includes("edge")) browser = "Edge";
    else if (ua.includes("opera")) browser = "Opera";

    return {
      type,
      os,
      browser,
    };
  }

  /**
   * Check if IP address is suspicious
   */
  async checkSuspiciousIP(ipAddress: string): Promise<boolean> {
    try {
      // Simple check for private/local IPs (not suspicious)
      if (ipAddress === "127.0.0.1" || ipAddress === "::1" || ipAddress.startsWith("192.168.") || ipAddress.startsWith("10.")) {
        return false;
      }

      // Check for multiple failed attempts from this IP
      const failedAttempts = await this.activityLogRepository.count({
        where: {
          ipAddress,
          action: "login_failure",
        },
      });

      return failedAttempts >= 10; // Suspicious if 10+ failed attempts in an hour
    } catch (error) {
      console.error("Error checking suspicious IP:", error);
      return false;
    }
  }
}

export const securityService = new SecurityService();
