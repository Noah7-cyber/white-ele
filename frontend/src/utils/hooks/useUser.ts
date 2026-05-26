/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  accountServices,
  GetProfileResponse,
  StaffRoleDetails,
  StaffClassAndSubjectItem,
  ParentRoleDetails,
  ParentRoleDetailsChild,
} from "@/services/account.service";

function isParentRoleDetails(rd: unknown): rd is ParentRoleDetails {
  return !!rd && typeof rd === "object" && Array.isArray((rd as ParentRoleDetails).children);
}

export function useUser() {
  const { data: session, status } = useSession();

  const { data: profileResponse, isLoading: isProfileLoading, error: profileError } = useQueryService<
    Record<string, never>,
    GetProfileResponse
  >({
    service: accountServices.getProfile,
    options: {
      keys: ["profile", "useUser"],
    },
  });

  const user = profileResponse?.data?.user;
  const roleDetails = user?.roleDetails ?? null;
  const staffRoleDetails = roleDetails && !isParentRoleDetails(roleDetails) ? (roleDetails as StaffRoleDetails) : null;
  const parentRoleDetails = roleDetails && isParentRoleDetails(roleDetails) ? (roleDetails as ParentRoleDetails) : null;

  const staffId = staffRoleDetails?.id ?? undefined;
  const staffClassesAndSubject: StaffClassAndSubjectItem[] = useMemo(() => {
    const raw = staffRoleDetails?.staffClassesAndSubject ?? [];
    return raw.filter((item) => item.subject == null);
  }, [staffRoleDetails?.staffClassesAndSubject]);

  const parentId = parentRoleDetails?.id ?? undefined;
  const children: ParentRoleDetailsChild[] = useMemo(
    () => parentRoleDetails?.children ?? [],
    [parentRoleDetails?.children]
  );

  const role = process.env.NEXT_PUBLIC_USER_ROLE ?? (session?.user as any)?.role ?? user?.role;

  return {
    role,
    status,
    session,
    user,
    roleDetails,
    staffRoleDetails,
    parentRoleDetails,
    staffId,
    staffClassesAndSubject,
    parentId,
    children,
    isProfileLoading,
    profileError,
  };
}
