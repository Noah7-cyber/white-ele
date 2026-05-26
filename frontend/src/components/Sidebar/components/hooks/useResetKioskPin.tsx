/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useMutationService } from "@/utils/hooks/useMutationService";
import * as Yup from "yup";
import { showToast } from "@/modules/shared/component/Toast";
import { ParentDynamicEndpoints } from "@/services/parent.service";
import { teacherDynamicEndpoints } from "@/services/teacher.service";
import { useUser } from "@/utils/hooks/useUser";

export interface ResetKioskPinFormValues {
  pin: string;
  confirmPin: string;
}

export const initialValues: ResetKioskPinFormValues = {
  pin: "",
  confirmPin: "",
};

export const validationSchema = Yup.object({
  pin: Yup.string()
    .required("New PIN is required")
    .length(4, "PIN must be exactly 4 digits")
    .matches(/^\d{4}$/, "PIN must contain only numbers"),
  confirmPin: Yup.string()
    .required("Please confirm your PIN")
    .length(4, "PIN must be exactly 4 digits")
    .matches(/^\d{4}$/, "PIN must contain only numbers")
    .oneOf([Yup.ref("pin")], "PINs must match"),
});

interface UseResetKioskPinOptions {
  onSuccess?: () => void;
}

const useResetKioskPin = (options?: UseResetKioskPinOptions) => {
  const { staffId, parentId } = useUser();
  const formInstance = useFormValidator<ResetKioskPinFormValues>({
    validationSchema,
    defaultValues: initialValues,
  });

  const { control, handleSubmit, reset } = formInstance;

  const isStaff = staffId != null && staffId !== undefined;
  const entityId = isStaff ? staffId : parentId ?? "";
  const service = isStaff
    ? teacherDynamicEndpoints.updateTeacher(entityId as number)
    : ParentDynamicEndpoints.updateParent(entityId as string);

  const { mutateAsync: resetKioskPinAsync, isPending: isResettingPin } = useMutationService<
    { pin: string },
    any
  >({
    service,
    options: {
      successTitle: "Kiosk PIN Reset Successfully",
      successMessage: "Your kiosk PIN has been updated successfully.",
      errorTitle: "Failed to Reset Kiosk PIN",
      invalidateKeys: isStaff ? ["profile", "staffDashboard"] : ["parentDashboard"],
    },
  });

  const onSubmit = async (values: ResetKioskPinFormValues) => {
    if (!staffId && !parentId) {
      showToast({
        message: "Error",
        description: "Session not found. Please log in again.",
        severity: "error",
        duration: 3000,
      });
      return;
    }

    try {
      await resetKioskPinAsync({
        pin: values.pin,
      });

      reset();

      if (options?.onSuccess) {
        options.onSuccess();
      }
    } catch (error) {
      console.error("Error resetting kiosk PIN:", error);
    }
  };

  return {
    control,
    handleSubmit: handleSubmit(onSubmit),
    isResettingPin,
    reset,
  };
};

export default useResetKioskPin;
