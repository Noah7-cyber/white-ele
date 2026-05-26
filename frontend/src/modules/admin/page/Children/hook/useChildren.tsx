import { IconButton, Typography } from "@mui/material";
import { MoreHoriz } from "@mui/icons-material";
import { ActionModal } from "@/modules/shared/component/ActionModal/actionModal";
import { DashboardRoutes } from "../../../../../routes/dashboard.routes";
import Image from "next/image";
import ProfileImage from "@/modules/shared/assets/images/profile.png";
import ProfileImageTwo from "@/modules/shared/assets/images/profile2.png";
import ProfileImageThree from "@/modules/shared/assets/images/profile3.png";
import Tooltip from "@/modules/shared/assets/svgs/tooltip.svg";
import { useState } from "react";

const gradeOptions = [
  { label: "All Classrooms", value: "All Classrooms" },
  { label: "Pre K", value: "Pre K" },
  { label: "Grade 1", value: "Grade 1" },
  { label: "Grade 2", value: "Grade 2" },
  { label: "Grade 3", value: "Grade 3" },
];
export const useChildren = (childId: string) => {
  const [deactivateAccount, setDeactivateAccount] = useState<boolean>(false);
  const [_selectedChildId, setSelectedChildId] = useState<number>();
  const [deleteAccount, setDeleteAccount] = useState<boolean>(false);

  const [gradeAnchorEl, setGradeAnchorEl] = useState<HTMLElement | null>(null);

  const [selectedGradeFilter, setSelectedGradeFilter] = useState(gradeOptions?.[0].label);

  const [gradeFilters, setGradeFilters] = useState(
    gradeOptions.map((opt, index) => ({
      ...opt,
      isActive: index === 0,
    })),
  );

  const handleDeactivateConfirm = () => {
    setDeactivateAccount(false);
  };

  const handleDeleteConfirm = () => {
    setDeleteAccount(false);
  };

  const handleOpenGradeFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setGradeAnchorEl(event.currentTarget);
  };

  const _handleGradeFilterChange = (value: string) => {
    setSelectedGradeFilter(value);
    setGradeFilters((prev) =>
      prev.map((f) => ({
        ...f,
        isActive: f.value === value,
      })),
    );
  };

  // Stats information for top cards
  const statsInfo = [
    { label: "Age", value: "4 years" },
    { label: "Overall Progress", value: "87%" },
    { label: "Days Per Week", value: "5" },
    { label: "Documents", value: "3" },
  ];

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

  const children = [
    {
      id: "1",
      image: ProfileImage,
      name: "Kwame Nkrumah",
      age: "4 years",
      class: "Grade 3",
      parent: "Kwame Nkrumah, Akosua Nkrumah",
      status: "Active",
      address: "45 Maple Lane, River...",
    },
    {
      id: "2",
      image: ProfileImageTwo,
      name: "Amina Diallo",
      age: "4 years",
      class: "Grade 5",
      parent: "Chinua Achebe, Ify Achebe",
      status: "Inactive",
      address: "78 Oak Street, Hillcrest....",
    },
    {
      id: "3",
      image: ProfileImageThree,
      name: "Zuri Mwangi",
      age: "4 years",
      class: "Grade 2",
      parent: "Amina J. Mohammed, Bola Mohammed",
      status: "Active",
      address: "32 Pine Ave, Greenfield...",
    },
    {
      id: "4",
      image: ProfileImage,
      name: "Kofi Mensah",
      age: "4 years",
      class: "Grade 4",
      parent: "Thabo Mbeki, Naledi Mbeki",
      status: "Inactive",
      address: "56 Cedar Road, Brooks....",
    },
    {
      id: "5",
      image: ProfileImage,
      name: "Fatoumata Sow",
      age: "4 years",
      class: "Grade 4",
      parent: "Fatou Bensouda, Ousmane Bensouda",
      status: "Active",
      address: "90 Birch Boulevard, Sun..",
    },
    {
      id: "6",
      image: ProfileImage,
      name: "Juma Karanja",
      age: "4 years",
      class: "Grade 2",
      parent: "Nia Malika, Jabari Malika",
      status: "Inactive",
      address: "12 Cherry Circle, Lak....",
    },
    {
      id: "7",
      image: ProfileImage,
      name: "Nia Chikezie",
      age: "4 years",
      class: "Grade 5",
      parent: "Zuri Kofi, Amara Kofi",
      status: "Active",
      address: "67 Ash Pleasantville....",
    },
  ];

  const _STATUS_STYLES: Record<string, { dot: string; chip: string }> = {
    Paid: {
      dot: "bg-green-500",
      chip: "bg-green-100 text-green-700",
    },
    Pending: {
      dot: "bg-yellow-500",
      chip: "bg-yellow-100 text-yellow-700",
    },
    Overdue: {
      dot: "bg-red-500",
      chip: "bg-red-100 text-red-700",
    },
  };

  const DEFAULT_STYLE = {
    dot: "bg-gray-400",
    chip: "bg-gray-100 text-gray-700",
  };

  const STATUS_CONSTANT: Record<string, { chip: string }> = {
    active: {
      chip: "bg-green-100 text-green-700",
    },
    inactive: {
      chip: "bg-[#CF000B]/10 text-[#CF000B]",
    },
  };

  const getStatusConfig = (status: string) =>
    STATUS_CONSTANT[status?.toLowerCase()] ?? DEFAULT_STYLE;

  const StatusCell = ({ status }: { status: string }) => {
    const { chip } = getStatusConfig(status);

    return (
      <div
        className={`flex items-center justify-center gap-2 px-2 py-1 rounded-full min-w-[100px] w-1/2 ${chip}`}
      >
        <span className="!text-xs !font-normal ">{status}</span>
      </div>
    );
  };

  const tableHeaders = ["Name", "Age", "Classroom", "Parent(s)", "Status", "Address", "Action"];

  const childrenTableData = children?.map((child) => {
    return {
      "Child name": (
        <div className="flex gap-2 items-center">
          <Image src={child.image} alt="" className="w-13 h-13 rounded-full" /> {child.name}
        </div>
      ),
      Age: child.age,
      Classroom: child.class,
      "Parent(s)": (
        <Typography
          sx={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
          className="!text-dark !text-[13px] !text-table-text !font-medium "
        >
          {" "}
          {child.parent?.replace(/, /g, ",\n")}
        </Typography>
      ),
      Status: (
        <div className="w-full flex items-center justify-center">
          <StatusCell status={child.status} />
        </div>
      ),
      Address: (
        <div className="flex items-center gap-2">
          {" "}
          {child.address}{" "}
          {child.address.length > 20 ? (
            <Tooltip title={child.address}>
              <span className="truncate max-w-[120px] inline-block cursor-pointer">
                {child.address}
              </span>
            </Tooltip>
          ) : (
            <></>
          )}{" "}
        </div>
      ),
      Action: (
        <ActionModal
          actions={[
            {
              label: "View",
              onClick: ({ push }) => {
                push(`${DashboardRoutes.children}/${child.id}/profile`);
              },
              color: "!text-[#02273A]",
            },
            {
              label: "Edit",
              onClick: (navigate) => {
                navigate.push(`${DashboardRoutes.children}/${child.id}/edit`);
              },
              color: "!text-[#02273A]",
            },
            {
              label: "Deactivate",
              onClick: () => {
                setSelectedChildId(Number(child.id));
                setDeactivateAccount(true);
              },
              color: "!text-[#02273A]",
            },
            {
              label: "Delete",
              onClick: () => {
                setDeleteAccount(true);
                setSelectedChildId(Number(child.id));
              },
              color: "!text-[#02273A]",
            },
          ]}
          classNames="items-center !gap-0 !p-1"
          customModalclassNames="!p-0"
          width={140}
          Iconcomponent={({ onClick, ref }) => (
            <IconButton ref={ref} onClick={onClick} size="small">
              <MoreHoriz />
            </IconButton>
          )}
        />
      ),
    };
  });

  const selectedChild = childId ? children.find((c) => c.id === childId) : undefined;

  return {
    // New data structures
    statsInfo,
    generalInfo,
    medicalInfo,
    emergencyContact,
    // Legacy data structures
    childrenTableData,
    tableHeaders,
    studentInfo,
    medicalFields,
    basicInfo,
    emergencyContacts,
    doctorInfo,
    selectedChild,
    deactivateAccount,
    setDeactivateAccount,
    handleDeactivateConfirm,
    handleDeleteConfirm,
    deleteAccount,
    setDeleteAccount,
    gradeAnchorEl,
    setGradeAnchorEl,
    selectedGradeFilter,
    gradeFilters,
    setSelectedGradeFilter,
    handleOpenGradeFilter,
  };
};
