import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { ParentRoutes } from "@/routes/parent.routes";

export type SearchRole = "admin" | "staff" | "parent";

type EntityType =
  | "student"
  | "classroom"
  | "staff"
  | "admin"
  | "parent"
  | "announcement"
  | "curriculum"
  | "subject"
  | "milestone"
  | "assessment";

export function getSearchResultRoute(
  role: SearchRole,
  entityType: EntityType,
  id: number
): string | null {
  const routes: Record<SearchRole, Partial<Record<EntityType, (id: number) => string>>> = {
    admin: {
      student: (id) => DashboardRoutes.childProfile.replace(":id", String(id)),
      classroom: (id) => DashboardRoutes.classroomDetails.replace(":classId", String(id)),
      staff: (id) => DashboardRoutes.teacherView.replace(":id", String(id)),
      admin: (id) => DashboardRoutes.teacherView.replace(":id", String(id)),
      parent: (id) => `${DashboardRoutes.parents}/${id}`,
      announcement: () => DashboardRoutes.announcement,
      curriculum: (id) => DashboardRoutes.viewCurriculum.replace(":id", String(id)),
      subject: (id) => DashboardRoutes.learningEditSubject.replace(":id", String(id)),
      milestone: (id) => `/admin/learning/milestones/${id}/edit`,
      assessment: (id) => `/admin/learning/assessments/${id}/view`,
    },
    staff: {
      student: (id) => StaffRoutes.childProfile.replace(":id", String(id)),
      classroom: (id) => `${StaffRoutes.classRooms}/${id}`,
      staff: (id) => StaffRoutes.teacherView.replace(":id", String(id)),
      admin: (id) => StaffRoutes.teacherView.replace(":id", String(id)),
      parent: (id) => `${StaffRoutes.root}/parents/${id}`,
      announcement: () => StaffRoutes.announcement,
      curriculum: (id) => StaffRoutes.viewCurriculum.replace(":id", String(id)),
      subject: (id) => `/staff/learning/subjects/${id}/edit`,
      milestone: (id) => `/staff/learning/milestones/${id}/edit`,
      assessment: (id) => `/staff/learning/assessments/${id}/view`,
    },
    parent: {
      student: (id) => `${ParentRoutes.children}/${id}`,
      announcement: () => ParentRoutes.announcement,
    },
  };

  const roleRoutes = routes[role];
  const routeFn = roleRoutes?.[entityType as keyof typeof roleRoutes];
  if (!routeFn || typeof routeFn !== "function") return null;
  return routeFn(id);
}
