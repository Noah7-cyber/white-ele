/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useParams, redirect } from "next/navigation";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { showToast } from "@/modules/shared/component/Toast";
import { type ClassroomProps, initialValue, validationSchema } from "../classroom.constant";
import { useMutationService } from "@/utils/hooks/useMutationService";

import {
  classroomDynamicEndpoints,
  classroomServices,
  GetClassroomByIdResponse,
} from "@/services/classroom.service";

import { teacherServices } from "@/services/teacher.service";
import { DropdownOption } from "@/modules/shared/component/Dropdown";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { GetSchoolResponse, schoolDynamicEndpoints } from "@/services/school.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
export interface StaffOption {
  label: string;
  value: number;
}

const useManageClassroomPage = ({
  onClose,
  onCompleteCreation,
}: {
  onClose?: () => void;
  onCompleteCreation?: () => void;
  isEdit?: boolean;
  classroom?: any;
}) => {
  const router = useRouter();
  const params = useParams();
  const classroomId = params?.classId as string | undefined;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formInstance = useFormValidator<ClassroomProps>({
    validationSchema,
    defaultValues: initialValue as ClassroomProps,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const { control, setValue, getValues, reset, watch } = formInstance;

  const [staffOptions, setStaffOptions] = useState<DropdownOption<number>[]>([]);

  const { data, hasNextPage, fetchNextPage } = useInfiniteQueryService<any, any>({
    service: {
      ...teacherServices.getAllTeachers,
      data: {
        delta: 50,
        status: "active",
      },  
    },
  });

  const fetchMoreStaff = () => {
    if (!hasNextPage) return;
    fetchNextPage();
  };

  const { mutateAsync: getClassroomById, isPending } = useMutationService<
    any,
    GetClassroomByIdResponse
  >({
    service: classroomDynamicEndpoints.getClassroomById(classroomId!),
    options: {
      disableToast: true,
    },
  });

  const { data: schoolData } = useQueryService<any, GetSchoolResponse>({
    service: schoolDynamicEndpoints.getParticularSchool(),
  });

  // Map teacher data from API into dropdown options whenever `data` changes
  useEffect(() => {
    const staff = data?.pages?.flatMap((page: any) => page?.staff ?? page?.data ?? []) ?? [];

    if (!Array.isArray(staff)) return;

    try {
      const mappedStaff: DropdownOption<number>[] = staff.reduce(
        (acc: DropdownOption<number>[], s: any) => {
          if (!acc.some((existing) => existing.value === s.id)) {
            acc.push({
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
  }, [data]);

  const assignedStaff = watch("assignedStaff") || [];

  // Keep local min/max age state in sync with form values (especially on edit)
  //   const { control, handleSubmit, getValues } = useForm();
  const [minAge, setMinAge] = useState(0);
  const [maxAge, setMaxAge] = useState(0);

  // Keep local min/max age state in sync with form values (especially on edit)
  const watchedMin = watch("minimumAge");
  const watchedMax = watch("maximumAge");

  useEffect(() => {
    const min = watchedMin != null && watchedMin !== "" ? Number(watchedMin) : 0;
    const max = watchedMax != null && watchedMax !== "" ? Number(watchedMax) : 0;
    setMinAge(min);
    setMaxAge(max);
  }, [watchedMin, watchedMax]);

  // When minAge increases, ensure maxAge is at least minAge (update form + local state)
  useEffect(() => {
    const currentMax = getValues("maximumAge");
    const maxNum = currentMax != null && currentMax !== "" ? Number(currentMax) : 0;
    const minNum = Number(minAge) || 0;
    if (minNum > 0 && maxNum < minNum) {
      const newMax = String(minNum);
      setValue("maximumAge", newMax, { shouldValidate: true });
      setMaxAge(minNum);
    }
  }, [minAge, setValue, getValues]);

  useEffect(() => {
    if (!classroomId) return;

    const fetchClassroom = async () => {
      const res = (await getClassroomById({})) as GetClassroomByIdResponse;
      const classroom = res.classroom;

      setValue("classroomName", classroom.classroomName);
      setValue("minimumAge", classroom.minimumAge.toString());
      setValue("maximumAge", classroom.maximumAge.toString());
      setValue("maximumCapacity", classroom.maximumCapacity.toString());

      // Assigned staff: normalise to array of ids
      const staffIds = Array.isArray(classroom.assignedStaff)
        ? classroom.assignedStaff.map((s: { id: number } | number) =>
            typeof s === "number" ? s : s.id,
          )
        : [];
      setValue("assignedStaff", staffIds);

      setValue("description", classroom.description ?? ""); // manual mapping
    };

    fetchClassroom();
  }, [classroomId, getClassroomById, setValue]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { mutateAsync: createClassroomAsync, isPending: isCreatingClassroom } = useMutationService({
    service: classroomServices.createClassroom,
    options: {
      isFormData: true,
    },
  });

  const { mutateAsync: updateClassroomAsync, isPending: isUpdatingClassroom } = useMutationService({
    service: classroomDynamicEndpoints.updateClassroom(classroomId!),
    options: {
      isFormData: true,
    },
  });

  const onHandleSubmit = async () => {
    const classroomName = getValues("classroomName");
    const minimumAge = getValues("minimumAge");
    const maximumAge = getValues("maximumAge");
    const maximumCapacity = getValues("maximumCapacity");
    const assignedStaffId = getValues("assignedStaff");
    const description = getValues("description");

    const reqData = {
      classroomName,
      minimumAge,
      maximumAge,
      maximumCapacity,
      assignedStaffId,
      description,
    };
    if (classroomId) {
      await updateClassroomAsync(reqData);
    } else {
      await createClassroomAsync(reqData);
    }
    reset();
    onCompleteCreation?.();
    onClose?.();
    redirect(DashboardRoutes.classRooms);
  };

  const handleSubmit = async () => {
    const isValid = await formInstance.trigger();
    if (!isValid) return;

    const actionText = classroomId ? "Updated" : "Added";
    showToast({
      message: `Classroom ${actionText} Successfully`,
      description: `You've successfully ${classroomId ? "updated" : "added"} a class to your school record.`,
      severity: "success",
      duration: 5000,
    });
    router.push(DashboardRoutes.classRooms);
  };

  return {
    ...formInstance,
    control,
    setValue,
    watch,
    classroomId,
    selectedImage,
    handleImageUpload,
    handleSubmit,
    onHandleSubmit,
    isCreatingClassroom,
    isUpdatingClassroom,
    staffOptions,
    isPending,
    minAge,
    maxAge,
    assignedStaff,
    setMinAge,
    setMaxAge,
  };
};

export default useManageClassroomPage;
