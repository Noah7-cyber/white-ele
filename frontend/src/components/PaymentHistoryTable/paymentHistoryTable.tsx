"use client";

import React from "react";
import { Table } from "@/modules/shared/component/Table";
import { classOptions, dropdownOptions, paymentHistoryHeaders, sectionOptions } from "@/constants";
import { Box } from "@mui/material";
import { CustomDropdown } from "../../modules/shared/component/CustomDropdown";
import SearchIcon from "@mui/icons-material/Search";
import { useState } from "react";
import { ReusableInput } from "../../modules/shared/component/CustomInputField";
import { useFees } from "@/screens/Fees/hook/useFees";

export function PaymentHistoryTable() {
  const { tableData } = useFees();
  const [dropdownValue, setDropdownValue] = useState<string | number>(
    dropdownOptions?.[0].value || "Today",
  );
  const [classOptionsValue, setClassOptionsValue] = useState<string | number>(
    classOptions?.[0]?.value || "All Classes",
  );
  const [sectionOptionsValue, setSectionOptionsValue] = useState<string | number>(
    sectionOptions?.[0].value || "All Sections",
  );
  const handleDropDownChange = (value: string | number) => setDropdownValue(value);
  const handleClassOptionsChange = (value: string | number) => setClassOptionsValue(value);
  const handleSectionOptionsChange = (value: string | number) => setSectionOptionsValue(value);
  const [searchText, setSearchText] = useState("");
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };
  return (
    <div className="bg-white flex flex-col gap-4 rounded-2xl shadow p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brandColor-active mb-4">Payment History</h2>
        <Box className="relative flex items-center gap-3 flex-shrink-0">
          <ReusableInput
            variant="search"
            value={searchText}
            onChange={handleSearchChange}
            startAdornment={<SearchIcon fontSize="inherit" />}
            showDefaultAdornment={false}
            sx={{
              borderRadius: "20px",
              cursor: "text",
              height: "30px",
            }}
          />
          <CustomDropdown
            value={dropdownValue}
            options={dropdownOptions}
            className="!text-sm !min-w-fit !font-medium font-avenir !bg-transparent"
            onChange={handleDropDownChange}
            sx={{
              width: "120px",
              backgroundColor: "#001F1F0D",
              height: 25,
              borderRadius: "16px",
              "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            }}
          />
          <CustomDropdown
            value={classOptionsValue}
            options={classOptions}
            className="!text-sm !min-w-fit !font-medium font-avenir !bg-transparent"
            onChange={handleClassOptionsChange}
            sx={{
              width: "120px",
              backgroundColor: "#001F1F0D",
              height: 25,
              borderRadius: "16px",
              "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            }}
          />
          <CustomDropdown
            value={sectionOptionsValue}
            options={sectionOptions}
            className="!text-sm !min-w-fit !font-medium font-avenir !bg-transparent"
            onChange={handleSectionOptionsChange}
            sx={{
              width: "120px",
              backgroundColor: "#001F1F0D",
              height: 25,
              borderRadius: "16px",
              "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            }}
          />
          <div />
        </Box>
      </div>
      <Table
        headers={paymentHistoryHeaders}
        tableData={tableData}
        headerRowClassName="!bg-brandColor-active"
        headerCellClassName="!text-white !font-medium"
      />
    </div>
  );
}
