import { Invitation } from "@/services/auth.service";

export type StatusType = "Active" | "Inactive" | "Expired";

export function getInvitationStatus(invitation: Pick<Invitation, "hasAccepted" | "expiresAt">): StatusType {
  if (invitation.hasAccepted) return "Active";
  if (new Date(invitation.expiresAt) < new Date()) return "Expired";
  return "Inactive";
}

export type SchoolAdminUser = Invitation & {
  userId?: number;
  assignedRoleId?: number | null;
  assignedRoleName?: string | null;
};

type AdminWithRole = {
  id: number;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  createdAt?: string;
  assignedRoleId?: number | null;
  assignedRoleName?: string | null;
};

export function getAssignedRoleDisplayName(
  row: Pick<SchoolAdminUser, "assignedRoleName" | "assignedRoleId" | "roleId" | "role">,
  getRoleName: (roleId?: number | null, fallback?: string) => string,
): string {
  if (row.assignedRoleName?.trim()) {
    return row.assignedRoleName.trim();
  }
  const roleId = row.assignedRoleId ?? row.roleId;
  return getRoleName(roleId, row.role === "admin" ? undefined : row.role);
}

export function buildSchoolAdminUsers(
  invitations: Invitation[],
  admins: AdminWithRole[],
): SchoolAdminUser[] {
  const rows: SchoolAdminUser[] = [];
  const seenEmails = new Set<string>();

  for (const admin of admins) {
    const email = admin.email?.trim().toLowerCase();
    if (!email) continue;
    seenEmails.add(email);

    const matchingInvite = invitations.find(
      (inv) => inv.email.trim().toLowerCase() === email,
    );

    if (matchingInvite) {
      rows.push({
        ...matchingInvite,
        userId: admin.id,
        assignedRoleId: admin.assignedRoleId ?? matchingInvite.assignedRoleId ?? matchingInvite.roleId,
        assignedRoleName:
          admin.assignedRoleName ?? matchingInvite.assignedRoleName ?? null,
        hasAccepted: true,
      });
    } else {
      rows.push({
        id: -admin.id,
        email: admin.email ?? "",
        firstName: admin.firstName ?? null,
        lastName: admin.lastName ?? null,
        role: "admin",
        roleId: admin.assignedRoleId ?? null,
        assignedRoleId: admin.assignedRoleId ?? null,
        assignedRoleName: admin.assignedRoleName ?? null,
        hasAccepted: true,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: admin.createdAt ?? new Date().toISOString(),
        userId: admin.id,
        token: "",
        invitedById: 0,
        schoolId: matchingInvite?.schoolId,
        acceptedAt: null,
      });
    }
  }

  for (const inv of invitations) {
    const email = inv.email.trim().toLowerCase();
    if (seenEmails.has(email)) continue;
    rows.push({
      ...inv,
      assignedRoleId: inv.assignedRoleId ?? inv.roleId ?? null,
      assignedRoleName: inv.assignedRoleName ?? null,
    });
  }

  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return rows;
}
