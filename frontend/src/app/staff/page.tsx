"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StaffPage() {
  const router = useRouter();

  useEffect(() => {
    // Simply redirect to profile settings
    router.replace("/staff/dashboard");
  }, [router]);

  return null;
}