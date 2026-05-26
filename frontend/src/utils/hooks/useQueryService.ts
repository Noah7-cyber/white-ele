import { QueryKey, useQuery } from "@tanstack/react-query";
import client from "../client";

export function useQueryService<Req extends object, Resp extends object>(
  props: UseQueryServiceProps<Req, Resp>,
) {
  const { service, options } = props;
  const { keys = [], isDownload, isPdf, canShare, fileName, ...rest } = options || {};

  return useQuery<Resp, Error, Resp, QueryKey>({
    refetchInterval: false,
    refetchOnWindowFocus: false,
    ...rest,
    queryKey: [...keys, service],
    queryFn: async () => {
      try {
        const result = await client.request({
          ...service,
          path: service?.path,
          method: service?.method,
          options: { isDownload, isPdf, canShare, fileName },
        });
        if (typeof result === "string") {
          throw new Error("Unexpected string response");
        }
        return result as Resp;
      } catch (err) {
        const path = service?.path ?? "unknown";
        console.error("[useQueryService] request failed:", path, err);
        if (err instanceof Error) {
          throw err;
        }
        const apiError = err as {
          status?: number;
          statusCode?: number;
          message?: string;
          error?: string;
        };
        const message = apiError?.message || apiError?.error || "Request failed";
        const wrappedError = new Error(message) as Error & {
          status?: number;
          statusCode?: number;
          payload?: unknown;
        };
        if (typeof apiError?.status === "number") {
          wrappedError.status = apiError.status;
        }
        if (typeof apiError?.statusCode === "number") {
          wrappedError.statusCode = apiError.statusCode;
        }
        wrappedError.payload = err;
        throw wrappedError;
      }
    },
  });
}
