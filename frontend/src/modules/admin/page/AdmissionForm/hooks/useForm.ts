/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useGetFormBySlug } from "@/screens/AdmissionForms/hooks/useFormApi";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { useMemo } from "react";

const useAdmissionForm = ({ slug, configOptions }: { slug: string; configOptions?: any }) => {
  const { data: formsData, isLoading, isError } = useGetFormBySlug(slug ?? null, configOptions);
  const data = formsData?.form;

  const formsTotalCount = useMemo(() => {
    const lastPage = data?.pages?.[data.pages.length - 1];
    return lastPage?.pagination?.count ?? 0;
  }, [data?.pages]);

  return {
    data,
    formsTotalCount,
    isLoading,
    isError,
  };
};

export default useAdmissionForm;
