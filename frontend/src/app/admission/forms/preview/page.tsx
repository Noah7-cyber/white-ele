"use client";

import { useEffect, useState } from "react";
import {
  ADMISSION_FORM_PREVIEW_STORAGE_KEY,
  type AdmissionFormPreviewData,
} from "@/screens/AdmissionForms/AdmissionFormPreview";
import AdmissionLiveForm from "@/modules/admin/page/AdmissionLiveForm/admissionLiveForm";

export default function AdmissionFormPreviewPage() {
  const [data, setData] = useState<AdmissionFormPreviewData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  console.log("Mounted data: ", data);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(ADMISSION_FORM_PREVIEW_STORAGE_KEY);
      console.log(raw);
      if (!raw) {
        setData(null);
        return;
      }
      const parsed = JSON.parse(raw) as AdmissionFormPreviewData;
      if (typeof parsed.formTitle === "string" && Array.isArray(parsed.questions)) {
        setData({
          formTitle: parsed.formTitle,
          formDescription:
            typeof parsed.formDescription === "string" ? parsed.formDescription : undefined,
          questions: parsed.questions,
        });
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    }
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-primary-text-light">Loading preview…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <h1 className="text-xl font-semibold text-[#022F2F] mb-2">No form to preview</h1>
        <p className="text-sm text-primary-text-light text-center max-w-md">
          Open this page from the admission form builder by clicking the Preview button when
          creating or editing a form.
        </p>
      </div>
    );
  }

  const previewData = {
    id: 1,
    title: data.formTitle,
    description: data.formDescription,
    formItems:
      data.questions?.map((q, index) => ({
        id: q.id,
        type: q.type,
        title: q.title,
        isRequired: q.required,
        options:
          q.type === "multiple" && Array.isArray(q.options)
            ? q.options.map((opt, optIndex) => ({
                id: optIndex + 1,
                value: `${optIndex + 1}`,
                label: opt,
                order: optIndex + 1,
              }))
            : undefined,
        order: index + 1,
      })) ?? [],
    status: "Unpublished",
  };

  return (
    // <AdmissionFormPreview
    //   formTitle={data.formTitle}
    //   formDescription={data.formDescription}
    //   questions={data.questions}
    // />
    <AdmissionLiveForm previewData={previewData} preview />
  );
}
