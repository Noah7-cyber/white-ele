/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";

import { useState, useEffect, useMemo, useCallback } from "react";
import { redirect, useParams } from "next/navigation";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import {
  childValidationSchema,
  initialChildValues,
  type ParentProps,
  type ChildProps,
  GenderValue,
} from "../child.constant";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { uploadServices } from "@/services/upload.service";
import {
  childServices,
  childDynamicEndpoints,
  type GetChildByIdResponse,
} from "@/services/child.service";
import { studentDocumentDynamicEndpoints } from "@/services/studentdocument.service";
import { showToast } from "@/modules/shared/component/Toast";
import type { AddChildTab } from "../../Children/hook/useAddChild";
import { DashboardRoutes } from "@/routes/dashboard.routes";

function getTabForPath(path: string): AddChildTab {
  if (path.startsWith("parents")) return "parent";
  if (path.startsWith("documents")) return "documents";
  return "profile";
}

function flattenErrors(
  errors: Record<string, any>,
  prefix = "",
): { message: string; tab: AddChildTab }[] {
  const result: { message: string; tab: AddChildTab }[] = [];
  for (const key of Object.keys(errors)) {
    const value = errors[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (value?.message && typeof value.message === "string") {
      result.push({ message: value.message, tab: getTabForPath(path) });
    } else if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        value.forEach((item, i) => {
          if (item && typeof item === "object") {
            result.push(...flattenErrors(item, `${path}.${i}`));
          }
        });
      } else {
        result.push(...flattenErrors(value, path));
      }
    }
  }
  return result;
}
import { useQueryService } from "@/utils/hooks/useQueryService";
import { classroomServices, type GetAllClassroomsResponse } from "@/services/classroom.service";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { type GetSchoolResponse, schoolDynamicEndpoints } from "@/services/school.service";
import { blobUrlToFile } from "@/utils/helper";

type ClassroomWithStudents = GetAllClassroomsResponse["data"][number] & {
  studentsCurrentClass?: Array<{
    id: number;
    userId?: number;
    admissionNumber?: string | null;
    user?: {
      firstName?: string | null;
      middleName?: string | null;
      lastName?: string | null;
    };
  }>;
};
const useManageChild = ({
  onClose,
}: {
  isEdit?: boolean;
  child?: any;
  onClose?: () => void;
  onComplete?: () => void;
}) => {
  const params = useParams();
  const childId = params?.id as string | undefined;

  const [imageBlob, setImageBlob] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [removedDocuments, setRemovedDocuments] = useState<any[]>([]);

  const formInstance = useFormValidator<ChildProps>({
    validationSchema: childValidationSchema,
    defaultValues: initialChildValues as ChildProps,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const { control, setValue, reset, getValues, watch, formState } = formInstance;

  const { mutateAsync: getAllClassroomAsync } = useMutationService<
    Record<string, never>,
    GetAllClassroomsResponse
  >({
    service: classroomServices.getAllClassrooms,
    options: {
      disableToast: true,
    },
  });

  const [classrooms, setClassrooms] = useState<ClassroomWithStudents[]>([]);
  const [isClassroomsLoading, setIsClassroomsLoading] = useState(false);

  const fetchAllClassrooms = useCallback(async () => {
    try {
      setIsClassroomsLoading(true);

      const response = await getAllClassroomAsync({} as Record<string, never>);

      const classroomData =
        (response as GetAllClassroomsResponse & { classrooms?: ClassroomWithStudents[] })
          ?.classrooms ??
        response?.data ??
        [];

      setClassrooms(classroomData);
    } catch (error) {
      console.error("Failed to fetch classrooms", error);
      setClassrooms([]);
    } finally {
      setIsClassroomsLoading(false);
    }
  }, [getAllClassroomAsync]);

  const { data } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: {
        delta: 50,
        status: "active",
      },
    },
  });

  useEffect(() => {
    fetchAllClassrooms();
  }, [fetchAllClassrooms]);

  const classroomOptions = useMemo(() => {
    if (!data?.pages) return [];

    const allClassrooms = data.pages.flatMap((page: any) => page.classrooms ?? []);

    return allClassrooms.map((c: any) => {
      const studentsInClass = Array.isArray(c.studentsCurrentClass) ? c.studentsCurrentClass.length : 0;
      const leftSlots = Math.max(0, Number(c.maximumCapacity || 0) - studentsInClass);
      const isClassFull = leftSlots === 0;

      return {
        label: c.classroomName,
        name: c.classroomName,
        value: c.id,
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
      };
    });
  }, [data]);

  const { data: childResponse, isLoading } = useQueryService<any, GetChildByIdResponse>({
    service: childDynamicEndpoints.getChildById(childId!),
    options: {
      enabled: !!childId,
    },
  });

  const childAdmissionNumber = childResponse?.data.admissionNumber;

  useEffect(() => {
    if (!childId || !childResponse?.data) return;

    const child = childResponse.data;
    if (typeof child.classroomId === "number") {
      setValue("classrooms", child.classroomId);
    } else {
      const classroomOption = classroomOptions.find((c) => c.value === child.classroomId);
      if (classroomOption) {
        setValue("classrooms", classroomOption.value);
      }
    }

    setValue("generalInfo.firstName", child?.user?.firstName);
    setValue("generalInfo.middleName", child.user.middleName || "");
    setValue("generalInfo.lastName", child.user.lastName);
    setValue("generalInfo.address", child.user.address);
    setValue("generalInfo.enrolmentDate", child.enrolmentDate);
    setValue("generalInfo.dateOfBirth", child.user.dateOfBirth);
    setValue("generalInfo.photoUrl", child.photoUrl);
    setValue("generalInfo.gender", child?.user?.gender as GenderValue);
    setValue("schedule", child.schedule || []);
    setValue("medicalInfo.allergies", child?.medicalRecord?.allergies || "");
    setValue("medicalInfo.dietRestriction", child?.medicalRecord?.dietRestriction || "");
    setValue("medicalInfo.foodPreferences", child?.medicalRecord?.foodPreferences || "");
    setValue("medicalInfo.medications", child?.medicalRecord?.medications || "");
    setValue("medicalInfo.notes", child?.medicalRecord?.notes || "");
    setValue("emergencyInfo.suffix", child?.emergencyContact?.suffix || "");
    setValue("emergencyInfo.address", child?.emergencyContact?.address || "");
    setValue("emergencyInfo.email", child?.emergencyContact?.email || "");
    const [firstName = "", lastName = ""] =
      child?.emergencyContact?.contactName?.trim().split(" ") || [];

    setValue("emergencyInfo.firstName", firstName);
    setValue("emergencyInfo.lastName", lastName);

    setValue("emergencyInfo.relationship", child?.emergencyContact?.relationship);
    setValue("emergencyInfo.phone", child?.emergencyContact?.phone || "");

    if (child?.parents && child?.parents?.length > 0) {
      child?.parents?.forEach((parent, index) => {
        setValue(`parents.${index}.id`, parent.id);
        setValue(`parents.${index}.suffix`, parent.suffix || "");
        setValue(`parents.${index}.relationship`, parent.relationship || "");
        setValue(`parents.${index}.notes`, parent.notes || "");
        setValue(`parents.${index}.photoUrl`, parent.photoUrl || "");

        // If full name in parent.user
        if (parent.user?.firstName) {
          setValue(`parents.${index}.firstName`, parent.user.firstName);
          setValue(`parents.${index}.lastName`, parent.user.lastName || "");
        }

        // If backend merges fullname into parent.user.fullName
        if (parent.user?.fullName) {
          const [f = "", ...rest] = parent.user.fullName.trim().split(" ");
          setValue(`parents.${index}.firstName`, f);
          setValue(`parents.${index}.lastName`, rest.join(" "));
        }

        setValue(`parents.${index}.suffix`, parent.suffix || "");
        setValue(`parents.${index}.phone`, parent.user?.phone || "");
        setValue(`parents.${index}.email`, parent.user?.email || "");
        setValue(`parents.${index}.address`, parent.user?.address || "");
      });
    }

    // ------ DOCUMENTS ------
    if (child.documents) {
      setValue("documents", child.documents);
    }
  }, [childId, childResponse]);

  const [activeTab, setActiveTab] = useState<AddChildTab>("profile");

  const parents = watch("parents");

  /** ---------------------
   * PARENT HANDLERS
   ---------------------- **/
  const addParent = () => {
    const currentParents = getValues("parents") || [];
    const newParent: ParentProps = {
      title: "",
      suffix: "",
      firstName: "",
      lastName: "",
      relationship: "",
      phone: "",
      email: "",
      address: "",
      photoUrl: null,
    };
    setValue("parents", [...currentParents, newParent]);
  };

  const normalizeParent = (p: ParentProps): ParentProps => ({
    id: p.id,
    title: p.suffix ?? p.title ?? "",
    suffix: p.suffix ?? p.title ?? "",
    firstName: p.firstName ?? "",
    lastName: p.lastName ?? "",
    relationship: p.relationship ?? "",
    phone: p.phone ?? "",
    email: p.email ?? "",
    address: p.address ?? "",
    photoUrl: p.photoUrl ?? null,
    notes: p.notes,
  });

  /** Add existing parent(s) from the system. Populates from the first index (Parent 1, 2, 3, ...). Replaces form parents with the given list. */
  const addParentFromExisting = (parentData: ParentProps | ParentProps[]) => {
    const list = Array.isArray(parentData) ? parentData : [parentData];
    const normalized = list.map(normalizeParent);
    setValue("parents", normalized, { shouldDirty: true });
  };

  /** Append existing parent(s) from the system to the end of the current list without replacing any in-progress entries.
   * However, if the first parent entry is empty (no firstName, lastName, email, phone), replace it with the first selected parent. */
  const appendParentFromExisting = (parentData: ParentProps | ParentProps[]) => {
    const list = Array.isArray(parentData) ? parentData : [parentData];
    const normalized = list.map(normalizeParent);
    const currentParents = getValues("parents") || [];
    // Avoid duplicates: filter out parents that are already in the list by id
    const existingIds = new Set(currentParents.map((p: ParentProps) => p.id).filter(Boolean));
    const toAdd = normalized.filter((p) => !p.id || !existingIds.has(p.id));

    if (toAdd.length === 0) {
      setValue("parents", currentParents, { shouldDirty: true });
      return;
    }

    // Check if the first parent entry is empty (no meaningful data filled in)
    const firstParent = currentParents[0];
    const isFirstEmpty =
      firstParent &&
      !firstParent.firstName?.trim() &&
      !firstParent.lastName?.trim() &&
      !firstParent.email?.trim() &&
      !firstParent.phone?.trim();

    if (isFirstEmpty && currentParents.length >= 1) {
      // Replace the first empty entry with the first selected parent, then append the rest
      const [firstToAdd, ...restToAdd] = toAdd;
      const updatedParents = [firstToAdd, ...currentParents.slice(1), ...restToAdd];
      setValue("parents", updatedParents, { shouldDirty: true });
    } else {
      // Just append all
      setValue("parents", [...currentParents, ...toAdd], { shouldDirty: true });
    }
  };

  /** Replace parent at index with an existing parent from the system (e.g. when editing/changing a parent). */
  const setParentFromExisting = (index: number, parentData: ParentProps) => {
    const currentParents = getValues("parents") || [];
    const updated = [...currentParents];
    updated[index] = {
      id: parentData.id,
      title: parentData.suffix ?? parentData.title ?? "",
      suffix: parentData.suffix ?? parentData.title ?? "",
      firstName: parentData.firstName ?? "",
      lastName: parentData.lastName ?? "",
      relationship: parentData.relationship ?? "",
      phone: parentData.phone ?? "",
      email: parentData.email ?? "",
      address: parentData.address ?? "",
      photoUrl: parentData.photoUrl ?? null,
      notes: parentData.notes,
    };
    setValue("parents", updated, { shouldDirty: true });
  };

  const removeParent = (index: number) => {
    const currentParents = getValues("parents") || [];
    const updatedParents = currentParents.filter((_, i) => i !== index);
    setValue("parents", updatedParents);
  };

  const handleParentImage = (file: File, index: number) => {
    const currentParents = getValues("parents") || [];
    currentParents[index].photoUrl = file;
    setValue("parents", currentParents, { shouldDirty: true });
  };

  /** ---------------------
   * IMAGE HANDLER
   ---------------------- **/
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setImageBlob(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const { mutateAsync: uploadImageAsync, isPending: isUploadingImage } = useMutationService({
    service: uploadServices.uploadImage,
    options: { isFormData: true, disableToast: true },
  });

  const { mutateAsync: uploadDocumentAsync, isPending: isUploadingDocument } = useMutationService({
    service: uploadServices.uploadDocuments,
    options: { isFormData: true, disableToast: true },
  });

  const { mutateAsync: createChildAsync, isPending: isCreatingChild } = useMutationService({
    service: childServices.createChild,
    options: {
      disableToast: true,
    },
  });

  const { mutateAsync: updateChildAsync, isPending: isUpdatingChild } = useMutationService({
    service: childDynamicEndpoints.updateChild(childId!),
    options: {
      disableToast: true,
    },
  });

  const { mutateAsync: deleteStudentDocumentAsync } = useMutationService<
    { documentId: number },
    unknown
  >({
    service: (data) => studentDocumentDynamicEndpoints.deleteDocument(String(data.documentId)),
    options: { disableToast: true },
  });

  const { data: schoolData } = useQueryService<any, GetSchoolResponse>({
    service: schoolDynamicEndpoints.getParticularSchool(),
  });

  const profileFields = [
    "generalInfo",
    "schedule",
    "classrooms",
    "medicalInfo",
    "emergencyInfo",
  ] as const;
  const parentFields = ["parents"] as const;

  const goNext = async () => {
    if (activeTab === "profile") {
      const valid = await formInstance.trigger(profileFields as any);
      if (!valid) {
        return;
      }
      setActiveTab("parent");
      return;
    }
    if (activeTab === "parent") {
      const valid = await formInstance.trigger(parentFields as any);
      if (!valid) {
        return;
      }
      setActiveTab("documents");
      return;
    }
  };

  const goPrev = () => {
    if (activeTab === "documents") return setActiveTab("parent");
    if (activeTab === "parent") return setActiveTab("profile");
  };

  const removeDocument = (index: number) => {
    const currentDocs = getValues("documents") || [];
    const removedDoc = currentDocs[index];
    if (
      removedDoc &&
      typeof removedDoc === "object" &&
      "id" in removedDoc &&
      (removedDoc as { id?: number }).id != null
    ) {
      setRemovedDocuments((prev) => [...prev, removedDoc]);
    }
    const updatedDocs = currentDocs.filter((_, i) => i !== index);
    setValue("documents", updatedDocs, { shouldDirty: true });
  };

  const handleRemoveDocument = (doc: { id?: number }) => {
    const currentDocs = getValues("documents") || [];
    const index = currentDocs.findIndex((d: any) => d?.id === doc?.id);
    if (index >= 0) removeDocument(index);
  };

  const replaceDocument = (file: File, index: number) => {
    const currentDocs = getValues("documents") || [];
    const replacedDoc = currentDocs[index];
    if (
      replacedDoc &&
      typeof replacedDoc === "object" &&
      "id" in replacedDoc &&
      (replacedDoc as { id?: number }).id != null
    ) {
      setRemovedDocuments((prev) => [...prev, replacedDoc]);
    }
    const updatedDocs = [...currentDocs];
    updatedDocs.splice(index, 1, file);
    setValue("documents", updatedDocs, { shouldDirty: true });
  };

  const onSubmitChild = async () => {
    const isValid = await formInstance.trigger();
    if (!isValid) {
      const errorsAfterTrigger = flattenErrors(formState.errors || {});
      const tabToSwitch = errorsAfterTrigger.length > 0 ? errorsAfterTrigger[0].tab : null;
      if (tabToSwitch) setActiveTab(tabToSwitch);
      showToast({
        message: "Please fix the errors before saving",
        description: `There are errors that need your attention. Check the form and try again.`,
        severity: "error",
        duration: 6000,
      });
      return;
    }

    if (imageBlob) {
      const file = await blobUrlToFile(imageBlob, "child-photo.jpg", "image/jpeg");

      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "profiles");
    }

    const form = getValues();

    let profileUrl = "";
    const isFile = (item: any): item is File => item instanceof File;

    if (isFile(getValues("generalInfo.photoUrl"))) {
      const file = getValues("generalInfo.photoUrl");
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "profiles");

      const { url }: any = await uploadImageAsync(formData);
      profileUrl = url;
    } else if (typeof getValues("generalInfo.photoUrl") === "string") {
      profileUrl = getValues("generalInfo.photoUrl");
    }

    const parentsWithUploadedImages = await Promise.all(
      form.parents.map(async (p) => {
        let uploadedUrl = "";

        if (isFile(p.photoUrl)) {
          const parentForm = new FormData();
          parentForm.append("image", p.photoUrl);
          parentForm.append("folder", "uploads");
          const { url }: any = await uploadImageAsync(parentForm);
          uploadedUrl = url;
        } else if (typeof p.photoUrl === "string") {
          uploadedUrl = p.photoUrl;
        }

        // Always send id when present so backend updates existing parent (e.g. on email change) instead of creating a new one
        return {
          ...(p.id != null && p.id !== undefined && { id: p.id }),
          firstName: p.firstName,
          lastName: p.lastName,
          relationship: p.relationship.toLowerCase(),
          suffix: p.suffix,
          phone: p.phone,
          email: p.email,
          address: p.address,
          notes: p.notes,
          photoUrl: uploadedUrl,
          ...(p.title && { suffix: p.title }),
        };
      }),
    );

    const ALLOWED_DOC_MIME = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const newFilesRaw: File[] = form.documents?.filter(isFile) || [];
    const newFiles = newFilesRaw.filter((file) => ALLOWED_DOC_MIME.includes(file.type));
    if (newFiles.length < newFilesRaw.length) {
      showToast({
        message: "Some files were skipped",
        description: "Only PDF and Word documents (.doc, .docx) are allowed. Images are not allowed.",
        severity: "warning",
        duration: 5000,
      });
    }
    const existingDocs = form.documents?.filter((d) => !isFile(d)) || [];

    let uploadedDocuments: { docName: any; documentUrl: any; }[] = [];

    if (newFiles.length > 0) {
      try {
        const formData = new FormData();
        newFiles.forEach((file) => {
          formData.append("documents", file);
        });
        formData.append("folder", "documents");

        const response: any = await uploadDocumentAsync(formData);
        const uploaded = response?.files ?? response?.data?.files ?? [];
        if (!Array.isArray(uploaded) || uploaded.length === 0) {
          showToast({
            message: "Document upload failed",
            description: "No files were returned from the server. Please try again.",
            severity: "error",
            duration: 5000,
          });
          return;
        }
        uploadedDocuments = uploaded.map((f: any) => ({
          docName: (f.fileName ?? f.name ?? "").replace(/^documents\//, ""),
          documentUrl: f.url ?? f.documentUrl ?? "",
        }));
      } catch (uploadError: any) {
        const msg =
          uploadError?.response?.data?.message ??
          uploadError?.message ??
          "Failed to upload documents. Please try again.";
        showToast({
          message: "Document upload failed",
          description: msg,
          severity: "error",
          duration: 6000,
        });
        return;
      }
    }

    const finalDocuments = [...existingDocs, ...uploadedDocuments];

    let payload: any;

    if (childId) {
      const updatePayload: Record<string, any> = {};
      const orig = childResponse?.data;
      const dirtyFields = formState.dirtyFields as any;

      // schedule
      const origSchedule = orig?.schedule || [];
      const isScheduleAltered =
        form.schedule?.length !== origSchedule.length ||
        form.schedule?.some((d) => !origSchedule.includes(d)) ||
        dirtyFields?.schedule;

      if (isScheduleAltered) {
        updatePayload.schedule = form.schedule;
      }

      // classroomId
      let origClassroomId = orig?.classroomId;
      if (origClassroomId != null && typeof origClassroomId !== "number") {
        const found = classroomOptions.find((c) => c.value === origClassroomId);
        if (found) origClassroomId = found.value;
      }
      if (form.classrooms !== origClassroomId || dirtyFields?.classrooms) {
        updatePayload.classroomId = form.classrooms;
      }

      // generalInfo
      const generalInfoPayload: Record<string, any> = {};
      if (form.generalInfo?.firstName !== orig?.user?.firstName || dirtyFields?.generalInfo?.firstName) {
        generalInfoPayload.firstName = form.generalInfo.firstName;
      }
      if (form.generalInfo?.lastName !== orig?.user?.lastName || dirtyFields?.generalInfo?.lastName) {
        generalInfoPayload.lastName = form.generalInfo.lastName;
      }
      const nextMiddleName = form.generalInfo?.middleName || null;
      if (nextMiddleName !== orig?.user?.middleName || dirtyFields?.generalInfo?.middleName) {
        generalInfoPayload.middleName = nextMiddleName;
      }
      if (form.generalInfo?.address !== orig?.user?.address || dirtyFields?.generalInfo?.address) {
        generalInfoPayload.address = form.generalInfo.address;
      }
      if (form.generalInfo?.dateOfBirth !== orig?.user?.dateOfBirth || dirtyFields?.generalInfo?.dateOfBirth) {
        generalInfoPayload.dateOfBirth = form.generalInfo.dateOfBirth;
      }
      if (form.generalInfo?.enrolmentDate !== orig?.enrolmentDate || dirtyFields?.generalInfo?.enrolmentDate) {
        generalInfoPayload.enrolmentDate = form.generalInfo.enrolmentDate;
      }
      if (form.generalInfo?.gender && (form.generalInfo.gender !== (orig?.user?.gender || "") || dirtyFields?.generalInfo?.gender)) {
        generalInfoPayload.gender = form.generalInfo.gender;
      }
      const isPhotoAltered = isFile(getValues("generalInfo.photoUrl")) || !!imageBlob || (profileUrl && profileUrl !== orig?.photoUrl) || dirtyFields?.generalInfo?.photoUrl;
      if (isPhotoAltered) {
        generalInfoPayload.photoUrl = profileUrl;
      }

      if (Object.keys(generalInfoPayload).length > 0) {
        updatePayload.generalInfo = generalInfoPayload;
      }

      // medicalInfo
      const origMed = orig?.medicalRecord;
      const medicalInfoPayload: Record<string, any> = {};
      if (form.medicalInfo?.allergies !== (origMed?.allergies || "") || dirtyFields?.medicalInfo?.allergies) {
        medicalInfoPayload.allergies = form.medicalInfo.allergies;
      }
      if (form.medicalInfo?.medications !== (origMed?.medications || "") || dirtyFields?.medicalInfo?.medications) {
        medicalInfoPayload.medications = form.medicalInfo.medications;
      }
      if (form.medicalInfo?.foodPreferences !== (origMed?.foodPreferences || "") || dirtyFields?.medicalInfo?.foodPreferences) {
        medicalInfoPayload.foodPreferences = form.medicalInfo.foodPreferences;
      }
      if (form.medicalInfo?.dietRestriction !== (origMed?.dietRestriction || "") || dirtyFields?.medicalInfo?.dietRestriction) {
        medicalInfoPayload.dietRestriction = form.medicalInfo.dietRestriction;
      }
      if (form.medicalInfo?.notes !== (origMed?.notes || "") || dirtyFields?.medicalInfo?.notes) {
        medicalInfoPayload.notes = form.medicalInfo.notes;
      }

      if (Object.keys(medicalInfoPayload).length > 0) {
        updatePayload.medicalInfo = medicalInfoPayload;
      }

      // emergencyContact
      const origEmerg = orig?.emergencyContact;
      const emergencyContactPayload: Record<string, any> = {};
      if (form.emergencyInfo?.suffix !== (origEmerg?.suffix || "") || dirtyFields?.emergencyInfo?.suffix) {
        emergencyContactPayload.suffix = form.emergencyInfo.suffix;
      }
      const [origEmergFirst = "", origEmergLast = ""] = origEmerg?.contactName?.trim().split(" ") || [];
      if (form.emergencyInfo?.firstName !== origEmergFirst || form.emergencyInfo?.lastName !== origEmergLast || dirtyFields?.emergencyInfo?.firstName || dirtyFields?.emergencyInfo?.lastName) {
        emergencyContactPayload.contactName = `${form.emergencyInfo.firstName} ${form.emergencyInfo.lastName}`;
      }
      if (form.emergencyInfo?.phone !== (origEmerg?.phone || "") || dirtyFields?.emergencyInfo?.phone) {
        emergencyContactPayload.phone = form.emergencyInfo.phone;
      }
      if (form.emergencyInfo?.relationship !== (origEmerg?.relationship || "") || dirtyFields?.emergencyInfo?.relationship) {
        emergencyContactPayload.relationship = form.emergencyInfo.relationship;
      }
      if (form.emergencyInfo?.email !== (origEmerg?.email || "") || dirtyFields?.emergencyInfo?.email) {
        emergencyContactPayload.email = form.emergencyInfo.email;
      }
      if (form.emergencyInfo?.address !== (origEmerg?.address || "") || dirtyFields?.emergencyInfo?.address) {
        emergencyContactPayload.address = form.emergencyInfo.address;
      }

      if (Object.keys(emergencyContactPayload).length > 0) {
        updatePayload.emergencyContact = emergencyContactPayload;
      }

      // parents
      const origParents = orig?.parents || [];
      const alteredParents: any[] = [];

      parentsWithUploadedImages.forEach((submittedParent, idx) => {
        const op = origParents[idx];
        const pForm = form.parents?.[idx];
        const pDirty = dirtyFields?.parents?.[idx];

        if (!op || submittedParent.id == null) {
          alteredParents.push(submittedParent);
          return;
        }

        const partialParent: Record<string, any> = { id: submittedParent.id };
        let hasChanges = false;

        let opFirst = op.user?.firstName || "";
        let opLast = op.user?.lastName || "";
        if (op.user?.fullName) {
          const [f = "", ...rest] = op.user.fullName.trim().split(" ");
          opFirst = f;
          opLast = rest.join(" ");
        }

        if (submittedParent.firstName !== opFirst || pDirty?.firstName) {
          partialParent.firstName = submittedParent.firstName;
          hasChanges = true;
        }
        if (submittedParent.lastName !== opLast || pDirty?.lastName) {
          partialParent.lastName = submittedParent.lastName;
          hasChanges = true;
        }
        if ((submittedParent.suffix || "") !== (op.suffix || "") || pDirty?.suffix || pDirty?.title) {
          partialParent.suffix = submittedParent.suffix;
          hasChanges = true;
        }
        if ((submittedParent.relationship || "").toLowerCase() !== (op.relationship || "").toLowerCase() || pDirty?.relationship) {
          partialParent.relationship = submittedParent.relationship;
          hasChanges = true;
        }
        if ((submittedParent.phone || "") !== (op.user?.phone || "") || pDirty?.phone) {
          partialParent.phone = submittedParent.phone;
          hasChanges = true;
        }
        if ((submittedParent.email || "") !== (op.user?.email || "") || pDirty?.email) {
          partialParent.email = submittedParent.email;
          hasChanges = true;
        }
        if ((submittedParent.address || "") !== (op.user?.address || "") || pDirty?.address) {
          partialParent.address = submittedParent.address;
          hasChanges = true;
        }
        if ((submittedParent.notes || "") !== (op.notes || "") || pDirty?.notes) {
          partialParent.notes = submittedParent.notes;
          hasChanges = true;
        }
        if (pForm && isFile(pForm.photoUrl)) {
          partialParent.photoUrl = submittedParent.photoUrl;
          hasChanges = true;
        }

        if (hasChanges) {
          alteredParents.push(partialParent);
        }
      });

      if (form.parents?.length !== origParents.length || alteredParents.length > 0 || dirtyFields?.parents) {
        updatePayload.parents = alteredParents;
      }

      // documents
      const origDocs = orig?.documents || [];
      const isDocumentsAltered =
        newFiles.length > 0 ||
        removedDocuments.length > 0 ||
        dirtyFields?.documents ||
        finalDocuments.length !== origDocs.length ||
        finalDocuments.some((d, idx) => {
          if (isFile(d)) return true;
          return (d as any).documentUrl !== origDocs[idx]?.documentUrl || (d as any).docName !== origDocs[idx]?.docName;
        });

      if (isDocumentsAltered) {
        updatePayload.documents = finalDocuments;
      }

      payload = updatePayload;
    } else {
      payload = {
        schoolId: schoolData?.school?.id,
        schedule: form.schedule,
        classroomId: form.classrooms,
        generalInfo: {
          firstName: form.generalInfo.firstName,
          lastName: form.generalInfo.lastName,
          middleName: form.generalInfo.middleName || null,
          address: form.generalInfo.address,
          dateOfBirth: form.generalInfo.dateOfBirth,
          enrolmentDate: form.generalInfo.enrolmentDate,
          photoUrl: profileUrl,
          ...(form.generalInfo.gender && { gender: form.generalInfo.gender }),
        },
        medicalInfo: {
          allergies: form.medicalInfo.allergies,
          medications: form.medicalInfo.medications,
          foodPreferences: form.medicalInfo.foodPreferences,
          dietRestriction: form.medicalInfo.dietRestriction,
          notes: form.medicalInfo.notes,
        },
        emergencyContact: {
          suffix: form.emergencyInfo.suffix,
          contactName: `${form.emergencyInfo.firstName} ${form.emergencyInfo.lastName}`,
          phone: form.emergencyInfo.phone,
          relationship: form.emergencyInfo.relationship,
          email: form.emergencyInfo.email,
          address: form.emergencyInfo.address,
        },
        parents: parentsWithUploadedImages,
        documents: finalDocuments,
      };
    }

    if (childId && removedDocuments.length > 0) {
      try {
        await Promise.all(
          removedDocuments
            .filter((doc: any) => doc?.id != null)
            .map((doc: any) => deleteStudentDocumentAsync({ documentId: doc.id })),
        );
      } catch (deletionError) {
        console.error("Error deleting removed documents:", deletionError);
        showToast({
          message: "Some documents could not be deleted",
          description: "The child was updated but some removed documents may still exist.",
          severity: "warning",
          duration: 5000,
        });
      }
    }

    try {
      if (childId) {
        await updateChildAsync(payload);
      } else {
        await createChildAsync(payload);
      }

      showToast({
        message: `Child ${childId ? "updated" : "created"} successfully`,
        description: `You've successfully ${childId ? "updated a child" : "added a child to your school record."} `,
        severity: "success",
        duration: 5000,
      });

      setRemovedDocuments([]);
      reset();
      onClose?.();
      redirect(DashboardRoutes.children);
    } catch (error: any) {
      // Next.js redirect() throws an error with message "NEXT_REDIRECT" – rethrow so the router can handle it
      if (error?.message === "NEXT_REDIRECT") {
        throw error;
      }
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";
      showToast({
        message: childId ? "Failed to update child" : "Failed to create child",
        description: message,
        severity: "error",
        duration: 6000,
      });
    }
  };

  return {
    ...formInstance,
    control,
    setValue,
    childId,
    selectedImage,
    handleImageUpload,
    onSubmitChild,
    isCreatingChild,
    isUpdatingChild,
    isUploadingImage,
    isUploadingDocument,
    goNext,
    goPrev,
    activeTab,
    setActiveTab,
    parents,
    addParent,
    addParentFromExisting,
    appendParentFromExisting,
    setParentFromExisting,
    removeParent,
    handleParentImage,
    isLoading,
    isClassroomsLoading,
    classroomOptions,
    childAdmissionNumber,
    removeDocument,
    replaceDocument,
    onRemoveDocument: handleRemoveDocument,
  };
};

export default useManageChild;
