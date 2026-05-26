 
"use client";

import useChangePassword from "@/modules/admin/page/SettingsPage/hooks/useChangePassword";
import useResetKioskPin from "./useResetKioskPin";

interface UseParentModalsOptions {
  onResetKioskPinSuccess?: () => void;
}

const useParentModals = (options?: UseParentModalsOptions) => {
  const changePassword = useChangePassword();
  const resetKioskPin = useResetKioskPin({
    onSuccess: options?.onResetKioskPinSuccess,
  });

  return {
    changePassword,
    resetKioskPin,
  };
};

export default useParentModals;

