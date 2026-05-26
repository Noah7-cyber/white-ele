"use client";

import type React from "react";
import { ChildDetailShell } from "@/modules/parent/component/ChildDetailComponent/ChildDetailComponent";

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  return <ChildDetailShell>{children}</ChildDetailShell>;
}
