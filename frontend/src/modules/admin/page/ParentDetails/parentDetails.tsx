"use client";

import { ChildrenLayout } from "@/layout/Shared/childrenLayout";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParentDetails } from "./hooks/useParentDetails";
import { ParentInvoiceList } from "../ParentInvoiceList";
import { ParentProfile } from "../ParentProfile";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";
import { CustomModal } from "@/modules/shared/component/CustomModal";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { ParentDynamicEndpoints } from "@/services/parent.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { showToast } from "@/modules/shared/component/Toast";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { ParentDeleteConfirmModal } from "@/modules/admin/component/ParentDeleteConfirmModal";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer";
import { Dropdown } from "@/modules/shared/component/Dropdown";

type DetailTab = "profile" | "invoice";

export const ParentDetails = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DetailTab>("profile");
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [tempFilterStatus, setTempFilterStatus] = useState("");
  const [activeFilterStatus, setActiveFilterStatus] = useState("");
  const isMobile = useMediaQuery("(max-width: 767px)");

  const { parentData, isLoading, handleSearch } = useParentDetails();

  const { mutateAsync: deleteParentAsync, isPending: isDeleting } = useMutationService({
    service: ParentDynamicEndpoints.deleteParent(parentData?.id ?? ""),
  });
  const { mutateAsync: resendInviteAsync, isPending: isResendingInvite } = useMutationService({
    service: ParentDynamicEndpoints.resendInvite(),
  });

  const handleResendInvite = useCallback(() => {
    if (!parentData?.id) {
      showToast({
        message: "Unable to resend invite",
        description: "Parent details are still loading. Please try again.",
        severity: "warning",
        duration: 2500,
      });
      return;
    }

    resendInviteAsync({ parentId: parentData.id })
      .then(() => {
        showToast({
          message: "Invite sent",
          description: "Parent invite has been resent successfully.",
          severity: "success",
          duration: 3000,
        });
      })
      .catch(() => {
        showToast({
          message: "Resend failed",
          description: "Unable to resend parent invite at the moment.",
          severity: "error",
          duration: 3000,
        });
      });
  }, [parentData, resendInviteAsync]);

  useEffect(() => {
    if (!isMobile && isActionSheetOpen) {
      setIsActionSheetOpen(false);
    }
  }, [isMobile, isActionSheetOpen]);
  const actionItems = useMemo(
    () => [
      {
        label: isResendingInvite ? "Resending..." : "Resend Invite",
        onClick: () => {
          setIsActionSheetOpen(false);
          handleResendInvite();
        },
      },
      {
        label: "Delete",
        onClick: () => {
          setIsActionSheetOpen(false);
          setDeleteModalOpen(true);
        },
        danger: true,
      },
    ],
    [handleResendInvite, isResendingInvite],
  );

  const handleDeleteParent = async () => {
    if (!parentData?.id) {
      showToast({
        message: "Unable to delete",
        description: "Parent details are still loading. Please try again.",
        severity: "warning",
        duration: 2500,
      });
      setDeleteModalOpen(false);
      return;
    }
    if ((parentData?.children?.length ?? 0) > 0) {
      showToast({
        message: "Cannot delete parent",
        description: "This parent is linked to at least one child. Reassign guardianship first.",
        severity: "warning",
        duration: 3500,
      });
      setDeleteModalOpen(false);
      return;
    }

    try {
      await deleteParentAsync({});
      setDeleteModalOpen(false);
      router.push(DashboardRoutes.parents);
    } catch {
      // Errors are handled by mutation service toasts
    }
  };

  return (
    <>
      <ChildrenLayout>
        <Box className="flex items-center w-full justify-between bg-white md:bg-transparent p-5 pb-2  md:p-0">
          <Box className="flex items-center gap-3">
            <ButtonIcon
              className="rounded-full !border border-brandColor-active/20! bg-[#008080]/10! md:bg-transparent !p- flex items-center justify-center"
              onClick={() => router.back()}
            >
              <Image src={LeftIcon || "/placeholder.svg"} alt="back" />
            </ButtonIcon>

            <Box className="flex items-center gap-2">
              <Typography className="!text-xl !font-semibold">{`${parentData?.user?.firstName || ""} ${parentData?.user?.lastName || ""}`}</Typography>

              {parentData && (
                <Box className="hidden md:block px-2 py-1 rounded-full bg-green-100 text-green-700">
                  <span className="text-xs font-medium">Active</span>
                </Box>
              )}
            </Box>
          </Box>
          <button
            className="block md:hidden"
            onClick={() => (activeTab === "invoice" ? setFilterOpen(true) : setIsActionSheetOpen(true))}
            aria-label={activeTab === "invoice" ? "Open invoice filters" : "Open parent actions"}
          >
            {activeTab === "invoice" ? <FilterIcon /> : <EllipsesIcon />}
          </button>
        </Box>

        <Box
          className="bg-dashboard-bg md:bg-transparent w-full md:px-0 md:pt-0 pt-3 px-5"
        >
          {/* --- Tabs --- */}
          <ScrollableTabBar className="border-b border-border-lightGray sm:mt-0 mt-4 mb-4">
            {["profile", "invoice"].map((key) => (
              <button
                key={key}
                type="button"
                className={`shrink-0 whitespace-nowrap pb-2 px-3 hover:cursor-pointer ${
                  activeTab === key
                    ? "!text-brandColor-active border-b border-brandColor-active font-medium"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab(key as DetailTab)}
              >
                {key[0].toUpperCase() + key.slice(1)}
              </button>
            ))}
          </ScrollableTabBar>

          {activeTab === "invoice" && (
            <Box className="w-full hidden md:flex items-center justify-between gap-4">
              <SearchTextfield
                onChange={handleSearch}
                placeholder="Search by invoice number, type, etc"
              />
            </Box>
          )}

          {/* --- Tab Content --- */}
          {activeTab === "profile" && (
            <ParentProfile isLoading={isLoading} parentData={parentData} />
          )}

          {activeTab === "invoice" && <ParentInvoiceList statusFilter={activeFilterStatus} />}
        </Box>
      </ChildrenLayout>

      {/* Mobile actions sheet */}
      <CustomModal
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        className="!p-0"
        width="100%"
        radius="16px 16px 0 0"
        maxHeight="70vh"
        modalStyle={
          isMobile
            ? {
                alignItems: "flex-end",
                justifyContent: "center",
              }
            : undefined
        }
        contentStyle={
          isMobile
            ? {
                bottom: 0,
                left: 0,
                transform: "none",
              }
            : undefined
        }
      >
        <div className="px-5 py-4">
          <div className="flex flex-col gap-2">
            {actionItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full text-left p-5 rounded-lg text-sm hover:bg-bg-color ${
                  item.danger ? "text-red-600" : "text-gray-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </CustomModal>

      <ParentDeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteParent}
        loading={isDeleting}
      />

      <MobileFilterDrawer
        open={filterOpen}
        onClose={() => {
          setTempFilterStatus(activeFilterStatus);
          setFilterOpen(false);
        }}
        onApply={() => {
          setActiveFilterStatus(tempFilterStatus);
          setFilterOpen(false);
        }}
        onReset={() => {
          setTempFilterStatus("");
          setActiveFilterStatus("");
          setFilterOpen(false);
        }}
      >
        <div className="flex flex-col gap-1">
          <Dropdown
            isForm
            textFieldProps={{ label: "Status", placeholder: "Select status" }}
            options={[
              { value: "", name: "All" },
              { value: "Paid", name: "Paid" },
              { value: "Sent", name: "Sent" },
              { value: "Overdue", name: "Overdue" },
              { value: "Partially Paid", name: "Partially Paid" },
            ]}
            value={tempFilterStatus}
            onSelect={(value) => setTempFilterStatus(value as string)}
          />
        </div>
      </MobileFilterDrawer>
    </>
  );
};
