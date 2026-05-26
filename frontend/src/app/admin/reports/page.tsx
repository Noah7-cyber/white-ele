"use client";

import { redirect } from "next/navigation";

export default function ReportsPage() {
  redirect("/admin/reports/billing/deposit");
}