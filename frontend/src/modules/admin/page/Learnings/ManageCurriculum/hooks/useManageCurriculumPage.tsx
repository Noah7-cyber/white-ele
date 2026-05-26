 
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import {
  type CurriculumFormValues,
  initialValue,
  validationSchema,
} from "../curriculum.constant";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { showToast } from "@/modules/shared/component/Toast";

export default function useManageCurriculumPage() {
  const router = useRouter();
  const params = useParams();
  const curriculumId = (params?.curriculumId ?? params?.id) as string | undefined;

  const formInstance = useFormValidator<CurriculumFormValues>({
    validationSchema,
    defaultValues: initialValue as CurriculumFormValues,
    reValidateMode: "onChange",
  });

  const { control, setValue, reset, handleSubmit } = formInstance;
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!curriculumId) {
      reset(initialValue as CurriculumFormValues);
      return;
    }
    // TODO: fetch curriculum by id and reset form
    reset(initialValue as CurriculumFormValues);
  }, [curriculumId, reset]);

  const onHandleSubmit = async (values: CurriculumFormValues) => {
    setIsSubmitting(true);
    try {
      // TODO: call create/update curriculum API
      showToast({
        message: curriculumId ? "Curriculum updated successfully" : "Curriculum created successfully",
        severity: "success",
        duration: 3000,
      });
      router.push(DashboardRoutes.learningCurriculum);
    } catch (error) {
      showToast({
        message: "Failed to save curriculum",
        severity: "error",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ...formInstance,
    control,
    setValue,
    reset,
    handleSubmit,
    curriculumId,
    onHandleSubmit,
    isSubmitting,
  };
}
