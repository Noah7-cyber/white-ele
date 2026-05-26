"use client";

import { Box, Checkbox, CircularProgress, FormControlLabel, Typography } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { useLogin } from "./hook/useLogin";
import { Button } from "@/modules/shared/component/Button";
import Link from "next/link";
import { AuthRoutes } from "@/routes/auth.routes";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Controller } from "react-hook-form";
import ChevronLeftIcon from "@/modules/shared/assets/svgs/leftIconWhite.svg";
import { buildReturnUrlQuery, normalizeReturnUrl } from "@/utils/auth/returnUrl";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromParams = searchParams.get("role");
  const returnUrl = searchParams.get("returnUrl");
  const isKioskLogin = useMemo(() => {
    if (searchParams.get("openAttendanceModal") === "1") return true;
    if (!returnUrl) return false;

    const normalizedReturnUrl = decodeURIComponent(returnUrl);
    return /[?&]openAttendanceModal=1(?:&|$)/.test(normalizedReturnUrl);
  }, [returnUrl, searchParams]);
  const normalizedRole =
    roleFromParams === "admin" || roleFromParams === "staff" || roleFromParams === "parent"
      ? roleFromParams
      : null;
  const normalizedReturnUrl = normalizeReturnUrl(returnUrl);

  useEffect(() => {
    if (normalizedRole) return;
    const query = normalizedReturnUrl
      ? `?returnUrl=${encodeURIComponent(normalizedReturnUrl)}`
      : "";
    router.replace(`${AuthRoutes.selectRole}${query}`);
  }, [normalizedRole, normalizedReturnUrl, router]);

  const { control, handleSubmit, isPending } = useLogin(normalizedRole || undefined);

  const registerHref = useMemo(() => {
    const base = AuthRoutes.role;
    return normalizedRole ? `${base}?role=${normalizedRole}` : base;
  }, [normalizedRole]);

  const shouldShowBackButton = useMemo(
    () => Boolean(searchParams.get("role") && normalizedRole),
    [normalizedRole, searchParams],
  );

  const selectRoleHref = useMemo(
    () => `${AuthRoutes.selectRole}${buildReturnUrlQuery(normalizedReturnUrl)}`,
    [normalizedReturnUrl],
  );

  const forgotPasswordHref = useMemo(() => {
    const base = AuthRoutes.forgotPassword;
    return normalizedRole ? `${base}?role=${normalizedRole}` : base;
  }, [normalizedRole]);

  if (!normalizedRole) return null;

  return (
    <Box
      className="w-full flex justify-center items-center"
      sx={{ display: "flex", justifyContent: "center", width: "100%" }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[500px] flex-col gap-5 rounded-2xl bg-white p-5 shadow-md sm:gap-6 sm:p-10"
      >
        <Box className="flex items-center justify-between gap-3">
          {shouldShowBackButton ? (
            <Box
              onClick={() => router.push(selectRoleHref)}
              className="cursor-pointer bg-brandColor-active flex items-center justify-center rounded-full !text-white p-2.5"
            >
              <ChevronLeftIcon />
            </Box>
          ) : (
            <Box className="w-10 h-10" />
          )}
          <Box className="text-center flex flex-col gap-1 flex-1">
            <Typography className="!font-bold !text-secondary-text-gray leading-[1.2] !text-2xl">
              {isKioskLogin ? "Kiosk Sign Up" : "Login now"}
            </Typography>
            <Typography className="!text-secondary-text-gray !font-normal !text-sm">
              {isKioskLogin
                ? "Log in to your kiosk to clock in/out of your child"
                : "Sign in to manage students, and staff."}
            </Typography>
          </Box>
          {shouldShowBackButton ? <Box className="w-10 h-10" /> : null}
        </Box>

        {/* Email */}
        <CWTextField
          control={control}
          name="email"
          label="Email Address"
          placeholder="Enter your email"
          labelOnTop
          required
          fullWidth
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
          className="flex-1"
        />

        {/* Password */}
        <CWTextField
          control={control}
          name="password"
          label="Password"
          type="password"
          labelOnTop
          placeholder="Enter your password"
          required
          fullWidth
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
          className="flex-1"
        />
        {!isKioskLogin && (
          <Controller
            control={control}
            name="keepMeLoggedIn"
            render={({ field }) => (
              <FormControlLabel
                className="!m-0"
                control={
                  <Checkbox
                    checked={Boolean(field.value)}
                    onChange={(event) => field.onChange(event.target.checked)}
                    size="small"
                    sx={{
                      color: "#D0D5DD",
                      "&.Mui-checked": { color: "#008080" },
                      margin: "0px",
                      padding: "0px 16px 0px 10px",
                      width: "16px",
                      height: "16px",
                      "& .MuiTouchRipple-root": {
                        display: "none",
                      },
                    }}
                  />
                }
                label={
                  <Typography className="!text-xs !font-normal !text-secondary-text-gray">
                    Keep me logged in
                  </Typography>
                }
              />
            )}
          />
        )}
        {/* Login Button */}
        <Button
          className=" text-primary-white !rounded-lg"
          fullWidth
          type="submit"
          disabled={isPending}
          sx={{
            textTransform: "none",

            borderRadius: "8px",
            height: "48px",
            py: 1.2,
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? <CircularProgress size={24} className="!text-white" /> : "Login"}
        </Button>

        <Box className="flex justify-center mb-3">
          <Link href={forgotPasswordHref} className="!text-xs text-text-gray">
            Forgot Password? <span className="!text-brandColor-active !font-semibold">Recover</span>
          </Link>
        </Box>
        <Box className="flex justify-center">
          <Link href={registerHref} className="!text-xs text-text-gray">
            Don&apos;t have an account?{" "}
            <span className="!text-brandColor-active !font-semibold">Sign Up</span>
          </Link>
        </Box>
      </form>
    </Box>
  );
};

export default LoginForm;
