/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useMutationService } from "@/utils/hooks/useMutationService";
import * as Yup from "yup";
import { showToast } from "@/modules/shared/component/Toast";
import { teacherDynamicEndpoints } from "@/services/teacher.service";
import { useUser } from "@/utils/hooks/useUser";

export interface ResetKioskPinFormValues {
  newPin: string;
  confirmPin: string;
}

export const initialValues: ResetKioskPinFormValues = {
  newPin: "",
  confirmPin: "",
};

export const validationSchema = Yup.object({
  newPin: Yup.string()
    .required("New PIN is required")
    .length(4, "PIN must be exactly 4 digits")
    .matches(/^\d+$/, "PIN must contain only numbers"),
  confirmPin: Yup.string()
    .required("Please confirm your PIN")
    .oneOf([Yup.ref("newPin")], "PINs must match")
    .length(4, "PIN must be exactly 4 digits"),
});

const useResetKioskPin = () => {
  const { staffId } = useUser(); 
  const formInstance = useFormValidator<ResetKioskPinFormValues>({
    validationSchema,
    defaultValues: initialValues,
  });

  const { control, handleSubmit, reset } = formInstance;

  const { mutateAsync: updateTeacherAsync, isPending: isResettingPin } = useMutationService<
    { pin: string },
    any
  >({
    service: teacherDynamicEndpoints.updateTeacher(staffId ?? 0),
    options: {
      successTitle: "Kiosk PIN Updated",
      successMessage: "Your kiosk PIN has been updated successfully.",
      errorTitle: "Update Failed",
    },
  });

  const onSubmit = async (values: ResetKioskPinFormValues) => {
    if (!staffId) {
      showToast({
        message: "Error",
        description: "Staff ID not found. Please log in again.",
        severity: "error",
      });
      return;
    }

    try {
      await updateTeacherAsync({
        pin: values.newPin,
      });
      reset();
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
