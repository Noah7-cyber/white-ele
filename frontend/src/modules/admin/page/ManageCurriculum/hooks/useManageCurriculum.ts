/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  type LessonFormValues,
  initialValue,
  validationSchema,
  type Subject,
  type SubjectFormValues,
  subjectInitialValues,
  subjectValidationSchema,
  type SubjectAttachment,
  MAX_ATTACHMENT_SIZE,
  MAX_ATTACHMENTS,
  ALLOWED_FILE_TYPES,
} from "@/modules/shared/component/Learning/manageCurriculum.constants";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { showToast } from "@/modules/shared/component/Toast";
import { useParams, useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import type { DropdownOption } from "@/modules/shared/component/Dropdown";
import { teacherServices } from "@/services/teacher.service";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { uploadServices } from "@/services/upload.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { classroomServices } from "@/services/classroom.service";
import {
  curriculumServices,
  curriculumDynamicEndpoints,
  type CreateCurriculumRequest,
  type GetCurriculumByIdResponse,
} from "@/services/curriculum.service";
import { useQueryService } from "@/utils/hooks/useQueryService";

// import { DashboardRoutes } from "@/routes/dashboard.routes";
const useManageCurriculum = () => {
  const formInstance = useFormValidator<LessonFormValues>({
    validationSchema,
    defaultValues: initialValue as LessonFormValues,
    reValidateMode: "onChange",
  });
  const router = useRouter();
  const { control, setValue, getValues } = formInstance;
  const { curriculumId } = useParams();
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [staffOptions, setStaffOptions] = useState<DropdownOption<number>[]>([]);
  const [classroomOptions, setClassroomOptions] = useState<DropdownOption<number>[]>([]);

  const handleSelectedClasses = (values: number[]) => {
    setSelectedCategories(values);
    setValue("classroomIds", values, { shouldValidate: true, shouldDirty: true });
  };

  const subjectFormInstance = useFormValidator<SubjectFormValues>({
    validationSchema: subjectValidationSchema,
    defaultValues: subjectInitialValues,
    reValidateMode: "onChange",
  });
  const { mutateAsync: uploadDocumentAsync } = useMutationService({
    service: uploadServices.uploadDocuments,
    options: { isFormData: true, disableToast: true },
  });

  const { data: staffData } = useInfiniteQueryService<any, any>({
    service: {
      ...teacherServices.getAllTeachers,
      data: {
        delta: 50,
        // status: "active",
      },
    },
  });

  const { data: classroomData } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: {
        delta: 50,
        status: "active",
      },
    },
  });

  const { data: curriculumData, isLoading: isLoadingCurriculum } = useQueryService<
    any,
    GetCurriculumByIdResponse
  >({
    service: curriculumDynamicEndpoints.getCurriculumById((curriculumId as string) || ""),
    options: {
      enabled: !!curriculumId,
    },
  });

  useEffect(() => {
    const staff = staffData?.pages?.flatMap((page: any) => page?.staff ?? page?.data ?? []) ?? [];

    if (!Array.isArray(staff)) return;

    try {
      const mappedStaff: DropdownOption<number>[] = staff.reduce(
        (acc: DropdownOption<number>[], s: any) => {
          if (!acc.some((existing) => existing.value === s.id)) {
            acc.push({
              // value: `${s.user?.firstName ?? ""} ${s.user?.lastName ?? ""}`.trim(),
              name: `${s.user?.firstName ?? ""} ${s.user?.lastName ?? ""}`.trim(),
              value: s.id,
            });
          }
          return acc;
        },
        [],
      );

      setStaffOptions(mappedStaff);
    } catch (err) {
      console.error("Failed to map staff options", err);
    }
  }, [staffData]);

  useEffect(() => {
    const classrooms =
      classroomData?.pages?.flatMap((page: any) => page?.classrooms ?? page?.data ?? []) ?? [];
    if (classrooms.length > 0) {
      const mapped = classrooms.reduce((acc: DropdownOption<number>[], c: any) => {
        if (!acc.some((existing) => existing.value === c.id)) {
          acc.push({
            // label: c.classroomName,
            name: c.classroomName,
            value: c.id,
          });
        }
        return acc;
      }, []);
      setClassroomOptions(mapped);
    }
  }, [classroomData?.pages]);

  // Load curriculum data into form when editing
  useEffect(() => {
    if (!curriculumData || !curriculumId) return;

    const curriculum = curriculumData.curriculum;
    // Handle both response structures: curriculum.subjects (actual API) or subjects at root (interface)
    const subjects = curriculum?.subjects || curriculumData.subjects || [];

    // Map API response to form structure
    const mappedSubjects: Subject[] = subjects.map((subject: any) => {
      // Extract teacher IDs from assignedTeachers or teachers array (handle both API formats)
      let teacherIds: number[] = [];

      // If subject.teacher exists and is an object, use its id
      if (subject.teacher && typeof subject.teacher === "object" && subject.teacher.id) {
        teacherIds = [subject.teacher.id];
      } else if (subject.assignedTeachers && Array.isArray(subject.assignedTeachers)) {
        teacherIds = subject.assignedTeachers.map((teacher: any) =>
          typeof teacher === "object" ? teacher.id : teacher,
        );
      } else if (subject.teachers && Array.isArray(subject.teachers)) {
        teacherIds = subject.teachers.map((teacher: any) =>
          typeof teacher === "object" ? teacher.id : teacher,
        );
      }

      // Map documents to attachments if they exist
      const attachments: SubjectAttachment[] =
        subject.attachments?.map((doc: any) => ({
          name: doc.name || doc.docName || "",
          url: doc.url || doc.documentUrl || "",
          size: 0, // Documents from API don't have size
          isExisting: true,
        })) || [];

      return {
        id: subject.id,
        name: subject.name,
        title: subject.name, // For API payload
        description: subject.description || "",
        assignedStaff: teacherIds,
        assignedTeachers: teacherIds, // For API payload
        attachments: attachments,
        documents: subject.attachments || [],
      };
    });

    // Normalize academic year format (API uses "2025/2026", form might use "2025-2026")
    const academicYearValue = curriculum.academicYear
      ? curriculum.academicYear.replace(/\//g, "-")
      : "";

    // Set form values
    setValue("title", curriculum.title || "");
    setValue("academicYear", academicYearValue);
    setValue("term", curriculum.term || "");
    setValue("classroomIds", curriculum.classIds || curriculum.classroomIds || []);
    setValue("startDate", curriculum.startDate || null);
    setValue("endDate", curriculum.endDate || null);
    setValue("description", curriculum.description || "");
    setValue("subjects", mappedSubjects);

    // Set selected categories
    setSelectedCategories(curriculum.classIds || curriculum.classroomIds || []);
  }, [curriculumData, curriculumId, setValue]);

  const assignedStaff = subjectFormInstance.watch("assignedStaff") || [];

  const toggleSubjectExpand = (subjectId: string | number) => {
    const idStr = String(subjectId);
    setExpandedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idStr)) {
        newSet.delete(idStr);
      } else {
        newSet.add(idStr);
      }
      return newSet;
    });
  };

  const openAddSubjectModal = () => {
    setEditingSubject(null);
    // Explicitly reset to initial values to ensure clean state
    subjectFormInstance.reset(subjectInitialValues);
    setIsSubjectModalOpen(true);
  };

  const openEditSubjectModal = (subject: Subject) => {
    setEditingSubject(subject);
    const mappedAttachments: SubjectAttachment[] = (subject.attachments || []).map((att) => ({
      ...att,
      file: undefined, // existing files don't have a File object
      isExisting: true,
    }));

    subjectFormInstance.reset({
      name: subject.name || "",
      description: subject.description || "",
      attachments: mappedAttachments,
      assignedStaff: subject.assignedStaff || [],
    });
    setIsSubjectModalOpen(true);
  };

  const closeSubjectModal = () => {
    setIsSubjectModalOpen(false);
    setEditingSubject(null);
    // Explicitly reset to initial values when closing
    subjectFormInstance.reset(subjectInitialValues);
  };

  const handleAddSubject = async () => {
    const isValid = await subjectFormInstance.trigger();
    if (!isValid) return;

    const formData = subjectFormInstance.getValues();

    // Normalize attachments - handle both File[] and SubjectAttachment[]
    const normalizedAttachments: SubjectAttachment[] = (formData.attachments || []).map(
      (att: any) => {
        // If it's a File object, convert to SubjectAttachment
        if (att instanceof File) {
          return {
            file: att,
            name: att.name,
            size: att.size,
            type: att.type,
          };
        }
        return att as SubjectAttachment;
      },
    );

    // Separate new files (with file property) from existing attachments
    const newFiles = normalizedAttachments.filter((att) => att.file);
    const existingAttachments = normalizedAttachments.filter((att) => att.isExisting && !att.file);

    const uploadedFiles: SubjectAttachment[] = [];

    // Upload new files
    for (const att of newFiles) {
      try {
        const fd = new FormData();
        fd.append("documents", att.file!); // key must match backend

        const res = await uploadDocumentAsync(fd); // use the mutation hook
        // API returns: { success: true, message: string, files: [{ fileName: string, url: string }] }
        const response = res as { files?: { fileName: string; url: string }[] };
        if (!response.files || response.files.length === 0) {
          throw new Error("No file returned from upload");
        }
        const uploadedFile = response.files[0];
        uploadedFiles.push({
          name: att.name,
          size: att.size,
          type: att.type,
          url: uploadedFile.url,
          isExisting: true,
          file: undefined, // remove file reference
        });
      } catch (error) {
        console.error("Error uploading file:", error);
        showToast({
          message: `Failed to upload ${att.name}`,
          severity: "error",
          duration: 3000,
        });
      }
    }

    // Merge existing attachments with newly uploaded files
    const finalAttachments = [...existingAttachments, ...uploadedFiles];

    // Convert attachments to documents format for API
    const documents = finalAttachments
      .filter((att) => att.url) // Only include uploaded/existing files with URLs
      .map((att) => ({
        fileName: att.name,
        url: att.url,
      }));

    const newSubject: Subject = {
      id: editingSubject?.id || `subject-${Date.now()}`,
      name: formData.name,
      title: formData.name, // For API payload
      description: formData.description,
      attachments: finalAttachments,
      assignedStaff: formData.assignedStaff,
      assignedTeachers: formData.assignedStaff, // For API payload
      documents: documents, // For API payload
    };

    // Update subjects in the curriculum
    const currentSubjects = getValues("subjects") || [];
    const updatedSubjects = editingSubject
      ? currentSubjects.map((s) => (String(s.id) === String(editingSubject.id) ? newSubject : s))
      : [...currentSubjects, newSubject];

    setValue("subjects", updatedSubjects, { shouldValidate: true, shouldDirty: true });
    closeSubjectModal();

    showToast({
      message: editingSubject ? "Subject updated successfully" : "Subject added successfully",
      severity: "success",
      duration: 3000,
    });
  };

  const handleDeleteSubject = (subjectId: string | number) => {
    const currentSubjects = getValues("subjects") || [];
    const updatedSubjects = currentSubjects.filter((s) => String(s.id) !== String(subjectId));
    setValue("subjects", updatedSubjects, { shouldValidate: true, shouldDirty: true });
    setExpandedSubjects((prev) => {
      const newSet = new Set(prev);
      newSet.delete(String(subjectId));
      return newSet;
    });
    showToast({
      message: "Subject deleted successfully",
      severity: "success",
      duration: 3000,
    });
  };

  const handleSubjectFileUpload = (files: File[]) => {
    const currentAttachments = subjectFormInstance.getValues("attachments") || [];

    // Filter to keep only existing attachments (marked as isExisting)
    // New File objects will replace old ones when added
    const existingAttachments = currentAttachments.filter(
      (att: any) => att.isExisting && !att.file,
    );

    const validFiles: SubjectAttachment[] = [];

    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showToast({ message: `${file.name} is not a valid file type.`, severity: "error" });
        continue;
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        showToast({ message: `${file.name} exceeds max size of 3MB.`, severity: "error" });
        continue;
      }
      if (existingAttachments.length + validFiles.length >= MAX_ATTACHMENTS) break;

      validFiles.push({ file, name: file.name, size: file.size, type: file.type });
    }

    if (validFiles.length > 0) {
      subjectFormInstance.setValue("attachments", [...existingAttachments, ...validFiles], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handleRemoveSubjectAttachment = (index: number) => {
    const currentFiles = subjectFormInstance.getValues("attachments") || [];
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    subjectFormInstance.setValue("attachments", updatedFiles, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const QualificationOptions = [
    "NCE (Nigeria Certificate in Education)",
    "B.Ed (Bachelor of Education)",
    "B.Sc (Ed) - Bachelor of Science in Education",
    "B.A (Ed) - Bachelor of Arts in Education",
    "Scheduled",
    "M.Ed (Master of Education)",
    "Suspended",
    "PGDE (Postgraduate Diploma in Education)",
    "PhD (Doctor of Philosophy in Education)",
    "B.Sc (Bachelor of Science)",
    "B.A (Bachelor of Arts)",
    "Special Education Certificate",
    "Child Psychology Diploma",
    "B.Mus (Bachelor of Music)",
    "B.Fine Arts / B.A (Fine Arts)",
    "Others",
  ];

  const { mutateAsync: createCurriculumAsync, isPending: isCreatingCurriculum } =
    useMutationService({
      service: curriculumServices.createCurriculum,
    });

  const { mutateAsync: updateCurriculumAsync, isPending: isUpdatingCurriculum } =
    useMutationService({
      service: curriculumId
        ? curriculumDynamicEndpoints.updateCurriculum(curriculumId as string)
        : curriculumServices.createCurriculum,
    });

  const handleSubmit = async () => {
    const isValid = await formInstance.trigger();
    if (!isValid) return;

    const formData = formInstance.getValues();
    const subjects = formData.subjects || [];

    // Transform subjects to match backend payload
    const curriculumSubjects = subjects.map((subject: Subject) => {
      // Extract teacher ID - only one teacher can be assigned (single ID, not array)
      // Handle both single value (number or object) and array formats
      let teacherId: number | undefined = undefined;

      // if (subject.assignedTeachers) {
      //   // Check if it's an array
      //   if (Array.isArray(subject.assignedTeachers)) {
      //     // If array, take the first element
      //     const teacher = subject.assignedTeachers[0];
      //     if (teacher) {
      //       teacherId =
      //         typeof teacher === "object" && "id" in teacher && teacher.id
      //           ? teacher.id
      //           : (teacher as number);
      //     }
      //   } else {
      //     // Single value (number or object)
      //     const assignedTeacher = subject.assignedTeachers as number | { id: number; name: string };
      //     teacherId =
      //       typeof assignedTeacher === "object" && "id" in assignedTeacher
      //         ? assignedTeacher.id
      //         : (assignedTeacher as number);
      //   }
      // } else if (subject.assignedStaff) {
      //   // Handle assignedStaff - take first if array, or use as single value
      //   if (Array.isArray(subject.assignedStaff)) {
      //     teacherId = subject.assignedStaff.length > 0 ? subject.assignedStaff[0] : undefined;
      //   } else {
      //     teacherId = subject.assignedStaff as number;
      //   }
      // }

      if (Array.isArray(subject.assignedStaff) && subject.assignedStaff.length > 0) {
        teacherId = subject.assignedStaff[0];
      } else if (typeof subject.assignedStaff === "number") {
        teacherId = subject.assignedStaff;
      }
      // Convert attachments to API format: array of URLs (strings only)
      const attachments = (subject.attachments || [])
        .filter((att) => {
          // Only include attachments that have a URL (uploaded/existing files)
          if (typeof att === "object" && "url" in att) {
            return !!att.url;
          }
          return false;
        })
        .map((att) => {
          const attachment = att as SubjectAttachment;
          return {
            url: attachment.url || "",
            name: attachment.name || "",
          };
        })
        .filter((att) => !!att.url && !!att.name); // Remove any empty

      return {
        title: subject.title || subject.name,
        assignedTeachers: teacherId, // Single teacher ID (not array)
        description: subject.description || "",
        attachments: attachments,
      };
    });

    // Format dates to YYYY-MM-DD
    const formatDate = (date: string | Date | null): string => {
      if (!date) return "";
      const d = new Date(date);
      return d.toISOString().split("T")[0];
    };

    // Convert academic year format from "2025-2026" to "2025/2026" if needed
    const academicYearValue = formData.academicYear.includes("/")
      ? formData.academicYear
      : formData.academicYear.replace(/-/g, "/");

    const payload: CreateCurriculumRequest = {
      title: formData.title,
      academicYear: academicYearValue,
      term: formData.term,
      startDate: formatDate(formData.startDate),
      endDate: formatDate(formData.endDate),
      classroomIds: formData.classroomIds || [],
      description: formData.description || "",
      subjects: curriculumSubjects,
    };

    try {
      if (curriculumId) {
        await updateCurriculumAsync(payload);
        showToast({
          message: "Curriculum Updated Successfully.",
          description: "You've successfully updated the curriculum.",
          severity: "success",
          duration: 5000,
        });
      } else {
        await createCurriculumAsync(payload);
        showToast({
          message: "Curriculum Created Successfully.",
          description: "You've successfully created a curriculum.",
          severity: "success",
          duration: 5000,
        });
      }
      router.push(DashboardRoutes.curriculum);
    } catch (error) {
      console.error("Error saving curriculum:", error);
      showToast({
        message: "Failed to save curriculum.",
        severity: "error",
        duration: 5000,
      });
    }
  };

  const handleSaveDraft = async () => {
    const formData = formInstance.getValues();
    showToast({
      message: "Draft saved successfully.",
      severity: "success",
      duration: 3000,
    });
  };

  return {
    ...formInstance,
    curriculumId,
    control,
    setValue,
    getValues,
    QualificationOptions,
    handleSubmit,
    handleSaveDraft,
    selectedCategories,
    setSelectedCategories: handleSelectedClasses,
    // Subjects
    subjects: getValues("subjects") || [],
    isSubjectModalOpen,
    openAddSubjectModal,
    openEditSubjectModal,
    closeSubjectModal,
    handleAddSubject,
    handleDeleteSubject,
    editingSubject,
    expandedSubjects,
    toggleSubjectExpand,
    // Subject form
    subjectControl: subjectFormInstance.control,
    subjectFormInstance,
    handleSubjectFileUpload,
    handleRemoveSubjectAttachment,
    assignedStaff,
    staffOptions,
    classroomOptions,
    isCreatingCurriculum,
    isUpdatingCurriculum,
    isLoadingCurriculum,
  };
};
export default useManageCurriculum;
