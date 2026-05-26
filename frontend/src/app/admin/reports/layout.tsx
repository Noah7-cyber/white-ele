/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useState, useMemo, Suspense } from "react";
import { Box, Typography, Menu, MenuItem, Fade } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Link from "next/link";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";
import FilterPopover from "@/modules/shared/component/FilterPopover/filterPopover";
import { Button } from "@/modules/shared/component/Button";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { classroomServices } from "@/services/classroom.service";
import { getDateRange } from "@/utils/helpers";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer";
import { Dropdown } from "@/modules/shared/component/Dropdown";
// ── Static options ───────────────────────────────────────────────────────
const timeOptions = [
  { label: "Today", value: "Today" },
  { label: "This Week", value: "This Week" },
  { label: "This Month", value: "This Month" },
  { label: "Last Month", value: "Last Month" },
  { label: "This Year", value: "This Year" },
  { label: "Last Year", value: "Last Year" },
];

// ─── Inner layout — uses hooks that require Suspense ────────────────────────
function ReportsLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  React.useEffect(() => {
    const handleOpen = () => setMobileFilterOpen(true);
    window.addEventListener("open-reports-filter", handleOpen);
    return () => window.removeEventListener("open-reports-filter", handleOpen);
  }, []);

  // ── Anchor-element state (opens popovers/menus) ──────────────────────────
  const [tabMenuAnchor, setTabMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTab, setMenuTab] = useState<string | null>(null);
  const [gradeAnchor, setGradeAnchor] = useState<HTMLElement | null>(null);
  const [timeAnchor, setTimeAnchor] = useState<HTMLElement | null>(null);
  const [depositStatusAnchor, setDepositStatusAnchor] = useState<HTMLElement | null>(null);
  const [attendanceStatusAnchor, setAttendanceStatusAnchor] = useState<HTMLElement | null>(null);

  // ── Read current filter values from URL (single source of truth) ─────────
  const currentStartDate = searchParams?.get("startDate");
  const currentEndDate = searchParams?.get("endDate");
  const currentClassroomId = searchParams?.get("classroomId");
  const currentDepositStatus = searchParams?.get("depositStatus") || "";
  const currentAttendanceStatus = searchParams?.get("attendanceStatus") || "";

  const selectedTimeLabel = useMemo(() => {
    if (!currentStartDate || !currentEndDate) return "This Month";
    for (const opt of timeOptions) {
      const range = getDateRange(opt.value);
      if (range.startDate === currentStartDate && range.endDate === currentEndDate) {
        return opt.label;
      }
    }
    return "Custom";
  }, [currentStartDate, currentEndDate]);

  // ── Fetch classrooms for grade filter ────────────────────────────────────
  const {
    data: classRoomData,
    hasNextPage: hasMoreClassrooms,
    fetchNextPage: fetchNextClassroomPage,
  } = useInfiniteQueryService<any, any>({
    service: { ...classroomServices.getAllClassrooms },
  });

  const fetchMoreClassrooms = async () => {
    if (!hasMoreClassrooms) return;
    await fetchNextClassroomPage();
  };

  const classrooms = useMemo(() => {
    const list = classRoomData?.pages?.reduce<any[]>((acc, page) => acc.concat(page?.classrooms ?? page?.data ?? []), []) ?? [];
    return list.map((c: any) => ({ id: c.id as number, name: c.classroomName as string }));
  }, [classRoomData]);

  const gradeOptions = useMemo(() => [
    { label: "All Classrooms", value: "All Classrooms", id: null },
    ...classrooms.map((c) => ({ label: c.name, value: c.name, id: c.id })),
  ], [classrooms]);

  const selectedGradeLabel = useMemo(() => {
    if (!currentClassroomId) return "All Classrooms";
    const match = classrooms.find((c) => String(c.id) === currentClassroomId);
    return match?.name ?? "All Classrooms";
  }, [currentClassroomId, classrooms]);

  /** Keep classroom + date (and other) filters when switching report tabs or sub-reports. */
  const reportQueryString = searchParams?.toString() ?? "";
  const withReportSearchParams = (path: string) =>
    reportQueryString ? `${path}?${reportQueryString}` : path;

  // ── URL helpers: update a subset of URL params without full navigation ────
  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // ── Tab definitions ───────────────────────────────────────────────────────
  const tabs = useMemo(() => [
    { id: "Billings", label: "Billings", baseRoute: "/admin/reports/billing", defaultRoute: "/admin/reports/billing/deposit" },
    { id: "Attendance", label: "Attendance", baseRoute: "/admin/reports/attendance", defaultRoute: "/admin/reports/attendance/check-in-out" },
    { id: "Children", label: "Children", baseRoute: "/admin/reports/children", defaultRoute: "/admin/reports/children/activities" },
    { id: "Staff", label: "Staff", baseRoute: "/admin/reports/staff", defaultRoute: "/admin/reports/staff" },
    { id: "Admission", label: "Admission", baseRoute: "/admin/reports/admission", defaultRoute: "/admin/reports/admission/tours" },
  ], []);

  // ── Fixed filter option lists ─────────────────────────────────────────────
  const depositStatusOptions = [
    { label: "All Status", value: "" },
    { label: "Overdue", value: "Overdue" },
    { label: "Sent", value: "Sent" },
    { label: "Paid", value: "Paid" },
  ];

  const attendanceStatusOptions = [
    { label: "All Status", value: "" },
    { label: "Checked In", value: "Checked In" },
    { label: "Checked Out", value: "Checked Out" },
    { label: "Absent", value: "Absent" },
  ];

  // ── Sub-report dropdown handlers ─────────────────────────────────────────
  const openTabMenu = (event: React.MouseEvent<HTMLElement>, tabId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setTabMenuAnchor(event.currentTarget);
    setMenuTab(tabId);
  };

  const closeTabMenu = () => {
    setTabMenuAnchor(null);
    setMenuTab(null);
  };

  const mn = "!text-sm !font-normal !px-4 !py-3 hover:!bg-gray-50 !text-[#344054]";
  const renderMenuItems = () => {
    switch (menuTab) {
      case "Billings":
        return [
          <MenuItem key="d" component={Link} href={withReportSearchParams("/admin/reports/billing/deposit")} onClick={closeTabMenu} className={mn}>Deposit</MenuItem>,
          <MenuItem key="t" component={Link} href={withReportSearchParams("/admin/reports/billing/transactions")} onClick={closeTabMenu} className={mn}>Transactions</MenuItem>,
          <MenuItem key="s" component={Link} href={withReportSearchParams("/admin/reports/billing/summary")} onClick={closeTabMenu} className={mn}>Summary</MenuItem>,
        ];
      case "Attendance":
        return [
          <MenuItem key="c" component={Link} href={withReportSearchParams("/admin/reports/attendance/check-in-out")} onClick={closeTabMenu} className={mn}>Check in/out</MenuItem>,
          <MenuItem key="h" component={Link} href={withReportSearchParams("/admin/reports/attendance/hours")} onClick={closeTabMenu} className={mn}>Attendance Hours</MenuItem>,
          <MenuItem key="r" component={Link} href={withReportSearchParams("/admin/reports/attendance/classrooms")} onClick={closeTabMenu} className={mn}>Classrooms</MenuItem>,
        ];
      case "Children":
        return [
          <MenuItem key="a" component={Link} href={withReportSearchParams("/admin/reports/children/activities")} onClick={closeTabMenu} className={mn}>Activities</MenuItem>,
          <MenuItem key="l" component={Link} href={withReportSearchParams("/admin/reports/children/learnings")} onClick={closeTabMenu} className={mn}>Learnings</MenuItem>,
        ];
      case "Admission":
        return [
          <MenuItem key="t" component={Link} href={withReportSearchParams("/admin/reports/admission/tours")} onClick={closeTabMenu} className={mn}>Tours</MenuItem>,
          <MenuItem key="f" component={Link} href={withReportSearchParams("/admin/reports/admission/forms")} onClick={closeTabMenu} className={mn}>Forms</MenuItem>,
        ];
      default:
        return null;
    }
  };

  return (
    <Box className="h-full p-5 flex flex-col gap-4">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography className="!text-xl !font-semibold md:block hidden">Reports</Typography>

        <Box className="hidden md:flex items-center gap-3">
          {pathname.includes("/attendance/check-in-out") && (
            <Button
              variant="outlined"
              endIcon={<KeyboardArrowDownIcon />}
              className="!text-gray-700 !border-gray-300 !rounded-lg !bg-white !normal-case"
              onClick={(e) => setAttendanceStatusAnchor(e.currentTarget)}
            >
              {currentAttendanceStatus || "All Status"}
            </Button>
          )}
          {pathname.includes("/billing/deposit") && (
            <Button
              variant="outlined"
              endIcon={<KeyboardArrowDownIcon />}
              className="!text-gray-700 !border-gray-300 !rounded-lg !bg-white !normal-case"
              onClick={(e) => setDepositStatusAnchor(e.currentTarget)}
            >
              {currentDepositStatus || "All Status"}
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={(e) => setGradeAnchor(e.currentTarget)}
            endIcon={<KeyboardArrowDownIcon />}
            className="!text-gray-700 !border-gray-300 !rounded-lg !bg-white !normal-case"
          >
            {selectedGradeLabel}
          </Button>
          <Button
            variant="outlined"
            onClick={(e) => setTimeAnchor(e.currentTarget)}
            endIcon={<KeyboardArrowDownIcon />}
            className="!text-gray-700 !border-gray-300 !rounded-lg !bg-white !normal-case"
          >
            {selectedTimeLabel}
          </Button>
        </Box>
      </Box>

      {/* Tab bar */}
      <ScrollableTabBar className="border-b border-[#E4E7EC]">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.baseRoute);
          return (
            <Box
              key={tab.id}
              className={`shrink-0 flex items-center pb-3 px-1 mr-4 relative ${active ? "border-b-2 border-[#00897B]" : ""
                }`}
            >
              <Link
                href={withReportSearchParams(tab.defaultRoute)}
                className={`text-sm font-normal no-underline ${active ? "text-[#00897B] font-medium" : "text-[#475467]"
                  }`}
              >
                {tab.label}
              </Link>
              {tab.id !== "Staff" && (
                <Box
                  component="span"
                  onClick={(e: React.MouseEvent<HTMLSpanElement>) =>
                    openTabMenu(e as unknown as React.MouseEvent<HTMLElement>, tab.id)
                  }
                  sx={{ display: "inline-flex", cursor: "pointer", ml: 0.5 }}
                  className={active ? "text-[#00897B]" : "text-[#98A2B3]"}
                >
                  <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                </Box>
              )}
            </Box>
          );
        })}
      </ScrollableTabBar>

      {/* Page content */}
      <Box className="flex-1 overflow-auto">{children}</Box>

      {/* Sub-report dropdown */}
      <Menu
        anchorEl={tabMenuAnchor}
        open={Boolean(tabMenuAnchor)}
        onClose={closeTabMenu}
        TransitionComponent={Fade}
        elevation={0}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          style: { marginTop: 10, boxShadow: "0px 4px 20px rgba(0,0,0,.10)", borderRadius: 8, minWidth: 150 },
        }}
      >
        {renderMenuItems()}
      </Menu>

      {/* Grade / classroom filter */}
      <FilterPopover
        open={Boolean(gradeAnchor)}
        anchorEl={gradeAnchor}
        onClose={() => setGradeAnchor(null)}
        options={gradeOptions}
        onSelect={(value) => {
          const match = gradeOptions.find((o) => o.value === value);
          updateParams({ classroomId: match?.id ? String(match.id) : null });
        }}
        onScrollEnd={fetchMoreClassrooms}
        width={180}
      />

      {/* Deposit status filter */}
      <FilterPopover
        open={Boolean(depositStatusAnchor)}
        anchorEl={depositStatusAnchor}
        onClose={() => setDepositStatusAnchor(null)}
        options={depositStatusOptions}
        onSelect={(value) => updateParams({ depositStatus: value || null })}
        width={150}
      />

      {/* Attendance status filter */}
      <FilterPopover
        open={Boolean(attendanceStatusAnchor)}
        anchorEl={attendanceStatusAnchor}
        onClose={() => setAttendanceStatusAnchor(null)}
        options={attendanceStatusOptions}
        onSelect={(value) => updateParams({ attendanceStatus: value || null })}
        width={150}
      />

      {/* Time / date filter */}
      <FilterPopover
        open={Boolean(timeAnchor)}
        anchorEl={timeAnchor}
        onClose={() => setTimeAnchor(null)}
        options={timeOptions}
        onSelect={(value) => {
          const range = getDateRange(value);
          updateParams({ startDate: range.startDate, endDate: range.endDate });
        }}
        width={150}
      />

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onApply={() => setMobileFilterOpen(false)}
        onReset={() => {
          updateParams({
            classroomId: null,
            startDate: null,
            endDate: null,
            depositStatus: null,
            attendanceStatus: null,
          });
          setMobileFilterOpen(false);
        }}
      >
        <div className="flex flex-col gap-4">
          {pathname.includes("/attendance/check-in-out") && (
            <div className="flex flex-col gap-2">
              <Typography className="!text-sm !font-medium !text-[#02273A]">Attendance Status</Typography>
              <Dropdown
                isForm
                options={attendanceStatusOptions.map((option) => ({
                  value: option.value,
                  name: option.label,
                }))}
                value={currentAttendanceStatus || ""}
                onSelect={(val) => updateParams({ attendanceStatus: val as string || null })}
                textFieldProps={{ placeholder: "Select status", isRounded: true }}
              />
            </div>
          )}

          {pathname.includes("/billing/deposit") && (
            <div className="flex flex-col gap-2">
              <Typography className="!text-sm !font-medium !text-[#02273A]">Deposit Status</Typography>
              <Dropdown
                isForm
                options={depositStatusOptions.map((option) => ({
                  value: option.value,
                  name: option.label,
                }))}
                value={currentDepositStatus || ""}
                onSelect={(val) => updateParams({ depositStatus: val as string || null })}
                textFieldProps={{ placeholder: "Select status", isRounded: true }}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Classroom</Typography>
            <Dropdown
              isForm
              options={gradeOptions.map((option) => ({
                value: String(option.id || ""),
                name: option.label,
              }))}
              value={currentClassroomId || ""}
              onSelect={(val) => updateParams({ classroomId: val as string || null })}
              textFieldProps={{ placeholder: "Select classroom", isRounded: true }}
              hasMore={Boolean(hasMoreClassrooms)}
              onLoadMore={fetchMoreClassrooms}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Time</Typography>
            <Dropdown
              isForm
              options={timeOptions.map((option) => ({
                value: option.value,
                name: option.label,
              }))}
              value={selectedTimeLabel === "Custom" ? "This Month" : selectedTimeLabel}
              onSelect={(val) => {
                const range = getDateRange(val as string);
                updateParams({ startDate: range.startDate, endDate: range.endDate });
              }}
              textFieldProps={{ placeholder: "Select time", isRounded: true }}
            />
          </div>
        </div>
      </MobileFilterDrawer>
    </Box>
  );
}

// ─── Exported layout — wraps inner with Suspense ────────────────────────────
export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ReportsLayoutInner>{children}</ReportsLayoutInner>
    </Suspense>
  );
}
