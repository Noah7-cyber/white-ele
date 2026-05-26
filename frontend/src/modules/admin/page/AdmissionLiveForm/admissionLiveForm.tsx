/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";
import useAdmissionForm from "@/modules/admin/page/AdmissionForm/hooks/useForm";
import WhitePenguinLogo from "@/modules/shared/assets/images/LOGO (1).svg";
import SubmissionSuccess from "../../component/AdmissionForms/SubmissionSuccess/submissionSuccess";
import QuestionCard from "../../component/AdmissionForms/QuestionCard/questionCard";
import classNames from "classnames";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { uploadServices } from "@/services/upload.service";
import { formDynamicEndpoints } from "@/services/form.service";
import { showToast } from "@/modules/shared/component/Toast";

// ========================
// Types
// ========================
export interface FormOption {
  id: number;
  value: string;
  label: string;
  order?: number;
}

export interface FormItem {
  id: number;
  title: string;
  type: string;
  isRequired: boolean;
  order?: number;
  options?: FormOption[];
}

export interface FormData {
  id: number;
  title: string;
  description?: string;
  formItems: FormItem[];
  status: string;
  schoolId?: number;
}

type FormValues = Record<number, string | string[] | File | null>;
type FormErrors = Record<number, string>;

export enum GUEST_REFERRAL_SOURCE {
  SCHOOL_WEBSITE = "School Website",
  GOOGLE_SEARCH = "Google Search",
  WHATSAPP = "WhatsApp",
  BLOG_POST = "Blog Post/Article",
  PARENT = "Referral (Parent)",
  STAFF = "Referral (Staff)",
  Print = "Flyer/Billboard",
  OTHER = "Other",
}

const REFERRAL_SOURCE_OPTIONS = Object.values(GUEST_REFERRAL_SOURCE).map((label) => ({
  value: label,
  label,
}));

interface AdmissionLiveFormProps {
  preview?: boolean;
  previewData?: FormData | null;
  contentClassName?: string;
}

const AdmissionLiveForm = ({
  preview = false,
  previewData = null,
  contentClassName,
}: AdmissionLiveFormProps) => {
  const params = useParams();
  const id = params?.id as string;

  const {
    data: form,
    isLoading,
    isError,
  } = useAdmissionForm({
    slug: id,
    configOptions: { enabled: !!id && !preview },
  });
  const activeForm = preview ? previewData : form;
  const isFormPublished = (activeForm?.status ?? "").toLowerCase() === "published";

  const schoolName = form?.school?.schoolName ?? "";
  const schoolLogoUrl = form?.school?.schoolLogoUrl ?? null;
  const brandColor = form?.school?.brandColor ?? "#008080";

  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [additionalContactsInput, setAdditionalContactsInput] = useState("");
  const [submitError, setSubmitError] = useState({
    contactName: "",
    contactEmail: "",
    referralSource: "",
  });

  const sortedItems = useMemo(() => {
    if (!form?.formItems) return [];
    return [...form.formItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [form?.formItems]);

  const handleValueChange = useCallback(
    (itemId: number) => (newValue: string | string[] | File | null) => {
      if (preview) return;
      setValues((prev) => ({ ...prev, [itemId]: newValue }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    },
    [preview],
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const newSubmitError = {
      contactName: "",
      contactEmail: "",
      referralSource: "",
    };
    let isMetaValid = true;

    if (!contactName.trim()) {
      newSubmitError.contactName = "Name is required";
      isMetaValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim()) {
      newSubmitError.contactEmail = "Email is required";
      isMetaValid = false;
    } else if (!emailRegex.test(contactEmail.trim())) {
      newSubmitError.contactEmail = "Enter a valid email address";
      isMetaValid = false;
    }

    if (!referralSource) {
      newSubmitError.referralSource = "Referral source is required";
      isMetaValid = false;
    }

    for (const item of sortedItems) {
      if (!item.isRequired) continue;

      const val = values[item.id];

      switch (item.type) {
        case "short_answer":
        case "long_answer":
        case "multiple_choice":
          if (!val || (typeof val === "string" && val.trim() === "")) {
            newErrors[item.id] = "This field is required";
          }
          break;
        case "checkbox":
          if (!val || (Array.isArray(val) && val.length === 0)) {
            newErrors[item.id] = "Please select at least one option";
          }
          break;
        case "image_upload":
        case "file_upload":
          if (!val) {
            newErrors[item.id] = "Please upload a file";
          }
          break;
        default:
          if (!val || (typeof val === "string" && val.trim() === "")) {
            newErrors[item.id] = "This field is required";
          }
      }
    }

    setErrors(newErrors);
    setSubmitError(newSubmitError);
    return Object.keys(newErrors).length === 0 && isMetaValid;
  }, [sortedItems, values, contactName, contactEmail, referralSource]);

  const { mutateAsync: uploadDocumentAsync, isPending: isDocumentUploadPending } =
    useMutationService({
      service: uploadServices.uploadDocuments,
      options: { isFormData: true, disableToast: true },
    });

  const { mutateAsync: uploadImageMutateAsync, isPending: isImageUploadPending } =
    useMutationService({
      service: uploadServices.uploadImage,
      options: {
        isFormData: true,
        disableToast: true,
      },
    });

  const { mutateAsync: submitFormResponseAsync, isPending: isSubmitFormPending } =
    useMutationService({
      service: formDynamicEndpoints.submitForm(activeForm?.id ?? 0),
      options: {
        disableToast: true,
      },
    });

  const isSubmitResponsePending =
    isDocumentUploadPending || isImageUploadPending || isSubmitFormPending;

  const resolveFileUploads = useCallback(
    async (item: any, val: any) => {
      if (item.type === "image_upload") {
        const formData = new FormData();
        formData.append("image", val);
        formData.append("folder", "uploads");
        const data: any = await uploadImageMutateAsync(formData);
        return data?.url ?? val.name;
      } else {
        const formData = new FormData();
        formData.append("documents", val);
        formData.append("folder", "documents");
        const data: any = await uploadDocumentAsync(formData);
        return data?.files?.[0]?.url ?? val.name;
      }
    },
    [uploadImageMutateAsync, uploadDocumentAsync],
  );

  const buildSubmissionPayload = useCallback(async () => {
    const answers = await Promise.all(
      sortedItems.map(async (item) => {
        const val = values[item.id];

        let value: string;

        if (val instanceof File) {
          value = await resolveFileUploads(item, val);
        } else if (Array.isArray(val)) {
          value = val.join(", ");
        } else {
          value = (val as string) ?? "";
        }

        return {
          formItemId: item.id,
          value,
        };
      }),
    );

    const additionalContacts = additionalContactsInput
      .split(",")
      .map((contact) => contact.trim())
      .filter(Boolean);

    return {
      names: [contactName.trim()],
      email: contactEmail.trim(),
      referralSource,
      additionalContacts,
      answers,
    };
  }, [sortedItems, values, resolveFileUploads, additionalContactsInput, contactEmail, contactName, referralSource]);

  const handleSubmit = useCallback(async () => {
    if (!isFormPublished) return;

    if (!validate()) {
      const firstErrorId = Object.keys(errors)[0];
      if (firstErrorId) {
        document.getElementById(`question-${firstErrorId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    try {
      const payload = await buildSubmissionPayload();
      console.log("Form Submission Payload:", payload);
      console.log("Form ID:", id);

      await submitFormResponseAsync(payload);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error building submission payload:", error);
    }
  }, [validate, buildSubmissionPayload, id, errors, submitFormResponseAsync, isFormPublished]);

  const handleSubmitAnother = useCallback(() => {
    setValues({});
    setErrors({});
    setContactName("");
    setContactEmail("");
    setReferralSource("");
    setAdditionalContactsInput("");
    setSubmitError({
      contactName: "",
      contactEmail: "",
      referralSource: "",
    });
    setIsSubmitted(false);
  }, []);

  const handleClearForm = useCallback(() => {
    setValues({});
    setErrors({});
    setContactName("");
    setContactEmail("");
    setReferralSource("");
    setAdditionalContactsInput("");
    setSubmitError({
      contactName: "",
      contactEmail: "",
      referralSource: "",
    });

    showToast({
      message: "Form cleared",
      description: "All input values have been cleared successfully.",
      severity: "success",
      duration: 3000,
    });
  }, []);

  if (!preview && isLoading) {
    return <SchoolLogoLoading />;
  }

  if (!preview && (isError || !form)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Form Not Found</h1>
        <p className="text-gray-600">
          The form you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  if (preview && !form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-gray-500 text-sm">No form data available for preview.</p>
      </div>
    );
  }

  const schoolLogo = (
    <div className="flex justify-center mb-2 min-h-16">
      <div className="flex flex-row items-center gap-4">
        {isLoading ? (
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-32 bg-gray-200 rounded-sm"></div>
          </div>
        ) : (
          <>
            {schoolLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- dynamic API URL; add domain to next.config images if using next/image
              <img
                src={schoolLogoUrl}
                alt={schoolName || "School"}
                className="w-16 h-16 object-contain"
              />
            ) : (
              <WhitePenguinLogo />
            )}
            {schoolName ? (
              <p className={`text-xl! font-bold! text-${brandColor}`}>{schoolName}</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );

  if (isSubmitted && !preview) {
    return (
      <SubmissionSuccess
        formTitle={form!.title}
        onSubmitAnother={handleSubmitAnother}
        schoolLogo={schoolLogo}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-dashboard-bg py-8 px-4">
      {!preview && !isFormPublished && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-center justify-center px-4">
          <div className="max-w-lg w-full rounded-xl bg-white border border-gray-200 shadow-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900">Form Not Accepting Responses</h2>
            <p className="mt-2 text-sm text-gray-600">
              This admission form is currently unavailable.
              Please check back later or contact the school for an update.
            </p>
          </div>
        </div>
      )}
      <div className={classNames("w-full max-w-160 mx-auto space-y-4", contentClassName)}>
        {!preview && schoolLogo}

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm border-t-4 border-t-brandColor-active">
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">{form?.title}</h1>
          {form?.description && <p className="text-sm text-gray-500 mt-2">{form?.description}</p>}
          <div className="mt-4 border-t border-gray-100 pt-3">
            <p className="text-xs text-badge-red!">* Indicates required question</p>
          </div>
        </div>

        {!preview && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Contact Information</h2>

            <div className="space-y-1">
              <label htmlFor="contact-name" className="text-sm text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="contact-name"
                type="text"
                placeholder="Enter your full name"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
                  if (submitError.contactName) {
                    setSubmitError((prev) => ({ ...prev, contactName: "" }));
                  }
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brandColor-active"
              />
              {submitError.contactName && (
                <p className="text-xs text-red-500">{submitError.contactName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="contact-email" className="text-sm text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="contact-email"
                type="email"
                placeholder="Enter your email"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value);
                  if (submitError.contactEmail) {
                    setSubmitError((prev) => ({ ...prev, contactEmail: "" }));
                  }
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brandColor-active"
              />
              {submitError.contactEmail && (
                <p className="text-xs text-red-500">{submitError.contactEmail}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="referral-source" className="text-sm text-gray-700">
                Referral Source <span className="text-red-500">*</span>
              </label>
              <select
                id="referral-source"
                value={referralSource}
                onChange={(e) => {
                  setReferralSource(e.target.value);
                  if (submitError.referralSource) {
                    setSubmitError((prev) => ({ ...prev, referralSource: "" }));
                  }
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brandColor-active bg-white"
              >
                <option value="">Select referral source</option>
                {REFERRAL_SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {submitError.referralSource && (
                <p className="text-xs text-red-500">{submitError.referralSource}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="additional-contacts" className="text-sm text-gray-700">
                Additional Contacts
              </label>
              <input
                id="additional-contacts"
                type="text"
                placeholder="Enter additional contacts separated by commas"
                value={additionalContactsInput}
                onChange={(e) => setAdditionalContactsInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brandColor-active"
              />
              <p className="text-xs text-gray-500">
                Example: Jane Doe, James Doe
              </p>
            </div>
          </div>
        )}

        {sortedItems.map((item) => (
          <div key={item.id} id={`question-${item.id}`}>
            <QuestionCard
              item={item}
              value={values[item.id] ?? null}
              onChange={handleValueChange(item.id)}
              error={errors[item.id]}
            />
          </div>
        ))}

        {!preview && (
          <div className="flex items-center justify-between pt-2 pb-8">
            <button
              onClick={handleSubmit}
              disabled={isSubmitResponsePending || !isFormPublished}
              className={`
                px-8 py-2.5 rounded-md text-sm font-medium text-white transition-colors
                ${isSubmitResponsePending ? "bg-brandColor-active/40 cursor-not-allowed" : "bg-brandColor-active hover:bg-brandColor-active/80 cursor-pointer"}
              `}
            >
              {isSubmitResponsePending ? "Submitting..." : "Submit"}
            </button>

            <button
              onClick={handleClearForm}
              className="text-sm text-brandColor-active hover:text-brandColor-active/80 cursor-pointer"
            >
              Clear form
            </button>
          </div>
        )}

        <div className="text-center pb-6">
          <p className="text-xs text-gray-400">Powered by WhitePenguin</p>
        </div>
      </div>
    </div>
  );
};

export default AdmissionLiveForm;
