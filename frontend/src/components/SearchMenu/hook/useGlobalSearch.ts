import { useQuery } from "@tanstack/react-query";
import client from "@/utils/client";
import { getGlobalSearchEndpoint } from "@/services/globalSearch.service";
import { GlobalSearchResponse } from "@/services/globalSearch.service";
import { useDebounce } from "@/utils/debounceHandler";

export function useGlobalSearch(searchText: string) {
  const [debouncedSearch] = useDebounce(searchText.trim(), 300);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["globalSearch", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return null;
      const endpoint = getGlobalSearchEndpoint(debouncedSearch);
      const result = await client.request<Record<string, never>, GlobalSearchResponse>({
        path: endpoint.path,
        method: endpoint.method,
        data: endpoint.data,
      });
      return result;
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 30000,
  });

  return {
    results: data?.results ?? null,
    isLoading: isLoading || isFetching,
    hasSearched: debouncedSearch.length >= 2,
  };
}
