/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import client, { ApiMethods } from "../client";
import { useAppDispatch } from "@/redux/store/hooks";
import { CombinedReducerType, AuthReduxState } from "@/redux/store/types";
import { showToast } from "@/modules/shared/component/Toast";

type MutationSuccessHandler<Resp, Req> = (
  response: Resp,
  helpers: {
    queryClient: ReturnType<typeof useQueryClient>;
    router: ReturnType<typeof useRouter>;
    dispatch: ReturnType<typeof useAppDispatch>;
    variables: Req;
  },
) => void;

type MutationErrorHandler = (
  error: unknown,
  helpers: {
    enqueueSnackbar: ReturnType<typeof useSnackbar>["enqueueSnackbar"];
  },
) => void;

// export interface UseMutationServiceProps<
//   Req extends object,
//   Resp extends object
// > {
//   service: {
//     path: string;
//     method?: ApiMethods;
//     options?: {
//       keys?: string[];
//     };
//     headers?: Record<string, string>;
//   };
//   options?: {
//     keys?: string[];
//     isDownload?: boolean;
//     isPdf?: boolean;
//     canShare?: boolean;
//     fileName?: string;
//     isFormData?: boolean;
//     onSuccess?: MutationSuccessHandler<Resp, Req>;
//     onError?: MutationErrorHandler;
//     successTitle?: string;
//     successMessage?: string;
//     errorTitle?: string;
//     invalidateKeys?: string[];
//     redirectTo?: string;
//   };
// }
// In UseMutationServiceProps interface
export interface UseMutationServiceProps<Req extends object, Resp = unknown> {
  service:
    | {
        path: string;
        method?: ApiMethods;
        options?: {
          keys?: string[];
        };
        headers?: Record<string, string>;
      }
    | ((variables: Req) => {
        // New: Allow function that returns service object
        path: string;
        method?: ApiMethods;
        options?: {
          keys?: string[];
        };
        headers?: Record<string, string>;
      });

  options?: {
    keys?: string[];
    isDownload?: boolean;
    isPdf?: boolean;
    canShare?: boolean;
    fileName?: string;
    isFormData?: boolean;
    onSuccess?: MutationSuccessHandler<Resp, Req>;
    onError?: MutationErrorHandler;
    successTitle?: string;
    successMessage?: string;
    errorTitle?: string;
    invalidateKeys?: string[];
    redirectTo?: string;
    disableToast?: boolean;
  };
}
export function useMutationService<Req extends object, Resp = unknown>(
  props: UseMutationServiceProps<Req, Resp>,
) {
  const { options = {} } = props;

  const {
    keys = [],
    isDownload,
    isPdf,
    canShare,
    fileName,
    isFormData,
    onSuccess,
    onError,
    successTitle,
    successMessage,
    errorTitle,
    invalidateKeys,
    redirectTo,
    ...rest
  } = options;

  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  const { refreshToken, accessToken } =
    useSelector<CombinedReducerType, AuthReduxState>(({ authentication }) => authentication) || {};

  return useMutation<Resp, unknown, Req>({
    ...rest,
    mutationKey: [...keys, props.service, refreshToken?._time_stamp, accessToken?._time_stamp],
    mutationFn: async (data) => {
      // Resolve service dynamically if it's a function
      const resolvedService =
        typeof props.service === "function" ? props.service(data) : props.service;

      return client.request<Req, Resp>({
        ...resolvedService,
        method: resolvedService.method ?? ApiMethods.POST,
        data,
        options: { isFormData, isDownload, isPdf, canShare, fileName },
      });
    },

    onSuccess: async (response, variables) => {
      if (onSuccess) {
        onSuccess(response, { queryClient, router, dispatch, variables });
      }

      if (invalidateKeys?.length) {
        invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      }

      if (!options.disableToast) {
        const title = successTitle || "Success";
        const description =
          successMessage || (response as { message?: string })?.message || "Operation completed.";

        if (successMessage || successTitle || (response as any)?.message) {
          showToast({
            message: title,
            description,
            severity: "success",
          });
        }
      }

      if (redirectTo) {
        router.replace(redirectTo);
      }
    },
    onError: (error: unknown) => {
      const apiError = error as any;

      const rawErrors = apiError?.response?.data?.errors;

      let errorMessage = "";

      if (Array.isArray(rawErrors) && rawErrors.length > 0) {
        // Handle backend errors that come back as an array of strings
        if (typeof rawErrors[0] === "string") {
          errorMessage = (rawErrors as string[]).join("\n");
        } else {
          // Fallback for existing shape: [{ msg, path }]
          errorMessage = rawErrors
            .map((err: any) => {
              const baseMsg = err?.msg || err?.message || String(err);
              return err?.path ? `${baseMsg} (${err.path})` : baseMsg;
            })
            .join("\n");
        }
      } else {
        errorMessage =
          apiError?.response?.data?.message || apiError?.message || "Something went wrong.";
      }

      if (onError) {
        onError(error, { enqueueSnackbar });
      } else if (!options.disableToast) {
        showToast({
          message: errorTitle || "Operation Failed",
          description: errorMessage,
          severity: "error",
        });
      }
    },
  });
}
