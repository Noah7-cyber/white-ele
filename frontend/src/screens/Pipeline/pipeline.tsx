"use client";

import { InsightCard } from "@/components/InsightCard";
import SearchIcon from "@mui/icons-material/Search";
import { Box, IconButton } from "@mui/material";
import ListIcon from "@/modules/shared/assets/svgs/list-icon.svg";
import GridIcon from "@/modules/shared/assets/svgs/grid-icon.svg";
import PlusIcon from "@/modules/shared/assets/svgs/plus-icon.svg";
import { Table } from "@/modules/shared/component/Table";
import { TourConversionChart } from "@/components/Charts/TourConversionChart";
import { ApplicationProgressChart } from "@/components/Charts/ApplicationProgressChart";
import { CustomDropdown } from "@/modules/shared/component/CustomDropdown";
import React from "react";
import Image from "next/image";
import {
  ageOptions,
  candidateOptions,
  chartOptions,
  dateOptions,
  insights,
  pipelineTableHeaders,
} from "@/constants";
import { ReusableInput } from "@/modules/shared/component/CustomInputField";

export function Pipeline() {
  const [searchText, setSearchText] = React.useState<string | number>("");
  const [value, setValue] = React.useState<string | number>(chartOptions?.[0].value);
  const [dateValue, setDateValue] = React.useState<string | number>(dateOptions?.[0].value);
  const [ageValue, setAgeValue] = React.useState<string | number>(ageOptions?.[0].value);
  const [candidateValue, setCandidateValue] = React.useState<string | number>(
    candidateOptions?.[0].value,
  );
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setSearchText(event.target.value);
  const handleValueChange = (newValue: string | number) => setValue(newValue);
  const handleDateValueChange = (newValue: string | number) => setDateValue(newValue);
  const handleAgeValueChange = (newValue: string | number) => setAgeValue(newValue);
  const handleCandidateValueChange = (newValue: string | number) => setCandidateValue(newValue);

  return (
    <div className="p-2 space-y-6 overflow-auto flex flex-col flex-1">
      {/* Top insights row */}
      <div className="grid grid-cols-4 gap-4">
        {insights.map((insight, idx: number) => (
          <InsightCard key={idx} name={insight.name} value={insight.value} />
        ))}
      </div>

      {/* Charts row */}
      <div className="flex gap-4 w-full h-96">
        {/* Left donut chart */}
        <div className="bg-white basis-[20%] rounded-2xl p-4 flex flex-col">
          <h2 className="!text-base !font-medium mb-2">Tour Conversion Rate</h2>
          <div className="flex-1 flex justify-center items-center">
            <TourConversionChart />
          </div>
          <div className="flex gap-5 flex-col justify-between items-center mt-3">
            <Box className="flex items-center justify-around w-full gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#008080]" />
                Enrolled
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#FEB92B]" />
                Declined
              </div>
            </Box>
            <Box className="flex items-center gap-8">
              <CustomDropdown
                value={dateValue}
                className="!text-sm !font-medium font-avenir"
                options={dateOptions}
                onChange={handleDateValueChange}
                startAdornment={
                  <Image src="/assets/svg/calendar.svg" alt="room" width={25} height={25} />
                }
                sx={{
                  minWidth: 140,
                  height: 25,
                  backgroundColor: "#001F1F0D",
                  borderRadius: "4px",
                  "& .MuiFormControl-root": { border: "none" },
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                }}
              />
              <CustomDropdown
                value={ageValue}
                className="!text-sm !font-medium font-avenir"
                options={ageOptions}
                onChange={handleAgeValueChange}
                sx={{
                  minWidth: 100,
                  height: 25,
                  backgroundColor: "#001F1F0D",
                  borderRadius: "4px",
                  "& .MuiFormControl-root": { border: "none" },
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                }}
              />
            </Box>
          </div>
        </div>

        {/* Right bar chart */}
        <div className="bg-white basis-[80%] rounded-2xl p-4 gap-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-2">
            <h2 className="!text-base !font-medium">Application Progress</h2>
            <CustomDropdown
              value={value}
              options={chartOptions}
              className="!text-sm !font-medium font-avenir"
              onChange={handleValueChange}
              sx={{
                minWidth: 100,
                backgroundColor: "#001F1F0D",
                height: 25,
                borderRadius: "4px",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
            />
          </div>
          <div className="flex-1">
            <ApplicationProgressChart />
          </div>
          <div className="flex gap-4 items-center justify-center -mt-6 text-sm">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              Applications
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-circle-yellow" />
              Interviews
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#008080]" />
              Enrolled
            </div>
          </div>
        </div>
      </div>

      {/* Table section */}
      <div className="bg-white rounded-2xl overflow-hidden px-4 py-4 w-full">
        <div className="flex items-center justify-between gap-4 mb-5 w-full">
          <h2 className="!text-lg !font-medium flex-1">All Candidates</h2>

          <div className="flex items-center gap-4">
            <ReusableInput
              variant="search"
              value={searchText}
              placeholder="Search candidates..."
              onChange={handleSearchChange}
              startAdornment={<SearchIcon fontSize="inherit" />}
              showDefaultAdornment={false}
              sx={{
                borderRadius: "20px",
                cursor: "text",
                height: "30px",
              }}
            />

            <Box className="relative flex items-center gap-2 flex-shrink-0">
              <CustomDropdown
                value={candidateValue}
                options={candidateOptions}
                className="!text-sm !font-medium font-avenir"
                onChange={handleCandidateValueChange}
                sx={{
                  width: 140,
                  backgroundColor: "#001F1F0D",
                  height: 25,
                  borderRadius: "16px",
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                }}
              />
              <IconButton className="!bg-circle-yellow !text-white">
                <ListIcon />
              </IconButton>
              <IconButton className="!bg-circle-yellow !text-white">
                <GridIcon />
              </IconButton>
              <IconButton className="!bg-circle-yellow !text-white">
                <PlusIcon />
              </IconButton>
            </Box>
          </div>
        </div>

        <Table headers={pipelineTableHeaders} tableData={[]} />
      </div>
    </div>
  );
}
