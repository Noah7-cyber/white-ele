import { redirect } from "next/navigation";

export default function RedirectAttendanceReport() {
  redirect("/admin/reports/attendance/check-in-out");
}
