import { EntityManager } from "typeorm";
import { Admin } from "../entities/Admin";
import { Parent } from "../entities/Parent";
import { Staff } from "../entities/Staff";
import { Student } from "../entities/StudentEntity";
import { User } from "../entities/User";
import { UserRole } from "../entities/EntityEnums";

export type UserRoleAndSchoolId = { role: UserRole; schoolId: number | null };
export type UserRoleAndSchoolIds = { role: UserRole; schoolIds: number[] };

function isValidSchoolId(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function pickSchoolIds(value: unknown): number[] {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  const ids = list
    .map((rec) => (rec as any)?.schoolId)
    .filter((id): id is number => isValidSchoolId(id));
  return Array.from(new Set(ids));
}

/**
 * Best-effort schoolId inference from a hydrated AuthUser/user payload.
 * This is sync and does not hit the database.
 */
export function inferSchoolIdFromUserPayload(user: any): number | undefined {
  const ids = inferSchoolIdsFromUserPayload(user);
  return ids.length === 1 ? ids[0] : undefined;
}

/**
 * Best-effort schoolIds inference from a hydrated AuthUser/user payload.
 * This is sync and does not hit the database.
 */
export function inferSchoolIdsFromUserPayload(user: any): number[] {
  if (!user) return [];
  if (isValidSchoolId(user.schoolId)) return [user.schoolId];

  const role: UserRole | undefined = user.role;
  if (!role) return [];

  if (role === UserRole.STAFF) return pickSchoolIds(user.staff ?? user.teacher);
  if (role === UserRole.PARENT) return pickSchoolIds(user.parent);
  if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) return pickSchoolIds(user.admin);
  if (role === UserRole.STUDENT) return pickSchoolIds(user.student);

  return [];
}

export async function getSchoolIdForRole(
  manager: EntityManager,
  userId: number,
  role: UserRole
): Promise<number | null> {
  const ids = await getSchoolIdsForRole(manager, userId, role);
  return ids.length === 1 ? ids[0] ?? null : null;
}

export async function getSchoolIdsForRole(
  manager: EntityManager,
  userId: number,
  role: UserRole
): Promise<number[]> {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.SUPER_ADMIN: {
      const rows = await manager.find(Admin, { where: { userId }, select: { schoolId: true } });
      return Array.from(
        new Set(rows.map((r) => r.schoolId).filter((id): id is number => isValidSchoolId(id)))
      );
    }
    case UserRole.STAFF: {
      const rows = await manager.find(Staff, { where: { userId }, select: { schoolId: true } });
      return Array.from(
        new Set(rows.map((r) => r.schoolId).filter((id): id is number => isValidSchoolId(id)))
      );
    }
    case UserRole.PARENT: {
      const rows = await manager.find(Parent, { where: { userId }, select: { schoolId: true } });
      return Array.from(
        new Set(rows.map((r) => r.schoolId).filter((id): id is number => isValidSchoolId(id)))
      );
    }
    case UserRole.STUDENT: {
      const rows = await manager.find(Student, { where: { userId }, select: { schoolId: true } });
      return Array.from(
        new Set(rows.map((r) => r.schoolId).filter((id): id is number => isValidSchoolId(id)))
      );
    }
    default:
      return [];
  }
}

export async function getUserRoleAndSchoolId(
  manager: EntityManager,
  userId: number
): Promise<UserRoleAndSchoolId | null> {
  const info = await getUserRoleAndSchoolIds(manager, userId);
  if (!info) return null;
  return { role: info.role, schoolId: info.schoolIds.length === 1 ? info.schoolIds[0] ?? null : null };
}

export async function getUserRoleAndSchoolIds(
  manager: EntityManager,
  userId: number
): Promise<UserRoleAndSchoolIds | null> {
  const user = await manager.findOne(User, {
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return null;

  const schoolIds = await getSchoolIdsForRole(manager, userId, user.role);
  return { role: user.role, schoolIds };
}

export async function getSchoolIdForUser(
  manager: EntityManager,
  userId: number
): Promise<number | null> {
  const ids = await getSchoolIdsForUser(manager, userId);
  return ids.length === 1 ? ids[0] ?? null : null;
}

export async function getSchoolIdsForUser(manager: EntityManager, userId: number): Promise<number[]> {
  const info = await getUserRoleAndSchoolIds(manager, userId);
  return info?.schoolIds ?? [];
}

