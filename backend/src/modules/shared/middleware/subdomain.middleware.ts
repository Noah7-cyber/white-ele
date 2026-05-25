import { Request, Response, NextFunction } from "express";
import { schoolService } from "../../school/services/school.service";
import { School } from "../entities/School";
import { AppDataSource } from "../../core/config/database";
import { Staff } from "../entities/Staff";
import { Parent } from "../entities/Parent";
import { Admin } from "../entities/Admin";
import { User } from "../entities/User";
import { UserRole } from "../entities/EntityEnums";

// Simple in-memory caches to reduce repeated DB work in the guard
const SCHOOL_CACHE_TTL_MS = 180_000;
const CONTEXT_CACHE_TTL_MS = 180_000;

const schoolCache = new Map<string, { school: School; schoolId: number; expiresAt: number }>();
const contextCache = new Map<string, { userId: number; role: UserRole; expiresAt: number }>();

/**
 * Extended Request interface to include school context
 */
export interface SchoolRequest extends Request {
  school?: School;
  schoolId?: number;
}

/**
 * Resolves school from subdomain or X-School-ID header.
 * Returns the schoolId if found.
 */
async function resolveSchoolId(req: Request): Promise<{ school?: School; schoolId?: number }> {
  const host = req.headers.host;
  const now = Date.now();

  // ## Try subdomain
  if (host) {
    const parts = host.split(".");
    let subDomain = "";

    if (host.includes("localhost") || /^\d+\.\d+\.\d+\.\d+/.test(host)) {
      if (parts.length >= 2 && parts[0] !== "localhost" && parts[0] !== "www") {
        subDomain = parts[0] as string;
      }
    } else {
      if (parts.length >= 3 && parts[0] !== "www") {
        subDomain = parts[0] as string;
      }
    }

    if (subDomain) {
      const cacheKey = `subdomain:${subDomain}`;
      const cached = schoolCache.get(cacheKey);
      if (cached && cached.expiresAt > now) {
        return { school: cached.school, schoolId: cached.schoolId };
      }

      try {
        const result = await schoolService.getSchoolBySubDomain(subDomain);
        if (result.success && result.school) {
          schoolCache.set(cacheKey, {
            school: result.school,
            schoolId: result.school.id,
            expiresAt: now + SCHOOL_CACHE_TTL_MS,
          });
          return { school: result.school, schoolId: result.school.id };
        }
      } catch (error) {
        console.error(`[SubdomainGuard] Error resolving subdomain ${subDomain}:`, error);
      }
    }
  }

  // ## Fallback: X-School-ID header
  const headerSchoolId = req.headers["school"] || req.headers["School"];
  if (headerSchoolId) {
    try {
      const schoolId = parseInt(headerSchoolId as string, 10);
      if (!isNaN(schoolId)) {
        const cacheKey = `id:${schoolId}`;
        const now2 = Date.now();
        const cached = schoolCache.get(cacheKey);
        if (cached && cached.expiresAt > now2) {
          return { school: cached.school, schoolId: cached.schoolId };
        }

        const result = await schoolService.getSchoolByIdForGuard(schoolId);
        if (result.success && result.school) {
          schoolCache.set(cacheKey, {
            school: result.school,
            schoolId: result.school.id,
            expiresAt: now2 + SCHOOL_CACHE_TTL_MS,
          });
          return { school: result.school, schoolId: result.school.id };
        }
      }
    } catch (error) {
      console.error(`[SubdomainGuard] Error resolving school from header:`, error);
    }
  }

  return {};
}

/**
 * Resolves the specific User record (and associated role account) for
 * the given identity (email/phone) within the target school context.
 */
async function resolveContextForSchool(
  identity: { email?: string; phone?: string },
  schoolId: number,
  requestedRole?: string,
): Promise<{ userId?: number; role?: UserRole } | null> {
  const cacheKey = `${identity.email || ""}|${identity.phone || ""}|${schoolId}|${requestedRole || ""}`;
  const now = Date.now();
  const cached = contextCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { userId: cached.userId, role: cached.role };
  }

  const userRepo = AppDataSource.getRepository(User);

  // Find all User records for this identity
  const whereClause = identity.email ? { email: identity.email } : { phone: identity.phone };
  const allUsers = await userRepo.find({ where: whereClause as any, select: ["id", "role"] });

  if (!allUsers.length) return null;

  const userIds = allUsers.map((u: User) => u.id);

  // Determine which role to look for
  const roleToCheck = requestedRole as UserRole | undefined;

  // Priority: if requestedRole is specified, look for that role in that school
  const rolesToSearch = roleToCheck
    ? [roleToCheck]
    : [UserRole.STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PARENT, UserRole.STUDENT];

  for (const role of rolesToSearch) {
    let match: { userId: number } | null = null;

    if (role === UserRole.STAFF) {
      const record = await AppDataSource.getRepository(Staff).findOne({
        where: userIds.map((id: number) => ({ userId: id, schoolId })) as any,
        select: ["userId"],
      });
      if (record) match = { userId: record.userId };
    } else if (role === UserRole.PARENT) {
      const record = await AppDataSource.getRepository(Parent).findOne({
        where: userIds.map((id: number) => ({ userId: id, schoolId })) as any,
        select: ["userId"],
      });
      if (record) match = { userId: record.userId };
    } else if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
      const roleUserIds = allUsers.filter((u: User) => u.role === role).map((u: User) => u.id);
      if (roleUserIds.length) {
        const record = await AppDataSource.getRepository(Admin).findOne({
          where: roleUserIds.map((id: number) => ({ userId: id, schoolId })) as any,
          select: ["userId"],
        });
        if (record) match = { userId: record.userId };
      }
    }
    // STUDENT context can be added similarly

    if (match) {
      contextCache.set(cacheKey, {
        userId: match.userId,
        role,
        expiresAt: now + CONTEXT_CACHE_TTL_MS,
      });
      return { userId: match.userId, role };
    }
  }

  return null;
}

/**
 * Middleware to resolve school based on subdomain or header, and
 * establish tenant context (school) for downstream handlers.
 *
 * Note: In this project, many routers run `authenticate` per-route.
 * To avoid fighting that middleware, this guard should NOT override `req.user.id/role`.
 */
export const subdomainGuard = async (req: Request, _res: Response, next: NextFunction) => {
  // Explicitly allow webhooks to bypass subdomain/tenant requirements
  if (req.path.startsWith("/notifications/whatsapp-webhook")) {
    return next();
  }

  // Step 1: Resolve school from subdomain or header
  const { school, schoolId } = await resolveSchoolId(req);

  if (school && schoolId) {
    (req as SchoolRequest).school = school;
    (req as SchoolRequest).schoolId = schoolId;
  }

  // Step 2: If user is authenticated and we have a school context, validate association
  // and attach the resolved school to req.user, without changing user identity/role.
  const authReq = req as any;
  const resolvedSchoolId = (req as SchoolRequest).schoolId;

  if (authReq.user && resolvedSchoolId) {
    try {
      const identity = {
        email: authReq.user.email,
        phone: authReq.user.phone,
      };

      const tokenRole = String(authReq.user.role || "");
      const headerRole = req.headers["x-role"] as string | undefined;

      // Reject attempts to override token role via X-Role.
      if (headerRole && headerRole !== tokenRole) {
        _res.status(403).json({
          success: false,
          message: "Role context mismatch.",
        });
        return;
      }

      // Always validate association using the authenticated token role.
      const requestedRole = tokenRole;

      const context = await resolveContextForSchool(identity, resolvedSchoolId, requestedRole);

      if (context) {
        // Attach resolved school context into req.user
        authReq.user.schoolId = resolvedSchoolId;
        authReq.user.school = school;
      } else {
        console.warn(`[SubdomainGuard] No association found for user in school ${resolvedSchoolId}`);
        _res.status(403).json({
          success: false,
          message: "You are not associated with this school.",
        });
        return;
      }
    } catch (error) {
      console.error(`[SubdomainGuard] Error resolving school context:`, error);
    }
  }

  next();
};
