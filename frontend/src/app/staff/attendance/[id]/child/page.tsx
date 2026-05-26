"use client";

import { RecordAttendanceModal } from "@/components/RecordAttendanceModal";
import { useChildAttendance } from "@/modules/shared/component/AttendanceComponent/hook/useChildAttendance";
import ProfilePage from "@/modules/shared/component/AttendanceComponent/profilePage";
import { capitalizeFirstLetter, simpleDateFormatter, timeFormatter } from "@/utils/helpers";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { GetChildByIdResponse, childDynamicEndpoints } from "@/services/child.service";
import type { Student } from "@/services/child.service";

const StatusPill = ({ status }: { status: string }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs ${
      status === "Present"
        ? "bg-[#E6FFF3] text-[#0A8A4C]"
        : status === "Absent"
          ? "bg-[#FFE6E6] text-[#C74444]"
          : status === "Late"
            ? "bg-[#FFF6DD] text-[#A88400]"
            : ""
    }`}
  >
    {status}
  </span>
);
const Page = () => {
  const { id } = useParams() as { id: string };
  const { data, isLoading } = useChildAttendance();
  const headers = ["Date", "Time In", "Time Out", "Reason/Note", "Status"];

  const { data: childResponse } = useQueryService<Record<string, never>, GetChildByIdResponse>({
    service: childDynamicEndpoints.getChildById(id ?? ""),
    options: { enabled: !!id },
  });
  const child: Student | null = childResponse?.data ?? null;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const attendances = data?.data?.attendances || [];
  const statusFromAttendance =
    child?.attendance?.currentAttendance?.status ??
    child?.attendance?.previousAttendance?.status ??
    "—";
  const parentName = child?.parents?.length
    ? child.parents
        .map((p) => `${p?.user?.firstName ?? ""} ${p?.user?.lastName ?? ""}`.trim())
        .filter(Boolean)
        .join(", ") || "—"
    : "—";
  const classroomName =
    (child as any)?.currentClassroom?.classroomName ?? (child as any)?.classroomName ?? "—";
  const age = child?.user?.dateOfBirth
    ? new Date().getFullYear() - new Date(child.user.dateOfBirth).getFullYear()
    : "—";

  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const tableData = attendances.map((att: any) => ({
    Date: simpleDateFormatter(att.date),
    "Time In": timeFormatter(att.timeIn),
    "Time Out": timeFormatter(att.timeOut),
    "Reason/Note": att.notes || "-",
    Status: <StatusPill status={capitalizeFirstLetter(att.status)} />,
    // "Action": <TableActionMenu t={att} type="childInfo" options={{ onEdit: () => { setSelectedAttendance(att); setOpenEditModal(true); } }} onDelete={handleDelete} />,
  }));
  const name = child ? `${child?.user?.firstName ?? ""} ${child?.user?.lastName ?? ""}`.trim() : "";
  const isLoadingChild = !childResponse && !!id;

  return (
    <>
      <ProfilePage
        selectedItem={undefined}
        name={name}
        status={statusFromAttendance}
        topCards={[
          { name: "Total School Days", value: data?.data?.potentialSchoolDays || 0 },
          { name: "Present Days", value: data?.data?.presentDays || 0 },
          { name: "Absent Days", value: data?.data?.absentDays || 0 },
          { name: "Late Days", value: data?.data?.lateDays || 0 },
          { name: "Excused Days", value: data?.data?.excusedDays || 0 },
        ]}
        isLoadingTableData={isLoading}
        isLoading={isLoading || isLoadingChild}
        infoData={[
          { label: "Class", value: classroomName },
          { label: "Age", value: age },
          { label: "Parent/Guardian", value: parentName },
          { label: "Admission number", value: child?.admissionNumber ?? "—" },
        ]}
        tableHeaders={headers}
        tableData={tableData}
      />
      {openEditModal && selectedAttendance && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <RecordAttendanceModal
            closeModal={() => {
              setOpenEditModal(false);
              setSelectedAttendance(null);
            }}
            attendanceId={selectedAttendance.id}
          />
        </div>
      )}
    </>
  );
};
export default Page;
