"use client";

import type React from "react";
import { useParams, usePathname } from "next/navigation";
import { ChildrenLayout } from "@/layout/Shared/childrenLayout";
import ProfilePage from "@/components/ProfilePage/profilePage";
import ParentPage from "@/screens/ParentPage/parentPage";
import DocumentsPage from "@/screens/DocumentsPage/documentsPage";
import EditIcon from "@/modules/shared/assets/svgs/editIcon.svg";
import { Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useChildDetail } from "./hooks/useChildDetail";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import WarnIcon from "@/modules/shared/assets/svgs/warnIcon.svg";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import Image from "next/image";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { useState } from "react";
import { Button } from "@/modules/shared/component/Button";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { ChildInvoiceList } from "@/screens/ChildInvoiceList";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { ChildResults } from "../ChildResults";
import { usePermissionGuide } from "@/utils/hooks/usePermissionGuide";

type DetailTab = "profile" | "parent" | "documents" | "invoice" | 'results';

interface ChildDetailPageProps {
  params?: Promise<{ id: string; tab: string }>;
}
export const ChildDetail: React.FC<ChildDetailPageProps> = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = pathname?.includes("/admin/");
  const isStaff = pathname?.includes("/staff/");
  const childInvoiceRole = isAdmin ? "admin" : isStaff ? "staff" : "parent";
  const { id, tab } = useParams() as { id: string; tab: string };
      const { hasPermission } = usePermissionGuide({ enabled: true });
  
  const {
    childResponse,
    isPending,
    refetch: refetchChild,
    deactivateModalOpen,
    setDeactivateModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeactivate,
    handleDelete,
    profileData,
  } = useChildDetail(id as string);

  const [activeTab, setActiveTab] = useState<DetailTab>((tab as DetailTab) || "profile");
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (isPending) {
    return <div className="p-10 text-center">Loading child details...</div>;
  }

  if (!childResponse) {
    return <div className="p-10 text-center text-red-500">Failed to load child data.</div>;
  }

  return (
    <>
      <ChildrenLayout>
        <Box className="flex items-center w-full justify-between p-5 pb-2 md:p-0 md:pb-0">
          <Box className="flex items-center gap-3">
            <ButtonIcon
              className="rounded-full border! border-brandColor-active/20! bg-dashboard-bg/20! md:bg-transparent !p- flex items-center justify-center"
              onClick={() => router.back()}
            >
              <Image src={LeftIcon || "/placeholder.svg"} alt="back" />
            </ButtonIcon>

            {!isMobile ? (
              <Box className="flex items-center gap-2">
                <Typography className="text-xl! font-semibold!">{`${childResponse.user.firstName} ${childResponse.user.lastName}`}</Typography>

                {childResponse && (
                  <Box className="px-2 py-1 rounded-full bg-green-100 text-green-700">
                    <span className="text-xs font-medium">Active</span>
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                <Typography className="text-xl! font-semibold!">Child Details</Typography>
              </Box>
            )}
          </Box>
          {isAdmin && hasPermission("student", "update") && !isMobile && (
            <Button
              onClick={() => router.push(`${DashboardRoutes.children}/${id}/edit`)}
              className="rounded-lg! px-4!"
              startIcon={<EditIcon />}
            >
              Edit Profile
            </Button>
          )}
          {isMobile && activeTab && isAdmin === "profile" && (
            <button onClick={() => setMobileActionsOpen(true)}>
              <EllipsesIcon />
            </button>
          )}
        </Box>

        {/* --- Tabs --- */}
        <ScrollableTabBar className="md:border-b md:border-border-lightGray md:mt-4 md:mb-4 bg-dashboard-bg md:bg-transparent px-5 py-5 md:py-0 md:px-0">
          {["profile", "parent", "documents", ...(isAdmin ? ["invoice"] : []), "results"].map((key) => (
            <button
              key={key}
              type="button"
              className={`shrink-0 whitespace-nowrap pb-2 px-3 hover:cursor-pointer ${
                activeTab === key
                  ? "text-brandColor-active! border-b border-brandColor-active font-medium"
                  : "text-[#0250504D]"
              }`}
              onClick={() => setActiveTab(key as DetailTab)}
            >
              {key[0].toUpperCase() + key.slice(1)}
            </button>
          ))}
        </ScrollableTabBar>

        {/* --- Tab Content --- */}
        {activeTab === "profile" && (
          <ProfilePage
            childId={id}
            childData={profileData}
            childPhoto={childResponse?.photoUrl}
            childName={`${childResponse?.user?.lastName} ${childResponse?.user?.firstName}`}
          />
        )}
        {activeTab === "parent" && <ParentPage parents={childResponse.parents} />}
        {activeTab === "documents" && (
          <DocumentsPage
            childId={id}
            documents={childResponse.documents ?? []}
            onDocumentDeleted={refetchChild}
          />
        )}
        {activeTab === "invoice" && <ChildInvoiceList role={childInvoiceRole} />}
        {activeTab === "results" && <ChildResults childId={id} />}
      </ChildrenLayout>

      {/* Confirmation Modals */}
      <ConfirmModal
        open={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        onConfirm={handleDeactivate}
        icon={<WarnIcon />}
        title="Are you sure you want to deactivate this child?"
        description="You can reactivate later."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
      />

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this child?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      {/* Mobile Actions Bottom Sheet */}
      {mobileActionsOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileActionsOpen(false)}
        />
      )}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 transition-transform duration-300 ${
          mobileActionsOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
        <div className="flex flex-col pb-8">
          {hasPermission("student", "update") && <button
            type="button"
            className="w-full text-left px-6 py-4 text-sm font-medium text-[#101828] border-b border-gray-100"
            onClick={() => {
              setMobileActionsOpen(false);
              router.push(`${DashboardRoutes.children}/${id}/edit`);
            }}
          >
            Edit
          </button>}
         {hasPermission("student", "update") && <button
            type="button"
            className="w-full text-left px-6 py-4 text-sm font-medium text-[#101828] border-b border-gray-100"
            onClick={() => {
              setMobileActionsOpen(false);
              setDeactivateModalOpen(true);
            }}
          >
            Deactivate
          </button>}
       {hasPermission("student", "delete") && <button
            type="button"
            className="w-full text-left px-6 py-4 text-sm font-medium text-red-500"
            onClick={() => {
              setMobileActionsOpen(false);
              setDeleteModalOpen(true);
            }}
          >
            Delete
          </button>}
        </div>
      </div>
    </>
  );
};
