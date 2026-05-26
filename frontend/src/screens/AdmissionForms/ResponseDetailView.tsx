/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { useGetFormBySlug } from "@/screens/AdmissionForms/hooks/useFormApi";
import {
  getResponderName,
  getResponderEmail,
  resolveAnswer,
} from "@/screens/AdmissionForms/FormResponse";
import EmptyStateIcon from "@/modules/shared/assets/svgs/items.svg";
import ChevronRight from "@/modules/shared/assets/svgs/chevronRight.svg";
import ChevronLeft from "@/modules/shared/assets/svgs/chevronLeft.svg";
import { Modal } from "@/modules/shared/component/modal";
import { X } from "lucide-react";

function formatDetailDate(isoDate: string): string {
  const date = new Date(isoDate);
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = (hours % 12 || 12).toString().padStart(2, "0");
  return `${month} ${day}, ${year} ${formattedHours}:${minutes} ${ampm}`;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function getFileExtensionFromUrl(url: string): string {
  const cleanUrl = url.split("?")[0].split("#")[0];
  const extension = cleanUrl.split(".").pop();
  return (extension || "").toLowerCase();
}

function isImageUrl(url: string): boolean {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
  return imageExtensions.includes(getFileExtensionFromUrl(url));
}

function isPdfUrl(url: string): boolean {
  return getFileExtensionFromUrl(url) === "pdf";
}

const ResponseDetailView = () => {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const responseId = Number(params?.responseId);

  const { data: formsData, isLoading, isError } = useGetFormBySlug(slug ?? null);
  const form = formsData?.form;

  const formResponses: any[] = useMemo(() => {
    return [...(form?.formResponses ?? [])].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }, [form?.formResponses]);

  const formItems: any[] = useMemo(() => form?.formItems ?? [], [form?.formItems]);
  const sortedItems = useMemo(
    () => [...formItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [formItems],
  );

  const currentIndex = formResponses.findIndex((r) => r.id === responseId);
  const response = formResponses[currentIndex];

  const totalResponses = formResponses.length;
  const prevResponseId = currentIndex > 0 ? formResponses[currentIndex - 1]?.id : null;
  const nextResponseId =
    currentIndex > -1 && currentIndex < totalResponses - 1
      ? formResponses[currentIndex + 1]?.id
      : null;
  const [previewAsset, setPreviewAsset] = React.useState<{
    url: string;
    title: string;
    type: "image" | "pdf" | "file";
  } | null>(null);

  if (isLoading) {
    return (
      <Box className="min-h-screen flex items-center justify-center bg-dashboard-bg/50">
        <Typography className="text-gray-500">Loading response...</Typography>
      </Box>
    );
  }

  if (isError || !response) {
    return (
      <Box className="min-h-screen bg-dashboard-bg/50 p-6">
        <ButtonIcon onClick={() => router.back()} className="mb-4">
          <Image src={LeftIcon} alt="back" />
        </ButtonIcon>
        <Box className="flex flex-col items-center justify-center gap-1.5 py-20">
          <EmptyStateIcon />
          <Typography className="text-xl! mt-2! text-[#003049]! font-medium!">
            Response not found.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="min-h-screen bg-dashboard-bg/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-5">
        <div className="flex items-center gap-3">
          <ButtonIcon
            onClick={() => router.push(`/admin/admission/forms/${slug}`)}
            className="rounded-full border! border-gray-200! flex items-center justify-center "
          >
            <Image src={LeftIcon} alt="back icon" />
          </ButtonIcon>
          <div>
            <h1 className="text-xl font-semibold text-[#003049]">Response Detail</h1>
            <p className="text-sm text-gray-500">{form?.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <button
              disabled={!prevResponseId}
              onClick={() =>
                router.push(`/admin/admission/forms/${slug}/responses/${prevResponseId}`)
              }
              className={`px-3 py-1.5 min-w-[100px] rounded-md border border-gray-300 flex items-center justify-center gap-1 font-medium ${!prevResponseId ? " text-gray-400 cursor-not-allowed" : "bg-transparent hover:bg-gray-50 cursor-pointer"}`}
            >
              <ChevronLeft />
              Previous
            </button>
            <span className="font-medium px-2">
              {currentIndex + 1} of {totalResponses}
            </span>
            <button
              disabled={!nextResponseId}
              onClick={() =>
                router.push(`/admin/admission/forms/${slug}/responses/${nextResponseId}`)
              }
              className={`px-3 py-1.5 min-w-[100px] rounded-md border border-gray-300 flex items-center justify-center gap-1 font-medium ${!nextResponseId ? " text-gray-400 cursor-not-allowed" : "bg-transparent hover:bg-gray-50 cursor-pointer"}`}
            >
              Next
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {/* Respondent Info Card */}
        <div className="bg-white rounded-xl border border-brandColor-active/20 p-4 space-y-3">
          <h2 className="text-lg font-semibold text-[#002C51]">
            {getResponderName(response, formItems)}
          </h2>
          <p className="text-sm text-brandColor-inactive">{getResponderEmail(response)}</p>
          <div className="flex gap-4 text-sm text-brandColor-inactive">
            <p>Submitted: {formatDetailDate(response.submittedAt)}</p>
            <p>Response #{response.id}</p>
          </div>
        </div>

        {/* Form Answers */}
        <div className="space-y-4">
          {sortedItems.map((formItem, index) => {
            const responseItem = response.formResponseItems.find(
              (ri: any) => ri.formItemId === formItem.id,
            );
            const answer = responseItem ? resolveAnswer(responseItem, formItem) : "—";
            const answerText = typeof answer === "string" ? answer : String(answer ?? "—");
            const isUrlAnswer = isHttpUrl(answerText);
            const isImageAnswer = isUrlAnswer && isImageUrl(answerText);
            const isPdfAnswer = isUrlAnswer && isPdfUrl(answerText);

            return (
              <div
                key={formItem.id}
                className="bg-white rounded-xl border border-brandColor-active/20 p-4"
              >
                <h3 className="font-semibold text-[#002C51] text-sm mb-4">
                  <span className="mr-2">{index + 1}.</span> {formItem.title}
                </h3>
                {isImageAnswer ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewAsset({ url: answerText, title: formItem.title, type: "image" })
                    }
                    className="ml-10 mt-2 cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- dynamic external URL */}
                    <img
                      src={answerText}
                      alt={formItem.title}
                      className="max-h-48 rounded border border-gray-200 object-contain"
                    />
                  </button>
                ) : isPdfAnswer ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewAsset({ url: answerText, title: formItem.title, type: "pdf" })
                    }
                    className="text-sm ml-6 text-brandColor-active underline underline-offset-2 cursor-pointer"
                  >
                    View PDF
                  </button>
                ) : isUrlAnswer ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewAsset({ url: answerText, title: formItem.title, type: "file" })
                    }
                    className="text-sm ml-6 text-brandColor-active underline underline-offset-2 break-all cursor-pointer text-left"
                  >
                    Open file
                  </button>
                ) : (
                  <p className="text-sm ml-6 text-primary-dark">{answerText}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
        className="w-[92vw] max-w-240 rounded-md!"
      >
        <div className="flex flex-col bg-white max-h-[85vh]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
            <Typography className="text-base! font-semibold! text-[#003049]! truncate pr-4">
              {previewAsset?.title || "File preview"}
            </Typography>
            <X
              size={20}
              className="cursor-pointer text-brandColor-active!"
              onClick={() => setPreviewAsset(null)}
            />
          </div>

          <div className="p-4 overflow-auto">
            {previewAsset?.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- dynamic external URL
              <img
                src={previewAsset.url}
                alt={previewAsset.title}
                className="max-h-[70vh] w-full object-contain rounded border border-gray-200"
              />
            ) : previewAsset?.type === "pdf" ? (
              <div className="space-y-3">
                <iframe
                  src={previewAsset.url}
                  title={previewAsset.title}
                  className="w-full h-[70vh] border border-gray-200 rounded"
                />
                <p className="text-xs text-gray-500">
                  If the PDF does not render here, use Open file below.
                </p>
                <a
                  href={previewAsset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brandColor-active underline underline-offset-2"
                >
                  Open file
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-primary-dark break-all">{previewAsset?.url}</p>
                <a
                  href={previewAsset?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brandColor-active underline underline-offset-2"
                >
                  Open file
                </a>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </Box>
  );
};

export default ResponseDetailView;
