/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import * as Yup from "yup";

import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { TextField } from "@/modules/shared/component/TextField";
import { Button } from "@/modules/shared/component/Button";
import type { Question } from "./components/QuestionCard";

/** Session storage key used when opening preview from the form builder. */
export const ADMISSION_FORM_PREVIEW_STORAGE_KEY = "admission-form-preview-data";

export interface AdmissionFormPreviewData {
  formTitle: string;
  formDescription?: string;
  questions: Question[];
}

type QuestionType = Question["type"];

export interface AdmissionFormAnswerPayloadItem {
  questionId: number;
  question: string;
  questionType: QuestionType;
  answer: string | string[];
}

export type AdmissionFormAnswerPayload = AdmissionFormAnswerPayloadItem[];

interface AdmissionFormPreviewProps {
  formTitle: string;
  formDescription?: string;
  questions: Question[];
  onSubmitPayload?: (payload: AdmissionFormAnswerPayload) => void;
}

interface AdmissionAnswerFormValue {
  questionId: number;
  question: string;
  questionType: QuestionType;
  required: boolean;
  answer: string | string[];
}

interface AdmissionFormSubmissionValues {
  answers: AdmissionAnswerFormValue[];
}

const buildValidationSchema = (questions: Question[]) =>
  Yup.object({
    answers: Yup.array()
      .length(questions.length, "All questions must be answered")
      .of(
        Yup.object({
          questionId: Yup.number().required(),
          question: Yup.string().required(),
          questionType: Yup.mixed<QuestionType>()
            .oneOf(["short", "long", "multiple", "checkbox", "image_upload", "file_upload"])
            .required(),
          required: Yup.boolean().required(),
          answer: Yup.mixed().test(
            "required-answer",
            "This question is required",
            function validateRequired(value) {
              const { required, questionType } = this.parent as AdmissionAnswerFormValue;

              if (!required) return true;

              if (questionType === "image_upload" || questionType === "file_upload") {
                return true;
              }

              if (questionType === "short" || questionType === "long") {
                if (typeof value !== "string") return false;
                return value.trim().length > 0;
              }

              if (questionType === "multiple") {
                if (typeof value !== "string") return false;
                return value.trim().length > 0;
              }

              if (questionType === "checkbox") {
                if (!Array.isArray(value)) return false;
                return value.length > 0;
              }

              return true;
            },
          ).test(
            "single-line-short-answer",
            "Short answer must be a single line",
            function validateSingleLine(value) {
              const { questionType } = this.parent as AdmissionAnswerFormValue;

              if (questionType !== "short") return true;
              if (typeof value !== "string") return true;

              return !value.includes("\n");
            },
          ),
        }),
      )
      .required(),
  });

export const AdmissionFormPreview: React.FC<AdmissionFormPreviewProps> = ({
  formTitle,
  formDescription,
  questions,
  onSubmitPayload,
}) => {
  const defaultValues: AdmissionFormSubmissionValues = useMemo(
    () => ({
      answers: questions.map((q) => ({
        questionId: q.id,
        question: q.title,
        questionType: q.type as QuestionType,
        required: q.required,
        answer: q.type === "checkbox" ? [] : "",
      })),
    }),
    [questions],
  );

  const validationSchema = useMemo(() => buildValidationSchema(questions), [questions]);

  const formInstance = useFormValidator<AdmissionFormSubmissionValues>({
    validationSchema,
    defaultValues,
    reValidateMode: "onChange",
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = formInstance;

  const { fields } = useFieldArray({
    control,
    name: "answers",
  });

  const handleFormSubmit = (values: AdmissionFormSubmissionValues) => {
    const payload: AdmissionFormAnswerPayload = values.answers.map((answer) => ({
      questionId: answer.questionId,
      question: answer.question,
      questionType: answer.questionType,
      answer: answer.answer,
    }));

    if (onSubmitPayload) {
      onSubmitPayload(payload);
    } else {
      // Fallback for now – integration point for API submission
      console.log("Admission form submission payload", payload);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6 space-y-6"
      >
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#022F2F]">{formTitle}</h1>
          {formDescription && (
            <p className="text-sm text-[#667085] whitespace-pre-line">{formDescription}</p>
          )}
        </header>

        <section className="space-y-6">
          {fields.map((field, index) => {
            const questionMeta = questions.find((q) => q.id === field.questionId);
            const questionType = field.questionType as QuestionType;
            const fieldError =
              (errors.answers && (errors.answers as any)[index]?.answer?.message) || undefined;

            if (!questionMeta) return null;

            return (
              <div
                key={field.id}
                className="border border-[#E4E7EC] rounded-xl px-4 py-3 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#022F2F]">
                      {questionMeta.title || "Untitled question"}
                      {questionMeta.required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    <p className="text-xs text-[#667085] mt-1">
                      {questionType === "short" &&
                        "Short answer • single-line text response"}
                      {questionType === "long" &&
                        "Long answer • multi-line text response"}
                      {questionType === "multiple" &&
                        "Multiple choice • select one option"}
                      {questionType === "checkbox" &&
                        "Checkboxes • select one or more options"}
                      {questionType === "image_upload" &&
                        "Image upload • attach an image (not collected in preview)"}
                      {questionType === "file_upload" &&
                        "File upload • attach a document (not collected in preview)"}
                    </p>
                  </div>
                </div>

                {/* Short answer */}
                {questionType === "short" && (
                  <Controller
                    control={control}
                    name={`answers.${index}.answer`}
                    render={({ field: controllerField }) => (
                      <TextField
                        variant="outlined"
                        fullWidth
                        placeholder="Type your answer (single line)"
                        value={controllerField.value as string}
                        onChange={(e) => controllerField.onChange(e.target.value)}
                        inputProps={{
                          className:
                            "!text-sm !font-normal !text-[#022F2F]",
                        }}
                        errorText={fieldError as string | undefined}
                      />
                    )}
                  />
                )}

                {/* Long answer */}
                {questionType === "long" && (
                  <Controller
                    control={control}
                    name={`answers.${index}.answer`}
                    render={({ field: controllerField }) => (
                      <TextField
                        variant="outlined"
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="Type your answer (can span multiple lines)"
                        value={controllerField.value as string}
                        onChange={(e) => controllerField.onChange(e.target.value)}
                        inputProps={{
                          className:
                            "!text-sm !font-normal !text-[#022F2F]",
                        }}
                        errorText={fieldError as string | undefined}
                      />
                    )}
                  />
                )}

                {/* Multiple choice */}
                {questionType === "multiple" && questionMeta.options && (
                  <Controller
                    control={control}
                    name={`answers.${index}.answer`}
                    render={({ field: controllerField }) => (
                      <div className="space-y-2">
                        {questionMeta.options?.map((option) => (
                          <label
                            key={option}
                            className="flex items-center gap-2 text-sm text-[#022F2F] cursor-pointer"
                          >
                            <input
                              type="radio"
                              className="h-4 w-4 text-[#008080]"
                              checked={controllerField.value === option}
                              onChange={() => controllerField.onChange(option)}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                        {fieldError && (
                          <p className="text-xs text-red-500 mt-1">{fieldError as string}</p>
                        )}
                      </div>
                    )}
                  />
                )}

                {/* Image upload / File upload — placeholder in preview */}
                {(questionType === "image_upload" || questionType === "file_upload") && (
                  <p className="text-xs text-[#667085] py-2">
                    {questionType === "image_upload"
                      ? "Image upload is not collected in this preview."
                      : "File upload is not collected in this preview."}
                  </p>
                )}

                {/* Checkbox options */}
                {questionType === "checkbox" && questionMeta.options && (
                  <Controller
                    control={control}
                    name={`answers.${index}.answer`}
                    render={({ field: controllerField }) => {
                      const currentValue = Array.isArray(controllerField.value)
                        ? controllerField.value
                        : [];

                      const toggleOption = (option: string) => {
                        if (currentValue.includes(option)) {
                          controllerField.onChange(
                            currentValue.filter((val: string) => val !== option),
                          );
                        } else {
                          controllerField.onChange([...currentValue, option]);
                        }
                      };

                      return (
                        <div className="space-y-2">
                          {questionMeta.options?.map((option) => (
                            <label
                              key={option}
                              className="flex items-center gap-2 text-sm text-[#022F2F] cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-[#008080]"
                                checked={currentValue.includes(option)}
                                onChange={() => toggleOption(option)}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                          {fieldError && (
                            <p className="text-xs text-red-500 mt-1">{fieldError as string}</p>
                          )}
                        </div>
                      );
                    }}
                  />
                )}
              </div>
            );
          })}
        </section>

        <footer className="pt-2 flex justify-end">
          <Button type="submit" className="px-8! rounded-lg!" disabled={isSubmitting}>
            Submit Form
          </Button>
        </footer>
      </form>
    </main>
  );
};

export default AdmissionFormPreview;

