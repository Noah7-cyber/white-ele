"use client";

import { StaffHome } from "@/modules/staff/page/StaffHome/staffHome";

/**
 * Staff dashboard must always render the staff shell content.
 * Do not branch on `useUser().role` here: env/session/profile can be stale or wrong
 * while the URL is still `/staff/dashboard`, which produced the admin dashboard UI.
 */
export default function StaffDashboardClient() {
  return <StaffHome />;
}
