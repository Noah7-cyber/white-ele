"use client";

import { Box, Typography } from "@mui/material";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import { useState } from "react";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import LearningPageActions from "@/layout/Shared/LearningPageActions";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

export default function ReportPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:768px)");

  return (
    <Box className="sm:p-0 flex flex-col gap-6">
      <Box className="md:flex justify-between items-center w-full gap-3 md:mt-4">
        <Box className="w-full lg:w-fit">
          <SearchTextfield
            placeholder="Search report"
            isRounded={isMobile}
            fullWidth={isMobile}
            endIcon={
              <button
                className="md:hidden"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
              >
                <FilterIcon className="text-gray-500" />
              </button>
            }
          />
        </Box>
        <LearningPageActions
          mobileFilterOpen={mobileFilterOpen}
          setMobileFilterOpen={setMobileFilterOpen}
        />
      </Box>

      <Box className="rounded-xl border border-[#E4E7EC] bg-white p-4 md:p-6">
        <Typography className="!text-lg !font-semibold !text-primary-dark">Report</Typography>
        <Typography className="!text-sm !text-input-gray mt-2">
          Learning reports and analytics will appear here.
        </Typography>
      </Box>

      <Box className="md:hidden">
        <PaginationControls
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalItems={0}
          onPageChange={(event) => {
            setCurrentPage(event?.page);
            setRowsPerPage(event?.rowsPerPage);
          }}
          isCondense
          bottomTableClasses="!text-xs"
        />
      </Box>

      <Box className="hidden md:block !pb-4 rounded-xl">
        <PaginationControls
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalItems={0}
          onPageChange={(event) => {
            setCurrentPage(event?.page);
            setRowsPerPage(event?.rowsPerPage);
          }}
          isCondense
          bottomTableClasses="!text-xs"
        />
      </Box>
    </Box>
  );
}
