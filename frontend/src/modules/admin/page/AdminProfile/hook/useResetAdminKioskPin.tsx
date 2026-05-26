/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as Yup from "yup";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { adminDynamicEndpoints } from "@/services/admin.service";
import { useUser } from "@/utils/hooks/useUser";

export interface ResetAdminKioskPinFormValues {
  pin: string;
  confirmPin: string;
}

const initialValues: ResetAdminKioskPinFormValues = {
  pin: "",
  confirmPin: "",
};

const validationSchema = Yup.object({
  pin: Yup.string()
    .required("New PIN is required")
    .matches(/^\d{4,8}$/, "PIN must be 4 to 8 digits"),
  confirmPin: Yup.string()
    .required("Please confirm your PIN")
    .matches(/^\d{4,8}$/, "PIN must be 4 to 8 digits")
    .oneOf([Yup.ref("pin")], "PINs must match"),
});

interface UseResetAdminKioskPinOptions {
  onSuccess?: () => void;
}

const useResetAdminKioskPin = ({ onSuccess }: UseResetAdminKioskPinOptions) => {
  const formInstance = useFormValidator<ResetAdminKioskPinFormValues>({
    validationSchema,
    defaultValues: initialValues,
  });

  const { control, handleSubmit, reset } = formInstance;
    const { roleDetails } = useUser();


  const { mutateAsync: resetAdminKioskPinAsync, isPending: isResettingPin } = useMutationService<
    { pin: string },
    any
  >({
    service: adminDynamicEndpoints.updateAdminPin(roleDetails?.id),
    options: {
      successTitle: "Kiosk PIN Reset Successfully",
      successMessage: "Your kiosk PIN has been updated successfully.",
      errorTitle: "Failed to Reset Kiosk PIN",
      invalidateKeys: ["profile"],
    },
  });

  const onSubmit = async (values: ResetAdminKioskPinFormValues) => {

    try {
      await resetAdminKioskPinAsync({
        pin: values.pin,
      });

      reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error resetting admin kiosk PIN:", error);
    }
  };

  return {
    control,
    handleSubmit: handleSubmit(onSubmit),
    isResettingPin,
    reset,
  };
};

export default useResetAdminKioskPin;
