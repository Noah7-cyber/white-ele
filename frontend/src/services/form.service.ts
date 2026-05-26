/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

const formsRoot = "/api/v1/forms";

// ========================
// API ENUMS (payload types)
// ========================
export const FORM_QUESTION_TYPE = {
  SHORT_ANSWER: "short_answer",
  LONG_ANSWER: "long_answer",
  MULTIPLE_CHOICE: "multiple_choice",
  CHECKBOX: "checkbox",
  IMAGE_UPLOAD: "image_upload",
  FILE_UPLOAD: "file_upload",
} as const;

export type FormQuestionTypeApi = (typeof FORM_QUESTION_TYPE)[keyof typeof FORM_QUESTION_TYPE];

// ========================
// API PAYLOAD & RESPONSE TYPES
// ========================
export interface FormQuestionOptionPayload {
  label: string;
  order: number;
  imageUrl?: string;
}

export interface FormQuestionItemPayload {
  title: string;
  type: FormQuestionTypeApi;
  isRequired: boolean;
  order: number;
  options?: FormQuestionOptionPayload[];
  imageUrls?: string[];
  id?: string | number | null; // Optional for creation, required for updates
}

export interface EditFormQuestionItemPayload {
  title: string;
  type: FormQuestionTypeApi;
  isRequired: boolean;
  order: number;
  options?: FormQuestionOptionPayload[];
  imageUrls?: string[];
  id: number | null;
}

export interface CreateFormMetadataPayload {
  title: string;
  description: string;
}

export interface CreateFormPayload extends CreateFormMetadataPayload {
  questions: FormQuestionItemPayload[];
}

export interface UpdateFormPayload {
  title: string;
  description: string;
  items?: EditFormQuestionItemPayload[];
  questions?: EditFormQuestionItemPayload[];
}

export interface FormQuestionItemResponse {
  id: number;
  title: string;
  type: FormQuestionTypeApi;
  isRequired: boolean;
  order: number;
  options?: FormQuestionOptionPayload[];
  imageUrls?: string;
}

export interface FormResponse {
  id: number;
  title: string;
  description: string;
  questions?: FormQuestionItemResponse[];
  items?: FormQuestionItemResponse[];
  formItems?: FormQuestionItemResponse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFormResponse {
  success?: boolean;
  message?: string;
  data?: FormResponse;
}

export interface GetFormByIdResponse {
  success?: boolean;
  message?: string;
  forms?: FormResponse[];
}

export interface FormItemsOptionsInterface {
  id: number;
  formItemId: number;
  label: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormItemsInterface {
  id: number;
  formId: number;
  title: string;
  type: string;
  imageUrl: null | string;
  isRequired: boolean;
  order: number;
  updatedAt: string;
  options: FormItemsOptionsInterface[];
}

export interface Forms {
  createdAt: string;
  description: string;
  formItems: FormItemsInterface[];
  formResponses: any;
  id: number;
  schoolId: number;
  slug: string | null;
  title: string;
  updatedAt: string;
  status: string;
  url: string;
}

export interface FormResponseItemDetail {
  id: number;
  formResponseId: number;
  formItemId: number;
  value: string | null;
  selectedOptionId: number | null;
  createdAt?: string;
  updatedAt?: string;
  formItem?: FormItemsInterface;
  selectedOption?: FormItemsOptionsInterface | null;
}

export interface FormResponseByIdData {
  id: number;
  formId: number;
  userId: number;
  names: string[];
  email: string;
  referralSource: string;
  additionalContacts: string[];
  submittedAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  formResponseItems: FormResponseItemDetail[];
  form?: Forms;
}

export interface GetFormResponseByIdResponse {
  success: boolean;
  message: string;
  response: FormResponseByIdData;
}

export type FormResponseStatusPatch = "completed" | "accepted" | "rejected" | "withdraw";

export interface PatchFormResponseStatusPayload {
  status: FormResponseStatusPatch;
}

// ========================
// ENDPOINTS
// ========================
export const formEndpoints = {
  createForm: { path: formsRoot, method: ApiMethods.POST },
  getForm: { path: formsRoot, method: ApiMethods.GET },
};

export const formDynamicEndpoints = {
  getFormById: (formId: string | number) => ({
    path: `${formsRoot}/formId=${formId}`,
    method: ApiMethods.GET,
  }),
  getFormBySlug: (slug: string) => ({
    path: `${formsRoot}/${slug}`,
    method: ApiMethods.GET,
  }),
  updateFormById: (formId: string | number) => ({
    path: `${formsRoot}/${formId}`,
    method: ApiMethods.PUT,
  }),
  deleteForm: (formId: string | number) => ({
    path: `${formsRoot}/${formId}`,
    method: ApiMethods.DELETE,
  }),
  deleteFormItem: (formId: string | number, itemId: string | number) => ({
    path: `${formsRoot}/${formId}/items/${itemId}`,
    method: ApiMethods.DELETE,
  }),
  submitForm: (formId: string | number) => ({
    path: `${formsRoot}/${formId}/respond`,
    method: ApiMethods.POST,
  }),
  getFormResponseById: (responseId: string | number) => ({
    path: `${formsRoot}/responses/${responseId}`,
    method: ApiMethods.GET,
  }),
  patchFormResponseStatus: (responseId: string | number) => ({
    path: `${formsRoot}/responses/${responseId}`,
    method: ApiMethods.PATCH,
  }),
  patchFormStatus: (formId: string | number) => ({
    path: `${formsRoot}/${formId}`,
    method: ApiMethods.PUT,
  }),
};

// ========================
// SERVICE GENERATOR (for useMutationService / useQueryService)
// ========================
type ServiceShape = { path: string; method: ApiMethods };

function generateFormServices<T extends Record<string, ServiceShape>>(endpoints: T): T {
  return endpoints as T;
}

export const formServices = generateFormServices(formEndpoints);
