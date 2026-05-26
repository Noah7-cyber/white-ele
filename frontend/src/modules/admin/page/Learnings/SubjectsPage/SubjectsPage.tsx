"use client";

import { Box, Drawer } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import useSubjectsPage from "./hooks/useSubjectsPage";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { useLearningActions } from "@/layout/Shared/LearningActionsContext";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import LearningPageActions from "@/layout/Shared/LearningPageActions";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { useState } from "react";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { SubjectRow } from "../learning.constants";

export default function SubjectsPage({ teacherId }: { teacherId?: number | null } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setSubjectActions } = useLearningActions();
  const {
    filters,
    applyFilters,
    SubjectList,
    currentPage,
    totalItems,
    isLoading,
    deleteModalOpen,
    setDeleteModalOpen,
    handleSearch,
    mobileSubjectData,
    subjectIds,
  } = useSubjectsPage(teacherId);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileActionSubject, setMobileActionSubject] = useState<SubjectRow | null>(null);
  const handleRowClick = (_rowData: unknown, rowIndex: number) => {
    const id = subjectIds?.[rowIndex];
    if (id) router.push(DashboardRoutes.learningViewSubject.replace(":id", String(id)));
  };

  useEffect(() => {
    const isStaffPath = pathname?.startsWith("/staff/learning");
    const addSubjectPath = isStaffPath
      ? "/staff/learning/subjects/add"
      : DashboardRoutes.learningAddSubject;

    setSubjectActions({
      openAdd: () => router.push(addSubjectPath),
    });
    return () => setSubjectActions(null);
  }, [setSubjectActions, router, pathname]);

  return (
    <Box className="sm:p-0 flex flex-col gap-6">
      <Box className="w-full md:flex items-center justify-between gap-4 ">
        <Box className="w-full lg:w-full max-w-md">
          <SearchTextfield
            onChange={handleSearch}
            placeholder="Search by subject name, skill, etc"
            endIcon={
              <button
                className="md:hidden "
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
              >
                <FilterIcon className="text-gray-500" />
              </button>
            }
            isRounded={true}
            fullWidth={true}
            className="max-w-full "
            inputClasses="max-w-full !bg-white"
          />
        </Box>
        <LearningPageActions
          mobileFilterOpen={mobileFilterOpen}
          setMobileFilterOpen={setMobileFilterOpen}
        />
      </Box>
      <div className="md:hidden flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#E4E7EC] bg-white p-4 h-24 animate-pulse"
              />
            ))
          : mobileSubjectData?.map((subject) => (
              <button
                key={subject.id}
                type="button"
                // onClick={() =>
                //   router.push(
                //     DashboardRoutes.learningEditSubject.replace(":id", String(subject.id)),
                //   )
                // }
                className="w-full rounded-xl border border-[#E4E7EC] bg-white p-4 text-left"
              >
                <Box className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-sm text-text-primary truncate">
                    {subject.subjectName}
                  </div>
                  <button
                    onClick={() =>
                      setMobileActionSubject({
                        id: subject.id,
                        subjectName: subject.subjectName,
                        teacherName: subject.teacherName,
                        class: subject.class,
                        ageRange: subject.ageRange,
                        skills: subject.skills,
                      })
                    }
                    className="p-1 rounded-full hover:bg-gray-100 shrink-0"
                    aria-label="More options"
                  >
                    <MoreHorizIcon className="text-gray-500" fontSize="small" />
                  </button>
                </Box>
                <div className="mt-3 flex items-center gap-1">
                  {subject.skills.slice(0, 2).map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-brandColor-active/20 text-brandColor-active px-2 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {subject.skills.length > 2 && (
                    <span className="text-xs bg-brandColor-active/20 text-brandColor-active px-2 py-0.5 rounded-full">
                      +{subject.skills.length - 2}
                    </span>
                  )}
                </div>
              </button>
            ))}
        {!!mobileSubjectData?.length && (
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={filters?.delta}
            totalItems={totalItems}
            onPageChange={(event) => {
              applyFilters({
                pos: (event?.page - 1) * event?.rowsPerPage,
                delta: event?.rowsPerPage,
              });
            }}
            isCondense
            bottomTableClasses="!text-xs"
          />
        )}
      </div>

      <Box className="hidden md:block !pb-4 rounded-xl">
        <Box className="bg-white rounded-xl">
          <Table
            headers={["Subject Name", "Teacher Name", "Class", "Age Range", "Skills", "Action"]}
            tableData={SubjectList}
            onRowClick={handleRowClick}
            preventRowClickColumnIndex={5}
            isCollapse
            rightAlignedIndex={[5]}
            className="relative"
            headerRowClassName="!bg-[#F9FAFB] !border-b !border-[#E4E7EC] !text-sm"
            headerCellClassName="!text-dark !font-medium"
            bodyRowClassName="border-b border-[#E4E7EC] last:border-0"
            tableContainerClassName="!border !border-[#E4E7EC] !rounded-lg !overflow-hidden !bg-white"
            isLoading={isLoading}
          />
        </Box>
        <Box className="flex justify-center pt-4">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={filters?.delta}
            totalItems={totalItems}
            onPageChange={(event) => {
              applyFilters({
                pos: (event?.page - 1) * event?.rowsPerPage,
                delta: event?.rowsPerPage,
              });
            }}
            isCondense
            bottomTableClasses="!text-xs"
          />
        </Box>
      </Box>

      <Drawer
        anchor="bottom"
        open={Boolean(mobileActionSubject)}
        onClose={() => setMobileActionSubject(null)}
        PaperProps={{
          className: "rounded-t-2xl",
          style: { maxHeight: "70vh" },
        }}
      >
        <div className="px-6 pt-3 pb-8">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          <button
            onClick={() => {
              if (!mobileActionSubject) return;
              router.push(
                DashboardRoutes.learningViewSubject.replace(":id", String(mobileActionSubject.id)),
              );
              setMobileActionSubject(null);
            }}
            className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
          >
            View
          </button>
          <button
            onClick={() => {
              if (!mobileActionSubject) return;
              router.push(
                DashboardRoutes.learningEditSubject.replace(":id", String(mobileActionSubject.id)),
              );
              setMobileActionSubject(null);
            }}
            className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
          >
            Edit
          </button>

          <button
            onClick={() => {
              if (!mobileActionSubject) return;
              setDeleteModalOpen(true);
              setMobileActionSubject(null);
            }}
            className="w-full text-left py-4 text-sm font-medium text-red-500"
          >
            Delete
          </button>
        </div>
      </Drawer>
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {}}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this subject?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </Box>
  );
}
