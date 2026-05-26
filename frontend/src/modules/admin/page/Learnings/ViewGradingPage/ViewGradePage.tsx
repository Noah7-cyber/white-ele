"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { useRouter, useParams } from "next/navigation";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import useViewGradePage from "./hook/useViewGradePage";
import { Table } from "@/modules/shared/component/Table";
import { Button } from "@/modules/shared/component/Button";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { DashboardRoutes } from "@/routes/dashboard.routes";

const SCORE_RUBRIC = [
  { score: "Score 0", description: "Not yet demonstrated" },
  { score: "Score 1", description: "Emerging - skill occasionally observed" },
  { score: "Score 2", description: "Developing - skill regularly observed" },
  { score: "Score 3", description: "Secure - skill consistently demonstrated" },
];

export default function ViewGradePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const {
    assessmentTitle,
    currentPage,
    rowsPerPage,
    totalItems,
    onPageChange,
    GradingStudentList,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    handleSaveAll,
    handleBack,
    paginatedStudents,
    gradeByStudentId,
    onGradeChange,
  } = useViewGradePage(id);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width:768px)");

  const requestLeave = useCallback(
    (href?: string) => {
      if (!hasUnsavedChanges) {
        if (href) router.push(href);
        else handleBack(() => router.back());
        return;
      }
      setPendingHref(href ?? null);
      setLeaveModalOpen(true);
    },
    [hasUnsavedChanges, router, handleBack],
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest(
          "input, textarea, select, [contenteditable='true'], [role='textbox'], .MuiFormControl-root, .MuiInputBase-root, .MuiInputBase-input",
        )
      ) {
        return;
      }
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      const targetUrl = new URL(anchor.href, window.location.origin);
      const isSamePage =
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search;
      if (isSamePage) return;

      event.preventDefault();
      event.stopPropagation();
      requestLeave(targetUrl.pathname + targetUrl.search + targetUrl.hash);
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [hasUnsavedChanges, requestLeave]);

  const headerBlock = (
    <Box
      className={`flex items-center justify-between gap-2 ${
        isMobile ? "shrink-0 rounded-xl bg-[#F0F8F7] px-2 py-3" : "bg-[#F0F8F7] rounded-xl"
      }`}
    >
      <Box className="flex items-center gap-3 min-w-0">
        <ButtonIcon
          className="rounded-full !border !border-brandColor-active/20 !p-1.5 flex items-center justify-center shrink-0 bg-white/80"
          onClick={() => requestLeave()}
        >
          <Image src={LeftIcon} alt="" />
        </ButtonIcon>
        <Typography className="!text-lg md:!text-xl !font-semibold !text-primary-dark truncate">
          {assessmentTitle}
        </Typography>
      </Box>
      {!isMobile && (
        <Box className="flex items-center gap-2 shrink-0">
          <Button
            className="!rounded-lg !px-8 !bg-brandColor-active !text-white"
            onClick={handleSaveAll}
            disabled={isSaving || isLoading || totalItems === 0}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </Box>
      )}
    </Box>
  );

  const rubricBlock = (
    <Box className="shrink-0 bg-white border py-2 border-border-light rounded-xl overflow-hidden">
      <Box
        className={`${isMobile ? "flex overflow-x-auto hide-scrollbar gap-3 px-3 py-2" : "grid grid-cols-4 divide-x"} divide-border-light px-4 py-3 gap-2`}
      >
        {SCORE_RUBRIC.map((item) => (
          <Box
            key={item.score}
            className={`text-left ${isMobile ? "min-w-[200px] shrink-0 rounded-xl border border-border-light bg-white px-3 py-2.5 shadow-sm" : "text-center pb-2"}`}
          >
            <Typography className="!text-xs !py-1 !font-semibold !text-primary-dark !mb-1 border-b border-border-light">
              {item.score}
            </Typography>
            <Typography className="!text-[10px] !py-1 !text-input-gray leading-snug">
              {item.description}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box className="flex justify-start items-center gap-2 px-3 pb-2 pt-1">
        <Box className="w-4 h-4 rounded-full bg-brandColor-active/20 flex items-center justify-center shrink-0">
          <Typography className="!text-[8px] !font-bold !text-brandColor-active">i</Typography>
        </Box>
        <Typography className="!text-[10px] !text-input-gray leading-snug">
          The passing threshold for this milestone is set at 2. Learners must achieve a score of at
          least 2 to successfully complete and pass this milestone.
        </Typography>
      </Box>
    </Box>
  );

  const studentsBlock = isMobile ? (
    <Box className="bg-white rounded-xl border !border-border-table p-4 shadow-sm">
      <div className="grid grid-cols-[1fr_minmax(0,7rem)] gap-2 mb-3">
        <Typography className="!text-sm !font-semibold !text-[#02273A]">Name</Typography>
        <Typography className="!text-sm !font-semibold !text-[#02273A] text-right pr-1">Grade</Typography>
      </div>
      <div className="flex flex-col gap-4">
        {paginatedStudents.map((student) => (
          <div key={student.id} className="grid grid-cols-[1fr_minmax(0,7rem)] items-center gap-2">
            <Typography className="!text-sm !font-medium !text-primary-dark truncate">
              {student.name}
            </Typography>
            <input
              value={gradeByStudentId[student.id] ?? ""}
              onChange={(event) => onGradeChange(student.id, event.target.value)}
              inputMode="numeric"
              maxLength={1}
              placeholder="Input grade"
              className="h-11 w-full rounded-lg border border-border-light px-2 text-sm text-center outline-none focus:border-brandColor-active placeholder:text-gray-300"
            />
          </div>
        ))}
      </div>
    </Box>
  ) : (
    <Box className="bg-white rounded-xl border !border-border-table">
      <Table
        headers={["Name", "Insert Grade"]}
        tableData={GradingStudentList}
        preventRowClickColumnIndex={1}
        isCollapse
        centeredHeaderIndex={[1]}
        isLoading={isLoading}
      />
    </Box>
  );

  const paginationBlock = (
    <Box className="flex justify-center pt-2 pb-1 shrink-0">
      <PaginationControls
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        totalItems={totalItems}
        onPageChange={onPageChange}
        isCondense
        bottomTableClasses="!text-xs"
      />
    </Box>
  );

  return (
    <Box
      className={
        isMobile
          ? "flex flex-col h-[100dvh] max-h-[100dvh] min-h-0 -mx-4 px-4 md:mx-0 md:px-0 md:h-full md:max-h-none relative"
          : "h-full space-y-6 relative"
      }
    >
      {isMobile ? (
        <>
          {headerBlock}
          <Box className="shrink-0 mt-3 space-y-3">{rubricBlock}</Box>
          <Box className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 py-3">
            {studentsBlock}
            {paginationBlock}
          </Box>
          <Box className="shrink-0 sticky bottom-0 z-20 -mx-4 px-4 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] bg-[#F5F7F9] border-t border-gray-200/80">
            <Button
              className="!rounded-xl !w-full !py-3 !bg-brandColor-active !text-white !font-semibold"
              onClick={handleSaveAll}
              disabled={isSaving || isLoading || totalItems === 0}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <button
              type="button"
              className="w-full mt-2 text-center text-sm text-brandColor-active font-medium py-1"
              onClick={() => router.push(DashboardRoutes.learningViewGradeDetail.replace(":id", id))}
            >
              View milestone details
            </button>
          </Box>
        </>
      ) : (
        <>
          {headerBlock}
          {rubricBlock}
          {studentsBlock}
          {paginationBlock}
        </>
      )}

      <ConfirmModal
        open={leaveModalOpen}
        onClose={() => {
          setLeaveModalOpen(false);
          setPendingHref(null);
        }}
        onConfirm={() => {
          setLeaveModalOpen(false);
          if (pendingHref) router.push(pendingHref);
          else handleBack(() => router.back());
          setPendingHref(null);
        }}
        icon={<TrashIcon />}
        title="Leave without saving?"
        description="You have unsaved grading changes. If you leave now, your updates will be lost."
        confirmLabel="Leave"
        cancelLabel="Stay"
      />
    </Box>
  );
}
