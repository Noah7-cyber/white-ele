"use client";

import { Box, Typography, Link } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { useRegister } from "./hook/useRegister";
import { Button } from "@/modules/shared/component/Button";
import NextLink from "next/link";
import { AuthRoutes } from "@/routes/auth.routes";
import { useSearchParams } from "next/navigation";
import ChevronLeftIcon from "@/modules/shared/assets/svgs/leftIconWhite.svg";
type RegisterRoleParam = "admin" | "parent" | undefined;

const RegisterForm = () => {
  const searchParams = useSearchParams();

  const roleFromParams = searchParams.get("role");
  const normalizedRole: RegisterRoleParam =
    roleFromParams === "admin" || roleFromParams === "parent" ? roleFromParams : undefined;

  const token = searchParams.get("token") || undefined;

  const { control, handleSubmit, isPending, isInviteLoading, invitedEmail, router } = useRegister({
    role: normalizedRole,
    token,
  });

  const heading =
    normalizedRole === "admin"
      ? "Create Account"
      : normalizedRole === "parent"
        ? "Create Account"
        : "Create Account";

  const subheading =
    normalizedRole === "admin"
      ? "Create an account to manage students, and staff."
      : normalizedRole === "parent"
        ? "Create your account to stay connected."
        : "Sign up to get started";

  return (
    <Box sx={{ display: "flex", justifyContent: "center", width: "100%", position: "relative" }}>
      {isInviteLoading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            // backgroundColor: "rgba(0,0,0,0.15)",
          }}
        >
          <Box className="flex flex-col items-center gap-2 bg-white/80 rounded-lg px-6 py-4 shadow-md">
            <Typography variant="body1" className="!font-medium text-primary-outlined">
              Accepting invitation...
            </Typography>
            <Typography variant="body2" className="text-text-gray text-center max-w-xs">
              Please wait while we confirm your invite details.
            </Typography>
          </Box>
        </Box>
      )}

      <form
        onSubmit={handleSubmit}
        className={`${normalizedRole === "admin" ? "max-w-[500px]" : "max-w-[480px]"
          } relative flex w-full flex-col gap-5 rounded-2xl bg-white p-5 shadow-md sm:gap-6 sm:p-8 md:p-12`}
        style={isInviteLoading ? { filter: "blur(1px)", pointerEvents: "none" } : {}}
      >
        <Box className=" flex flex-col gap-4">
          <Box
            className={`flex items-center justify-between gap-3 ${normalizedRole === "admin" ? "" : "pr-3"}`}
          >
            <Box
              onClick={() => router.back()}
              className="cursor-pointer bg-brandColor-active flex items-center justify-center rounded-full !text-white p-2.5"
            >
              <ChevronLeftIcon />
            </Box>
            <Box
              className={`text-center flex flex-col gap-1 ${normalizedRole === "admin" ? "px-3" : "px-3"}`}
            >
              <Typography className="!font-bold !text-secondary-text-gray leading-[1.2] !text-2xl">
                {heading}
              </Typography>
              <Typography className="!text-secondary-text-gray !font-normal !text-sm">
                {subheading}
              </Typography>
            </Box>
          </Box>

          <CWTextField
            control={control}
            name="firstName"
            label="First Name"
            placeholder="Enter your first name"
            labelOnTop
            fullWidth
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
            className="flex-1"
          />
          <CWTextField
            control={control}
            name="lastName"
            label="Last Name"
            placeholder="Enter your last name"
            labelOnTop
            fullWidth
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
            className="flex-1"
          />

          <CWTextField
            control={control}
            name="email"
            label="Email Address"
            placeholder="Enter your email"
            labelOnTop
            fullWidth
            disabled={!!invitedEmail}
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
            className="flex-1"
          />

          <CWTextField
            control={control}
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            labelOnTop
            fullWidth
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
            className="flex-1"
          />

          <CWTextField
            control={control}
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            labelOnTop
            fullWidth
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
            className="flex-1"
          />

          <Button
            className="text-primary-white !rounded-lg"
            fullWidth
            type="submit"
            disabled={isPending || isInviteLoading}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              height: "48px",
              py: 1.2,
              cursor: isPending || isInviteLoading ? "not-allowed" : "pointer",
            }}
          >
            {isPending ? "Creating Account..." : "Create Account"}
          </Button>

          <Box className="flex justify-center">
            <Typography className="text-text-gray !text-xs">
              Already have an account?{" "}
              <Link
                component={NextLink}
                href={
                  normalizedRole
                    ? `${AuthRoutes.login}?role=${normalizedRole}`
                    : AuthRoutes.selectRole
                }
                className="!text-brandColor-active !font-semibold !no-underline"
              >
                Login
              </Link>
            </Typography>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default RegisterForm;
