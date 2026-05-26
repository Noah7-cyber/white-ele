/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChangeEvent, forwardRef, ReactNode, useState } from "react";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  BaseTextFieldProps,
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  TextField as MUITextField,
  ThemeProvider,
} from "@mui/material";

import EyeHideIcon from "@/modules/shared/assets/svgs/eyeHide.svg";
import EyeShowIcon from "@/modules/shared/assets/svgs/eyeShow.svg";
import SearchIcon from "@/modules/shared/assets/svgs/searchIcon.svg";
import CheckCircleIcon from "@/modules/shared/assets/svgs/successCheckIcon.svg";
import CalendarIcon from "@/modules/shared/assets/svgs/calendarLinear.svg";
import ClockIcon from "@/modules/shared/assets/svgs/clock.svg";

import theme from "@/theme/muiTheme";
import classNames from "classnames";

import "./textField.css";
// Default icons for date and time pickers - exported for use in CWTextField
export const DEFAULT_DATE_ICON = CalendarIcon;
export const DEFAULT_TIME_ICON = ClockIcon;

export interface TextFieldProps extends BaseTextFieldProps {
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  errorText?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  isSearch?: boolean;
  readOnly?: boolean;
  labelOnTop?: boolean;
  isLoading?: boolean;
  isRounded?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  className?: string;
  labelClassName?: string;
  requiredAsterisk?: boolean;
  errorTextClassName?: string;
  inputClasses?: string;
  min?: number;
  max?: number;
  externalLink?: boolean;
  href?: string;
  linkText?: string;
}

export const TextField = forwardRef<HTMLDivElement, TextFieldProps>(
  (
    {
      type,
      label,
      endIcon,
      startIcon,
      errorText,
      labelOnTop,
      isRounded,
      isLoading,
      isSuccess,
      readOnly,
      isSearch,
      isError,
      className,
      placeholder,
      labelClassName,
      inputClasses,
      errorTextClassName,
      min,
      max,
      variant = "outlined",
      requiredAsterisk,
      externalLink,
      linkText,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    function endItem() {
      if (type === "password") {
        return (
          <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword}>
            {showPassword ? (
              <EyeShowIcon className="text-sm" />
            ) : (
              <EyeHideIcon className="text-sm" />
            )}
          </IconButton>
        );
      }

      if (isLoading) {
        return (
          <ThemeProvider theme={theme}>
            <CircularProgress size={20} thickness={6} disableShrink />
          </ThemeProvider>
        );
      }

      if (isSuccess) return <CheckCircleIcon className="successIcon" />;
      if (isError) return <CancelIcon className="dangerIcon" />;

      return endIcon || "";
    }

    const showEndAdornment =
      type !== "date" &&
      type !== "time" &&
      (type === "password" || isLoading || isSuccess || isError || endIcon);

    const { InputProps: propsInputProps, ...restProps } = props as any;

    const mergedInputProps = {
      ...propsInputProps,
      startAdornment: propsInputProps?.startAdornment || ( (startIcon || isSearch) ? (
        <InputAdornment position="start">
          {startIcon || (isSearch && <SearchIcon />)}
        </InputAdornment>
      ) : undefined),
      endAdornment: propsInputProps?.endAdornment || (showEndAdornment ? (
        <InputAdornment position="end">{endItem()}</InputAdornment>
      ) : undefined),
      classes: {
        ...propsInputProps?.classes,
        notchedOutline: classNames(
          {
            "!border-none": isSearch,
            "!border-outline-color !border !border-solid ": variant === "outlined",
          },
          propsInputProps?.classes?.notchedOutline,
        ),
      },
      sx: {
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#D0D5DD",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "#D0D5DD",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "#008080",
          borderWidth: "1px",
        },
        ...propsInputProps?.sx,
      },
      className: classNames(
        "rounded-lg !text-xs",
        {
          "!rounded-lg md:!rounded-full": isRounded,
          "!h-10": !isSearch && !props.multiline,
          "bg-white !rounded-full !h-8": isSearch,
        },
        propsInputProps?.className,
        inputClasses,
      ),
      inputProps: {
        className: isSearch
          ? "!placeholder-dark !placeholder:font-light"
          : "!text-dark !text-xs",
        ...restProps.inputProps,
        ...propsInputProps?.inputProps,
        min,
        max,
      },
      readOnly: readOnly || propsInputProps?.readOnly,
    };

    return (
      <FormControl
        error={!!errorText}
        fullWidth={restProps.fullWidth === undefined ? true : restProps.fullWidth}
      >
        {labelOnTop && (
          <label className={classNames("bd-text-field-label text-xs font-medium", labelClassName)}>
            {label}
            {requiredAsterisk && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        {externalLink && <Box className="!text-xs !text-brandColor-active">{linkText}</Box>}
        <MUITextField
          ref={ref}
          placeholder={placeholder}
          className={classNames("!text-textColor", { "bd-text-field": !isSearch }, className)}
          label={
            !labelOnTop && label ? (
              <>
                {label}
                {requiredAsterisk && <span className="text-red-500 ml-0.5">*</span>}
              </>
            ) : undefined
          }
          variant={variant}
          type={showPassword ? "text" : type}
          InputLabelProps={{ ...restProps.InputLabelProps }}
          InputProps={mergedInputProps}
          {...restProps}
        />
        {errorText && (
          <FormHelperText className={classNames("relative -left-3", errorTextClassName)}>
            {errorText}
          </FormHelperText>
        )}
      </FormControl>
    );
  },
);

TextField.displayName = "TextField";
