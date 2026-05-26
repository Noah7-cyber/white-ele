"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ParentRoutes } from "@/routes/parent.routes";

export default function ParentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ParentRoutes.dashboard);
  }, [router]);

  return null;
}


