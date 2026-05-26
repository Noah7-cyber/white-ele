/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { type TeacherProps, initialValue, validationSchema } from "../teacher.constant";
import { useMutationService } from "@/utils/hooks/useMutationService";
import {
  GetTeacherByIdResponse,
  teacherDynamicEndpoints,
  teacherServices,
} from "@/services/teacher.service";
import { uploadServices } from "@/services/upload.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { classroomServices } from "@/services/classroom.service";
import { DropdownOption } from "@/modules/shared/component/Dropdown";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { schoolDynamicEndpoints, GetSchoolResponse } from "@/services/school.service";
import { showToast } from "@/modules/shared/component/Toast";
const useManageTeacher = ({
  onClose,
  onCompleteCreation,
}: {
  onClose?: () => void;
  onCompleteCreation?: () => void;
  isEdit?: boolean;
}) => {
  const router = useRouter();
  const params = useParams();

  const teacherId = params?.id as string | undefined;

  const formInstance = useFormValidator<TeacherProps>({
    validationSchema,
    defaultValues: initialValue as TeacherProps,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const { control, setValue, reset, formState } = formInstance;

  const [classroomOptions, setClassroomOptions] = useState<DropdownOption<number>[]>([]);

  const {
    data,
    hasNextPage: hasMore,
    fetchNextPage,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: {
        delta: 50,
        status: "active",
      },
    },
  });

  useEffect(() => {
    const classrooms = data?.pages?.flatMap((page: any) => page?.classrooms ?? page?.data ?? []) ?? [];
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
  }, [data?.pages]);

  const { data: { staff: teacher } = {} as any, isLoading } = useQueryService<
    any,
    GetTeacherByIdResponse
  >({
    service: teacherDynamicEndpoints.getTeacherById(teacherId!),
    options: {
      enabled: !!teacherId,
    },
  });
  const { data: schoolData } = useQueryService<any, GetSchoolResponse>({
    service: schoolDynamicEndpoints.getParticularSchool(),
  });

  useEffect(() => {
    // When adding a new teacher (no teacherId), explicitly reset to initial values
    if (!teacherId) {
      reset(initialValue as TeacherProps);
      return;
    }

    // When editing, only proceed if teacher data is loaded
    if (!teacher) return;

    const contactName = teacher?.emergencyContacts?.contactName || "";
    const nameParts = contactName.split(" ");

    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const assignedClassrooms = (teacher?.assignedClasses ?? []).map((c: any) => ({
      label: c.classroomName,
      name: c.classroomName,
      value: c.id,
    }));

    reset({
      suffix: teacher?.user?.profile?.suffix || "",
      firstName: teacher?.user?.firstName || "",
      lastName: teacher?.user?.lastName || "",
      email: teacher?.user?.email || "",
      phone: teacher?.user?.phone || "",
      dateOfBirth: teacher?.user?.dateOfBirth || "",
      role: teacher?.staffRole || teacher?.user?.role || "",
      qualification: teacher?.qualification || "",
      address: teacher?.user?.profile?.address || "",
      city: teacher?.user?.profile?.city || "",
      state: teacher?.user?.profile?.state || "",
      postal_code: teacher?.user?.profile?.postalCode || "",
      startDate: teacher?.startDate || "",
      assignedClasses: assignedClassrooms,
      selectedImage: teacher?.user?.profile?.photo || "",
      emergencyContact: {
        suffix: teacher?.emergencyContacts?.suffix || "",
        firstName: firstName || "",
        lastName: lastName || "",
        contactName: contactName || "",
        phone: teacher?.emergencyContacts?.phone || "",
        email: teacher?.emergencyContacts?.email || "",
        address: teacher?.emergencyContacts?.address || "",
        relationship: teacher?.emergencyContacts?.relationship || "",
        notes: teacher?.emergencyContacts?.notes || "",
      },
    } as any);
  }, [teacherId, teacher, reset]);

  const { mutateAsync: uploadImageMutateAsync, isPending: isImagePending } = useMutationService({
    service: uploadServices.uploadImage,
    options: {
      isFormData: true,
    },
  });

  const { mutateAsync: createTeacherAsync, isPending: isCreatingTeacher } = useMutationService({
    service: teacherServices.createTeacher,
    options: {
      isFormData: true,
      disableToast: true,
    },
  });

  const { mutateAsync: updateTeacherAsync, isPending: isUpdatingTeacher } = useMutationService({
    service: teacherDynamicEndpoints.updateTeacher(teacher?.id),
    options: {
      isFormData: true,
      disableToast: true,
    },
  });

  const onHandleSubmit = async (values: TeacherProps) => {
    // Extract only the classroom IDs from the assignedClasses dropdown options
    const classroomIds = Array.isArray(values?.assignedClasses)
      ? values.assignedClasses.map((classroom: any) =>
          typeof classroom === "object" && classroom.value !== undefined
            ? classroom.value
            : classroom,
        )
      : [];

    const reqData = {
      suffix: values?.suffix || "",
      firstName: values?.firstName,
      lastName: values?.lastName,
      // middleName: "",
      email: values?.email,
      phone: values?.phone,
      // dateOfBirth: "",
      address: values?.address,
      city: "",
      state: "",
      postalCode: "",
      // schoolId: schoolData?.school?.id ,
      startDate: values?.startDate,
      // Only include assignedClasses if it has values
      ...(classroomIds.length > 0 ? { assignedClassroom: classroomIds } : {}),
      qualification: values?.qualification,
      // Only include photo if it has a value (not empty string)
      ...(values?.selectedImage ? { photo: values.selectedImage } : {}),
      role: values?.role,
      emergencyContact: {
        suffix: values?.emergencyContact.suffix,
        contactName: `${values?.emergencyContact?.firstName} ${values?.emergencyContact?.lastName}`,
        address: values?.emergencyContact?.address,
        email: values?.emergencyContact?.email,
        relationship: values?.emergencyContact.relationship,
        phone: values?.emergencyContact?.phone,
        notes: values?.emergencyContact.notes,
      },
    };

    try {
      if (teacherId) {
        await updateTeacherAsync(reqData);
      } else {
        await createTeacherAsync(reqData);
      }
      showToast({
        message: teacherId ? "Teacher updated" : "Teacher added",
        description: teacherId
          ? "Teacher information has been updated successfully."
          : "The teacher has been added to your school.",
        severity: "success",
      });
      router.back();
      onCompleteCreation?.();
      onClose?.();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        err?.message ||
        "Something went wrong. Please check the form and try again.";
      showToast({
        message: teacherId ? "Failed to update teacher" : "Failed to add teacher",
        description: message,
        severity: "error",
        duration: 6000,
      });
      throw err;
    }
  };

  async function onUploadImage(event: any) {
    const file = event.target.files[0];
    const logoImageUrl = new FormData();

    logoImageUrl.append("image", file);
    logoImageUrl.append("folder", "profiles");
    const { url }: any = await uploadImageMutateAsync(logoImageUrl);

    setValue("selectedImage", url);

    event.target.value = "";
  }

  return {
    ...formInstance,
    control,
    setValue,
    teacherId,
    isLoading,
    onHandleSubmit,
    isCreatingTeacher,
    isUpdatingTeacher,
    isImagePending,
    onUploadImage,
    classroomOptions,
    formState,
  };
};

export default useManageTeacher;
