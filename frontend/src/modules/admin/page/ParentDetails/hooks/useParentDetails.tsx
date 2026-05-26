/* eslint-disable @typescript-eslint/no-explicit-any */
import { ParentDynamicEndpoints } from "@/services/parent.service";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { unwrapQueryDataBody } from "@/utils/unwrapQueryResponse";
import { useParams } from "next/navigation";
import { ChangeEvent } from "react";

export function useParentDetails() {
  const { id } = useParams();

  const { debouncedSearch, setSearch } = useDebouncer();

  const parentDetailsQuery = useQueryService({
    service: {
      ...ParentDynamicEndpoints.getParentById(id as string),
      data: {
        search: debouncedSearch,
      },
    },
  });
  const { isLoading } = parentDetailsQuery;
  const parentData = unwrapQueryDataBody<Record<string, any>>(parentDetailsQuery.data);

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  return { parentData, isLoading, handleSearch };
}
