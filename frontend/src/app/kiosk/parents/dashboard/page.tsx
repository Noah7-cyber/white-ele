"use client";

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ParentsDashboardPage from '@/modules/kiosk/page/ParentsDashboard/parentsDashboard'
import { getParentUid } from '@/modules/kiosk/hooks/useKioskVerify'

const DashboardPage = () => {
  const router = useRouter();

  useEffect(() => {
    const parentUid = getParentUid();
    if (!parentUid) {
      // Redirect to login if UID is not present
      router.push("/kiosk/parents/login");
    }
  }, [router]);

  // Check UID before rendering
  if (typeof window !== "undefined" && !getParentUid()) {
    return null; // Prevent flash of content before redirect
  }

  return (
    <ParentsDashboardPage />
  )
}

export default DashboardPage