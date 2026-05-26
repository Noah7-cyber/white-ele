/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useFieldArray, type FieldErrors } from "react-hook-form";
import * as yup from "yup";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import dayjs from "dayjs";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { classroomServices } from "@/services/classroom.service";
import { scheduleTourServices, type SendOfferPayload } from "@/services/tour.service";
import { uploadServices } from "@/services/upload.service";
import { accountServices, GetDefaultBankAccountResponse } from "@/services/account.service";
import type { Classroom } from "@/services/classroom.service";
import type { DropdownOption } from "@/modules/shared/component/Dropdown";
import type { LeadAndRequest } from "./useLeadsAndRequests";
import { showToast } from "@/modules/shared/component/Toast";

function extractFirstErrorMessage(errors: FieldErrors): string | undefined {
  for (const err of Object.values(errors)) {
    if (err == null) continue;
    if (typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
      return (err as { message: string }).message;
    }
    if (typeof err === "object") {
      const nested = extractFirstErrorMessage(err as FieldErrors);
      if (nested) return nested;
    }
  }
  return undefined;
}

function parseNumericFormValue(value: unknown): number {
  if (value === "" || value === null || value === undefined) return NaN;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : NaN;
}

export interface SendOfferItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  vat: number;
  amount: number;
}

export interface SendOfferChild {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  classroom: number | string;
}

export interface SendOfferFormData {
  parentFirstName: string;
  parentLastName: string;
  paymentMethod: string;
  children: SendOfferChild[];
  items: SendOfferItem[];
  notes: string;
}

interface SendOfferFormValues {
  parentFirstName: string;
  parentLastName: string;
  paymentMethod: string;
  notes: string;
}

const sendOfferSchema = yup.object().shape({
  parentFirstName: yup.string().required("Parent first name is required"),
  parentLastName: yup.string().required("Parent last name is required"),
  paymentMethod: yup.string().required("Payment method is required"),
  children: yup
    .array()
    .of(
      yup.object().shape({
        firstName: yup.string().required("First name is required"),
        lastName: yup.string().required("Last name is required"),
        dateOfBirth: yup.string().required("Date of birth is required"),
        classroom: yup
          .mixed()
          .test(
            "classroom-selected",
            "Classroom is required",
            (v) => v !== undefined && v !== null && v !== "" && Number(v) !== 0,
          ),
      }),
    )
    .min(1, "At least one child is required"),
  items: yup
    .array()
    .of(
      yup.object().shape({
        description: yup.string().required("Description is required"),
        quantity: yup
          .number()
          .transform((_v, originalValue) => parseNumericFormValue(originalValue))
          .typeError("Must be a number")
          .moreThan(0, "Quantity must be greater than 0"),
        rate: yup
          .number()
          .transform((_v, originalValue) => parseNumericFormValue(originalValue))
          .typeError("Must be a number")
          .moreThan(0, "Rate must be greater than 0"),
        vat: yup
          .number()
          .transform((_v, originalValue) => parseNumericFormValue(originalValue))
          .typeError("Must be a number")
          .min(0, "VAT cannot be less than 0%")
          .max(100, "VAT cannot exceed 100%"),
        amount: yup
          .number()
          .transform((_v, originalValue) => parseNumericFormValue(originalValue))
          .typeError("Must be a number")
          .min(0),
      }),
    )
    .min(1, "At least one item is required"),
  notes: yup.string().optional(),
});

const defaultItem = (): SendOfferItem => ({
  id: crypto.randomUUID?.() ?? `item-${Date.now()}-${Math.random()}`,
  description: "",
  quantity: 0,
  rate: 0,
  vat: 0,
  amount: 0,
});

const defaultChild = (): SendOfferChild => ({
  id: crypto.randomUUID?.() ?? `child-${Date.now()}-${Math.random()}`,
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  classroom: 0,
});

export interface SendOfferAttachment {
  name: string;
  url: string;
}

export interface SendOfferEmailData {
  to: string;
  subject: string;
  body: string;
  attachments: SendOfferAttachment[];
}

export function useSendOffer(onSuccess?: () => void) {
  const { mutateAsync: sendOffer, isPending: isSendingOffer } = useMutationService({
    service: scheduleTourServices.sendOffer,
  });

  const { mutateAsync: uploadDocumentsAsync, isPending: isUploadingDocuments } = useMutationService(
    {
      service: uploadServices.uploadDocuments,
      options: { isFormData: true },
    },
  );

  const { data: defaultBankResp } = useQueryService<
    Record<string, never>,
    GetDefaultBankAccountResponse
  >({
    service: accountServices.getDefaultBankAccount,
    options: {
      keys: ["defaultBankAccount"],
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  const {
    data: classroomData,
    isLoading: isLoadingClassrooms,
    hasNextPage: hasMoreClassrooms,
    fetchNextPage: fetchNextClassroomPage,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: { delta: 50 },
    },
  });

  const classroomOptions: DropdownOption<number>[] = useMemo(() => {
    const list: Classroom[] =
      classroomData?.pages?.flatMap((page: any) => page?.classrooms ?? page?.data ?? []) ?? [];
    return list.reduce((acc: DropdownOption<number>[], c: Classroom) => {
      const studentsInClass = Array.isArray(c.studentsCurrentClass) ? c.studentsCurrentClass.length : 0;
      const leftSlots = Math.max(0, Number(c.maximumCapacity || 0) - studentsInClass);
      const isClassFull = leftSlots === 0;
      if (!acc.some((existing) => existing.value === c.id)) {
        acc.push({
          value: c.id,
          name: `${c.classroomName} (Age ${c.minimumAge ?? ""}-${c.maximumAge ?? ""})`,
          disabled: isClassFull,
          component: (
            <div className="flex items-center justify-between gap-2 w-full">
              <span>{c.classroomName}</span>
              {isClassFull && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-gray-700 uppercase">
                  Class Full
                </span>
              )}
            </div>
          ),
        });
      }
      return acc;
    }, []);
  }, [classroomData]);


  useEffect(() => {
    if (!hasMoreClassrooms) return;
    void fetchNextClassroomPage();
  }, [hasMoreClassrooms, fetchNextClassroomPage]);

  // Modal & Lead state
  const [showSendOfferModal, setShowSendOfferModal] = useState(false);
  const [showSendOfferEmailModal, setShowSendOfferEmailModal] = useState(false);
  const [sendOfferLead, setSendOfferLead] = useState<LeadAndRequest | null>(null);
  const [emailData, setEmailData] = useState<SendOfferEmailData | null>(null);

  // Derived Names
  const derivedData = useMemo(() => {
    const firstParentName = sendOfferLead?.parents?.split(",")[0]?.trim() || "";
    const location = sendOfferLead?.booking?.tourEvent?.location || "";
    const titles = ["mr", "mrs", "ms", "miss", "dr", "prof"];
    const nameParts = firstParentName
      .split(/\s+/)
      .filter((part) => !titles.includes(part.toLowerCase().replace(".", "")));

    const firstName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts[0] : "";

    return { firstName, lastName, location };
  }, [sendOfferLead]);

  // Form logic
  const {
    control,
    reset,
    getValues,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useFormValidator<SendOfferFormData>({
    validationSchema: sendOfferSchema,
    defaultValues: {
      parentFirstName: "",
      parentLastName: "",
      paymentMethod: "transfer",
      children: [defaultChild()],
      items: [defaultItem()],
      notes: "",
    },
  });

  const {
    fields: childrenFields,
    append: addChildField,
    remove: removeChildField,
  } = useFieldArray({
    control,
    name: "children",
  });

  const {
    fields: itemsFields,
    append: addItemField,
    remove: removeItemField,
  } = useFieldArray({
    control,
    name: "items",
  });

  const children = watch("children") || [];
  const items = watch("items") || [];

  const openSendOfferModal = useCallback((lead: LeadAndRequest) => {
    setSendOfferLead(lead);
    setShowSendOfferModal(true);
  }, []);

  const closeSendOfferModal = useCallback(() => {
    setShowSendOfferModal(false);
    // Don't null lead yet as Email modal might need it
  }, []);

  const openSendOfferEmailModal = useCallback((data: SendOfferEmailData) => {
    setEmailData(data);
    setShowSendOfferEmailModal(true);
  }, []);

  const closeSendOfferEmailModal = useCallback(() => {
    setShowSendOfferEmailModal(false);
    setEmailData(null);
    setSendOfferLead(null);
  }, []);

  const addAttachment = useCallback(
    async (file: File) => {
      try {
        const formData = new FormData();
        formData.append("documents", file);
        formData.append("folder", "offers");

        const response = (await uploadDocumentsAsync(formData)) as {
          files?: { fileName: string; url: string }[];
        };

        const uploadedUrl = response?.files?.[0]?.url;

        if (uploadedUrl) {
          setEmailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              attachments: [...prev.attachments, { name: file.name, url: uploadedUrl }],
            };
          });
        }
      } catch (error: any) {
        showToast({
          message: "Failed to upload attachment",
          description: (error as any).error.message,
          severity: "error",
        });
      }
    },
    [uploadDocumentsAsync],
  );

  const removeAttachment = useCallback((index: number) => {
    setEmailData((prev) => {
      if (!prev) return null;
      const newAttachments = [...prev.attachments];
      newAttachments.splice(index, 1);
      return {
        ...prev,
        attachments: newAttachments,
      };
    });
  }, []);

  // Sync form with lead data when modal opens
  useEffect(() => {
    if (showSendOfferModal) {
      reset({
        parentFirstName: derivedData.firstName,
        parentLastName: derivedData.lastName,
        paymentMethod: "transfer",
        notes: "",
        children: [defaultChild()],
        items: [defaultItem()],
      });
    }
  }, [showSendOfferModal, derivedData, reset]);

  const addRow = useCallback(() => {
    addItemField(defaultItem());
  }, [addItemField]);

  const removeRow = useCallback(
    (index: number) => {
      if (itemsFields.length > 1) {
        removeItemField(index);
      }
    },
    [itemsFields.length, removeItemField],
  );

  const updateItem = useCallback(
    (index: number, field: keyof SendOfferItem, value: string | number) => {
      const currentItems = getValues("items");
      const item = currentItems[index];
      if (!item) return;

      const updatedItem = { ...item, [field]: value };

      // Auto-calculate amount if quantity or rate changes
      if (field === "quantity" || field === "rate") {
        updatedItem.amount = Number(updatedItem.quantity || 0) * Number(updatedItem.rate || 0);
      }

      setValue(`items.${index}`, updatedItem, { shouldValidate: true });
    },
    [getValues, setValue],
  );

  const addChild = useCallback(() => {
    addChildField(defaultChild());
  }, [addChildField]);

  const removeChild = useCallback(
    (index: number) => {
      if (childrenFields.length > 1) {
        removeChildField(index);
      }
    },
    [childrenFields.length, removeChildField],
  );

  const updateChild = useCallback(
    (index: number, field: keyof SendOfferChild, value: string | number) => {
      const currentChildren = getValues("children");
      const child = currentChildren[index];
      if (!child) return;

      setValue(`children.${index}.${field}` as any, value, { shouldValidate: true });
    },
    [getValues, setValue],
  );

  const handleGenerate = useCallback(
    (formValues: SendOfferFormData) => {
      const parentEmail = sendOfferLead?.booking?.email || "";
      const childFullName =
        formValues.children.length > 0
          ? `${formValues.children[0].firstName} ${formValues.children[0].lastName}`.trim()
          : "Noah Johnson";

      const location = derivedData.location.trim();

      setEmailData({
        to: parentEmail,
        subject: location
          ? `Admission Offer from ${location} - ${childFullName}`
          : `Admission offer - ${childFullName}`,
        body: `Dear Sir/Madam,\n\nPlease find attached the admission offer and invoice for ${childFullName}${location ? ` from ${location}` : ""} for your review and necessary action.\n\nThank you.\n\nKind regards,\nFinance Team${location ? `\n${location}` : ""}`,
        attachments: [],
      });

      setShowSendOfferModal(false);
      setShowSendOfferEmailModal(true);
    },
    [sendOfferLead, derivedData],
  );

  const onInvalidGenerate = useCallback((validationErrors: FieldErrors<SendOfferFormData>) => {
    const msg =
      extractFirstErrorMessage(validationErrors) ??
      "Fill in all required fields before generating the email.";
    showToast({
      message: "Form incomplete",
      description: msg,
      severity: "error",
      duration: 5000,
    });
  }, []);

  const submitGenerateOffer = useCallback(
    (e?: React.BaseSyntheticEvent) => handleSubmit(handleGenerate, onInvalidGenerate)(e),
    [handleSubmit, handleGenerate, onInvalidGenerate],
  );

  const handleSendFinalOffer = useCallback(
    async (finalEmailData: any) => {
      if (!sendOfferLead?.bookingId) {
        console.error("No booking ID found");
        return;
      }

      const formValues = getValues();
      const bankAccountId = defaultBankResp?.bankAccount?.id;

      const basePayload = {
        parent: {
          firstName: formValues.parentFirstName,
          lastName: formValues.parentLastName,
        },
        students: formValues.children.map((child) => ({
          firstName: child.firstName,
          lastName: child.lastName,
          classroomId: child.classroom,
          dateOfBirth: child.dateOfBirth
            ? dayjs(child.dateOfBirth, "DD/MM/YYYY").format("YYYY-MM-DD")
            : "",
        })),
        items: formValues.items.map((item) => ({
          description: item.description,
          quantity: parseNumericFormValue(item.quantity),
          tax: parseNumericFormValue(item.vat) || 0,
          rate: parseNumericFormValue(item.rate),
        })),
        notes: formValues.notes,
        paymentMethod: formValues.paymentMethod,
        ...(bankAccountId ? { bankAccountId } : {}),
        email: {
          receipient: finalEmailData.to,
          subject: finalEmailData.subject,
          body: finalEmailData.body,
          attachment: finalEmailData.attachments?.map((a: SendOfferAttachment) => a.url) || [],
        },
      };

      const payload: SendOfferPayload =
        sendOfferLead.recordType === "form_response"
          ? { ...basePayload, formResponseId: sendOfferLead.bookingId }
          : { ...basePayload, bookedTourId: sendOfferLead.bookingId };

      try {
        await sendOffer(payload);
        onSuccess?.();
        closeSendOfferEmailModal();
        setSendOfferLead(null);
      } catch (error) {
        console.error("Failed to send offer:", error);
      }
    },
    [sendOfferLead, getValues, sendOffer, onSuccess, closeSendOfferEmailModal, defaultBankResp?.bankAccount?.id],
  );

  return {
    classroomOptions,
    isLoadingClassrooms,
    showSendOfferModal,
    showSendOfferEmailModal,
    openSendOfferModal,
    closeSendOfferModal,
    closeSendOfferEmailModal,
    emailData,
    addAttachment,
    removeAttachment,
    // Form & Items
    control,
    items,
    addRow,
    removeRow,
    updateItem,
    // Children
    children,
    addChild,
    removeChild,
    updateChild,
    submitGenerateOffer,
    errors,
    handleSendFinalOffer,
    isSendingOffer,
    isUploadingDocuments,
  };
}
