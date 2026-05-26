"use client";

import { Box, Button, Typography } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { useLogin } from "./hook/useLogin";

const LoginForm = () => {
  const { control, handleSubmit, isPending } = useLogin();

  return (
    <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 p-10 rounded-lg shadow-md w-[500px] bg-white"
      >
        {/* Header */}
        <Box className="text-center space-y-1">
          <Typography variant="h5" className="!font-semibold text-primary-outlined">
            Welcome Back!
          </Typography>
          <Typography variant="body2" className="text-primary-outlined !font-medium">
            Sign in to access your staff portal
          </Typography>
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

        {/* Login Button */}
        <Button
          variant="contained"
          fullWidth
          type="submit"
          disabled={isPending}
          sx={{
            textTransform: "none",
            backgroundColor: isPending ? "#78909C" : "#003049",
            borderRadius: "9999px",
            height: "48px",
            py: 1.2,
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Logging In..." : "Login"}
        </Button>
      </form>
    </Box>
  );
};

export default LoginForm;
