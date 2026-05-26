/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQueryService } from "@/utils/hooks/useQueryService";
import { GetTeacherByIdResponse, teacherDynamicEndpoints } from "@/services/teacher.service";
import { useState } from "react";
import { useParams } from "next/navigation";
import { RoleOptions } from "../../ManageTeacher/teacher.constant";

export function useTeacherDetail(id: string) {
  const params = useParams();

  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const teacherId = params?.id as string;


  const {
    data: { staff: teachers } = {} as any,
    isLoading,
    isError,
    refetch,
  } = useQueryService<
    any, // request body type (GET request → usually void or any)
    GetTeacherByIdResponse
  >({
    service: teacherDynamicEndpoints.getTeacherById(teacherId!),
    options: {
      enabled: !!teacherId,
    },
  });

  const resolvedRoleValue = teachers?.staffRole || teachers?.user?.role || "";
  const roleLabel =
    RoleOptions.find((opt) => opt.value === resolvedRoleValue)?.name || resolvedRoleValue || "N/A";

  const teacher = teachers
    ? {
        firstName: teachers.user?.firstName,
        lastName: teachers.user?.lastName,
        email: teachers.user?.email,
        phone: teachers.user?.phone,
        assignedClassroom:
          teachers.assignedClasses?.length > 0
            ? teachers.assignedClasses.map((c: any) => c.classroomName).join(", ")
            : "None",
        address: teachers.user?.address || "N/A",
        startDate: teachers.startDate,
        qualification: teachers.qualification,
        role: roleLabel,
        photoUrl: teachers?.user?.profile?.photo || null,
        emergencyContact: teachers.emergencyContacts || null,
      }
    : null;

  const handleDeactivate = async () => {};
  const handleDelete = async () => {};

  return {
    teacher,
    isLoading,
    isError,
    
    deactivateModalOpen,
    setDeactivateModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeactivate,
    handleDelete,
  };
}
