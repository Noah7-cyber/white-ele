"use client";

import React, { useCallback } from "react";
import { SelectChangeEvent } from "@mui/material";
import {
  Box,
  MenuItem,
  Pagination,
  PaginationItem,
  PaginationRenderItemParams,
  Select,
  Typography,
} from "@mui/material";
import classNames from "classnames";
import LeftIcon from "@/modules/shared/assets/svgs/chevronLeft.svg";
import RightIcon from "@/modules/shared/assets/svgs/chevronRight.svg";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/chevronSelector.svg";

export interface PaginationControlsProps {
  currentPage: number; // 1-based
  rowsPerPage: number;
  totalItems: number;
  rowsPerPageList?: number[];
  onPageChange?: (args: { page: number; rowsPerPage: number }) => void;
  isCondense?: boolean;
  isCollapse?: boolean;
  paginationRowClassName?: string;
  bottomTableClasses?: string;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  rowsPerPage,
  totalItems,
  rowsPerPageList = [5, 10, 25, 50],
  onPageChange,
  isCondense,
  // isCollapse,
  paginationRowClassName,
  bottomTableClasses,
  className,
}) => {
  const handlePageChange = useCallback(
    (event: React.ChangeEvent<unknown>, page: number) => {
      event.stopPropagation();
      onPageChange?.({ page, rowsPerPage });
    },
    [onPageChange, rowsPerPage],
  );

  const handleRowsPerPageChange = useCallback(
    (event: SelectChangeEvent<number>) => {
      const newRowsPerPage = Number(event.target.value);
      onPageChange?.({ page: 1, rowsPerPage: newRowsPerPage });
    },
    [onPageChange],
  );

  const renderPaginationItem = (item: PaginationRenderItemParams) => (
    <PaginationItem
      slots={{
        previous: () => <LeftIcon />,
        next: () => <RightIcon />,
      }}
      {...item}
      className={classNames(
        "!rounded-0 !border-0 !border-none !text-xs flex !font-bold !items-center ",
        {
          "!bg-skyblue text-dark !rounded-l-lg !w-1": item.type === "previous",
          "!bg-skyblue !text-dark rounded-r-lg !w-1": item.type === "next",
          "!bg-brandColor-active !text-white !w-1": item.selected,
          "!bg-skyblue text-dark  !w-1":
            item.type !== "previous" && item.type !== "next" && !item.selected,
        },
      )}
      sx={{
        minWidth: 20,
        height: 20,
        fontSize: 8,
      }}
    />
  );

  const pageCount = Math.ceil(totalItems / rowsPerPage);

  // if (pageCount <= 1) return null; // Hide if no pagination needed

  return (
    <Box
      className={classNames(
        "!border-0 !border-none",
        {
          "h-12": !isCondense,
        },
        paginationRowClassName,
        className,
      )}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "0 2px",
      }}
    >
      <Box
        className={classNames(
          "!border-0 !border-none !text-dark !font-[350] flex items-center gap-2 space-x-2",
        )}
        sx={{ flex: 1 }}
      >
        <Typography className={`!text-dark !font-normal text-xs! ${bottomTableClasses}`}>
          Rows per page
        </Typography>
        <Select
          value={rowsPerPage}
          onChange={handleRowsPerPageChange}
          className="table-pagination-select border-0 !rounded-md my-0 flex items-center !p-0 text-sm"
          sx={{
            minWidth: 40,
            maxWidth: 30,
            height: 20,
            fontSize: 10,
            fontWeight: 600,
            padding: "0px",
            ".MuiSelect-select": {
              paddingRight: "0px !important",
              paddingLeft: "8px !important",
              minHeight: "unset",
              display: "flex",
              alignItems: "center",
            },
            ".MuiOutlinedInput-notchedOutline": {
              padding: 0,
            },
            "& .MuiSvgIcon-root": {
              fontSize: 8,
              marginRight: 4,
            },
          }}
          IconComponent={() => (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: -10,
              }}
            >
              <ExpandMoreIcon className="!w-2 !h-2 mr-1" />
            </span>
          )}
        >
          {rowsPerPageList.map((val) => (
            <MenuItem key={val} value={val} className="!text-xs">
              {val}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Box
        className="!border-0 !border-none !text-base !font-[600]"
        sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
      >
        <Pagination
          page={currentPage}
          variant="text"
          shape="circular"
          onChange={handlePageChange}
          classes={{
            ul: "-space-x-1 !flex !flex-row !items-center !font-semibold !text-xs !flex-nowrap",
          }}
          count={pageCount}
          renderItem={renderPaginationItem}
        />
      </Box>
    </Box>
  );
};
