/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray } from "react-hook-form";

import { useFormValidator } from "@/utils/hooks/useFormValidator";

import {
  MilestoneProps,
  initialMilestoneValues,
  milestoneValidationSchema,
} from "../milestone.constant";

import { milestoneServices, milestoneDynamicEndpoints } from "@/services/milestone.service";
import { useMutationService } from "@/utils/hooks/useMutationService";


const useManageMilestone = () => {
  const router = useRouter();
  const params = useParams();
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const milestoneId = params?.milestoneId as string | undefined;

  const formInstance = useFormValidator<MilestoneProps>({
    validationSchema: milestoneValidationSchema,
    defaultValues: initialMilestoneValues,
  });

  const { control, setValue, getValues, reset } = formInstance;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
  });
  const toggleCollapse = (index: number) => {
    setCollapsed((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // ========= FETCH BY ID =========
  const { mutateAsync: getMilestoneById } = useMutationService({
    service: milestoneDynamicEndpoints.getMilestoneById(milestoneId!),
    options: { disableToast: true },
  });

  useEffect(() => {
    if (!milestoneId || milestoneId === "add") return;

    const fetchMilestone = async () => {
      const res: any = await getMilestoneById({});

      const milestones = res?.milestones || [];
      setValue("milestones", milestones);
    };

    fetchMilestone();
  }, [milestoneId, getMilestoneById, setValue]);

  // ========= MUTATIONS =========
  const { mutateAsync: createMilestonesAsync } = useMutationService({
    service: milestoneServices.createMilestone,
  });

  const { mutateAsync: updateMilestoneAsync } = useMutationService({
    service: milestoneDynamicEndpoints.updateMilestone(milestoneId!),
  });

  // ========= SUBMIT =========
  const onHandleSubmit = async () => {
    const valid = await formInstance.trigger();
    if (!valid) return;

    const payload = { milestones: getValues() };
    if (milestoneId && milestoneId !== "add") {
      await updateMilestoneAsync(payload);
    } else {
      await createMilestonesAsync(payload);
    }

    reset();
    router.back();
  };

  return {
    ...formInstance,
    milestoneId,
    fields,
    appendMilestone: () =>
      append({
        title: "",
        description: "",
        type: "",
        successCriteria: "",
        resources: "",
      }),

    removeMilestone: remove,
    onHandleSubmit,
    router,
    toggleCollapse,
    collapsed,
  };
};

export default useManageMilestone;
