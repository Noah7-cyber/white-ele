/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import {
  formDynamicEndpoints,
  formServices,
  type GetFormByIdResponse,
} from "@/services/form.service";

export function useGetFormById(formId: string | number | null) {
  const isEmptyFormId = formId === null || formId === "";
  return useQueryService<Record<string, never>, GetFormByIdResponse>({
    service: {
      ...(!isEmptyFormId ? formServices.getForm : { path: "__noop__", method: "get" as const }),
      ...(!isEmptyFormId ? { data: { formId } } : {}),
    },
    options: {
      keys: ["form", String(formId ?? "")],
      enabled: !isEmptyFormId,
    },
  });
}

export function useGetFormBySlug(slug: string | null, configService?: any) {
  const isEmptyFormId = slug === null || slug === "";
  return useQueryService<Record<string, never>, any>({
    service: {
      ...(!isEmptyFormId
        ? formDynamicEndpoints.getFormBySlug(slug ?? "")
        : { path: "__noop__", method: "get" as const }),
      ...configService,
    },
    options: {
      keys: ["form", String(slug ?? "")],
      enabled: !isEmptyFormId,
    },
  });
}

/** Delete a form. Call with mutateAsync({ formId }). */
export function useDeleteForm() {
  return useMutationService<{ formId: string | number }, { success?: boolean; message?: string }>({
    service: (variables) => formDynamicEndpoints.deleteForm(variables.formId),
    options: {
      successTitle: "Form deleted",
      errorTitle: "Failed to delete form",
    },
  });
}

/** Delete a question/item from a form. Call with mutateAsync({ formId, itemId }). */
export function useDeleteFormItem() {
  return useMutationService<
    { formId: string | number; itemId: string | number },
    { success?: boolean; message?: string }
  >({
    service: (variables) => formDynamicEndpoints.deleteFormItem(variables.formId, variables.itemId),
    options: {
      successTitle: "Question removed",
      errorTitle: "Failed to remove question",
    },
  });
}
