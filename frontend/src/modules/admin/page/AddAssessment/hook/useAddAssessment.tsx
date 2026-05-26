"use client";

import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { AssessmentFormData, validationSchema, initialValue } from "../assessment.constant";
import { showToast } from "@/modules/shared/component/Toast";

const useAddAssessment = () => {
  const formInstance = useFormValidator<AssessmentFormData>({
    validationSchema,
    defaultValues: initialValue as AssessmentFormData,
    reValidateMode: "onChange",
  });
  const { control, setValue, getValues } = formInstance;

  const handleSubmit = async () => {
    // const isValid = await formInstance.trigger();
    // if (!isValid) return;
    const _formData = formInstance.getValues();
    showToast({
      message: "Assessment Created Successfully.",
      description: "You've successfully created a assessment.",
      severity: "success",
      duration: 5000,
    });
  };

  const handleSaveDraft = async () => {
    const _formData = formInstance.getValues();
    showToast({
      message: "Draft saved successfully.",
      severity: "success",
      duration: 3000,
    });
  };

  return {
    ...formInstance,
    handleSubmit,
    handleSaveDraft,
    setValue,
    getValues,
    control,
  };
};

export default useAddAssessment;
