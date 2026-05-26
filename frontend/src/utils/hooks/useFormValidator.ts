"use client";

import { FieldValues, useForm, UseFormProps } from "react-hook-form";

import { yupResolver } from "@hookform/resolvers/yup";

import { AnyObjectSchema } from "yup";

export interface UseFormValidatorProps<T extends FieldValues = FieldValues>
  extends UseFormProps<T> {
  validationSchema?: AnyObjectSchema;
}

export function useFormValidator<T extends FieldValues = FieldValues>({
  validationSchema,
  ...props
}: UseFormValidatorProps<T>) {
  const resolver = validationSchema ? yupResolver(validationSchema) : undefined;

  return useForm<T>({
    ...props,
    resolver,
    reValidateMode: props.reValidateMode || "onChange",
  });
}
