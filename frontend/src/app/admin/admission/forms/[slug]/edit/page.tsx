"use client";

import { useParams } from "next/navigation";
import { FormSubmissionsPage } from "@/screens/AdmissionForms";
import { useGetFormBySlug } from "@/screens/AdmissionForms/hooks/useFormApi";
import { formResponseToBuilderState } from "@/screens/AdmissionForms/formMappers";

export default function EditAdmissionFormPage() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const { data: formsData, isLoading, isError } = useGetFormBySlug(slug ?? null);
  const data = formsData?.form;

  if (isLoading || !slug) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <p className="text-primary-text-light">
          {isLoading ? "Loading form…" : "No form selected."}
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5">
        <p className="text-primary-text-light">Form not found or failed to load.</p>
      </div>
    );
  }

  const { formTitle, formDescription, questions } = formResponseToBuilderState(data);

  return (
    <FormSubmissionsPage
      formId={data.id}
      initialFormTitle={formTitle}
      initialFormDescription={formDescription}
      initialQuestions={questions}
    />
  );
}
