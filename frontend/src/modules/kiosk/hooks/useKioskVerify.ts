/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { teacherServices } from "@/services/teacher.service";
import { KioskVerifyRequest, KioskVerifyResponse, parentServices } from "@/services/parent.service";

const PARENT_UID_KEY = "parent_kiosk_uid";
const PARENT_ID_KEY = "parent_kiosk_id";
const PARENT_KIOSK_EXPIRES_AT_KEY = "parent_kiosk_expires_at";
const EXPIRY_MINUTES = 10;

export default function useKioskVerify(opts?: { target?: "staff" | "parent"; service?: { path: string; method: any } }) {
  const [verifyData, setVerifyData] = useState<KioskVerifyResponse["data"] | null>(null);
  
  const serviceToUse = opts?.service ?? (opts?.target === "parent" ? parentServices.kioskVerify : teacherServices.kioskVerify);

  const { mutateAsync: verifyPinAsync, isPending: isVerifying } = useMutationService<KioskVerifyRequest, KioskVerifyResponse>({
    service: serviceToUse,
    options: {
      disableToast: true,
    },
  });

  const verify = async (payload: KioskVerifyRequest) => {
    const res = await verifyPinAsync(payload);
    
    if (res?.success && res?.data) {
      setVerifyData(res.data);
      if (typeof window !== "undefined") {
        const expiresAt = Date.now() + EXPIRY_MINUTES * 60 * 1000;
        localStorage.setItem(PARENT_KIOSK_EXPIRES_AT_KEY, expiresAt.toString());
        if (res.data.user?.uuid) {
          localStorage.setItem(PARENT_UID_KEY, res.data.user.uuid);
        }
        if (res.data.id) {
          localStorage.setItem(PARENT_ID_KEY, res.data.id.toString());
        }
      }
    }
    
    return res;
  };

  return { verify, isVerifying, verifyData } as const;
}

const isExpired = (): boolean => {
  if (typeof window === "undefined") return true;
  const expiresAt = localStorage.getItem(PARENT_KIOSK_EXPIRES_AT_KEY);
  if (!expiresAt) return true;
  return Date.now() > Number(expiresAt);
};

const clearIfExpired = (): void => {
  if (isExpired()) removeParentUid();
};

// Export function to check if parent is authenticated
export const getParentUid = (): string | null => {
  if (typeof window === "undefined") return null;
  clearIfExpired();
  return localStorage.getItem(PARENT_UID_KEY);
};

// Export function to get parent ID
export const getParentId = (): string | null => {
  if (typeof window === "undefined") return null;
  clearIfExpired();
  return localStorage.getItem(PARENT_ID_KEY);
};

// Export function to remove parent UID (for logout)
export const removeParentUid = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PARENT_UID_KEY);
    localStorage.removeItem(PARENT_ID_KEY);
    localStorage.removeItem(PARENT_KIOSK_EXPIRES_AT_KEY);
  }
};
