/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { Control, Controller } from "react-hook-form";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import classNames from "classnames";
// import { TextField as MUITextField } from "@mui/material";
import { TextField, TextFieldProps } from "../TextField";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import "./CWTextField.css";
import { formatAmountOnType } from "@/utils/hooks/formatNumber";

dayjs.extend(customParseFormat);

/** Form value is stored as ISO date string (YYYY-MM-DD) for consistency. */
const FORM_DATE_FORMAT = "YYYY-MM-DD";
const DISPLAY_DATE_FORMAT = "DD/MM/YYYY";

function parseFormDateToDayjs(value: unknown): Dayjs | null {
  if (value == null || value === "") return null;
  if (dayjs.isDayjs(value)) return value;
  if (value instanceof Date) return dayjs(value);
  const str = String(value);
  // Accept both ISO (yyyy-MM-dd) and DD/MM/YYYY
  const parsed =
    dayjs(str, FORM_DATE_FORMAT, true).isValid() ? dayjs(str, FORM_DATE_FORMAT) : dayjs(str, DISPLAY_DATE_FORMAT, true);
  return parsed.isValid() ? parsed : null;
}

export interface CWTextFieldProps extends TextFieldProps {
  name: string;
  isAmount?: boolean;
  control: Control<any>;
  slots?: {
    /** Custom icon component for the date picker button. Set to null to hide the icon. */
    openPickerIcon?: React.ElementType | null;
  };
}

export const CWTextField: React.FC<CWTextFieldProps> = ({ isAmount, control, name, ...props }) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, onBlur, ref, ...field }, fieldState: { error } }) => {
        if (props.type === "date") {
          const parsedValue = parseFormDateToDayjs(value);
          // const hidePickerIcon = props.slots?.openPickerIcon === null;

          return (
            <DatePicker
              value={parsedValue}
              className={props.className}
              format={DISPLAY_DATE_FORMAT}
              onChange={(newValue: Dayjs | null) => {
                onChange(newValue ? newValue.format(FORM_DATE_FORMAT) : null);
              }}
              slots={{
                textField: TextField as any,
                // ...(hidePickerIcon && { openPickerButton: () => null }),
              }}
              slotProps={{
               
                // popper: { sx: { zIndex: 1400 } },
                textField: {
                  onBlur,
                  inputRef: ref,
                  errorText: error?.message,
                  label: props.label,
                  placeholder: props.placeholder || "DD/MM/YYYY",
                  className: props.className,
                  variant: props.variant,
                  fullWidth: props.fullWidth,
                  InputProps: {
                    ...(props as any).InputProps,
                    className: props.inputClasses,
                  },
                  InputLabelProps: props.InputLabelProps,
                  ...(props as any),
                  type: "text",
                } as any,
              }}
            />
            // <DatePicker
            //   value={value}
            //   onChange={(date) => onChange(date)}
            //   slotProps={{
            //     textField: {
            //       component: DatePickerTextField,
            //       label: label,
            //       labelClassName,
            //       className,
            //       errorMessage,
            //     },
            //   }}
            // />
          );
        }

        // if (props.type === "time") {
        //   return (
        //     <TimePicker
        //       value={value || null}
        //       onChange={(newValue) => onChange(newValue)}
        //       format="hh:mm A"
        //       slots={{
        //         openPickerIcon: props.slots?.openPickerIcon,
        //       }}
        //       slotProps={{
        //         openPickerButton: {
        //           className: "!p-4",
        //         } as any,
        //         textField: {
        //           label: props.label,
        //           placeholder: props.placeholder || "--:-- --",
        //           className: props.className,
        //           // labelOnTop: props.labelOnTop,
        //           // labelClassName: props.labelClassName,
        //           // inputClasses: props.inputClasses,
        //           variant: props.variant,
        //           fullWidth: props.fullWidth,
        //           InputProps: {
        //             ...(props as any).InputProps,
        //             className: props.inputClasses,
        //           },
        //           InputLabelProps: props.InputLabelProps,
        //           // errorText: error?.message,
        //         } as any,
        //       }}
        //     />
        //   );
        // }

        return (
          <TextField
            {...props}
            {...field}
            value={isAmount ? formatAmountOnType(value) || "" : value || ""}
            // Use text input for amount fields so comma formatting doesn't conflict with number inputs
            type={isAmount ? "text" : (props as any).type}
            inputMode={isAmount ? "numeric" : (props as any).inputMode}
            onChange={(event) => {
              if (isAmount) {
                let raw = event.target.value.replace(/[^0-9]/g, "");
                // When value is 0, first keystroke should replace zero instead of appending (#25)
                const currentClean = String(value ?? "").replace(/[^0-9]/g, "");
                if (currentClean === "0" && raw !== "0") {
                  raw = raw.replace(/^0+/, "") || "0";
                }
                const formatted = formatAmountOnType(raw);

                // send clean number to react-hook-form
                onChange(raw);

                // update displayed value (formatted)
                event.target.value = formatted;
              } else {
                onChange(event.target.value);
              }
              props?.onChange?.(event);
            }}
            onBlur={(event) => {
              onBlur();
              props?.onBlur?.(event);
            }}
            inputRef={ref}
            labelClassName={classNames("text-base !font-[350]", props.labelClassName)}
            errorText={error?.message}
          />
        );
      }}
    />
  );
};
