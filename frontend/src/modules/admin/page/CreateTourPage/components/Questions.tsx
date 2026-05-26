/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { Toggle } from "@/constants";
import DeleteIcon from "@/modules/shared/assets/svgs/trashIcon-red.svg";
import EditIcon from "@/modules/shared/assets/svgs/editBlackIcon.svg";
import QuestionNameModal from "@/modules/admin/component/TourModals/QuestionNameModal";
import QuestionEmailModal from "@/modules/admin/component/TourModals/QuestionEmailModal";
import QuestionLongTextModal from "@/modules/admin/component/TourModals/QuestionLongTextModal";
import QuestionShortTextModal from "@/modules/admin/component/TourModals/QuestionShortTextModal";
import QuestionPhoneModal from "@/modules/admin/component/TourModals/QuestionPhoneModal";
import QuestionMultipleEmailsModal from "@/modules/admin/component/TourModals/QuestionMultipleEmailsModal";
import QuestionAddModal from "@/modules/admin/component/TourModals/QuestionAddModal";
import { Question } from "../tour.constants";

interface QuestionsProps {
  control: any;
  setValue: any;
  getValues: any;
  watch: any;
}

type ModalType = null | "name" | "email" | "phone" | "short" | "long" | "guests" | "add";

interface QuestionWithId extends Question {
  id: string;
  enabled?: boolean;
}

const defaultBookingOptions = {
  requiresConfirmation: false,
  disableCancelling: false,
  disableRescheduling: false,
};

const Questions = ({ setValue, watch }: QuestionsProps) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [customizeQuestions, setCustomizeQuestions] = useState<boolean>(true);

  // Initialize with default questions (5-6 questions)
  const [questions, setQuestions] = useState<QuestionWithId[]>(() => [
    {
      id: Math.random().toString(36).substr(2, 9),
      inputType: "name",
      label: "Parent Name",
      placeHolder: "Name",
      isRequired: true,
      enabled: true, // Name is always enabled
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      inputType: "email",
      label: "Email Address",
      placeHolder: "Email",
      isRequired: true,
      enabled: true,
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      inputType: "phone",
      label: "Phone Number",
      placeHolder: "Phone (preferably WhatsApp)",
      isRequired: false,
      enabled: false,
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      inputType: "shortText",
      label: "What is this booking about?",
      placeHolder: "Short Text",
      isRequired: false,
      enabled: false,
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      inputType: "longText",
      label: "Additional Notes",
      placeHolder: "Long Text",
      isRequired: false,
      enabled: false,
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      inputType: "guests",
      label: "Add Guests",
      placeHolder: "Multiple Emails",
      isRequired: false,
      enabled: false,
    },
  ]);

  const getQuestionTitle = (inputType: string): string => {
    const titles: Record<string, string> = {
      name: "Parent Name",
      email: "Email Address",
      phone: "Phone Number",
      shortText: "What is this booking about?",
      longText: "Additional Notes",
      guests: "Add Guests",
    };
    return titles[inputType] || inputType;
  };

  const getQuestionSubtitle = (inputType: string): string => {
    const subtitles: Record<string, string> = {
      name: "Name",
      email: "Email",
      phone: "Phone (preferably WhatsApp)",
      shortText: "Short Text",
      longText: "Long Text",
      guests: "Multiple Emails",
    };
    return subtitles[inputType] || inputType;
  };

  const getModalType = (inputType: string): ModalType => {
    const modalMap: Record<string, ModalType> = {
      name: "name",
      email: "email",
      phone: "phone",
      shortText: "short",
      longText: "long",
      guests: "guests",
    };
    return modalMap[inputType] || "add";
  };

  const handleAddQuestion = (newQuestion: Question) => {
    if (editingQuestionId) {
      // Update existing question
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestionId
            ? { ...newQuestion, id: editingQuestionId, enabled: q.enabled ?? false }
            : q,
        ),
      );
      setEditingQuestionId(null);
    } else {
      // Add new question
      setQuestions((prev) => [
        ...prev,
        {
          ...newQuestion,
          id: Math.random().toString(36).substr(2, 9),
          enabled: false, // New questions are disabled by default
        },
      ]);
    }
    setActiveModal(null);
  };

  const handleToggleQuestion = (questionId: string, enabled: boolean) => {
    if (!customizeQuestions) return;
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, enabled } : q)));
  };

  const handleMasterToggle = (checked: boolean) => {
    setCustomizeQuestions(checked);
    if (!checked) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.inputType === "name" || q.inputType === "email" ? q : { ...q, enabled: false },
        ),
      );
    }
  };

  const handleEditQuestion = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      setEditingQuestionId(questionId);
      setActiveModal(getModalType(question.inputType));
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    // Don't allow deleting the name question (required)
    if (question && question.inputType === "name") {
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  useEffect(() => {
    // Only include enabled questions and remove id/enabled before setting value
    const enabledQuestions = questions
      .filter((q) => q.enabled !== false) // Include all questions where enabled is true or undefined (for name)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ id, enabled, ...rest }) => rest); // Remove id and enabled from the payload
    setValue("questions", enabledQuestions);
  }, [setValue, questions]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold mb-4">Booking Questions</h2>
          <p className="text-sm text-gray-500">
            Customize the questions asked on the tour booking page
          </p>
        </div>
        <Toggle checked={customizeQuestions} onChange={handleMasterToggle} />
      </div>

      {/* Questions List */}
      <div className="mt-6 bg-white border border-[#E6F7F6] rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-1">Questions</h2>
        <p className="text-xs text-gray-500 mb-4">
          Customize the questions asked on the tour booking page
        </p>

        <div className="space-y-3">
          {questions.map((question) => {
            const isNameQuestion = question.inputType === "name";
            const isEmailQuestion = question.inputType === "email";
            const isRequiredQuestion = isNameQuestion || isEmailQuestion;
            const isEnabled = question.enabled !== false;
            const showEditDelete = customizeQuestions;
            const toggleDisabled = !customizeQuestions;
            const toggleChecked = toggleDisabled && !isRequiredQuestion ? false : isEnabled;

            return (
              <div
                key={question.id}
                className="flex items-center justify-between p-4 bg-white rounded-md border border-gray-100"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {question.label || getQuestionTitle(question.inputType)}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {getQuestionSubtitle(question.inputType)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {!isNameQuestion && !isEmailQuestion && (
                    <Toggle
                      checked={toggleChecked}
                      onChange={(v: boolean) => handleToggleQuestion(question.id, v)}
                      disabled={toggleDisabled}
                    />
                  )}

                  {showEditDelete && (
                    <button
                      type="button"
                      aria-label={`edit-${question.id}`}
                      onClick={() => handleEditQuestion(question.id)}
                      className="cursor-pointer"
                    >
                      <EditIcon />
                    </button>
                  )}

                  {showEditDelete && !isNameQuestion && !isEmailQuestion && (
                    <button
                      type="button"
                      aria-label={`delete-${question.id}`}
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="cursor-pointer"
                    >
                      <DeleteIcon />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Add new question - hidden when customize questions is off */}
        {customizeQuestions && (
          <div className="my-3 px-3">
            <button
              type="button"
              onClick={() => {
                setActiveModal("add");
                setEditingQuestionId(null);
              }}
              className="inline-flex cursor-pointer text-text-tertiary items-center gap-2 text-sm "
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm border border-text-tertiary/70">
                +
              </span>
              Add a question
            </button>
          </div>
        )}
      </div>

      <Settings setValue={setValue} watch={watch} />

      {/* ---- Modals ---- */}
      {activeModal === "name" && (
        <QuestionNameModal
          onSave={handleAddQuestion}
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            setEditingQuestionId(null);
          }}
        />
      )}

      {activeModal === "email" && (
        <QuestionEmailModal
          onSave={handleAddQuestion}
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            setEditingQuestionId(null);
          }}
        />
      )}

      {activeModal === "phone" && (
        <QuestionPhoneModal
          onSave={handleAddQuestion}
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            setEditingQuestionId(null);
          }}
        />
      )}

      {activeModal === "short" && (
        <QuestionShortTextModal
          onSave={handleAddQuestion}
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            setEditingQuestionId(null);
          }}
        />
      )}

      {activeModal === "long" && (
        <QuestionLongTextModal
          onSave={handleAddQuestion}
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            setEditingQuestionId(null);
          }}
        />
      )}

      {activeModal === "guests" && (
        <QuestionMultipleEmailsModal
          onSave={handleAddQuestion}
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            setEditingQuestionId(null);
          }}
        />
      )}

      {activeModal === "add" && (
        <QuestionAddModal
          onSave={handleAddQuestion}
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            setEditingQuestionId(null);
          }}
        />
      )}
    </div>
  );
};

interface SettingsProps {
  setValue: any;
  watch: any;
}

function Settings({ setValue, watch }: SettingsProps) {
  const bookingOptions = watch("bookingOptions") ?? defaultBookingOptions;

  const updateOption = (key: keyof typeof bookingOptions, value: boolean) => {
    setValue("bookingOptions", { ...bookingOptions, [key]: value });
  };

  return (
    <div className="mt-6 p-4 space-y-3">
      <div className="flex items-start justify-between py-3 border-[#E6F7F6] border-b">
        <div>
          <div className="text-sm font-medium text-gray-800">Requires confirmation</div>
          <div className="mt-1 text-xs text-gray-400">
            The booking needs to be manually confirmed.
          </div>
        </div>
        <Toggle
          checked={bookingOptions.requiresConfirmation}
          onChange={(v) => updateOption("requiresConfirmation", v)}
        />
      </div>

      <div className="flex items-start justify-between py-3 border-[#E6F7F6] border-b">
        <div>
          <div className="text-sm font-medium text-gray-800">Disable Cancelling</div>
          <div className="mt-1 text-xs text-gray-400">Guests can no longer cancel the tour.</div>
        </div>
        <Toggle
          checked={bookingOptions.disableCancelling}
          onChange={(v) => updateOption("disableCancelling", v)}
        />
      </div>

      <div className="flex items-start justify-between py-3">
        <div>
          <div className="text-sm font-medium text-gray-800">Disable Rescheduling</div>
          <div className="mt-1 text-xs text-gray-400">
            Guests can no longer reschedule the tour.
          </div>
        </div>
        <Toggle
          checked={bookingOptions.disableRescheduling}
          onChange={(v) => updateOption("disableRescheduling", v)}
        />
      </div>
    </div>
  );
}

export default Questions;
