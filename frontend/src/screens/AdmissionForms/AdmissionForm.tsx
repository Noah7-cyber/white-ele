"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { FormHeader } from "./components/FormHeader";
import { FormTitleCard } from "./components/FormTitleCard";
import { QuestionCard, Question } from "./components/QuestionCard";
import { AddQuestionButton } from "./components/AddQuestionButton";
import { showToast } from "@/modules/shared/component/Toast";
import { buildCreateFormPayload, buildEditFormPayload } from "./formMappers";
import { formDynamicEndpoints, formServices } from "@/services/form.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import type {
  CreateFormMetadataPayload,
  CreateFormPayload,
  CreateFormResponse,
  FormQuestionItemPayload,
  FormResponse,
  UpdateFormPayload,
} from "@/services/form.service";
import FormPreviewModal from "@/modules/admin/component/AdmissionForms/FormPreviewModal/formPreviewModal";

function validateFormForPublish(
  formTitle: string,
  questions: Question[],
): { valid: boolean; message?: string } {
  const trimmedTitle = formTitle?.trim() ?? "";
  if (!trimmedTitle) {
    return { valid: false, message: "Form title is required." };
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const trimmedQuestionTitle = q.title?.trim() ?? "";
    if (!trimmedQuestionTitle) {
      return {
        valid: false,
        message: `Question ${i + 1} needs a title.`,
      };
    }
    if (q.type === "multiple" || q.type === "checkbox") {
      const options = q.options ?? [];
      if (options.length === 0) {
        return {
          valid: false,
          message: `Question "${trimmedQuestionTitle}" must have at least one option.`,
        };
      }
      const emptyOptionIndex = options.findIndex((opt) => !opt?.trim());
      if (emptyOptionIndex >= 0) {
        return {
          valid: false,
          message: `Question "${trimmedQuestionTitle}" has an empty option. Add or remove options.`,
        };
      }
    }
  }

  return { valid: true };
}

export interface FormSubmissionsPageProps {
  /** When provided, form is in edit mode (load from API). */
  formId?: string | null;
  /** Prefill title (e.g. from GET form by id). */
  initialFormTitle?: string;
  /** Prefill description. */
  initialFormDescription?: string;
  /** Prefill questions (e.g. from GET form by id). */
  initialQuestions?: Question[];
}

// export interface FormQuestionProps extends FormQuestionItemPayload {
//   id: number | null;
// }

export function FormSubmissionsPage({
  formId = null,
  initialFormTitle,
  initialFormDescription,
  initialQuestions,
}: FormSubmissionsPageProps = {}) {
  const isEditMode = formId != null && formId !== "";
  const router = useRouter();
  const [formTitle, setFormTitle] = useState(initialFormTitle ?? "Form Title");
  const [formDescription, setFormDescription] = useState(initialFormDescription ?? "");
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions ?? [
      { id: 1, type: "short", title: "Untitled Question", required: false },
      { id: 2, type: "long", title: "Untitled Question", required: false },
      {
        id: 3,
        type: "multiple",
        title: "Untitled Question",
        required: false,
        options: ["Option 1"],
      },
    ],
  );
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Track server-assigned question IDs and deleted questions for edit mode
  const initialQuestionIdsRef = useRef<Set<number>>(new Set());
  const [deletedQuestions, setDeletedQuestions] = useState<Question[]>([]);
  const localIdCounterRef = useRef(-1);

  // Generate a negative local ID for new questions (won't collide with server IDs)
  const generateLocalId = () => {
    const id = localIdCounterRef.current;
    localIdCounterRef.current -= 1;
    return id;
  };

  const openPreviewModal = () => {
    setIsPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
  };

  useEffect(() => {
    if (initialFormTitle !== undefined) setFormTitle(initialFormTitle);
    if (initialFormDescription !== undefined) setFormDescription(initialFormDescription);
    if (initialQuestions !== undefined && initialQuestions.length > 0) {
      setQuestions(initialQuestions);
      // Store the server-assigned IDs so we can distinguish them from locally-created ones
      initialQuestionIdsRef.current = new Set(initialQuestions.map((q) => q.id));
      // Reset deleted questions when initial data changes
      setDeletedQuestions([]);
    }
  }, [initialFormTitle, initialFormDescription, initialQuestions]);

  const handleNavigateBack = () => {
    router.back();
  };

  const { mutateAsync: createFormAsync, isPending: isPublishing } = useMutationService<
    CreateFormPayload,
    CreateFormResponse
  >({
    service: formServices.createForm,
    options: {
      successTitle: "Form published",
      successMessage: "Your admission form has been published.",
      errorTitle: "Failed to publish form",
    },
  });

  const { mutateAsync: updateFormAsync, isPending: isFormUpdating } = useMutationService<
    UpdateFormPayload,
    CreateFormResponse
  >({
    service: formDynamicEndpoints.updateFormById(formId || ""),
    options: {
      successTitle: "Form updated",
      successMessage: "Your admission form has been updated.",
      errorTitle: "Failed to update form",
    },
  });

  const isFormActionLoading = isEditMode ? isFormUpdating : isPublishing;

  const handlePreview = () => {
    openPreviewModal();
  };

  const handlePublish = async () => {
    const result = validateFormForPublish(formTitle, questions);
    if (!result.valid) {
      showToast({
        message: "Cannot publish form",
        description: result.message,
        severity: "error",
        duration: 5000,
      });
      return;
    }

    try {
      if (isEditMode) {
        const payload = buildEditFormPayload(
          formTitle,
          formDescription,
          questions,
          deletedQuestions,
          initialQuestionIdsRef.current,
        );
        console.log(payload);
        await updateFormAsync({
          title: payload.title,
          description: payload.description,
          items: payload?.items?.map((q) => ({ ...q, id: null })),
        });
      } else {
        const payload = buildCreateFormPayload(formTitle, formDescription, questions);
        const transformedPayload = payload.questions.map((q) => ({
          ...q,
          id: null,
        }));
        await createFormAsync({ ...payload, questions: transformedPayload });
      }
      router.push("/admin/admission/tours");
    } catch {
      // Error toast handled by useMutationService
    }
  };

  const addQuestion = () => {
    const newId = isEditMode ? generateLocalId() : Math.max(...questions.map((q) => q.id), 0) + 1;
    setQuestions([
      ...questions,
      {
        id: newId,
        type: "short",
        title: "Untitled Question",
        required: false,
      },
    ]);
  };

  const duplicateQuestion = (id: number) => {
    const questionToDuplicate = questions.find((q) => q.id === id);
    if (questionToDuplicate) {
      const newId = isEditMode ? generateLocalId() : Math.max(...questions.map((q) => q.id), 0) + 1;
      const newQuestion = { ...questionToDuplicate, id: newId };
      const index = questions.findIndex((q) => q.id === id);
      const newQuestions = [...questions];
      newQuestions.splice(index + 1, 0, newQuestion);
      setQuestions(newQuestions);
    }
  };

  const deleteQuestion = (id: number) => {
    // In edit mode, track deleted server questions so we can send them with id: null
    if (isEditMode && initialQuestionIdsRef.current.has(id)) {
      const deletedQ = questions.find((q) => q.id === id);
      if (deletedQ) {
        setDeletedQuestions((prev) => [...prev, deletedQ]);
      }
    }
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestionType = (id: number, type: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          const updated = { ...q, type };
          if (type === "multiple" || type === "checkbox") {
            updated.options = updated.options || ["Option 1"];
          } else {
            delete updated.options;
          }
          return updated;
        }
        return q;
      }),
    );
  };

  const updateQuestionTitle = (id: number, title: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, title } : q)));
  };

  const toggleRequired = (id: number) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, required: !q.required } : q)));
  };

  const addOption = (questionId: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          return { ...q, options: [...q.options, `Option ${q.options.length + 1}`] };
        }
        return q;
      }),
    );
  };

  const updateOption = (questionId: number, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      }),
    );
  };

  const removeOption = (questionId: number, optionIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options && q.options.length > 1) {
          return { ...q, options: q.options.filter((_, i) => i !== optionIndex) };
        }
        return q;
      }),
    );
  };

  const updateQuestionImageUrls = (id: number, imageUrls: string[]) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, imageUrls } : q)));
  };

  const previewData = {
    id: 1,
    title: formTitle,
    description: formDescription,
    formItems:
      questions?.map((q, index) => ({
        id: q.id,
        type: q.type === "multiple" ? "multiple_choice" : q.type,
        title: q.title,
        isRequired: q.required,
        options: !!q?.options?.length
          ? q.options.map((opt, optIndex) => ({
              id: optIndex + 1,
              value: `${optIndex + 1}`,
              label: opt,
              order: optIndex + 1,
            }))
          : undefined,
        imageUrls: q.imageUrls,
        order: index + 1,
      })) ?? [],
    status: "Unpublished",
  };

  return (
    <>
      <main className="min-h-screen p-5 space-y-6">
        <FormHeader
          onNavigateBack={handleNavigateBack}
          onPublish={handlePublish}
          onPreview={handlePreview}
          isPublishing={isFormActionLoading}
          isEditMode={isEditMode}
        />

        <div className="w-full space-y-6 pb-20">
          <FormTitleCard
            title={formTitle}
            description={formDescription}
            onTitleChange={setFormTitle}
            onDescriptionChange={setFormDescription}
          />

          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              canDelete={questions.length > 1}
              onUpdateTitle={updateQuestionTitle}
              onUpdateType={updateQuestionType}
              onToggleRequired={toggleRequired}
              onDuplicate={duplicateQuestion}
              onDelete={deleteQuestion}
              onAddOption={addOption}
              onUpdateOption={updateOption}
              onRemoveOption={removeOption}
              onUpdateImageUrls={updateQuestionImageUrls}
            />
          ))}

          <AddQuestionButton onClick={addQuestion} />
        </div>
      </main>
      <FormPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={closePreviewModal}
        previewData={previewData}
        contentClassName="max-w-full p-6"
      />
    </>
  );
}
