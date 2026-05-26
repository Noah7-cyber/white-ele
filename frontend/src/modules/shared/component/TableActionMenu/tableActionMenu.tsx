/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useState } from "react";
import { useNavigation } from "@/utils/hooks/useNavigation";
import { RecordAttendanceModal, } from "@/components/RecordAttendanceModal";
// import useAttendance from "@/modules/admin/page/Attendance/hook/useAttendance";
import { ActionModal } from "@/modules/shared/component/ActionModalV2/actionModal";
import useAttendance from "../AttendanceComponent/hook/useAttendance";
import { usePathname } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";

interface Props {
  t: any;
  type: "teacher" | "child" | "teacherInfo" | "childInfo" | "admin" | "adminInfo";
  options?: { isChild?: boolean; isTeacher?: boolean; isAdmin?: boolean; onEdit?: () => void };
  onDelete?: (id: number) => void;
}

const TableActionMenu: React.FC<Props> = ({ t, type, options, onDelete }) => {

  const pathname = usePathname();
  const navigate = useNavigation();
  const { IconTrigger: iconTrigger } = useAttendance();
  const [openEditModal, setOpenEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isInfoPage = type === "teacherInfo" || type === "childInfo" || type === "adminInfo";
  const isAdminPath = pathname?.includes("/admin/attendance");

  const actions = [
    ...(type !== "admin" ? [{
      label: isInfoPage ? "Edit" : "View",
      onClick: ({ push }: typeof navigate) => {
        if (isInfoPage) {
          if (options?.onEdit) {
            options.onEdit();
          } else {
            setOpenEditModal(true);
          }
        } else {
          const id = options?.isChild ? t.studentId : options?.isAdmin ? t.adminId : t.teacherId;
          const roleType = options?.isChild ? "child" : options?.isAdmin ? "admin" : "teacher";
          push(`${isAdminPath ? "/admin/attendance/" : "/staff/attendance/"}${id}/${roleType}`);
        }
      },
      icon: "",
    }] : []),
    ...(onDelete ? [{
      label: "Delete",
      onClick: () => {
        setShowDeleteConfirm(true);
      },
      icon: "",
    }] : []),
  ];

  return (
    <>
      <ActionModal
        actions={actions}
        classNames="items-start !gap-0 !p-4"
        width={160}
        customModalclassNames="!p-0"
        Iconcomponent={iconTrigger}
      />

      {openEditModal && type === "teacherInfo" ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <RecordAttendanceModal 
            closeModal={() => setOpenEditModal(false)} 
            isTeacher 
            attendanceId={t.id}
          />
        </div>
      ) : (
        openEditModal &&
        type === "childInfo" && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <RecordAttendanceModal 
              closeModal={() => setOpenEditModal(false)} 
              attendanceId={t.id}
            />
          </div>
        )
      )}

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (onDelete) {
            onDelete(t.id);
          }
          setShowDeleteConfirm(false);
        }}
        icon={<TrashIcon />}
        title="Delete Attendance"
        description="Are you sure you want to delete this attendance record? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </>
  );
};

export default TableActionMenu;
