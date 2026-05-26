/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { type MilestoneFormValues, initialValue, validationSchema } from "../milestone.constant";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import type { DropdownOption } from "@/modules/shared/component/Dropdown";
import { showToast } from "@/modules/shared/component/Toast";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { curriculumServices, curriculumDynamicEndpoints } from "@/services/curriculum.service";
import type { SubjectResponse } from "@/services/curriculum.service";
import {
  milestoneServices,
  milestoneDynamicEndpoints,
  type CreateMilestoneRequest,
} from "@/services/milestone.service";

export interface UseManageMilestoneOptions {
  /** When provided (e.g. from modal form), subjects are fetched for this curriculum only. */
  selectedCurriculumId?: string | null;
}

export default function useManageMilestone(options?: UseManageMilestoneOptions) {
  const { selectedCurriculumId } = options ?? {};
  const router = useRouter();
  const params = useParams();
  const milestoneId = params?.id as string | undefined;
  const [curriculumOptions, setCurriculumOptions] = useState<DropdownOption<string>[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<DropdownOption<string>[]>([]);
  const formInstance = useFormValidator<MilestoneFormValues>({
    validationSchema,
    defaultValues: initialValue as MilestoneFormValues,
    reValidateMode: "onChange",
  });

  const { control, setValue, reset, handleSubmit, watch } = formInstance;

  const curriculumFromForm = watch("curriculum");
  const curriculumId = selectedCurriculumId ?? curriculumFromForm;
  const {
    data: curriculaData,
    fetchNextPage: fetchNextCurriculaPage,
    hasNextPage: hasMoreCurricula,
    refetch: refetchCurricula,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...curriculumServices.getAllCurriculums,
      data: { delta: 50 },
    },
  });

  const { data: curriculumByIdData } = useQueryService<
    Record<string, unknown>,
    { success?: boolean; curriculum?: { subjects?: SubjectResponse[] }; subjects?: SubjectResponse[] }
  >({
    service: curriculumId
      ? curriculumDynamicEndpoints.getCurriculumById(curriculumId)
      : curriculumServices.getAllCurriculums,
    options: { enabled: !!curriculumId },
  });

  useEffect(() => {
    const list =
      curriculaData?.pages?.flatMap((page: any) => page?.curriculums ?? page?.data ?? []) ?? [];
    if (!Array.isArray(list)) return;
    console.log(list,'curriculums list')
    setCurriculumOptions(
      list.reduce((acc: DropdownOption<string>[], c: any) => {
        if (!acc.some((existing) => existing.value === String(c.id))) {
          acc.push({
            value: String(c.id),
            name: (c.title ?? c.name ?? "") as string,
            // value: (c.title ?? c.name ?? "") as string,
          });
        }
        return acc;
      }, []),
    );
  }, [curriculaData]);

  useEffect(() => {
    if (!hasMoreCurricula) return;
    void fetchNextCurriculaPage();
  }, [hasMoreCurricula, fetchNextCurriculaPage]);

  useEffect(() => {
    if (!curriculumId) {
      setSubjectOptions([]);
      return;
    }
    const list =
      curriculumByIdData?.curriculum?.subjects ?? curriculumByIdData?.subjects ?? [];
    if (!Array.isArray(list)) return;
    setSubjectOptions(
      list.map((s: SubjectResponse) => ({
        value: String(s.id),
        name: s.name ?? "",
        label: s.name ?? "",
      })),
    );
  }, [curriculumId, curriculumByIdData]);

  const { mutateAsync: createMilestoneAsync, isPending: isCreating } = useMutationService({
    service: milestoneServices.createMilestone,
    options: { disableToast: true },
  });

  const { mutateAsync: updateMilestoneAsync, isPending: isUpdating } = useMutationService({
    service: milestoneId
      ? milestoneDynamicEndpoints.updateMilestone(milestoneId)
      : milestoneServices.createMilestone,
    options: { disableToast: true },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!milestoneId) {
      reset(initialValue as MilestoneFormValues);
      return;
    }
    // TODO: fetch milestone by id and reset form when editing
    reset(initialValue as MilestoneFormValues);
  }, [milestoneId, reset]);

  const onHandleSubmit = async (values: MilestoneFormValues) => {
    if (values.startDate && values.endDate && values.startDate > values.endDate) {
      showToast({
        message: "The start date cannot be after the end date.",
        severity: "error",
        duration: 3000,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: CreateMilestoneRequest = {
        title: values.milestoneName,
        subjectId: Number(values.subject),
        curriculumId: Number(values.curriculum),
        gradingType: values.gradingType || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      };

      if (milestoneId) {
        await updateMilestoneAsync(payload);
      } else {
        await createMilestoneAsync(payload);
      }

      showToast({
        message: milestoneId ? "Milestone updated successfully" : "Milestone created successfully",
        severity: "success",
        duration: 3000,
      });
      router.push(DashboardRoutes.learningMilestones);
    } catch {
      showToast({
        message: "Failed to save milestone",
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
    watch,
    milestoneId,
    curriculumOptions,
    subjectOptions,
    onHandleSubmit,
    isSubmitting: isSubmitting || isCreating || isUpdating,
    refetchCurricula,
  };
}
