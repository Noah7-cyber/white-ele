/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import { Modal } from "@/modules/shared/component/modal";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { TextField } from "@/modules/shared/component/TextField";
import { Button } from "@/modules/shared/component/Button";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import * as Yup from "yup";
import { showToast } from "@/modules/shared/component/Toast";
import { authServices, LoginRequest, LoginResponse } from "@/services/auth.service";
import { teacherDynamicEndpoints } from "@/services/teacher.service";
import { ParentDynamicEndpoints as ParentEndpoints } from "@/services/parent.service";
import client from "@/utils/client";
import { ApiMethods } from "@/utils/client";

export type ForgotPINModalType = "teacher" | "parent";

interface ForgotPINModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ForgotPINModalType;
  prefilledEmail?: string;
  onSuccess?: () => void;
}

// Step 1: Login form
const loginSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

type LoginFormValues = Yup.InferType<typeof loginSchema>;

const loginDefaultValues: LoginFormValues = {
  email: "",
  password: "",
};

// Step 2: Reset PIN form (same as sidebar useResetKioskPin)
const resetPinSchema = Yup.object({
  pin: Yup.string()
    .required("New PIN is required")
    .length(4, "PIN must be exactly 4 digits")
    .matches(/^\d{4}$/, "PIN must contain only numbers"),
  confirmPin: Yup.string()
    .required("Please confirm your PIN")
    .length(4, "PIN must be exactly 4 digits")
    .matches(/^\d{4}$/, "PIN must contain only numbers")
    .oneOf([Yup.ref("pin")], "PINs must match"),
});

type ResetPinFormValues = Yup.InferType<typeof resetPinSchema>;

const resetPinDefaultValues: ResetPinFormValues = {
  pin: "",
  confirmPin: "",
};

export const ForgotPINModal: React.FC<ForgotPINModalProps> = ({
  isOpen,
  onClose,
  type,
  prefilledEmail = "",
  onSuccess,
}) => {
  const [step, setStep] = useState<"login" | "reset">("login");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [entityId, setEntityId] = useState<number | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);

  const loginForm = useFormValidator<LoginFormValues>({
    validationSchema: loginSchema,
    defaultValues: loginDefaultValues,
  });

  const resetPinForm = useFormValidator<ResetPinFormValues>({
    validationSchema: resetPinSchema,
    defaultValues: resetPinDefaultValues,
  });

  const setLoginEmail = loginForm.setValue;
  useEffect(() => {
    if (isOpen && prefilledEmail) {
      setLoginEmail("email", prefilledEmail, { shouldValidate: false });
    }
  }, [isOpen, prefilledEmail, setLoginEmail]);

  const handleClose = () => {
    setStep("login");
    setAccessToken(null);
    setEntityId(null);
    loginForm.reset(loginDefaultValues);
    resetPinForm.reset(resetPinDefaultValues);
    onClose();
  };

  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsLoggingIn(true);
    try {
      const payload: LoginRequest & { role?: string } = {
        email: values.email.trim(),
        password: values.password,
        role: type === "teacher" ? "staff" : "parent",
      };
      const response = await client.request<typeof payload, LoginResponse>({
        ...authServices.login,
        method: authServices.login.method ?? ApiMethods.POST,
        data: payload,
      });

      const token = (response as any)?.accessToken ?? (response as any)?.data?.accessToken;
      const user = (response as any)?.user ?? (response as any)?.data?.user;
      if (!token || !user) {
        showToast({
          message: "Invalid response",
          description: "Could not complete sign in. Please try again.",
          severity: "error",
        });
        return;
      }

      const role = (user?.role ?? "").toLowerCase();
      const expectedRole = type === "teacher" ? "staff" : "parent";
      if (role !== expectedRole) {
        showToast({
          message: "Wrong account type",
          description: `Please sign in with your ${type} account (${type === "teacher" ? "staff" : "parent"}).`,
          severity: "error",
        });
        return;
      }

      let id: number | null = null;
      if (type === "teacher") {
        const staff = (user as any)?.staff;
        if (Array.isArray(staff) && staff[0]?.id != null) {
          id = Number(staff[0].id);
        } else if (
          staff &&
          typeof staff === "object" &&
          !Array.isArray(staff) &&
          staff.id != null
        ) {
          id = Number(staff.id);
        } else {
          id = (user as any)?.staffId ?? null;
        }
      } else {
        const parent = (user as any)?.parent;
        if (Array.isArray(parent) && parent[0]?.id != null) {
          id = Number(parent[0].id);
        } else if (
          parent &&
          typeof parent === "object" &&
          !Array.isArray(parent) &&
          parent.id != null
        ) {
          id = Number(parent.id);
        } else {
          id = (user as any)?.parentId ?? null;
        }
      }

      if (id == null) {
        showToast({
          message: "Account not found",
          description: "Your account does not have kiosk access. Contact your administrator.",
          severity: "error",
        });
        return;
      }

      setAccessToken(token);
      setEntityId(id);
      setStep("reset");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Sign in failed. Check your email and password.";
      showToast({
        message: "Sign in failed",
        description: message,
        severity: "error",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const onResetPinSubmit = async (values: ResetPinFormValues) => {
    if (accessToken == null || entityId == null) return;
    setIsResettingPin(true);
    try {
      const endpoint =
        type === "teacher"
          ? teacherDynamicEndpoints.updateTeacher(entityId)
          : ParentEndpoints.updateParent(entityId);

      await client.request<{ pin: string }, unknown>({
        path: endpoint.path,
        method: endpoint.method as ApiMethods,
        data: { pin: values.pin },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      showToast({
        message: "Kiosk PIN reset successfully",
        description: "You can now use your new PIN to sign in at the kiosk.",
        severity: "success",
      });
      handleClose();
      onSuccess?.();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? err?.message ?? "Failed to update PIN. Please try again.";
      showToast({
        message: "Failed to reset PIN",
        description: message,
        severity: "error",
      });
    } finally {
      setIsResettingPin(false);
    }
  };

  const label = type === "teacher" ? "Teacher" : "Parent";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="rounded-xl w-full max-w-[400px] sm:max-w-[480px]"
    >
      <Box className="p-4 flex flex-col gap-4">
        <Box className="flex items-center justify-between pb-3 border-b border-border-light">
          <Typography className="text-lg! font-semibold! text-gray-800!">
            {step === "login" ? `Reset ${label} PIN` : "Set new PIN"}
          </Typography>
          <button onClick={handleClose} className="cursor-pointer" aria-label="Close">
            <CloseIcon />
          </button>
        </Box>

        {step === "login" ? (
          <>
            <Typography className="text-sm! text-gray-600! mb-2!">
              Sign in with your {type} account to reset your kiosk PIN.
            </Typography>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="flex flex-col gap-4">
              <CWTextField
                control={loginForm.control}
                name="email"
                label="Email"
                type="email"
                placeholder="Enter your email"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10"
                className="w-full"
              />
              <CWTextField
                control={loginForm.control}
                name="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10"
                className="w-full"
              />
              <Box className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleClose}
                  className="flex-1! rounded-lg! border! !bg-transparent border-gray-300! text-gray-700!"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isLoggingIn}
                  disabled={isLoggingIn}
                  className="flex-1! rounded-lg! bg-[#008080]! text-white!"
                >
                  {isLoggingIn ? "Signing in..." : "Sign in"}
                </Button>
              </Box>
            </form>
          </>
        ) : (
          <>
            <Typography className="text-sm! text-gray-600! mb-2!">
              Choose a new 4-digit kiosk PIN. You will use this at the kiosk only.
            </Typography>
            <form
              onSubmit={resetPinForm.handleSubmit(onResetPinSubmit)}
              className="flex flex-col gap-4"
            >
              <Controller
                name="pin"
                control={resetPinForm.control}
                render={({ field: { value, onChange, onBlur, ref }, fieldState: { error } }) => (
                  <TextField
                    value={value ?? ""}
                    onChange={(e) => onChange((e.target.value.replace(/\D/g, "").slice(0, 4)))}
                    onBlur={onBlur}
                    inputRef={ref}
                    label="New PIN"
                    placeholder="4-digit PIN"
                    labelOnTop
                    type="password"
                    inputMode="numeric"
                    inputProps={{ maxLength: 4, autoComplete: "one-time-code" }}
                    labelClassName="!text-sm !font-medium !text-input-gray"
                    inputClasses="mt-1 !text-sm !h-10"
                    className="w-full"
                    errorText={error?.message}
                    isError={!!error}
                    autoFocus
                  />
                )}
              />
              <Controller
                name="confirmPin"
                control={resetPinForm.control}
                render={({ field: { value, onChange, onBlur, ref }, fieldState: { error } }) => (
                  <TextField
                    value={value ?? ""}
                    onChange={(e) => onChange((e.target.value.replace(/\D/g, "").slice(0, 4)))}
                    onBlur={onBlur}
                    inputRef={ref}
                    label="Confirm PIN"
                    placeholder="Confirm 4-digit PIN"
                    labelOnTop
                    type="password"
                    inputMode="numeric"
                    inputProps={{ maxLength: 4, autoComplete: "one-time-code" }}
                    labelClassName="!text-sm !font-medium !text-input-gray"
                    inputClasses="mt-1 !text-sm !h-10"
                    className="w-full"
                    errorText={error?.message}
                    isError={!!error}
                  />
                )}
              />
              <Box className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setStep("login")}
                  className="flex-1! rounded-lg! !bg-transparent border! border-gray-300! text-gray-700!"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  loading={isResettingPin}
                  disabled={isResettingPin}
                  className="flex-1! rounded-lg! bg-[#008080]! text-white!"
                >
                  {isResettingPin ? "Updating..." : "Reset PIN"}
                </Button>
              </Box>
            </form>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default ForgotPINModal;
