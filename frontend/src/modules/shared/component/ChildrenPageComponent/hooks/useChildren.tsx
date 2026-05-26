"use client";

import React, { ChangeEvent, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { IconButton, Typography } from "@mui/material";
import { MoreHoriz } from "@mui/icons-material";
import { ActionModal } from "@/modules/shared/component/ActionModal/actionModal";
import { DashboardRoutes } from "../../../../../routes/dashboard.routes";
import { JSX, useMemo, useState, useEffect } from "react";
import TooltipIcon from "@/modules/shared/assets/svgs/tooltip.svg"; // Rename to avoid conflict with MUI Tooltip

import { childServices, ChildDynamicEndpoints } from "@/services/child.service";
import { showToast } from "../../Toast";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { unwrapQueryDataBody } from "@/utils/unwrapQueryResponse";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { ITEMS_PER_PAGE } from "@/constants";
import { classroomServices } from "@/services/classroom.service";
import { useFilter } from "@/utils/hooks/useFilter";
import { useUser } from "@/utils/hooks/useUser";
import { StaffRoutes } from "@/routes/staff.routes";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";
import { usePermissionGuide } from "@/utils/hooks/usePermissionGuide";
const gradeOptions = [
  { label: "All Classrooms", value: "All Classrooms" },
  { label: "Pre K", value: "Pre K" },
  { label: "Grade 1", value: "Grade 1" },
  { label: "Grade 2", value: "Grade 2" },
  { label: "Grade 3", value: "Grade 3" },
];

type ChildrenListPagination = {
  pos?: number;
  delta?: number;
  total?: number;
  count?: number;
};

type ChildrenListMeta = {
  totalStudents?: number;
  averageDevelopmentPercent?: number;
};

export const useChildren = (role: "admin" | "staff") => {
  const [deactivateAccount, setDeactivateAccount] = useState<boolean>(false);
  const [selectedChildId, setSelectedChildId] = useState<number>();
  const [selectedChildStatus, setSelectedChildStatus] = useState<string>("");
  const [deleteAccount, setDeleteAccount] = useState<boolean>(false);
    const { hasPermission } = usePermissionGuide({ enabled: true });


  const [gradeAnchorEl, setGradeAnchorEl] = useState<HTMLElement | null>(null);

  const [selectedGradeFilter, setSelectedGradeFilter] = useState(gradeOptions?.[0].label);

  // Staff-only: assigned classroom IDs and teacher (staff) ID from profile (useUser)
  const { staffId } = useUser();

  const [gradeFilters] = useState(
    gradeOptions.map((opt, index) => ({
      ...opt,
      isActive: index === 0,
    })),
  );

  const [selectedClassroomFilter, setSelectedClassroomFilter] = useState("all");

  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });
  const { debouncedSearch, setSearch } = useDebouncer();

  const handleDeactivate = async () => {
    if (selectedChildId == null) return;
    const normalizedStatus = String(selectedChildStatus || "").toLowerCase();
    const nextStatus =
      normalizedStatus === "active"
        ? "inactive"
        : normalizedStatus === "inactive" || normalizedStatus === "deactive"
          ? "active"
          : "inactive";
    try {
      await changeChildStatusAsync({ status: nextStatus });
      showToast({
        message: nextStatus === "active" ? "Child Activated" : "Child Deactivated",
        description:
          nextStatus === "active"
            ? "The child has been successfully activated."
            : "The child has been successfully deactivated.",
        severity: "success",
        duration: 3000,
      });
      setDeactivateAccount(false);
      handleDeactivateConfirm();
      refetch();
    } catch {
      showToast({
        message: "Deactivate failed",
        description: "Could not deactivate the child.",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const handleDelete = async () => {
    if (selectedChildId == null) return;
    try {
      await deleteChildAsync({});

      showToast({
        message: "Child Deleted",
        description: "The child has been successfully deleted.",
        severity: "success",
        duration: 3000,
      });
      setDeleteAccount(false);
      handleDeleteConfirm();
      refetch();
    } catch (error: any) {
      showToast({
        message: "Error",
        description: error?.message || "Failed to delete child",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const handleDeactivateConfirm = () => {
    setDeactivateAccount(false);
  };

  const handleDeleteConfirm = () => {
    setDeleteAccount(false);
  };

  const handleOpenGradeFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setGradeAnchorEl(event.currentTarget);
  };

  // Handle classroom filter changes
  const handleClassroomFilterChange = (value: string) => {
    setSelectedClassroomFilter(value);
    // Reset to first page when filter changes
    applyFilters({ ...filters, pos: 0 });
  };

  const childrenListQuery = useQueryService<any, any>({
    service: {
      ...childServices.getAllChilds,
      data: {
        ...(filters?.search ? { search: filters?.search } : {}),
        sortBy: "firstName",
        sortOrder: "ASC",
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        ...(filters?.pos ? { pos: filters?.pos } : {}),
        ...(selectedClassroomFilter && selectedClassroomFilter !== "all"
          ? { classroomId: selectedClassroomFilter }
          : {}),
        ...(role === "staff" && staffId != null ? { staffId: staffId } : {}),
        search: debouncedSearch,
      },
    },
    options: {
      keys: [
        "children",
        role,
        selectedClassroomFilter,
        filters?.pos ?? 0,
        filters?.delta ?? ITEMS_PER_PAGE,
        debouncedSearch ?? "",
      ],
    },
  });

  const listBundle = useMemo(() => {
    const inner = unwrapQueryDataBody<{
      students?: unknown[];
      pagination?: ChildrenListPagination;
      metaData?: ChildrenListMeta;
    }>(childrenListQuery.data);
    return {
      students: Array.isArray(inner?.students) ? inner.students : [],
      pagination: (inner?.pagination ?? {}) as ChildrenListPagination,
      metaData: (inner?.metaData ?? {}) as ChildrenListMeta,
    };
  }, [childrenListQuery.data]);

  const { students, pagination, metaData } = listBundle;
  const { isLoading, refetch } = childrenListQuery;

  // Count of active students (for Active Enrollments card)
  const { data: activeCountData } = useQueryService<any, any>({
    service: {
      ...childServices.getAllChilds,
      data: {
        status: "active",
        delta: 1,
        pos: 0,
        ...(selectedClassroomFilter && selectedClassroomFilter !== "all"
          ? { classroomId: selectedClassroomFilter }
          : {}),
        ...(role === "staff" && staffId != null ? { staffId: staffId } : {}),
      },
    },
    options: {
      keys: ["children-active-count", role, selectedClassroomFilter],
    },
  });

  const activeEnrollmentsCount =
    activeCountData?.pagination?.count ??
    activeCountData?.pagination?.total ??
    activeCountData?.data?.pagination?.count ??
    activeCountData?.data?.pagination?.total ??
    0;
  const totalChildrenCount = pagination?.count ?? metaData?.totalStudents ?? 0;
  const averageDevelopmentPercent =
    metaData?.averageDevelopmentPercent != null ? metaData.averageDevelopmentPercent : 0;
  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  const { mutateAsync: changeChildStatusAsync } = useMutationService({
    service: () => ChildDynamicEndpoints.changeChildStatus(selectedChildId!),
    options: { disableToast: true },
  });

  const { mutateAsync: deleteChildAsync } = useMutationService({
    service: ChildDynamicEndpoints.deleteChild(selectedChildId!),
    options: {
      disableToast: true,
    },
  });

  // Fetch all classrooms via infinite pagination — next batch fetched on dropdown scroll
  const {
    data: classRoomData,
    hasNextPage: hasMoreClassrooms,
    fetchNextPage: fetchNextClassPage,
    isLoading: isLoadingClassrooms,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: role === "staff" && staffId != null ? { staffId } : {},
    },
  });

  const allClassrooms = useMemo(
    () =>
      classRoomData?.pages?.reduce<any[]>((acc, page) => {
        return acc.concat(page?.classrooms ?? page?.data ?? []);
      }, []) ?? [],
    [classRoomData],
  );

  const classroomFilters = useMemo(
    () => [
      { label: "All Classrooms", value: "all", isActive: selectedClassroomFilter === "all" },
      ...allClassrooms.map((c: any) => ({
        label: c.classroomName || c.name,
        value: String(c.id),
        isActive: selectedClassroomFilter === String(c.id),
      })),
    ],
    [allClassrooms, selectedClassroomFilter],
  );

  const fetchMoreClassrooms = async (): Promise<void> => {
    if (!hasMoreClassrooms) return;
    fetchNextClassPage();
  };

  const classroomMap = useMemo(() => {
    const map = new Map<number, string>();
    allClassrooms.forEach((c: any) => {
      const name = c.classroomName || c.name;
      if (c?.id != null && name) {
        map.set(c.id, name);
      }
    });
    return map;
  }, [allClassrooms]);

  // General Information section
  const generalInfo = [
    { label: "Student ID", value: "STU-EJ2024" },
    { label: "Classroom", value: "Grade 2" },
    { label: "Address", value: "123 Maple Street, Springfield, Abuja" },
    { label: "Date of Birth", value: "03 January, 2004" },
    { label: "Schedule", value: "Monday - Friday" },
    { label: "Enrolment Date", value: "01 December, 2025" },
  ];

  // Medical Information section with bullets
  const medicalInfo = [
    {
      label: "Allergies",
      value: "Peanut, Fish",
    },
    {
      label: "Medication",
      bullets: ["Inhaler for asthma", "Omeprazole for Ulcer", "Coughing for cough"],
    },
    {
      label: "Diet Restrictions",
      value: "No nuts due to allergy",
    },
    {
      label: "Food Preferences",
      bullets: ["Enjoys fruits, pasta", "Dislikes chicken", "Dislikes vegetables"],
    },
    {
      label: "Diet Restrictions",
      value: "No nuts due to allergy",
    },
  ];

  // Emergency Contact
  const emergencyContact = [
    { label: "Name", value: "Elizabeth Johnson" },
    { label: "Phone Number", value: "+234 812 345 6789" },
    { label: "Email", value: "elizabeth.johnson@gmail.com" },
    { label: "Relationship", value: "Mother" },
    { label: "Address", value: "123 Maple Street, Springfield, Abuja" },
  ];

  // Legacy data structures (keep for backward compatibility)
  const studentInfo = [
    { label: "First Name", value: "Emma" },
    { label: "Last Name", value: "Johnson" },
    { label: "Middle Name", value: "Rose" },
    { label: "Student ID", value: "STU-EJ2024" },
    { label: "Address", value: "123 Maple Street, Springfield, Abuja" },
    { label: "Schedule", value: "Monday - Friday" },
    { label: "Date of Birth", value: "03/15/2020" },
    { label: "Classroom", value: "Curious Cubs" },
    { label: "Enrollment Date", value: "08/15/2023" },
    { label: "Sibling", value: "Jacob Johnson (Age 6)" },
  ];

  const medicalFields = [
    {
      label: "Allergies",
      tags: [{ label: "Peanuts" }, { label: "Shellfish" }],
    },
    {
      label: "Food Preferences",
      value: "Enjoys fruits, pasta and chicken. Dislikes vegetables",
    },
    {
      label: "Medications",
      tags: [{ label: "Inhaler for asthma" }],
    },
    {
      label: "Diet Restrictions",
      value: "No nuts due to allergy",
    },
    {
      label: "Other Preferences/Notes",
      value: "Prefers quiet activities during rest time",
    },
  ];

  const basicInfo = [
    { label: "Age", value: "3 years" },
    { label: "Overall Progress", value: "87%" },
    { label: "Days Per Week", value: 5 },
    { label: "Documents", value: 3 },
  ];

  const emergencyContacts = [
    { label: "Name", value: "Linda Smith" },
    { label: "Phone", value: "(234) 345 6789" },
    { label: "Relationship", value: "Grandmother" },
    { label: "Email", value: "linda.smith@email.com" },
    { label: "Address", value: "456 Oak Avenue, Springfield" },
  ];

  const doctorInfo = [
    { label: "Doctor Name", value: "Dr. Linda Smith" },
    { label: "Phone", value: "(234) 345 6789" },
  ];

  const STATUS_CONSTANT: Record<string, { chip: string }> = {
    active: {
      chip: "bg-green-100 text-green-700",
    },
    inactive: {
      chip: "bg-[#CF000B]/10 text-[#CF000B]",
    },
  };

  const getStatusConfig = (status: string) =>
    STATUS_CONSTANT[status?.toLowerCase()] ?? { chip: "" };

  const StatusCell = ({ status }: { status: string }) => {
    const { chip } = getStatusConfig(status);
    const displayStatus =
      status?.toLowerCase() === "active"
        ? "Active"
        : status?.toLowerCase() === "inactive"
          ? "Inactive"
          : status;

    return (
      <div
        className={`flex items-center justify-center gap-2 px-2 py-1 rounded-full min-w-[80px] w-1/2 ${chip}`}
      >
        <span className="text-xs! font-normal! ">{displayStatus}</span>
      </div>
    );
  };

  const AddressWithTooltip = ({ address }: { address?: string }) => {
    const spanRef = useRef<HTMLSpanElement>(null);
    const iconRef = useRef<HTMLSpanElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
      const el = spanRef.current;
      if (el) {
        setIsTruncated(el.scrollWidth > el.clientWidth);
      }
    }, [address]);

    // Position tooltip above the icon, always same width
    useEffect(() => {
      if (showTooltip && iconRef.current) {
        const rect = iconRef.current.getBoundingClientRect();
        setTooltipStyle({
          position: "fixed",
          left: rect.left + rect.width / 2,
          top: rect.top - 4,
          transform: "translate(-50%, -100%)",
          zIndex: 9999,
          maxWidth: "300px",
          minWidth: "200px",
          width: "max-content",
          background: "white",
          border: "1px solid #d1d5db",
          borderRadius: "0.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: "8px 12px 8px 12px",
          fontSize: "12px",
          color: "#111827",
          whiteSpace: "pre-line",
          // wordBreak: "break-word",
          pointerEvents: "none",
          textAlign: "center",
        });
      }
    }, [showTooltip]);

    if (!address) {
      return <span className="text-gray-400">No address added</span>;
    }

    return (
      <div className="flex items-center w-full justify-center relative">
        <span
          ref={spanRef}
          className="truncate max-w-[160px] text-table-text! inline-block cursor-pointer align-middle"
          title={isTruncated ? "" : address}
        >
          {address}
        </span>
        {isTruncated && (
          <span
            ref={iconRef}
            className="ml-1 relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <TooltipIcon />
            {showTooltip && (
              <div style={tooltipStyle}>
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "-10px",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderTop: "10px solid white",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.08))",
                    zIndex: 10000,
                    pointerEvents: "none",
                  }}
                />
                <div style={{ fontWeight: 500 }}>{address}</div>
              </div>
            )}
          </span>
        )}
      </div>
    );
  };

  const tableHeaders =
    role === "admin"
      ? ["Name", "Age", "Classroom", "Parent(s)", "Status", "Address", "Action"]
      : ["Name", "Age", "Parent(s)", "Address", "Action"];

  // On tablet (md, below lg/1024px): hide Parent(s) and Address columns
  const tabletHiddenColumnIndices =
    role === "admin"
      ? [3, 5] // Parent(s) at index 3, Address at index 5
      : [2, 3]; // Parent(s) at index 2, Address at index 3

  // Students from API
  const displayedStudents = students || [];

  const mobileChildrenData = (displayedStudents || []).map((child: any) => {
    const calculateAge = (dob: string) => {
      if (!dob) return "N/A";
      const birth = new Date(dob);
      const today = new Date();
      if (birth > today) return "0 months";
      let ageYears = today.getFullYear() - birth.getFullYear();
      let ageMonths = today.getMonth() - birth.getMonth();
      const dayDiff = today.getDate() - birth.getDate();
      if (dayDiff < 0) ageMonths--;
      if (ageMonths < 0) { ageYears--; ageMonths += 12; }
      if (ageYears > 0) return `${ageYears} ${ageYears === 1 ? "year" : "years"}`;
      return `${Math.max(0, ageMonths)} ${Math.max(0, ageMonths) === 1 ? "month" : "months"}`;
    };

    const classroom =
      (child.classroomId != null && classroomMap.get(child.classroomId)) ||
      (child.classrooms && child.classrooms.length > 0
        ? child.classrooms.map((c: any) => c.className || c.name).join(", ")
        : "--");

    return {
      id: child?.id as number,
      name: `${child?.user?.firstName ?? ""} ${child?.user?.lastName ?? ""}`.trim(),
      photoUrl: child?.photoUrl as string | undefined,
      classroom,
      age: calculateAge(child?.user?.dateOfBirth),
      status: String(child?.status || "") as string,
    };
  });

  const childrenTableData = (displayedStudents || []).map((child: any) => {
    const user = child?.user;

    // -------- AGE FROM DOB --------
    const calculateAge = (dob: string) => {
      if (!dob) return "N/A";
      const birth = new Date(dob);
      const today = new Date();
      if (birth > today) return "0 months";
      let ageYears = today.getFullYear() - birth.getFullYear();
      let ageMonths = today.getMonth() - birth.getMonth();
      const dayDiff = today.getDate() - birth.getDate();
      if (dayDiff < 0) ageMonths--;
      if (ageMonths < 0) { ageYears--; ageMonths += 12; }
      if (ageYears > 0) return `${ageYears} ${ageYears === 1 ? "year" : "years"}`;
      return `${Math.max(0, ageMonths)} ${Math.max(0, ageMonths) === 1 ? "month" : "months"}`;
    };

    const classroomDisplay =
      (child.classroomId != null && classroomMap.get(child.classroomId)) ||
      (child.classrooms && child.classrooms.length > 0
        ? child.classrooms.map((c: any) => c.className || c.name).join(", ")
        : "--");

    const parentsDisplay =
      child.parents && child.parents.length > 0
        ? child.parents
            .map((p: any) => `${p.user?.firstName || ""} ${p.user?.lastName || ""}`.trim())
            .join(", ")
        : "None Added";

    const baseData: Record<string, JSX.Element | string> = {
      Name: (
        <div className="flex gap-2 items-center">
          <InitialsAvatar
            src={child?.photoUrl}
            name={`${child?.user?.firstName ?? ""} ${child?.user?.lastName ?? ""}`.trim()}
            alt={child?.user?.firstName}
            className="w-10 h-10"
            initialsClassName="text-xs"
          />
          <Typography className="text-dark! text-[13px]! text-table-text! font-medium!">
            {`${child?.user?.firstName}
            ${child?.user?.lastName}`}
          </Typography>
        </div>
      ),
      Age: calculateAge(user?.dateOfBirth),
    };

    if (role === "admin") {
      baseData.Classroom = (
        <Typography className="text-dark! text-[13px]! text-table-text! font-medium! text-center">
          {classroomDisplay}
        </Typography>
      );
    }

    baseData["Parent(s)"] = (
      <Typography
        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        className="text-dark! text-[13px]! text-table-text! font-medium!"
      >
        {parentsDisplay.replace(/, /g, ",\n")}
      </Typography>
    );

    if (role === "admin") {
      baseData.Status = (
        <div className="flex items-center justify-center">
          <StatusCell status={child?.status} />
        </div>
      );
    }

    baseData.Address = <AddressWithTooltip address={child?.user?.address} />;

    const staff = StaffRoutes.children;
    const admin = DashboardRoutes.children;

    const baseActions = [
      {
        label: "View",
        onClick: ({ push }: { push: (path: string) => void }) =>
          push(`${role === "admin" ? admin : staff}/${child?.id}`),
        color: "!text-[#02273A]",
      },
    ];

    const adminOnlyActions =
      role === "admin"
        ? [
            ...(hasPermission("student", "update") ? [{
              label: "Edit",
              onClick: ({ push }: { push: (path: string) => void }) =>
                push(`${admin}/${child.id}/edit`),
              color: "!text-[#02273A]",
            }] : []),
            ...(hasPermission("student", "update") ? [{
              label:
                String(child?.status || "").toLowerCase() === "inactive" ||
                String(child?.status || "").toLowerCase() === "deactive"
                  ? "Activate"
                  : "Deactivate",
              onClick: () => {
                setSelectedChildId(Number(child?.id));
                setSelectedChildStatus(String(child?.status || ""));
                setDeactivateAccount(true);
              },
              color: "!text-[#02273A]",
            }] : []),
            ...(hasPermission("student", "delete") ? [{
              label: "Delete",
              onClick: () => {
                setDeleteAccount(true);
                setSelectedChildId(Number(child?.id));
              },
              color: "!text-[#02273A]",
            }] : []),
          ]
        : [];

    baseData.Action = (
      <ActionModal
        actions={[...baseActions, ...adminOnlyActions]}
        classNames="items-center !gap-0 !p-1"
        customModalclassNames="!p-0"
        width={140}
        Iconcomponent={({ onClick, ref }) => (
          <IconButton ref={ref} onClick={onClick} size="small">
            <MoreHoriz />
          </IconButton>
        )}
      />
    );

    return baseData;
  });

  const filteredData = childrenTableData;

  // Determine pagination values. When client-side filtered, derive counts from filteredStudents
  const posVal = Number(filters?.pos ?? pagination?.pos ?? 0) || 0;
  const deltaVal = Number(filters?.delta ?? pagination?.delta ?? ITEMS_PER_PAGE) || ITEMS_PER_PAGE;

  const currentPage = Math.floor(posVal / deltaVal) + 1;

  // Total number of items (support APIs that use `total` or `count`)
  const totalItems = pagination?.total ?? pagination?.count ?? 0;

  // Total pages
  const totalPages = Math.ceil(totalItems / deltaVal) || 1;

  const statsInfo = useMemo(
    () => [
      { label: "Total Children", value: String(totalItems) },
      { label: "Age", value: "—" },
      { label: "Overall Progress", value: "—" },
      { label: "Days Per Week", value: "—" },
      { label: "Documents", value: "—" },
    ],
    [totalItems],
  );

  // Changing page
  const handlePageChange = ({ page, rowsPerPage }: { page: number; rowsPerPage: number }) => {
    applyFilters({
      ...filters,
      delta: rowsPerPage,
      pos: (page - 1) * rowsPerPage,
    });
  };

  return {
    mobileChildrenData,
    // New data structures
    statsInfo,
    generalInfo,
    medicalInfo,
    emergencyContact,
    // Legacy data structures
    childrenTableData: filteredData,
    tableHeaders,
    tabletHiddenColumnIndices,
    studentInfo,
    medicalFields,
    basicInfo,
    emergencyContacts,
    isLoading,
    doctorInfo,
    selectedChildId,
    selectedChildStatus,
    deactivateAccount,
    setDeactivateAccount,
    handleDeactivateConfirm,
    handleDeleteConfirm,
    deleteAccount,
    setDeleteAccount,
    // allChild,
    gradeAnchorEl,
    setGradeAnchorEl,
    selectedGradeFilter,
    gradeFilters,
    setSelectedGradeFilter,
    handleOpenGradeFilter,
    // Classroom filters
    classroomFilters,
    selectedClassroomFilter,
    setSelectedClassroomFilter,
    handleClassroomFilterChange,
    fetchMoreClassrooms,
    hasMoreClassrooms,
    isLoadingClassrooms,
    // handlePageChange,
    handleDeactivate,
    handleDelete,
    // paginatedData,
    totalItems,
    totalPages,
    currentPage,
    handlePageChange,
    rowsPerPage: filters.delta,
    pagination,
    filters,
    applyFilters,
    displayedStudentIds: (displayedStudents || []).map((s: any) => s?.id),
    handleSearch,
    activeEnrollmentsCount,
    totalChildrenCount,
    averageDevelopmentPercent,
    hasPermission
  };
};
