"use client";

import { useTeacherAttendance } from "@/modules/shared/component/AttendanceComponent/hook/useTeacherAttendance";
import ProfilePage from "@/modules/shared/component/AttendanceComponent/profilePage";
import { capitalizeFirstLetter, getHeaders, simpleDateFormatter, timeFormatter, formatHoursWorked, getHoursWorked } from "@/utils/helpers";
import TableActionMenu from "@/modules/shared/component/TableActionMenu/tableActionMenu";
import { useState } from "react";
import { RecordAttendanceModal } from "@/components/RecordAttendanceModal";
import { useParams } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { GetTeacherByIdResponse, teacherDynamicEndpoints } from "@/services/teacher.service";
import type { Teacher } from "@/services/teacher.service";

const StatusPill = ({ status }: { status: string }) => (
  <span className={`px-3 py-1 rounded-full text-xs ${status === 'Present' ? 'bg-[#E6FFF3] text-[#0A8A4C]' :
    status === 'Absent' ? 'bg-[#FFE6E6] text-[#C74444]' :
      status === 'Late' ? 'bg-[#FFF6DD] text-[#A88400]' :
        ''
    }`}>
    {status}
  </span>
);

const Page = () => {
  const { id } = useParams() as { id: string };
  const { teacherAttendanceSummary, isLoading, handleDelete } = useTeacherAttendance();
  const headers = getHeaders("detail");

  const { data: teacherResponse } = useQueryService<Record<string, never>, GetTeacherByIdResponse>({
    service: teacherDynamicEndpoints.getTeacherById(id ?? ""),
    options: { enabled: !!id },
  });
  const teacher: Teacher | null = teacherResponse?.staff ?? teacherResponse?.data ?? null;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const summary = teacherAttendanceSummary?.metadata;
  const attendances = teacherAttendanceSummary?.attendances || [];
  const statusFromAttendance = teacher?.attendance?.currentAttendance?.status ?? teacher?.attendance?.previousAttendance?.status ?? "—";

  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);

  const tableData = attendances.map((att: any) => ({
    "Date": simpleDateFormatter(att.date),
    "Time In": timeFormatter(att.timeIn),
    "Time Out": timeFormatter(att.timeOut),
    "Hours Worked": att?.timeIn && att?.timeOut ? formatHoursWorked(getHoursWorked(att.timeIn, att.timeOut)) : "-",
    "Reason/Note": att.notes || "-",
    "Status": <StatusPill status={capitalizeFirstLetter(att.status)} />,
    "Action": <TableActionMenu t={att} type="teacherInfo" options={{ onEdit: () => { setSelectedAttendance(att); setOpenEditModal(true); } }} onDelete={handleDelete} />,
  }));

  const isLoadingTeacher = !teacherResponse && !!id;
  const name = teacher ? `${teacher?.user?.firstName ?? ""} ${teacher?.user?.lastName ?? ""}`.trim() : "";

  return (
    <>
      <ProfilePage
        name={name}
        status={statusFromAttendance}
        selectedItem={undefined}
        topCards={[
          { name: "Total Working Days", value: summary?.totalWorkingDays || summary?.totalPotentialSchoolDays || 0 },
          { name: "Present Days", value: summary?.PresentDays || 0 },
          { name: "Absent Days", value: summary?.AbsentDays || 0 },
          { name: "Late Days", value: summary?.LateDays || 0 },
          { name: "Days on Leave", value: summary?.LeaveDays || 0 },
        ]}
        infoData={[
          { label: "Role", value: capitalizeFirstLetter(teacher?.staffRole ?? "") },
          { label: "Subject", value: teacher?.qualification ?? "" },
          { label: "Days Per Week", value: summary?.daysPerWeekCount ?? 0 },
          { label: "Documents", value: 0 },
        ]}
        tableHeaders={headers}
        isLoadingTableData={isLoading}
        isLoading={isLoading || isLoadingTeacher}
        tableData={tableData}
      />
      {openEditModal && selectedAttendance && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <RecordAttendanceModal
            closeModal={() => { setOpenEditModal(false); setSelectedAttendance(null); }}
            isTeacher
            attendanceId={selectedAttendance.id}
          />
        </div>
      )}
    </>
  );
};

export default Page;
