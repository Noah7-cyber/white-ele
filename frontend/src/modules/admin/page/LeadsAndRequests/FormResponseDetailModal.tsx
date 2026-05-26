"use client";

import React from "react";
import Image from "next/image";
import CloseIcon from "@mui/icons-material/Close";
import { CircularProgress, useMediaQuery } from "@mui/material";
import { CustomModal } from "@/modules/shared/component/CustomModal";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";
import successImage from "@/modules/shared/assets/images/success.png";
import { FormItemsInterface, FormResponseByIdData, FormResponseItemDetail } from "@/services/form.service";

interface FormResponseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  response: FormResponseByIdData | null;
  isLoading?: boolean;
}

function formatDate(isoDate?: string): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function resolveAnswer(
  responseItem: FormResponseItemDetail,
  formItem: FormItemsInterface,
): string {
  if (responseItem?.selectedOptionId != null && Array.isArray(formItem.options)) {
    const selectedOption = formItem.options.find((opt) => opt.id === responseItem.selectedOptionId);
    return selectedOption?.label ?? "—";
  }
  if (responseItem?.value != null && responseItem.value !== "") {
    // Some responses return option ids as value (e.g. "60" or "60,61"); resolve to labels.
    if (Array.isArray(formItem.options) && formItem.options.length > 0) {
      const rawValues = responseItem.value
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((num) => !Number.isNaN(num));

      if (rawValues.length > 0) {
        const labels = rawValues
          .map((optionId) => formItem.options.find((opt) => opt.id === optionId)?.label)
          .filter(Boolean);
        if (labels.length > 0) return labels.join(", ");
      }
    }
    return responseItem.value;
  }
  return "—";
}

function statusHeading(status?: string): string {
  if (!status?.trim()) return "Form response";
  return status.replace(/_/g, " ");
}

function statusSubtext(status?: string): string {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "submitted") {
    return "We have received this submission. Review the answers and contact details below.";
  }
  if (normalized === "completed") {
    return "This response is complete. Details are shown below.";
  }
  return "The form response details are listed below.";
}

const FormResponseDetailModal: React.FC<FormResponseDetailModalProps> = ({
  isOpen,
  onClose,
  response,
  isLoading = false,
}) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  const sortedResponseItems = [...(response?.formResponseItems ?? [])].sort(
    (a, b) => (a.formItem?.order ?? Number.MAX_SAFE_INTEGER) - (b.formItem?.order ?? Number.MAX_SAFE_INTEGER),
  );

  const heroTitle = isLoading
    ? "Loading…"
    : !response
      ? "No response found"
      : statusHeading(response.form?.title);
  const heroSubtext = isLoading
    ? "Please wait while we load the response."
    : !response
      ? "We could not load this form response."
      : statusSubtext(response.status);

  const content = (
    <div className="space-y-4">
      <div className="relative rounded-lg bg-white px-2 pt-2 pb-0 text-center">
        {!isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-0 right-0 z-10 rounded p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <span className="inline-flex text-xl leading-none">
              <CloseIcon fontSize="medium" />
            </span>
          </button>
        )}

        {!isLoading && response ? (
          <div className="mb-6 flex justify-center">
            <Image src={successImage} alt="" width={120} height={120} className="object-contain" />
          </div>
        ) : null}

        <h1 className="mb-2 text-xl font-semibold capitalize text-gray-900 sm:text-2xl">
          {heroTitle}
        </h1>
        <p className="mb-2 border-b border-gray-300 pb-5 text-sm text-gray-500">{heroSubtext}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12" aria-busy="true" aria-label="Loading response details">
          <CircularProgress size={40} sx={{ color: "#008080" }} />
        </div>
      ) : !response ? (
        <div className="py-8 text-center text-sm text-gray-500">No response details found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">Parent(s)</p>
              <p className="text-gray-900">{response.names?.join(", ") || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="break-words text-gray-900">{response.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Source</p>
              <p className="text-gray-900">{response.referralSource || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Submitted</p>
              <p className="text-gray-900">{formatDate(response.submittedAt || response.createdAt)}</p>
            </div>
          </div>

          <div className={`space-y-3 ${isMobile ? "mt-5" : "mt-6 max-h-[50vh] overflow-y-auto pr-1"}`}>
            {sortedResponseItems.map((responseItem) => {
              const formItem = responseItem.formItem;
              if (!formItem) return null;
              const answer = resolveAnswer(responseItem, formItem);

              return (
                <div
                  key={responseItem.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="mb-3 text-sm font-medium text-gray-800">
                    {formItem.title}
                    {formItem.isRequired && <span className="ml-1 text-red-500">*</span>}
                  </p>
                  {answer.startsWith("https") ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external file URL from response
                    <img
                      src={answer}
                      alt={formItem.title}
                      className="max-h-48 rounded border border-gray-200 object-contain"
                    />
                  ) : (
                    <p className="border-b border-gray-200 pb-2 text-sm text-gray-700">{answer}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer open={isOpen} onClose={onClose} title="Form Response">
        <div className="px-5 py-5">{content}</div>
      </MobileFormDrawer>
    );
  }

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} width={640} radius="12px" maxHeight="80vh">
      {content}
    </CustomModal>
  );
};

export default FormResponseDetailModal;
