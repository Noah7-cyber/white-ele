import type { Question } from "./components/QuestionCard";
import type {
  CreateFormPayload,
  FormQuestionItemPayload,
  FormQuestionTypeApi,
  FormResponse,
  UpdateFormPayload,
} from "@/services/form.service";
import { FORM_QUESTION_TYPE } from "@/services/form.service";

/** Map our internal question type to API enum. */
export function internalTypeToApiType(type: string): FormQuestionTypeApi {
  const map: Record<string, FormQuestionTypeApi> = {
    short: FORM_QUESTION_TYPE.SHORT_ANSWER,
    long: FORM_QUESTION_TYPE.LONG_ANSWER,
    multiple: FORM_QUESTION_TYPE.MULTIPLE_CHOICE,
    checkbox: FORM_QUESTION_TYPE.CHECKBOX,
    image_upload: FORM_QUESTION_TYPE.IMAGE_UPLOAD,
    file_upload: FORM_QUESTION_TYPE.FILE_UPLOAD,
  };
  return map[type] ?? FORM_QUESTION_TYPE.SHORT_ANSWER;
}

/** Map API question type to our internal type. */
export function apiTypeToInternalType(apiType: string): string {
  const map: Record<string, string> = {
    short_answer: "short",
    long_answer: "long",
    multiple_choice: "multiple",
    checkbox: "checkbox",
    image_upload: "image_upload",
    file_upload: "file_upload",
  };
  return map[apiType] ?? "short";
}

export interface EditFormQuestionItemPayload extends Omit<FormQuestionItemPayload, "id"> {
  id: number | null;
}

/** Convert one question to API payload item. */
export function questionToPayloadItem(q: Question, order: number): FormQuestionItemPayload {
  console.log("Assigning Question: ", q);
  const payload: FormQuestionItemPayload = {
    title: q.title.trim(),
    type: internalTypeToApiType(q.type),
    isRequired: q.required,
    order,
    id: q.id,
  };
  if (q.imageUrls && q.imageUrls.length > 0) {
    payload.imageUrls = q.imageUrls;
  }
  if (q.options && q.options.length > 0 && (q.type === "multiple" || q.type === "checkbox")) {
    payload.options = q.options.map((label, index) => ({
      label: label.trim(),
      order: index,
    }));
  }
  return payload;
}

/** Convert one question to an edit-mode payload item (id is null for new/deleted questions). */
export function questionToEditPayloadItem(
  q: Question,
  order: number,
  serverQuestionIds: Set<number>,
): EditFormQuestionItemPayload {
  const isServerQuestion = serverQuestionIds.has(q.id);
  const payload: EditFormQuestionItemPayload = {
    title: q.title.trim(),
    type: internalTypeToApiType(q.type),
    isRequired: q.required,
    order,
    id: isServerQuestion ? q.id : null,
  };
  if (q.imageUrls && q.imageUrls.length > 0) {
    payload.imageUrls = q.imageUrls;
  }
  if (q.options && q.options.length > 0 && (q.type === "multiple" || q.type === "checkbox")) {
    payload.options = q.options.map((label, index) => ({
      label: label.trim(),
      order: index,
    }));
  }
  return payload;
}

/** Build full create-form payload from builder state. */
export function buildCreateFormPayload(
  formTitle: string,
  formDescription: string,
  questions: Question[],
): CreateFormPayload {
  return {
    title: formTitle.trim(),
    description: formDescription.trim(),
    questions: questions.map((q, index) => questionToPayloadItem(q, index + 1)),
  };
}

/**
 * Build the unified edit-mode payload.
 *
 * - Existing (server) questions keep their original id.
 * - Newly added / duplicated questions get id: null.
 * - Deleted server questions are appended with id: null (signals removal to API).
 */
export function buildEditFormPayload(
  formTitle: string,
  formDescription: string,
  questions: Question[],
  deletedQuestions: Question[],
  serverQuestionIds: Set<number>,
): UpdateFormPayload {
  // Active questions mapped with correct ids
  const activeItems = questions.map((q, index) =>
    questionToEditPayloadItem(q, index + 1, serverQuestionIds),
  );

  // Deleted server questions sent with id: null to signal deletion
  const deletedItems: EditFormQuestionItemPayload[] = deletedQuestions.map((q, index) => ({
    title: q.title.trim(),
    type: internalTypeToApiType(q.type),
    isRequired: q.required,
    order: activeItems.length + index + 1,
    id: null,
    ...(q.imageUrls && q.imageUrls.length > 0 && { imageUrls: q.imageUrls }),
    ...(q.options &&
      q.options.length > 0 &&
      (q.type === "multiple" || q.type === "checkbox") && {
        options: q.options.map((label, optIndex) => ({
          label: label.trim(),
          order: optIndex,
        })),
      }),
  }));

  return {
    title: formTitle.trim(),
    description: formDescription.trim(),
    items: [...activeItems, ...deletedItems],
  };
}

/**
 * Build the edit-mode payload for editFormItemsAsync.
 *
 * - Existing (server) questions keep their original id.
 * - Newly added / duplicated questions get id: null.
 * - Deleted server questions are appended with id: null (signals removal to API).
 */
export function buildEditFormItemsPayload(
  questions: Question[],
  deletedQuestions: Question[],
  serverQuestionIds: Set<number>,
): EditFormQuestionItemPayload[] {
  // Active questions mapped with correct ids
  const activeItems = questions.map((q, index) =>
    questionToEditPayloadItem(q, index + 1, serverQuestionIds),
  );

  // Deleted server questions sent with id: null to signal deletion
  const deletedItems: EditFormQuestionItemPayload[] = deletedQuestions.map((q, index) => ({
    title: q.title.trim(),
    type: internalTypeToApiType(q.type),
    isRequired: q.required,
    order: activeItems.length + index + 1,
    id: null,
    ...(q.imageUrls && q.imageUrls.length > 0 && { imageUrls: q.imageUrls }),
    ...(q.options &&
      q.options.length > 0 &&
      (q.type === "multiple" || q.type === "checkbox") && {
        options: q.options.map((label, optIndex) => ({
          label: label.trim(),
          order: optIndex,
        })),
      }),
  }));

  return [...activeItems, ...deletedItems];
}

/** Map API form response to builder state (for edit/load by id). */
export function formResponseToBuilderState(data: FormResponse): {
  formTitle: string;
  formDescription: string;
  questions: Question[];
} {
  const items = data.questions ?? data.items ?? data.formItems ?? [];
  const questions: Question[] = items
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({
      id: item.id ?? index + 1,
      title: item.title,
      type: apiTypeToInternalType(item.type),
      required: item.isRequired,
      imageUrls: Array.isArray(item.imageUrls)
        ? item.imageUrls
        : item.imageUrls
          ? [item.imageUrls]
          : undefined,
      options:
        item.options && (item.type === "multiple_choice" || item.type === "checkbox")
          ? item.options.sort((a, b) => a.order - b.order).map((o) => o.label)
          : undefined,
    }));
  return {
    formTitle: data.title,
    formDescription: data.description ?? "",
    questions,
  };
}
