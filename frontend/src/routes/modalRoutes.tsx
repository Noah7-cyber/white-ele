/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ScheduleTourModal } from "@/components/ScheduleTourModal";
import { AnnouncementDetailModal } from "@/modules/admin/component/AnnouncementDetailModal";
import CancelTourModal from "@/modules/admin/component/EventModal/CancelTourModal";
import RescheduleTourModal from "@/modules/admin/component/EventModal/RescheduleTourModal";
import type { ReactNode } from "react";
import InvoicePreviewModal from "@/modules/shared/component/InvoicePreviewModal/invoicePreviewModal";
import ParentInvoiceModal from "@/modules/parent/component/ParentInvoiceModal/parentInvoiceModal";
import ViewMilestoneModal from "@/modules/admin/page/Learnings/MilestonesPage/ViewMilestoneModal";
import { ChatModalWrapper } from "@/modules/shared/component/ChatModal/chatModalWrapper";


export interface ModalRouteProps {
  component: ReactNode;
  className?: string;
  hasCloseIcon?: boolean;
  isKeepOpen?: boolean;
  modalProps?: any;
}

export enum ModalRoute {
  announcement = "announcement",
  announcementDetail = "announcement-detail",
  scheduleTour = "schedule-tour",
  cancelTour = "cancel-tour",
  rescheduleTour = "reschedule-tour",
  recordAttendance = "record-attendance",
  invoiceReceipt = "invoice-receipt",
  parentInvoiceReceipt = "parent-invoice-receipt",
  sendInvoice = "send-invoice",
  viewMilestone = "view-milestone",
  chat = "chat",
}

export const modalLayouts: { [key: string]: ModalRouteProps } = {
  // [ModalRoute.announcement]: {
  //   component: <CreateAnnouncementModal  />,
  // },
  [ModalRoute.announcementDetail]: {
    component: <AnnouncementDetailModal />,
  },
  [ModalRoute.scheduleTour]: {
    component: <ScheduleTourModal />,
  },
  [ModalRoute.cancelTour]: {
    component: <CancelTourModal />,
  },
  [ModalRoute.rescheduleTour]: {
    component: <RescheduleTourModal />,
  },
  // [ModalRoute.recordAttendance]: {
  //   component: <RecordAttendanceModal />,
  // },
  [ModalRoute.invoiceReceipt]: {
    component: <InvoicePreviewModal />,
    modalProps: {
      maxWidth: "md",
      fullWidth: true,
    },
  },
  [ModalRoute.parentInvoiceReceipt]: {
    component: <ParentInvoiceModal />,
    modalProps: {
      maxWidth: "md",
      fullWidth: true,
    },
  },
  // [ModalRoute.sendInvoice]: {
  //   component: <SendInvoiceModal />,
  // },
  [ModalRoute.viewMilestone]: {
    component: <ViewMilestoneModal />,
  },
  [ModalRoute.chat]: {
    component: <ChatModalWrapper />,
    hasCloseIcon: false,
  },
};
