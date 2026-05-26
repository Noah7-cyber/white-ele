import { ReactNode } from "react";

import MUIButton, { ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

import classNames from "classnames";

export interface MUIButtonProps extends ButtonProps {
  className?: string;
  variant?: "text" | "contained" | "outlined";
  children?: ReactNode;
  loading?: boolean;
  isRounded?: boolean;
  loadingIndicator?: ReactNode;
  loaderClassName?: string;
  defaultLoaderSize?: "small" | "large" | "default";
  disableElevation?: boolean;
}

export function Button({
  className,
  variant = "contained",
  children,
  loading,
  disabled,
  isRounded = true,
  loadingIndicator,
  loaderClassName,
  defaultLoaderSize = "default",
  disableElevation = true,
  ...props
}: MUIButtonProps) {
  const variantClasses = classNames({
    "!min-h-5": variant === "contained",
    "!opacity-50": loading || disabled,
    "!rounded-full": isRounded,
    loader: loading,
    "!bg-[#008080]": !className?.includes("bg"),
    "!text-primary-white disabled:!text-white": !className?.includes("bg"),
  });
  const spinnerSizeClass = {
    small: 16,
    large: 40,
    default: 24,
  };
  return (
    <MUIButton
      variant={variant}
      disabled={disabled || loading}
      className={classNames(
        "custom-button !normal-case",
        variantClasses,
        className
      )}
      disableElevation={disableElevation}
      {...props}
      classes={{ root: className }}
    >
      {loading ? (
        <>
          {loadingIndicator || (
            <CircularProgress
              className={classNames("!text-white", loaderClassName)}
              size={spinnerSizeClass[defaultLoaderSize]}
            />
          )}
        </>
      ) : (
        children
      )}
    </MUIButton>
  );
}
