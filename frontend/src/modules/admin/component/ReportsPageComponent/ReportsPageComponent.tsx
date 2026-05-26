"use client";

import React, { useState } from "react";
import { Box, Typography, Menu, MenuItem, Fade, Button } from "@mui/material";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";

// Import Sub-Components
import Tours from "./Admission/Tours/Tours";
import Forms from "./Admission/Forms/Forms";
import CheckInOut from "./Attendance/CheckInOut/CheckInOut";
import AttendanceHours from "./Attendance/AttendanceHours/AttendanceHours";
import AttendanceClassrooms from "./Attendance/Classrooms/Classrooms";
import BillingDeposit from "./Billings/Deposit/Deposit";
import BillingTransactions from "./Billings/Transactions/Transactions";
import BillingSummary from "./Billings/Summary/Summary";
import useAttendance from "@/modules/shared/component/AttendanceComponent/hook/useAttendance";
import FilterPopover from "@/modules/shared/component/FilterPopover/filterPopover";
import Activities from "./Children/Activities/Activities";
import Learning from "./Children/Learnings/Learnings";
import StaffReport from "./Staff/StaffReport/StaffReport";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";

const tabs = ["Billings", "Attendance", "Children", "Staff", "Admission"];

const depositStatusOptions = [
  {
    label: "All Status",
    value: "",
  },
  {
    label: "Overdue",
    value: "Overdue",
  },
  {
    label: "Sent",
    value: "Sent",
  },
  {
    label: "Paid",
    value: "Paid",
  },
];

const attendanceStatusOptions = [
  {
    label: "All Status",
    value: "",
  },
  {
    label: "Checked In",
    value: "Checked In",
  },
  {
    label: "Checked Out",
    value: "Checked Out",
  },
  {
    label: "Absent",
    value: "Absent",
  },
];

export default function ReportsPageComponent() {
  const [activeTab, setActiveTab] = useState("Billings");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTab, setMenuTab] = useState<string | null>(null);

  // Sub-tab states
  const [admissionSubTab, setAdmissionSubTab] = useState("Tours");
  const [attendanceSubTab, setAttendanceSubTab] = useState("Check in/out");
  const [billingsSubTab, setBillingsSubTab] = useState("Deposit");
  const [childrenSubTab, setChildrenSubTab] = useState("Activities");

  const {
    gradeAnchorEl,
    setGradeAnchorEl,
    setTimeAnchorEl,
    TimeAnchorEl,
    gradeFilters,
    timeFilters,
    selectedGradeFilter,
    selectedTimeFilter,
    handleTimeFilterChange,
    handleGradeFilterChange,
    handleOpenGradeFilter,
    handleOpenTimeFilter,
    handleOpenDepositStatusFilter,
    selectedClassroomId,
    startDate,
    endDate,
    depositStatus,
    setDepositStatus,
    depositStatusAnchorEl,
    setDepositStatusAnchorEl,
    attendanceStatusAnchorEl,
    setAttendanceStatusAnchorEl,
    handleOpenAttendanceStatusFilter,
    attendanceStatus,
    setAttendanceStatus,
  } = useAttendance("admin");

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>, tab: string) => {
    // Always activate the tab immediately (using its current/default sub-tab)
    setActiveTab(tab);
    if (tab === "Admission" || tab === "Attendance" || tab === "Billings" || tab === "Children") {
      // Also open the sub-tab dropdown
      setAnchorEl(event.currentTarget);
      setMenuTab(tab);
    } else {
      setAnchorEl(null);
      setMenuTab(null);
    }
  };

  const handleClose = (subTab?: string) => {
    if (subTab && menuTab) {
      setActiveTab(menuTab);
      if (menuTab === "Admission") {
        setAdmissionSubTab(subTab);
      } else if (menuTab === "Attendance") {
        setAttendanceSubTab(subTab);
      } else if (menuTab === "Billings") {
        setBillingsSubTab(subTab);
      } else if (menuTab === "Children") {
        setChildrenSubTab(subTab);
      }
    }
    setAnchorEl(null);
    setMenuTab(null);
  };

  // Render content based on active tab and sub-tab
  const renderContent = () => {
    if (activeTab === "Admission") {
      switch (admissionSubTab) {
        case "Tours":
          return (
            <Tours classroomId={selectedClassroomId} startDate={startDate} endDate={endDate} />
          );
        case "Forms":
          return (
            <Forms classroomId={selectedClassroomId} startDate={startDate} endDate={endDate} />
          );
        default:
          return null;
      }
    } else if (activeTab === "Attendance") {
      switch (attendanceSubTab) {
        case "Check in/out":
          return (
            <CheckInOut
              classroomId={selectedClassroomId}
              startDate={startDate}
              endDate={endDate}
              status={attendanceStatus}
            />
          );
        case "Attendance Hours":
          return (
            <AttendanceHours
              classroomId={selectedClassroomId}
              startDate={startDate}
              endDate={endDate}
            />
          );
        case "Classrooms":
          return <AttendanceClassrooms startDate={startDate} endDate={endDate} />;
        default:
          return null;
      }
    } else if (activeTab === "Billings") {
      switch (billingsSubTab) {
        case "Deposit":
          return (
            <BillingDeposit
              classroomId={selectedClassroomId}
              startDate={startDate}
              endDate={endDate}
              status={depositStatus}
            />
          );
        case "Transactions":
          return <BillingTransactions />;
        case "Summary":
          return <BillingSummary />;
        default:
          return (
            <BillingDeposit
              classroomId={selectedClassroomId}
              startDate={startDate}
              endDate={endDate}
              status={depositStatus}
            />
          );
      }
    } else if (activeTab === "Children") {
      switch (childrenSubTab) {
        case "Activities":
          return (
            <Activities classroomId={selectedClassroomId} startDate={startDate} endDate={endDate} />
          );
        case "Learnings":
          return (
            <Learning classroomId={selectedClassroomId} startDate={startDate} endDate={endDate} />
          );
        default:
          return <Tours />;
      }
    } else if (activeTab === "Staff") {
      return (
        <StaffReport classroomId={selectedClassroomId} startDate={startDate} endDate={endDate} />
      );
    }

    return <Box className="p-8 text-center text-gray-500">Content for {activeTab} coming soon</Box>;
  };

  // Render sub-tabs for the menu
  const renderMenuItems = () => {
    if (menuTab === "Admission") {
      return [
        <MenuItem
          key="tours"
          onClick={() => handleClose("Tours")}
          className="!text-sm !font-normal !px-4 !py-3 hover:!bg-gray-50 !text-[#344054]"
        >
          Tours
        </MenuItem>,
        <MenuItem
          key="forms"
          onClick={() => handleClose("Forms")}
          className="!text-sm !font-normal !px-4 !py-3 hover:!bg-gray-50 !text-[#344054]"
        >
          Forms
        </MenuItem>,
      ];
    }
    if (menuTab === "Attendance") {
      return [
        <MenuItem
          key="checkin"
          onClick={() => handleClose("Check in/out")}
          className="!text-sm !font-normal !px-4 !py-3 hover:!bg-gray-50 !text-[#344054]"
        >
          Check in/out
        </MenuItem>,
        <MenuItem
          key="hours"
          onClick={() => handleClose("Attendance Hours")}
          className="!text-sm !font-normal !px-4 !py-3 hover:!bg-gray-50 !text-[#344054]"
        >
          Attendance Hours
        </MenuItem>,
        <MenuItem
          key="classrooms"
          onClick={() => handleClose("Classrooms")}
          className="!text-sm !font-normal !px-4 !py-3 hover:!bg-gray-50 !text-[#344054]"
        >
          Classrooms
        </MenuItem>,
      ];
    }
    if (menuTab === "Billings") {
      return [
        <MenuItem
          key="deposit"
          onClick={() => handleClose("Deposit")}
          className="!text-sm !font-normal !px-4 !py-3 hover:!bg-gray-50 !text-[#344054]"
        >
          Deposit
        </MenuItem>,
        <MenuItem
          key="transactions"
          onClick={() => handleClose("Transactions")}
          className="!text-sm !font-normal !px-4 !py-3 hover:!bg-gray-50 !text-[#344054]"
        >
          Transactions
        </MenuItem>,
        <MenuItem
          key="summary"
          onClick={() => handleClose("Summary")}
          className="!text-sm !font-normal !px-4 !py-3 hover:!bg-gray-50 !text-[#344054]"
        >
          Summary
        </MenuItem>,
      ];
    }
    if (menuTab === "Children") {
      return [
        <MenuItem
          key="activities"
          onClick={() => handleClose("Activities")}
          className="!text-sm !font-normal !px-4 !py-3 hover:!bg-gray-50 !text-[#344054]"
        >
          Activities
        </MenuItem>,
        <MenuItem
          key="learning"
          onClick={() => handleClose("Learnings")}
          className="!text-sm !font-normal !px-4 !py-3 hover:!bg-gray-50 !text-[#344054]"
        >
          Learnings
        </MenuItem>,
      ];
    }
    return null;
  };

  return (
    <Box className="flex flex-col gap-3 h-full px-6 py-5">
      {/* Header with Title and Filters */}
      <Box className="flex justify-between items-center">
        <Typography className="text-xl! font-semibold! text-primary-gray!">Reports</Typography>

        {/* Dynamic Filters – always show Grade + Time; show Status filters selectively */}
        <Box className="flex gap-3 min-h-[40px]">
          {activeTab === "Attendance" && attendanceSubTab === "Check in/out" && (
            <Button
              variant="outlined"
              endIcon={<KeyboardArrowDownIcon className="text-gray-500" />}
              className="!normal-case !text-gray-700 !border-gray-300 !rounded-lg !px-4"
              onClick={handleOpenAttendanceStatusFilter}
            >
              {attendanceStatus || "All Status"}
            </Button>
          )}

          {activeTab === "Billings" && billingsSubTab === "Deposit" && (
            <Button
              variant="outlined"
              endIcon={<KeyboardArrowDownIcon className="text-gray-500" />}
              onClick={handleOpenDepositStatusFilter}
              className="!normal-case !text-gray-700 !border-gray-300 !rounded-lg !px-4"
            >
              {depositStatus || "All Status"}
            </Button>
          )}

          <Button
            variant="outlined"
            onClick={handleOpenGradeFilter}
            endIcon={<KeyboardArrowDownIcon className="text-gray-500" />}
            className="!normal-case !text-gray-700 !border-gray-300 !rounded-lg !px-4"
          >
            {selectedGradeFilter}
          </Button>
          <Button
            variant="outlined"
            onClick={handleOpenTimeFilter}
            endIcon={<KeyboardArrowDownIcon className="text-gray-500" />}
            className="!normal-case !text-gray-700 !border-gray-300 !rounded-lg !px-4"
          >
            {selectedTimeFilter}
          </Button>
        </Box>

        <FilterPopover
          open={Boolean(gradeAnchorEl)}
          anchorEl={gradeAnchorEl}
          onClose={() => setGradeAnchorEl(null)}
          options={gradeFilters}
          onSelect={(value) => {
            handleGradeFilterChange(value);
          }}
          width={150}
        />
        <FilterPopover
          open={Boolean(depositStatusAnchorEl)}
          anchorEl={depositStatusAnchorEl}
          onClose={() => setDepositStatusAnchorEl(null)}
          options={depositStatusOptions}
          onSelect={(value) => {
            const selectedOption = depositStatusOptions.find((option) => option.label === value);
            setDepositStatus(selectedOption?.value || "");
          }}
          width={150}
        />
        <FilterPopover
          open={Boolean(attendanceStatusAnchorEl)}
          anchorEl={attendanceStatusAnchorEl}
          onClose={() => setAttendanceStatusAnchorEl(null)}
          options={attendanceStatusOptions}
          onSelect={(value) => {
            const selectedOption = attendanceStatusOptions.find((option) => option.label === value);
            setAttendanceStatus(selectedOption?.value || "");
          }}
          width={150}
        />

        <FilterPopover
          open={Boolean(TimeAnchorEl)}
          anchorEl={TimeAnchorEl}
          onClose={() => setTimeAnchorEl(null)}
          options={timeFilters}
          onSelect={(value) => {
            handleTimeFilterChange(value);
          }}
          width={150}
        />
      </Box>

      {/* Tabs Area */}
      <ScrollableTabBar
        className="border-b border-[#E4E7EC] mb-3"
        innerClassName="flex flex-nowrap items-center min-w-min"
      >
        {tabs.map((tab) => (
          <Box
            key={tab}
            className={`shrink-0 flex items-center cursor-pointer px-4 py-3 relative group select-none`}
            onClick={(e) => handleClick(e, tab)}
          >
            <Typography
              className={`!text-sm !font-normal mr-1 ${
                activeTab === tab ? "!text-[#00897B]" : "!text-[#667085]"
              }`}
            >
              {tab}
            </Typography>

            {/* Show chevron only for expandable tabs */}
            {tab && tab !== "Staff" && (
              <Box className="text-[#98A2B3] flex items-center justify-center">
                <ExpandMoreIcon className="w-3 h-3 !ml-1.5" />
              </Box>
            )}

            {activeTab === tab && (
              <Box className="absolute bottom-0 left-0 w-full h-[1px] bg-[#00897B]" />
            )}
          </Box>
        ))}
      </ScrollableTabBar>

      {/* Dropdown Menu (Shared for both Admission and Attendance) */}
      <Menu
        id="fade-menu"
        MenuListProps={{
          "aria-labelledby": "fade-button",
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
        TransitionComponent={Fade}
        elevation={0}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          style: {
            marginTop: "10px",
            boxShadow: "0px 4px 20px 0px rgba(0, 0, 0, 0.10)",
            borderRadius: "8px",
            minWidth: "150px",
          },
        }}
      >
        {renderMenuItems()}
      </Menu>

      {/* Content Area */}
      <Box>{renderContent()}</Box>
    </Box>
  );
}
