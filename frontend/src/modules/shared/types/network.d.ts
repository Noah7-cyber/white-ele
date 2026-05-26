import {
  InfiniteData,
  QueryKey,
  UndefinedInitialDataInfiniteOptions,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";

declare global {
  interface PaginationData {
    count?: number;
    delta?: number;
    pos?: number;
    search?: string;
  }

  interface ServiceMetaData {
    totalServicesWorth?: number;
  }
  interface ProductMetaData {
    totalProductsWorth?: number;
  }

  type PageParams = Omit<PaginationData, "count">;

  interface UseInfinityQueryServiceProps<Req, Resp> {
    service: ServiceInterface<Req, Resp>;
    requestPayload?: Req;
    options?: Omit<
      UndefinedInitialDataInfiniteOptions<
        Resp,
        Error,
        InfiniteData<Resp, PageParams>,
        QueryKey,
        PageParams
      >,
      | "queryKey"
      | "queryFn"
      | "initialPageParam"
      | "getNextPageParam"
      | "getPreviousPageParam"
    > & {
      keys?: string[];
      enabled?: boolean;
    };
  }

  interface UseMutationServiceProps<Req, Resp> {
    service: ServiceInterface<Req, Resp>;
    requestPayload?: Req;
    options?: Omit<
      UseMutationOptions<Resp, Error, Req>,
      "mutationKey" | "mutationFn"
    > & {
      keys?: string[];
      enabled?: boolean;
      isDownload?: boolean;
      canShare?: boolean;
      fileName?: string;
      isPdf?: boolean;
      isFormData?: boolean;
      onError?: (err: ErrorResponse) => void;
    };
  }

  interface UseQueryServiceProps<Req, Resp> {
    service: ServiceInterface<Req, Resp>;
    requestPayload?: Req;
    options?: Omit<
      UseQueryOptions<Resp, Error, Resp, QueryKey>,
      "queryKey" | "queryFn"
    > & {
      keys?: string[];
      enabled?: boolean;
      isDownload?: boolean;
      canShare?: boolean;
      fileName?: string;
      isPdf?: boolean;
    };
  }
}
