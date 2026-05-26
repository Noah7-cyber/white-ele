import { useMutationService } from "../../../utils/hooks/useMutationService";
import { AttendanceDynamicEndpoints } from "@/services/attendance.service";
import { UpdateStaffAttendanceRequest, UpdateChildAttendanceRequest } from "@/services/attendance.service";

export const useUpdateStaffAttendance = (attendanceId: string | number) => {
  return useMutationService<UpdateStaffAttendanceRequest>({
    service: AttendanceDynamicEndpoints.updateStaffAttendance(attendanceId),
    options: {
      successMessage: "Staff attendance updated successfully",
      errorTitle: "Failed to update staff attendance",
      invalidateKeys: ["staffAttendance"],
    },
  });
};

export const useUpdateChildAttendance = (attendanceId: string | number) => {
  return useMutationService<UpdateChildAttendanceRequest>({
    service: AttendanceDynamicEndpoints.updateChildAttendance(attendanceId),
    options: {
      successMessage: "Child attendance updated successfully",
      errorTitle: "Failed to update child attendance",
      invalidateKeys: ["childAttendance"],
    },
  });
};