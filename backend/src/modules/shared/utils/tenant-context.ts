import { Request } from "express";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { inferSchoolIdFromUserPayload } from "./user-school";

/**
 * Tenant context utilities for multi-tenant data isolation
 * 
 * This module provides utilities to automatically scope database queries
 * to the authenticated user's school (tenant).
 */

/**
 * Get the schoolId from the authenticated request
 * @param req - Express request object
 * @returns The schoolId if available, undefined otherwise
 * @throws Error if schoolId is required but not available
 */
export function getSchoolId(req: Request): number | undefined {
  const authReq = req as AuthenticatedRequest;
  const direct = authReq.user?.schoolId;
  if (typeof direct === "number" && !Number.isNaN(direct)) return direct;

  const requestSchoolId = (req as any).schoolId;
  if (typeof requestSchoolId === "number" && !Number.isNaN(requestSchoolId)) {
    return requestSchoolId;
  }

  // If user has exactly one school, infer it. (Multi-school users must provide tenant context explicitly.)
  return inferSchoolIdFromUserPayload(authReq.user);
}

/**
 * Get the schoolId from the authenticated request, throwing if not available
 * Use this when schoolId is required for the operation
 * @param req - Express request object
 * @returns The schoolId
 * @throws Error if schoolId is not available
 */
export function requireSchoolId(req: Request): number {
  const schoolId = getSchoolId(req);
  if (!schoolId) {
    throw new Error("School ID is required but not available. User must be associated with a school.");
  }
  return schoolId;
}

/**
 * Check if the request has a valid school context
 * @param req - Express request object
 * @returns true if schoolId is available
 */
export function hasSchoolContext(req: Request): boolean {
  return getSchoolId(req) !== undefined;
}

/**
 * Validate that the provided schoolId matches the authenticated user's schoolId
 * Use this to prevent users from accessing data from other schools
 * @param req - Express request object
 * @param schoolId - The schoolId to validate
 * @throws Error if schoolId doesn't match the user's school
 */
export function validateSchoolAccess(req: Request, schoolId: number | null | undefined): void {
  const userSchoolId = getSchoolId(req);
  
  if (!userSchoolId) {
    throw new Error("User is not associated with a school");
  }
  
  // Only enforce tenant match when the resource is school-scoped. `null` (e.g. library templates)
  // must not be treated like `undefined` — `null !== undefined` is true in JS and would wrongly reject.
  if (schoolId != null && Number(schoolId) !== Number(userSchoolId)) {
    throw new Error("User does not belong to this school");
  }
}

