"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Simply redirect to profile settings
    router.replace("/admin/dashboard");
  }, [router]);

  return null;
}
