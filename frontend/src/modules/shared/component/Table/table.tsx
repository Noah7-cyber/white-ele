"use client";

import React, { ReactNode, useState } from "react";

import {
  Box,
  CircularProgress,
  Table as MUITable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ThemeProvider,
  Typography,
} from "@mui/material";
import EmptyStateIcon from "@/modules/shared/assets/svgs/items.svg";
// import { theme } from "@/theme/muiTheme";

// import "./table.css";
import classNames from "classnames";

type TableData = ReactNode | Record<string, ReactNode>;
export interface TableProps {
  isCollapse?: boolean;
  isCondense?: boolean;
  headers?: Array<ReactNode>;
  tableData?: TableData[];
  isLoading?: boolean;
  isFetching?: boolean;
  headerMarginBottom?: number;
  headerRowClassName?: string;
  headerCellClassName?: string;
  bodyRowClassName?: string;
  bodyCellClassName?: string;
  bodyMarginButton?: string;
  tableClassName?: string;
  tableContainerClassName?: string;
  arialLabel?: string;
  emptyState?: ReactNode;
  onRowClick?: (rowData: TableData, rowIndex: number) => void;
  /** Column index (e.g. Action column) where click should not trigger onRowClick (e.g. quick actions) */
  preventRowClickColumnIndex?: number;
  selectableRows?: boolean;
  onRowSelect?: (row: TableData, selected: boolean, rowIndex: number) => void;
  className?: string;
  centeredHeaderIndex?: number[];
  sx?: object;
  rightAlignedIndex?: number[];
  leftAlignedIndex?: number[];
  /** Column indices to hide on tablet screens (md, below lg/1024px) */
  tabletHiddenColumnIndices?: number[];
  renderMobileCard?: (row: TableData, index: number) => React.ReactNode;
}

export const Table: React.FC<TableProps> = ({
  isCondense,
  isCollapse,
  headers = [],
  tableData = [],
  headerRowClassName,
  headerCellClassName,
  bodyRowClassName,
  bodyCellClassName,
  headerMarginBottom = 20,
  bodyMarginButton = 20,
  tableClassName,
  tableContainerClassName,
  onRowClick,
  preventRowClickColumnIndex,
  arialLabel,
  isLoading,
  isFetching,
  onRowSelect,
  selectableRows,
  className,
  emptyState,
  centeredHeaderIndex,
  // bottomTableClasses,
  rightAlignedIndex,
  leftAlignedIndex,
  tabletHiddenColumnIndices,
  renderMobileCard,
  // ...props
}) => {
  const [selectedRow, setSelectedRow] = useState<number>(-1);

  const handlerRowClick = (row: TableData, index: number) => {
    setSelectedRow((prev) => (prev === index ? -1 : index));
    onRowSelect?.(row, selectedRow !== index, index);
    onRowClick?.(row, index);
  };

  const rows = tableData;

  const ComposedTableRow = ({ cellsMap, rowIndex }: { cellsMap: TableData; rowIndex: number }) => {
    const cells = Object.values(cellsMap || []);

    return (
      <>
        <TableRow
          onClick={() => handlerRowClick(cellsMap, rowIndex)}
          className={classNames(
            "bg-white rounded-lg border-b !border-divider-border  hover:bg-white-offset01 cursor-pointer",
            {
              "h-20": !isCondense,
              "!border-2 border-black": selectableRows && selectedRow === rowIndex,
            },
            bodyRowClassName,
          )}
        >
          {cells.map((value, i) => (
            <TableCell
              key={i}
              className={classNames(
                "!border-0 !text-[13px] !text-table-text !font-medium !py-0",
                {
                  "rounded-l-2xl ": i === 0 && !isCondense && !isCollapse,
                  "rounded-r-2xl": i === headers.length - 1 && !isCondense && !isCollapse,
                  "!text-center": centeredHeaderIndex?.includes(i),
                  "!text-right !pl-0": rightAlignedIndex?.includes(i),
                  "!hidden lg:!table-cell": tabletHiddenColumnIndices?.includes(i),
                },
                bodyCellClassName,
              )}
              onClick={
                preventRowClickColumnIndex !== undefined && i === preventRowClickColumnIndex
                  ? (e) => e.stopPropagation()
                  : undefined
              }
              onMouseDown={
                preventRowClickColumnIndex !== undefined && i === preventRowClickColumnIndex
                  ? (e) => e.stopPropagation()
                  : undefined
              }
            >
              {value}
            </TableCell>
          ))}
        </TableRow>
        {/* The additional row space is unncessary, leave it commented and just pass abeg, ejo, biko, kawankuri */}
        {/* {!isCondense && !isCollapse && (
          <TableRow key={`collapse-condense-row-${rowIndex}`}>
            <TableCell className={`!p-0 h-[${bodyMarginButton}px] !border-0 !text-transparent`}>
              .
            </TableCell>
          </TableRow>
        )} */}
      </>
    );
  };

  return (
    <>
      {renderMobileCard && rows?.length > 0 && !isLoading && (
        <Box className="md:hidden flex flex-col w-full">
          {rows.map((cellsMap, index) => renderMobileCard(cellsMap, index))}
        </Box>
      )}

      <Box
        className={classNames(
          "table-wrapper relative items-center flex flex-col bg-transparent !text-table-text",
          renderMobileCard ? "hidden md:flex" : "flex",
          className,
        )}
      >
        {isFetching && !!rows.length && (
          <Box className="absolute flex items-center justify-center rounded-full border-grey-lighten border-4 border-solid top-14 box-border bg-grey-lighten">
            <CircularProgress thickness={4} size={30} />
          </Box>
        )}
        <TableContainer
          component={Box}
          className={classNames(
            "!shadow-none bg-white rounded-2xl w-full ",
            tableContainerClassName,
          )}
        >
          <MUITable
            className={classNames(
              "min-w-full w-full bg-transparent py-4 2xl:py-4 border-collapse",
              tableClassName,
            )}
            aria-label={arialLabel || "Table"}
            sx={{ borderCollapse: "collapse" }}
          >
            {!!headers.length && (
              <TableHead className="">
                <TableRow
                  className={classNames(
                    "!border-0 !bg-header-gray",
                    { "h-10": !isCondense },
                    headerRowClassName,
                  )}
                >
                  {headers.map((value, i) => (
                    <TableCell
                      key={i}
                      className={classNames(
                        "!font-medium !text-primary-tex-dark/8 !text-xs !text-table-text !py-3 text-left",
                        {
                          "!text-center": centeredHeaderIndex?.includes(i),
                          "!text-right !pl-0": rightAlignedIndex?.includes(i),
                          "rounded-tl-2xl": i === 0 && !isCondense && !isCollapse,
                          "rounded-tr-2xl": i === headers.length - 1 && !isCondense && !isCollapse,
                          "!text-left": leftAlignedIndex?.includes(i),
                          "!hidden lg:!table-cell": tabletHiddenColumnIndices?.includes(i),
                        },
                        headerCellClassName,
                      )}
                    >
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
                {/* The additional row space is unncessary, leave it commented and just pass abeg, ejo, biko, kawankuri */}
                {/* {!isCondense && !isCollapse && (
                  <TableRow>
                    <TableCell
                      className={`!p-0 h-[${headerMarginBottom}px] !border-0 !text-transparent`}
                    >
                      .
                    </TableCell>
                  </TableRow>
                )} */}
              </TableHead>
            )}
            <TableBody>
              {rows.length === 0 && !isLoading && (
                <TableRow
                  key={-1}
                  className={classNames("bg-white rounded-lg h-96", bodyRowClassName)}
                >
                  <TableCell
                    colSpan={headers.length}
                    className={classNames(
                      "!border-0 !text-base  !text-dark !font-medium !text-center",
                      { "rounded-2xl ": !isCondense && !isCollapse },
                      bodyCellClassName,
                    )}
                  >
                    {emptyState || (
                      <Box className="flex flex-col items-center justify-center gap-1.5">
                        <EmptyStateIcon />
                        <Typography className=" text-xl! !mt-2 text-[#003049]! font-medium!">
                          No data to show.
                        </Typography>
                        <Typography className=" text-sm! text-textColor/50! font-normal!">
                          You haven&apos;t received any new data.
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow
                  key={-1}
                  className={classNames("bg-white border-b rounded-lg h-96", bodyRowClassName)}
                >
                  <TableCell
                    colSpan={headers.length}
                    className={classNames(
                      "!border-0 !text-base  !text-dark !font-medium !text-center",
                      { "rounded-2xl ": !isCondense && !isCollapse },
                      bodyCellClassName,
                    )}
                  >
                    <CircularProgress thickness={4} size={30} />
                    <p>Getting data ...</p>
                  </TableCell>
                </TableRow>
              )}
              {rows?.length > 0 &&
                !isLoading &&
                rows.map((cellsMap, index) => (
                  <ComposedTableRow key={index} rowIndex={index} cellsMap={cellsMap} />
                ))}
            </TableBody>
          </MUITable>
        </TableContainer>
      </Box>
    </>
  );
};
