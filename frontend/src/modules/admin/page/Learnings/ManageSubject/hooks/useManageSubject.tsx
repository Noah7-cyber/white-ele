/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { type SubjectFormValues, initialValue, validationSchema } from "../subject.constant";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import type { DropdownOption } from "@/modules/shared/component/Dropdown";
import { showToast } from "@/modules/shared/component/Toast";
import { teacherServices, teacherDynamicEndpoints, type Teacher } from "@/services/teacher.service";
import {
  curriculumServices,
  type Subject,
  type SubjectScheduleItem,
} from "@/services/curriculum.service";
import { subjectServices, subjectDynamicEndpoints } from "@/services/subject.service";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { SKILL_OPTIONS } from "@/constants/learning.enums";
import { classroomServices } from "@/services/classroom.service";
import { useUser } from "@/utils/hooks/useUser";
import { StaffRoutes } from "@/routes/staff.routes";

export interface CurriculumOption {
  id: string;
  label: string;
  value: string;
}

/** Convert API schedule (day, startTime, endTime as "HH:mm") to form schedule (hour, minute, meridiem) */
function apiScheduleToForm(
  items: SubjectScheduleItem[] | undefined,
): SubjectFormValues["schedule"] {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((s) => {
    const start = parseTimeTo12h(s.startTime ?? "09:00");
    const end = parseTimeTo12h(s.endTime ?? "17:00");
    return {
      day: s.day,
      startHour: start.hour,
      startMinute: start.minute,
      startMeridiem: start.meridiem,
      endHour: end.hour,
      endMinute: end.minute,
      endMeridiem: end.meridiem,
    };
  });
}

function parseTimeTo12h(time: string): {
  hour: number | null;
  minute: number | null;
  meridiem: string;
} {
  const parts = time.trim().split(/[:\s]/).filter(Boolean);
  const hour24 = parts[0] != null ? parseInt(parts[0], 10) : null;
  const minute = parts[1] != null ? parseInt(parts[1], 10) : 0;
  if (hour24 === null || isNaN(hour24)) return { hour: null, minute: null, meridiem: "AM" };
  // Assume API uses 24h (0-23)
  let hour12: number;
  let meridiem: string;
  if (hour24 === 0) {
    hour12 = 12;
    meridiem = "AM";
  } else if (hour24 < 12) {
    hour12 = hour24;
    meridiem = "AM";
  } else if (hour24 === 12) {
    hour12 = 12;
    meridiem = "PM";
  } else {
    hour12 = hour24 - 12;
    meridiem = "PM";
  }
  return {
    hour: hour12,
    minute: isNaN(minute) ? null : Math.min(59, Math.max(0, minute)),
    meridiem,
  };
}

/** Convert form schedule to API format with 24h "HH:mm" times */
function formScheduleToApi(schedule: SubjectFormValues["schedule"]): SubjectScheduleItem[] {
  return (schedule ?? []).map((s) => ({
    day: s.day,
    startTime: to24hString(s.startHour, s.startMinute, s.startMeridiem),
    endTime: to24hString(s.endHour, s.endMinute, s.endMeridiem),
  }));
}

function to24hString(hour: number | null, minute: number | null, meridiem: string): string {
  if (hour == null || minute == null) return "09:00";
  let h = hour;
  if (meridiem === "PM" && hour !== 12) h += 12;
  if (meridiem === "AM" && hour === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(Math.min(59, Math.max(0, minute))).padStart(2, "0")}`;
}

export default function useManageSubject() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [classroomOptions, setClassroomOptions] = useState<DropdownOption<number>[]>([]);
  const subjectId = params?.id as string | undefined;
  const [staffOptions, setStaffOptions] = useState<DropdownOption<string>[]>([]);
  const formInstance = useFormValidator<SubjectFormValues>({
    validationSchema,
    defaultValues: initialValue as SubjectFormValues,
    reValidateMode: "onChange",
  });

  const { control, setValue, reset, handleSubmit, formState } = formInstance;

  const returnTo = searchParams?.get("returnTo") ?? "";
  const prefillCurriculumId = searchParams?.get("curriculumId") ?? "";

  const [curriculumOptions, setCurriculumOptions] = useState<DropdownOption<string>[]>([]);
  const [teacherOptions] = useState<DropdownOption<string>[]>([]);
  const [classOptions] = useState<DropdownOption<string>[]>([]);

  const skillsOptions: DropdownOption<string>[] = useMemo(
    () => SKILL_OPTIONS.map((o) => ({ value: o.value, name: o.label })),
    [],
  );

  const [manageCurriculumModalOpen, setManageCurriculumModalOpen] = useState(false);

  const { role, staffId } = useUser();
  const isStaff = role === "staff";

  const { data: curriculaData } = useInfiniteQueryService<
    Record<string, unknown>,
    { success?: boolean; curriculums?: { id: number; title?: string; name?: string }[]; pagination: PaginationData }
  >({
    service: {
      ...curriculumServices.getAllCurriculums,
      data: { delta: 50 },
    },
  });

  const { data } = useInfiniteQueryService<any, any>({
    service: {
      ...teacherServices.getAllTeachers,
      data: isStaff ? { staffId, delta: 50 } : { delta: 50 },
    },
  });

  const { data: subjectData, isLoading: isSubjectLoading } = useQueryService<
    Record<string, unknown>,
    { success?: boolean; data?: Subject }
  >({
    service: subjectId
      ? subjectDynamicEndpoints.getSubjectById(subjectId)
      : subjectServices.getAllSubjects,
    options: { enabled: !!subjectId },
  });

  const sub = subjectData?.data as Subject | undefined;
  const firstTeacher = Array.isArray(sub?.teacherAssignments)
    ? sub?.teacherAssignments[0]
    : undefined;
  const subAny = sub as Record<string, unknown> | undefined;
  const teacherIdRaw =
    subAny?.assignedTeacherId != null
      ? subAny.assignedTeacherId
      : ((subAny?.assignedTeachers as number[] | undefined)?.[0] ?? firstTeacher?.id);
  const teacherIdFromSubject =
    typeof teacherIdRaw === "number" || typeof teacherIdRaw === "string" ? teacherIdRaw : undefined;

  const { data: teacherByIdData } = useQueryService<
    Record<string, unknown>,
    { success?: boolean; staff?: Teacher }
  >({
    service:
      teacherIdFromSubject != null
        ? teacherDynamicEndpoints.getTeacherById(teacherIdFromSubject)
        : teacherServices.getAllTeachers,
    options: { enabled: !!subjectId && teacherIdFromSubject != null },
  });

  const { mutateAsync: createSubject, isPending: isCreating } = useMutationService({
    service: subjectServices.createSubject,
    options: { disableToast: true },
  });

  const updateService = subjectId
    ? subjectDynamicEndpoints.updateSubject(subjectId)
    : subjectServices.createSubject;
  const { mutateAsync: updateSubject, isPending: isUpdating } = useMutationService({
    service: updateService,
    options: { disableToast: true },
  });

  const {
    data: classRoomData,
    hasNextPage: hasMoreRooms,
    fetchNextPage: fetchNextClassPage,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: isStaff ? { staffId } : undefined,
    },
  });

  useEffect(() => {
    const classrooms =
      classRoomData?.pages?.flatMap((page: any) => page?.classrooms ?? page?.data ?? []) ?? [];
    if (classrooms.length > 0) {
      const mapped = classrooms.reduce((acc: DropdownOption<number>[], c: any) => {
        if (!acc.some((existing) => existing.value === c.id)) {
          acc.push({
            name: c.classroomName ?? c.name ?? "",
            value: c.id,
          });
        }
        return acc;
      }, []);
      setClassroomOptions(mapped);
    }
  }, [classRoomData?.pages]);

  useEffect(() => {
    const list =
      curriculaData?.pages?.flatMap((page: any) => page?.curriculums ?? page?.data ?? []) ?? [];
    if (!Array.isArray(list)) return;
    setCurriculumOptions(
      list.reduce((acc: DropdownOption<string>[], c: any) => {
        if (!acc.some((existing) => existing.value === String(c.id))) {
          acc.push({
            value: String(c.id),
            name: (c.title ?? c.name ?? "") as string,
          });
        }
        return acc;
      }, []),
    );
  }, [curriculaData]);

  const fetchMoreClassrooms = async () => {
    if (!hasMoreRooms) return;
    fetchNextClassPage();
  };

  
  // Build staff options: from getAllTeachers + merge fetched staff-by-ID when editing (same pattern as curriculum - use string value to match form)
  useEffect(() => {
    const staffList =
      data?.pages?.flatMap((page: any) => page?.staff ?? page?.data ?? page?.teachers ?? []) ?? [];
    const baseMapped: DropdownOption<string>[] = Array.isArray(staffList)
      ? staffList.reduce((acc: DropdownOption<string>[], s: any) => {
          if (!acc.some((existing) => existing.value === String(s.id))) {
            const n = `${s.user?.firstName ?? ""} ${s.user?.lastName ?? ""}`.trim();
            acc.push({ name: n, value: String(s.id) });
          }
          return acc;
        }, [])
      : [];
    const fetchedStaff = teacherByIdData?.staff as
      | (Teacher & { user?: { firstName?: string; lastName?: string } })
      | undefined;
    if (
      fetchedStaff &&
      teacherIdFromSubject != null &&
      !baseMapped.some((o) => o.value === String(fetchedStaff.id))
    ) {
      const name =
        `${fetchedStaff.user?.firstName ?? fetchedStaff.firstName ?? ""} ${fetchedStaff.user?.lastName ?? fetchedStaff.lastName ?? ""}`.trim() ||
        fetchedStaff.name ||
        String(fetchedStaff.id);
      setStaffOptions([{ name, value: String(fetchedStaff.id) }, ...baseMapped]);
    } else {
      setStaffOptions(baseMapped);
    }
  }, [data, teacherByIdData, teacherIdFromSubject]);

  // Populate form when editing (same pattern as curriculum: use IDs from subject, ensure options exist)
  useEffect(() => {
    if (!subjectId) {
      reset(initialValue as SubjectFormValues);
      if (prefillCurriculumId) {
        setValue("curriculum", prefillCurriculumId, { shouldValidate: true, shouldDirty: true });
      }
      if (isStaff && staffId) {
        setValue("assignedTeacher", String(staffId), { shouldValidate: true, shouldDirty: true });
      }
      return;
    }
    const subject = subjectData?.data as Subject | undefined;
    if (!subject) return;

    const schedule = apiScheduleToForm(subject.schedule as SubjectScheduleItem[] | undefined);
    const subjectAny = subject as Record<string, unknown>;
    const curriculumId =
      (subject.curriculum as { id?: number } | undefined)?.id ?? subjectAny?.curriculumId;
    const teacherId =
      subjectAny?.assignedTeacherId != null
        ? subjectAny.assignedTeacherId
        : ((subjectAny?.assignedTeachers as number[] | undefined)?.[0] ??
          (Array.isArray(subject.teacherAssignments) ? subject.teacherAssignments[0] : undefined)
            ?.id);
    const firstTeacherForClass = Array.isArray(subject.teacherAssignments)
      ? subject.teacherAssignments[0]
      : undefined;
    const directClassrooms = Array.isArray(
      (subjectAny?.classrooms as { id: number }[] | undefined) ?? [],
    )
      ? ((subjectAny?.classrooms as { id: number }[] | undefined) ?? [])
      : [];
    const classroomIds: number[] = Array.isArray(subjectAny?.classroomIds as number[] | undefined)
      ? (subjectAny.classroomIds as number[])
      : directClassrooms.length > 0
        ? directClassrooms.map((c: { id: number }) => c.id)
      : (firstTeacherForClass?.classrooms?.map((c: { id: number }) => c.id) ?? []);

    const ageRange = subject.ageRange as { minimumAge?: number; maximumAge?: number } | undefined;

    reset({
      subjectName: subject.name ?? "",
      assignedTeacher: teacherId != null ? String(teacherId) : "",
      class: classroomIds[0] ?? "",
      curriculum: curriculumId != null ? String(curriculumId) : "",
      minimumAge: ageRange?.minimumAge != null ? String(ageRange.minimumAge) : "",
      maximumAge: ageRange?.maximumAge != null ? String(ageRange.maximumAge) : "",
      duration: subjectAny?.duration != null ? String(subjectAny.duration) : "",
      skills: Array.isArray(subject.skills) ? subject.skills : [],
      description: subject.description ?? "",
      schedule,
    } as SubjectFormValues);
  }, [subjectId, subjectData, reset, prefillCurriculumId, setValue, isStaff, staffId]);

  // Set assignedTeacher when staff-by-ID loads (same as curriculum: ensure value is set after option exists)
  useEffect(() => {
    const staff = teacherByIdData?.staff as
      | (Teacher & { user?: { firstName?: string; lastName?: string } })
      | undefined;
    if (!staff || !teacherIdFromSubject || !subjectId) return;
    setValue("assignedTeacher", String(staff.id), { shouldValidate: false, shouldDirty: false });
  }, [subjectId, teacherByIdData, teacherIdFromSubject, setValue]);

  const onHandleSubmit = async (values: SubjectFormValues) => {
    const minAge = Number(values.minimumAge);
    const maxAge = Number(values.maximumAge);
    if (!isNaN(minAge) && !isNaN(maxAge) && maxAge <= minAge) {
      return;
    }
    try {
      const normalizedClassroomIds = Array.isArray(values.class)
        ? values.class
            .map((c) => (typeof c === "number" ? c : Number(c)))
            .filter((c) => !Number.isNaN(c))
        : values.class !== "" && values.class != null
          ? [typeof values.class === "number" ? values.class : Number(values.class)].filter(
              (c) => !Number.isNaN(c),
            )
          : undefined;

      const payload = {
        title: values.subjectName,
        description: values.description || undefined,
        curriculumId: Number(values.curriculum),
        subjectSchedule: formScheduleToApi(values.schedule ?? []),
        skills: values.skills?.length ? values.skills : undefined,
        assignedTeacher: values.assignedTeacher ? Number(values.assignedTeacher) : undefined,
        classroomIds: normalizedClassroomIds?.length ? normalizedClassroomIds : undefined,

        minimumAge: values.minimumAge ? Number(values.minimumAge) : undefined,
        maximumAge: values.maximumAge ? Number(values.maximumAge) : undefined,

        duration: values.duration ? Number(values.duration) : undefined,
      };
      if (subjectId) {
        await updateSubject(payload as { title?: string; description?: string });
      } else {
        await createSubject(payload as { title: string; curriculumId: number });
      }
      showToast({
        message: subjectId ? "Subject updated successfully" : "Subject created successfully",
        severity: "success",
        duration: 3000,
      });
      if (returnTo) {
        router.push(returnTo);
      } else {
       if (isStaff) {
        router.push(StaffRoutes.subjects);
       } else {
        router.push(DashboardRoutes.learningSubjects);
       }
      }
    } catch (err: unknown) {
      showToast({
        message: (err as { message?: string })?.message ?? "Failed to save subject",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const isSubmitting = isCreating || isUpdating;

  const onInvalidSubmit = (errors: Record<string, unknown>) => {
    const scheduleErrors = errors?.schedule;
    const message =
      Array.isArray(scheduleErrors) && scheduleErrors.length > 0
        ? "Please fix the schedule errors"
        : typeof scheduleErrors === "object" && scheduleErrors && "message" in scheduleErrors
          ? String((scheduleErrors as { message?: string }).message)
          : typeof errors?.maximumAge === "object" &&
              errors?.maximumAge &&
              "message" in errors.maximumAge
            ? String((errors.maximumAge as { message?: string }).message)
            : "Please fix the form errors";
    showToast({
      message,
      severity: "error",
      duration: 4000,
    });
  };

  const openManageCurriculumModal = () => setManageCurriculumModalOpen(true);
  const closeManageCurriculumModal = () => setManageCurriculumModalOpen(false);

  const onCurriculumAdded = (newCurriculum: { id: string; name: string }) => {
    const option = {
      label: newCurriculum.name,
      value: newCurriculum.id,
      name: newCurriculum.name,
    };
    setCurriculumOptions((prev) => [...prev, option]);
    setValue("curriculum", newCurriculum.id, { shouldValidate: true, shouldDirty: true });
    closeManageCurriculumModal();
  };

  /** For edit mode: schedule in availability format (API uses "schedule" not "subjectSchedule") */
  const scheduleData = subjectData?.data?.schedule ?? subjectData?.data?.subjectSchedule;
  const initialSchedule =
    scheduleData && Array.isArray(scheduleData)
      ? apiScheduleToForm(scheduleData as SubjectScheduleItem[])
      : undefined;

  return {
    ...formInstance,
    control,
    setValue,
    reset,
    handleSubmit,
    formState,
    onInvalidSubmit,
    subjectId,
    initialSchedule,
    curriculumOptions,
    teacherOptions,
    classOptions,
    skillsOptions,
    onHandleSubmit,
    isSubmitting,
    manageCurriculumModalOpen,
    openManageCurriculumModal,
    closeManageCurriculumModal,
    onCurriculumAdded,
    staffOptions,
    classroomOptions,
    isSubjectLoading,
    fetchMoreClassrooms,
    hasMoreRooms,
    isStaff,
    staffId,
  };
}
