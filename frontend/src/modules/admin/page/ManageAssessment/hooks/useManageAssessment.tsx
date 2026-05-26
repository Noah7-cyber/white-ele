/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

import { useFormValidator } from "@/utils/hooks/useFormValidator";
import {
  AssessmentProps,
  initialAssessmentValues,
  assessmentValidationSchema,
} from "../assessment.constant";

import {
  assessmentServices,
  assessmentDynamicEndpoints,
} from "@/services/assessment.service";

import { useMutationService } from "@/utils/hooks/useMutationService";
import { showToast } from "@/modules/shared/component/Toast";

const useManageAssessmentPage = () => {
  const router = useRouter();
  const params = useParams();

  const assessmentId = params?.assessmentId as string | undefined;

  const formInstance = useFormValidator<AssessmentProps>({
    validationSchema: assessmentValidationSchema,
    defaultValues: initialAssessmentValues,
  });

  const { setValue, getValues, reset } = formInstance;

  // ========= FETCH BY ID =========
  const { mutateAsync: getAssessmentById, isPending } = useMutationService({
    service: assessmentDynamicEndpoints.getAssessmentById(assessmentId!),
    options: {
      disableToast: true,
    },
  });

  useEffect(() => {
    if (!assessmentId || assessmentId === "add") return;

    const fetchAssessment = async () => {
      const res: any = await getAssessmentById({});

      const a = res.assessment;

      setValue("title", a.title);
      setValue("type", a.type);
      setValue("dueDate", a.dueDate);
      setValue("totalMarks", a.totalMarks?.toString());
      setValue("description", a.description);
      setValue("rubric", a.rubric);
    };

    fetchAssessment();
  }, [assessmentId, getAssessmentById, setValue]);

  // ========= CREATE =========
  const { mutateAsync: createAssessmentAsync, isPending: isCreatingAssessment } =
    useMutationService({
      service: assessmentServices.createAssessment,
    });

  // ========= UPDATE =========
  const { mutateAsync: updateAssessmentAsync, isPending: isUpdatingAssessment } =
    useMutationService({
      service: assessmentDynamicEndpoints.updateAssessment(assessmentId!),
    });

  // ========= SUBMIT =========
  const onHandleSubmit = async () => {
    const isValid = await formInstance.trigger();
    if (!isValid) return;

    const payload = {
      title: getValues("title"),
      type: getValues("type"),
      dueDate: getValues("dueDate"),
      totalMarks: getValues("totalMarks"),
      description: getValues("description"),
      rubric: getValues("rubric"),
    };

    if (assessmentId && assessmentId !== "add") {
      await updateAssessmentAsync(payload);
    } else {
      await createAssessmentAsync(payload);
    }

    showToast({
      message: assessmentId ? "Assessment Updated" : "Assessment Created",
      description: "Operation completed successfully",
      severity: "success",
      duration: 5000,
    });

    reset();
    router.back();
  };

  return {
    ...formInstance,
    assessmentId,
    isPending,
    isCreatingAssessment,
    isUpdatingAssessment,
    onHandleSubmit,
    router
  };
};

export default useManageAssessmentPage;
