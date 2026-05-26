/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authServices, AcceptInvitationRequest } from "@/services/auth.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { RegisterFormValues, initialValue, validationSchema } from "../auth.constant";
import { AuthRoutes } from "@/routes/auth.routes";
import client from "@/utils/client";
import { ApiMethods } from "@/utils/client";
import { showToast } from "@/modules/shared/component/Toast";

type RegisterRoleParam = "admin" | "parent" | undefined;

interface UseRegisterParams {
  role?: RegisterRoleParam;
  token?: string;
}

export function useRegister(params?: UseRegisterParams) {
  const router = useRouter();
  const [isInviteLoading, setIsInviteLoading] = useState<boolean>(false);
  const [isInviteAccepted, setIsInviteAccepted] = useState<boolean>(false);
  const [invitedEmail, setInvitedEmail] = useState<string | undefined>(undefined);

  const formInstance = useFormValidator<RegisterFormValues>({
    validationSchema,
    defaultValues: {
      ...initialValue,
      email: invitedEmail || initialValue.email,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { control, handleSubmit, setValue } = formInstance;

  useEffect(() => {
    const runAcceptInvite = async () => {
      if (!params?.token) return;

      try {
        setIsInviteLoading(true);
        const requestPayload: AcceptInvitationRequest = {
          token: params.token,
        };

        const response = await client.request<AcceptInvitationRequest, any>({
          path: authServices.acceptInvitation.path,
          method: authServices.acceptInvitation.method as ApiMethods,
          data: requestPayload,
        });

        // Extract email from response
        const emailFromResponse =
          (response as any)?.email ||
          (response as any)?.data?.email ||
          (response as any)?.data?.data?.email;

        if (emailFromResponse) {
          // Update form email and store it for disabling the field
          setValue("email", emailFromResponse, { shouldValidate: true });
          setInvitedEmail(emailFromResponse);
          setIsInviteAccepted(true);
        }
      } catch (error: any) {
        console.error("Failed to accept invitation", error);
        
        // Extract error message from the error response
        const errorsArray =
          error?.response?.data?.errors && Array.isArray(error.response.data.errors)
            ? error.response.data.errors
            : null;

        let errorMessage = "";

        if (errorsArray) {
          errorMessage = errorsArray
            .map((err: any) => `${err.msg}${err.path ? ` (${err.path})` : ""}`)
            .join("\n");
        } else {
          errorMessage =
            error?.response?.data?.message || error?.message || "Failed to accept invitation.";
        }

        // Show toast error
        showToast({
          message: "Invitation Error",
          description: errorMessage,
          severity: "error",
        });
      } finally {
        setIsInviteLoading(false);
      }
    };

    void runAcceptInvite();
  }, [params?.token, setValue]);

  const { mutateAsync: registerAsync, isPending } = useMutationService({
    service: authServices.register,
    options: {
      successTitle: "Registration successful!",
      successMessage: params?.token
        ? "Please log in to your account."
        : "Please verify your email to complete registration.",
      errorTitle: "Registration failed",
      isFormData: false,
      onSuccess: (response: unknown) => {
        const typedResponse = response as any;

        // Check if this is an invited user (has token in payload)
        const isInvitedUser = Boolean(params?.token);

        if (isInvitedUser) {
          // Invited users route to login to now log in to the account
          router.push(`${AuthRoutes.login}?role=admin`);
          return;
        }

        // New user (no token in payload): go to verify email, carrying email and role in query param
        const email =
          typedResponse?.email ||
          typedResponse?.data?.email ||
          invitedEmail ||
          formInstance.getValues("email") ||
          "";

        const role = params?.role || "admin"; // Default to admin for new users

        if (email) {
          const encoded = encodeURIComponent(email);
          router.push(`${AuthRoutes.verifyEmail}?email=${encoded}&role=${role}`);
        } else {
          router.push(`${AuthRoutes.verifyEmail}?role=${role}`);
        }
      },
    },
  });

  const onValidSubmit = async (formValues: RegisterFormValues) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, phone, ...payload } = formValues;

    const registrationPayload: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role: string;
    } = {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      password: payload.password,
      role: params?.role || payload.role || "admin",
      ...(params?.token ? { invitationToken: params.token } : {}),
    };

    await registerAsync(registrationPayload as unknown as never);
  };

  const onInvalidSubmit = () => {
    console.log("Validation errors occurred");
  };

  return {
    control,
    handleSubmit: handleSubmit(onValidSubmit, onInvalidSubmit),
    isPending,
    isInviteLoading,
    isInviteAccepted,
    invitedEmail,
    router,
  };
}
