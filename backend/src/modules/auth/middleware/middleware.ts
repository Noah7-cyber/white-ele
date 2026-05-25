import { Request, Response, NextFunction } from "express";
import { jwtService } from "../services/jwt.service";
import { sessionService } from "../services/session.service";
import { AppDataSource } from "../../core/config/database";
import { User } from "../../shared/entities/User";
import { AuthUser } from "../types/types";
import { AUTH_MESSAGES } from "../constants/messages";
import { UserRole } from "../../shared/entities/EntityEnums";
import { getApiV1RelativePath, isPublicApiPath, resolveRbacIntent } from "../../shared/middleware/rbac-route-registry";

export interface AuthenticatedRequest extends Omit<Request, "user"> {
  user: AuthUser;
  sessionId?: number;
}

/**
 * For non-public `/api/v1/*` routes, require a valid session the same as `authenticate`.
 * Public routes skip so anonymous clients can hit login/register/etc.
 */
export const authenticateWithSkipList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const rel = getApiV1RelativePath(req);
  if (isPublicApiPath(rel)) {
    next();
    return;
  }
  // Keep current behavior for non-RBAC routes; route-level middleware handles them.
  if (!resolveRbacIntent(req)) {
    next();
    return;
  }
  return authenticate(req, res, next);
};

/**
 * Authentication middleware
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if ((req as AuthenticatedRequest).user && req.__wpAuthenticateDone === true) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: AUTH_MESSAGES.TOKEN_REQUIRED,
      });
      return;
    }

    // Verify token
    const payload = await jwtService.verifyAccessToken(token);
    const requestedRole = payload.role;

    //build relations to load based on role
    const relations: string[] = [];
    if (requestedRole === UserRole.STAFF) relations.push('teacher');
    else if (requestedRole === UserRole.PARENT) relations.push('parent');
    else if (requestedRole === UserRole.ADMIN || requestedRole === UserRole.SUPER_ADMIN) relations.push('admin');
    else if (requestedRole === UserRole.STUDENT) relations.push('student');

    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: payload.userId },
      relations
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: AUTH_MESSAGES.USER_NOT_FOUND,
      });
      return;
    }

    const contextSchoolId =
      typeof (req as any).schoolId === "number" && !Number.isNaN((req as any).schoolId) ? (req as any).schoolId : undefined;

    // If a tenant context is explicitly provided, filter role accounts to that school only.
    // This prevents cross-school leakage and also ensures downstream code picks the correct account.
    if (typeof contextSchoolId === "number") {
      if (requestedRole === UserRole.STAFF) {
        const list = Array.isArray((user as any).teacher) ? (user as any).teacher : (user as any).teacher ? [(user as any).teacher] : [];
        (user as any).teacher = list.filter((a: any) => a?.schoolId === contextSchoolId);
      }

      if (requestedRole === UserRole.PARENT) {
        const list = Array.isArray((user as any).parent) ? (user as any).parent : (user as any).parent ? [(user as any).parent] : [];
        (user as any).parent = list.filter((a: any) => a?.schoolId === contextSchoolId);
      }

      if (requestedRole === UserRole.ADMIN || requestedRole === UserRole.SUPER_ADMIN) {
        const list = Array.isArray((user as any).admin) ? (user as any).admin : (user as any).admin ? [(user as any).admin] : [];
        (user as any).admin = list.filter((a: any) => a?.schoolId === contextSchoolId);
      }

      if (requestedRole === UserRole.STUDENT) {
        const list = Array.isArray((user as any).student) ? (user as any).student : (user as any).student ? [(user as any).student] : [];
        (user as any).student = list.filter((a: any) => a?.schoolId === contextSchoolId);
      }
    }

    const deriveSchoolId = (): number | undefined => {
      // Prefer explicitly set tenant context when present (e.g. subdomain middleware)
      if (typeof contextSchoolId === "number") return contextSchoolId;

      if (requestedRole === UserRole.STAFF) {
        const accounts = (user.teacher as any) ?? [];
        const list = Array.isArray(accounts) ? accounts : [accounts];
        const match = list.find((a) => typeof a?.schoolId === "number" && !Number.isNaN(a.schoolId));
        return match?.schoolId;
      }

      if (requestedRole === UserRole.PARENT) {
        const accounts = (user.parent as any) ?? [];
        const list = Array.isArray(accounts) ? accounts : [accounts];
        const withSchool = list.filter((a) => typeof a?.schoolId === "number" && !Number.isNaN(a.schoolId));
        const uniqueSchoolIds = Array.from(new Set(withSchool.map((a) => a.schoolId)));
        if (uniqueSchoolIds.length > 1) return undefined;
        return uniqueSchoolIds[0];
      }

      if (requestedRole === UserRole.ADMIN || requestedRole === UserRole.SUPER_ADMIN) {
        const accounts = (user.admin as any) ?? [];
        const list = Array.isArray(accounts) ? accounts : [accounts];
        const withSchool = list.filter((a) => typeof a?.schoolId === "number" && !Number.isNaN(a.schoolId));

        // If admin is associated with multiple schools and no explicit context is set,
        // require school context (subdomain / X-School-ID) to disambiguate.
        const uniqueSchoolIds = Array.from(new Set(withSchool.map((a) => a.schoolId)));
        if (uniqueSchoolIds.length > 1) return undefined;
        return uniqueSchoolIds[0];
      }

      // if (requestedRole === UserRole.STUDENT) {
      //   const accounts = (user.student as any) ?? [];
      //   const list = Array.isArray(accounts) ? accounts : [accounts];
      //   const match = list.find((a) => typeof a?.schoolId === "number" && !Number.isNaN(a.schoolId));
      //   return match?.schoolId;
      // }

      return (user as any).schoolId || undefined;
    };

    // Validate session if present
    if (payload.sessionId) {
      const session = await sessionService.validateSession(payload.sessionId);
      if (!session) {
        res.status(401).json({
          success: false,
          message: AUTH_MESSAGES.SESSION_EXPIRED,
          code: "SESSION_EXPIRED",
        });
        return;
      }
      (req as AuthenticatedRequest).sessionId = payload.sessionId;
    }

    // Attach user to request with role-specific accounts only
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      name: user.lastName,
      role: requestedRole, // Use the role from the token
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      mfaEnabled: user.mfaEnabled,
      // For staff accounts, schoolId should come from the Staff (teachers) table, not the User record.
      schoolId: deriveSchoolId(),
      staff: requestedRole === UserRole.STAFF ? (user.teacher as any) : undefined,
      parent: requestedRole === UserRole.PARENT ? (user.parent as any) : undefined,
      student: requestedRole === UserRole.STUDENT ? (user.student as any) : undefined,
      admin: requestedRole === UserRole.ADMIN || requestedRole === UserRole.SUPER_ADMIN ? (user.admin as any) : undefined
    };

    req.__wpAuthenticateDone = true;
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    let message = "Invalid or expired token";
    let code = "INVALID_TOKEN";

    if (error instanceof Error) {
      if (error.message.includes("expired")) {
        message = "Token has expired";
        code = "TOKEN_EXPIRED";
      } else if (error.message.includes("revoked")) {
        message = "Token has been revoked";
        code = "TOKEN_REVOKED";
      } else if (error.message.includes("session")) {
        message = "Session expired. Please log in again.";
        code = "SESSION_EXPIRED";
      }
    }

    res.status(401).json({
      success: false,
      message,
      code,
    });
  }
};

/**
 * Optional authentication middleware
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (token) {
      const payload = await jwtService.verifyAccessToken(token);
      const requestedRole = payload.role;

      const relations: string[] = [];
      if (requestedRole === UserRole.STAFF) relations.push('teacher');
      else if (requestedRole === UserRole.PARENT) relations.push('parent');
      else if (requestedRole === UserRole.STUDENT) relations.push('student');
      else if (requestedRole === UserRole.ADMIN || requestedRole === UserRole.SUPER_ADMIN) relations.push('admin');

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: payload.userId },
        relations
      });

      if (user && user.isActive) {
        const contextSchoolId =
          typeof (req as any).schoolId === "number" && !Number.isNaN((req as any).schoolId) ? (req as any).schoolId : undefined;

        if (typeof contextSchoolId === "number") {
          if (requestedRole === UserRole.STAFF) {
            const list = Array.isArray((user as any).teacher) ? (user as any).teacher : (user as any).teacher ? [(user as any).teacher] : [];
            (user as any).teacher = list.filter((a: any) => a?.schoolId === contextSchoolId);
          }
          if (requestedRole === UserRole.PARENT) {
            const list = Array.isArray((user as any).parent) ? (user as any).parent : (user as any).parent ? [(user as any).parent] : [];
            (user as any).parent = list.filter((a: any) => a?.schoolId === contextSchoolId);
          }
          if (requestedRole === UserRole.ADMIN || requestedRole === UserRole.SUPER_ADMIN) {
            const list = Array.isArray((user as any).admin) ? (user as any).admin : (user as any).admin ? [(user as any).admin] : [];
            (user as any).admin = list.filter((a: any) => a?.schoolId === contextSchoolId);
          }
          if (requestedRole === UserRole.STUDENT) {
            const list = Array.isArray((user as any).student) ? (user as any).student : (user as any).student ? [(user as any).student] : [];
            (user as any).student = list.filter((a: any) => a?.schoolId === contextSchoolId);
          }
        }

        const deriveSchoolId = (): number | undefined => {
          if (typeof contextSchoolId === "number") return contextSchoolId;

          if (requestedRole === UserRole.STAFF) {
            const accounts = (user.teacher as any) ?? [];
            const list = Array.isArray(accounts) ? accounts : [accounts];
            const match = list.find((a) => typeof a?.schoolId === "number" && !Number.isNaN(a.schoolId));
            return match?.schoolId;
          }

          if (requestedRole === UserRole.PARENT) {
            const accounts = (user.parent as any) ?? [];
            const list = Array.isArray(accounts) ? accounts : [accounts];
            const withSchool = list.filter((a) => typeof a?.schoolId === "number" && !Number.isNaN(a.schoolId));
            const uniqueSchoolIds = Array.from(new Set(withSchool.map((a) => a.schoolId)));
            if (uniqueSchoolIds.length > 1) return undefined;
            return uniqueSchoolIds[0];
          }

          if (requestedRole === UserRole.ADMIN || requestedRole === UserRole.SUPER_ADMIN) {
            const accounts = (user.admin as any) ?? [];
            const list = Array.isArray(accounts) ? accounts : [accounts];
            const withSchool = list.filter((a) => typeof a?.schoolId === "number" && !Number.isNaN(a.schoolId));

            const uniqueSchoolIds = Array.from(new Set(withSchool.map((a) => a.schoolId)));
            if (uniqueSchoolIds.length > 1) return undefined;
            return uniqueSchoolIds[0];
          }

          // if (requestedRole === UserRole.STUDENT) {
          //   const accounts = (user.student as any) ?? [];
          //   const list = Array.isArray(accounts) ? accounts : [accounts];
          //   const match = list.find((a) => typeof a?.schoolId === "number" && !Number.isNaN(a.schoolId));
          //   return match?.schoolId;
          // }

          return (user as any).schoolId || undefined;
        };

        (req as AuthenticatedRequest).user = {
          id: user.id,
          email: user.email || undefined,
          phone: user.phone || undefined,
          name: user.lastName,
          role: requestedRole,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          mfaEnabled: user.mfaEnabled,
          schoolId: deriveSchoolId(),
          staff: requestedRole === UserRole.STAFF ? (user.teacher as any) : undefined,
          parent: requestedRole === UserRole.PARENT ? (user.parent as any) : undefined,
          student: requestedRole === UserRole.STUDENT ? (user.student as any) : undefined,
          admin: requestedRole === UserRole.ADMIN || requestedRole === UserRole.SUPER_ADMIN ? (user.admin as any) : undefined
        };

        if (payload.sessionId) {
          (req as AuthenticatedRequest).sessionId = payload.sessionId;
        }
      }
    }
    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    next();
  }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: AUTH_MESSAGES.AUTHENTICATION_REQUIRED,
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: AUTH_MESSAGES.FORBIDDEN,
      });
      return;
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(["admin", "super_admin"]);

/**
 * Super admin only middleware
 */
export const requireSuperAdmin = requireRole(["super_admin"]);

/**
 * Agent or admin middleware
 */
export const requireAgentOrAdmin = requireRole(["agent", "admin", "super_admin"]);

/**
 * Extract device info from request
 */
export const extractDeviceInfo = (req: Request) => {
  return sessionService.parseDeviceInfo(req.headers["user-agent"], req.ip || req.connection.remoteAddress);
};

/**
 * TODO: Re-enable rate limiting at a later time
 * Rate limiting middleware (simplified version)
 */
export const rateLimit = (_type: "login" | "passwordReset" | "registration") => {
  return async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Rate limiting is currently disabled - always allow requests
    // TODO: Re-enable rate limiting logic at a later time
    next();

    /* Original rate limiting implementation - re-enable at a later time
    try {
      // Rate limiting identifier (not used in current implementation)
      // const identifier = req.body.identifier || req.body.email || req.ip || "unknown";

      // This would integrate with your rate limiting service
      // For now, we'll skip in test environment
      if (process.env["NODE_ENV"] === "test") {
        next();
        return;
      }

      // Rate limiting logic would go here
      // This is a placeholder - implement based on your needs
      next();
    } catch (error) {
      console.error("Rate limiting error:", error);
      next();
    }
    */
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Remove X-Powered-By header
  res.removeHeader("X-Powered-By");

  // Add security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Only add HSTS in production
  if (process.env["NODE_ENV"] === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      timestamp: new Date().toISOString(),
    };

    // Log only errors in production, everything in development
    if (process.env["NODE_ENV"] === "development" || res.statusCode >= 400) {
      console.log(JSON.stringify(logData));
    }
  });

  next();
};
