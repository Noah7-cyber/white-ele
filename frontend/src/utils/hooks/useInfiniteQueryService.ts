/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSelector } from "react-redux";

import { InfiniteData, QueryKey, useInfiniteQuery } from "@tanstack/react-query";

import client from "../client";
import { AuthState } from "@/redux/store/slices/authSlice";

const DEFAULT_PAGE_LIMIT = 10;

export function useInfiniteQueryService<
  Req extends Omit<Partial<PaginationData>, "count"> | undefined | null,
  Resp extends Record<"pagination", PaginationData>,
>(props: UseInfinityQueryServiceProps<Req, Resp>) {
  const {
    service: { options: serviceOptions, ...service },
    options: queryOptions,
  } = props;

  const { data = {} as PageParams } = service;
  const payload = data || ({} as PageParams);
  const { keys = [], ...rest } = queryOptions || {};

  const initialPageParam = {
    pos: payload.pos || 0,
    delta: payload.delta ?? DEFAULT_PAGE_LIMIT,
  } as PageParams;

  const { refreshToken, accessToken }: any = useSelector<AuthState>(
    ({ accessToken, refreshToken }) => ({ accessToken, refreshToken }),
  );

  const result = useInfiniteQuery<
    Resp,
    Error,
    InfiniteData<Resp, PageParams>,
    QueryKey,
    PageParams
  >({
    initialPageParam,
    ...rest,
    queryKey: [
      ...keys,
      ...(serviceOptions?.keys || []),
      service,
      refreshToken?._time_stamp,
      accessToken?._time_stamp,
    ],
    queryFn: async ({ pageParam }) => {
      try {
        const response = await client.request<Req & PageParams, Resp>({
          ...service,
          data: {
            ...payload,
            ...pageParam,
          } as Req & PageParams,
        });
        return response;
      } catch (err) {
        const path = service?.path ?? "unknown";
        console.error("[useInfiniteQueryService] request failed:", path, err);
        throw err instanceof Error ? err : new Error(String(err));
      }
    },
    getNextPageParam: (lastPage: Resp) => {
      if (lastPage == null || typeof lastPage !== "object") return undefined;
      const delta = payload.delta || initialPageParam?.delta || 0;
      const pagination =
        (lastPage as any)?.data?.pagination ??
        (lastPage as any)?.pagination ??
        (lastPage as any)?.data?.data?.pagination;
      const lastPageOffset = pagination?.pos || 0;

      const pos = delta + lastPageOffset;
      const hasMore = pos < (pagination?.count ?? Infinity);

      return !hasMore ? undefined : { pos, delta };
    },
    getPreviousPageParam: (previousPage: Resp) => {
      if (previousPage == null || typeof previousPage !== "object") {
        return { pos: 0, delta: payload.delta || initialPageParam?.delta || DEFAULT_PAGE_LIMIT };
      }
      const delta = payload.delta || initialPageParam?.delta || 0;
      const pagination =
        (previousPage as any)?.data?.pagination ??
        (previousPage as any)?.pagination ??
        (previousPage as any)?.data?.data?.pagination;
      const lastPageOffset = pagination?.pos || 0;

      const pos = lastPageOffset - delta;
      const hasPrevious = pos > 0;

      return { pos: hasPrevious ? pos : 0, delta };
    },
  });

  return result;
}
