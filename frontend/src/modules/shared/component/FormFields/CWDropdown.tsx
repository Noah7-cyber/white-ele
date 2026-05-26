/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Control, Controller, FieldError } from "react-hook-form";
import { Dropdown, DropdownProps, DropdownValue } from "../Dropdown";

import "./CWTextField.css";

interface DropdownError {
  name?: FieldError;
  value?: FieldError;
}

interface CWDropdownProps<T extends DropdownValue = DropdownValue> extends DropdownProps<T> {
  name: string;
  control: Control<any>;
}

export const CWDropdown = <T extends DropdownValue = DropdownValue>({
  textFieldProps,
  control,
  name,
  ...props
}: CWDropdownProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <Dropdown<T>
          {...props}
          // --- Handle Single vs Multi Select ---
          value={!props.isMultipleSelect ? value : undefined}
          selectedValues={props.isMultipleSelect && Array.isArray(value) ? value : undefined}
          onChangeValue={(val, option) => {
            if (!props.isMultipleSelect) {
              onChange(val);
              props.onChangeValue?.(val, option);
            }
          }}
          onSelectedValues={(vals) => {
            if (props.isMultipleSelect) {
              onChange(vals);
              props.onSelectedValues?.(vals);
            }
          }}
          // --- Show errors in TextField ---
          textFieldProps={{
            ...textFieldProps,
            errorText:
              error?.message ||
              (error as DropdownError)?.name?.message ||
              (error as DropdownError)?.value?.message,
          }}
          // --- Pass error state down to Dropdown if needed ---
          isError={!!error}
          errorText={
            error?.message ||
            (error as DropdownError)?.name?.message ||
            (error as DropdownError)?.value?.message
          }
        />
      )}
    />
  );
};
