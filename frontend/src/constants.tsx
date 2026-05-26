/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { DashboardRoutes } from "./routes/dashboard.routes";
import { JSX } from "react/jsx-runtime";
// import { ActionMenu } from './components/ActionMenu';
import TeacherIcon from "@/modules/shared/assets/svgs/teacher.svg";
import ClassroomIcon from "@/modules/shared/assets/svgs/classroom.svg";
import AdmissionIcon from "@/modules/shared/assets/svgs/admission.svg";
// import ParentIcon from "@/modules/shared/assets/svgs/mage_users.svg";
import AttendanceIcon from "@/modules/shared/assets/svgs/attendance.svg";
// import ClipboardIcon from "@/modules/shared/assets/svgs/clipboardOutline.svg";
// import LearningIcon from "@/modules/shared/assets/svgs/books.svg";
// import MessagingIcon from "@/modules/shared/assets/svgs/messageIcon.svg";
import InvoiceIcon from "@/modules/shared/assets/svgs/invoice.svg";
import PhotoLibraryIcon from "@/modules/shared/assets/svgs/photoIcon.svg";
import SettingsIcon from "@/modules/shared/assets/svgs/settingsOutline.svg";
import AnalyticsIcon from "@/modules/shared/assets/svgs/analytics.svg";
// import BillingsIcon from "@/modules/shared/assets/svgs/bill-icon.svg";
import { StaffRoutes } from "./routes/staff.routes";
import { ParentRoutes } from "./routes/parent.routes";

interface ChatMessage {
  name: string;
  preview: string;
  time: string;
  profile: JSX.Element;
  unread?: number;
}

export interface SubItems {
  id: string | number;
  path: string;
  label: string;
  subIcon?: React.ReactNode;
}

export interface SidebarItemProps {
  id: string | number;
  path: string;
  pathname?: string;
  label: string;
  icon?: React.ReactNode;
  arrowIcon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  subItems?: SubItems[];
  matchPaths?: string[];
}

export const classDetails = {
  school: "whitepenguin",
  name: "Opeyemi",
  firstText: "Good Morning, Ms. Opeyemi",
  parentText: "Nursery A Class Assigned",
  adminText: "Admin",
  staffText: "Class Assigned",
};

type Role = "admin" | "staff" | "parent" | string;

export const routeRoleMessages: Record<string, Record<Role, string>> = {
  [DashboardRoutes.dashboard]: {
    admin: "Good Morning, Ms. Opeyemi",
    staff: "Staff Dashboard",
    parent: "Parent Dashboard",
  },
  [DashboardRoutes.children]: {
    admin: "Children",
    adminSubtext: "Children management portal",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.messaging]: {
    admin: "Messaging",
    adminSubtext: "Stay connected with teachers and receive important updates",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.assessments]: {
    admin: "Assessments",
    adminSubtext: "Evaluate student progress through various assessments.",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.announcement]: {
    admin: "Announcements",
    adminSubtext: "Stay connected with teachers and receive important updates",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.tours]: {
    admin: "Admission",
    adminSubtext:
      "Manage tour scheduling, track admission applications and review form submissions",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.forms]: {
    admin: "Form submission",
    adminSubtext: "Review and process admission forms and documents",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.pipeline]: {
    admin: "Pipeline",
    adminSubtext:
      "Track prospective families through the admission applications and review form submissions",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.profile]: {
    admin: "Profile",
    adminSubtext: "Manage your account information and preferences",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.settings]: {
    admin: "Settings",
    adminSubtext: "Manage your system configuration and preferences",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.tuitionPlans]: {
    admin: "Billing",
    adminSubtext: "Manage your invoices, payment methods and transaction history",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.invoices]: {
    admin: "Billing",
    adminSubtext: "Manage your invoices, payment methods and transaction history",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.feesPayments]: {
    admin: "Billing",
    adminSubtext: "Manage your invoices, payment methods and transaction history",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.attendanceChildren]: {
    admin: "Attendance",
    adminSubtext: "Track and analyze attendance patterns for children",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.teachersAttendance]: {
    admin: "Attendance",
    adminSubtext: "Track and analyze attendance patterns for staff",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.reports]: {
    admin: "Attendance",
    adminSubtext: "Track and analyze attendance patterns for staff/children",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.guides]: {
    admin: "Guides",
    adminSubtext: "Learn how to navigate and use the dashboard effectively",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.learning]: {
    admin: "Manage All Classes",
    staff: "Your Assigned Classes",
    parent: "Your Child's Classes",
  },
  [DashboardRoutes.classRooms]: {
    admin: "Classrooms",
    adminSubtext: "Manage classroom capacity, staff assignments and student enrollment",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.roomsActivities]: {
    admin: "Activities",
    adminSubtext: "All updates are shared",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.myChild]: {
    admin: "Manage All Classes",
    staff: "Your Assigned Classes",
    parent: "Your Child's Classes",
  },
  [DashboardRoutes.teachers]: {
    admin: "Teachers & Staff",
    adminSubtext: "Manage staff members, roles and assignments",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
  [DashboardRoutes.addChildren]: {
    admin: "Manage All Classes",
    staff: "Your Assigned Classes",
    parent: "Your Child's Classes",
  },
  [DashboardRoutes.curriculum]: {
    admin: "Curriculum",
    adminSubtext: "Curriculum plan for the session",
    staff: "",
    staffSubText: "",
    parent: "",
    parentSubtext: "",
  },
};

export const chartOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const GradeOptions = [
  { value: "all classroom", label: "All Classroom" },
  { value: "pre_k", label: "Pre K" },
  { value: "grade1", label: "Grade 1" },
  { value: "grade2", label: "Grade 2" },
  { value: "grade3", label: "Grade 3" },
];

export const chartOption = ["Daily", "Weekly", "Monthly"];
export const gradeOptions = ["All", "Pre K", "Grade 1", "Grade 2", "Grade 3"];

export const dateOptions = [
  { value: "Dec 2025", label: "Dec 2025" },
  { value: "Nov 2025", label: "Nov 2025" },
  { value: "Oct 2025", label: "Oct 2025" },
  // { value: 'Sep 2025', label: 'Sep 2025' },
  // { value: 'Aug 2025', label: 'Aug 2025' },
  // { value: 'Jul 2025', label: 'Jul 2025' },
];

export const dataApplicationProgressChart = [
  { day: "Mon", Applications: 60, Interviews: 50, Enrolled: 60 },
  { day: "Tue", Applications: 65, Interviews: 70, Enrolled: 60 },
  { day: "Wed", Applications: 55, Interviews: 58, Enrolled: 65 },
  { day: "Thu", Applications: 70, Interviews: 60, Enrolled: 55 },
  { day: "Fri", Applications: 40, Interviews: 35, Enrolled: 30 },
];

export const candidateOptions = [
  { value: "All Classroom", label: "All Classroom", color: "!text-[#02273A]", onclick: () => {} },
  { value: "Pre K", label: "Pre K", color: "!text-[#02273A]", onclick: () => {} },
  { value: "Grade 1", label: "Grade 1", color: "!text-[#02273A]", onclick: () => {} },
  { value: "Grade 2", label: "Grade 2", color: "!text-[#02273A]", onclick: () => {} },
  { value: "Grade 3", label: "Grade 3", color: "!text-[#02273A]", onclick: () => {} },
];

export const ageOptions = [
  { value: "All ages", label: "All ages" },
  { value: "below 5", label: "below 5" },
  { value: "5 - 9", label: "5 - 9" },
];

export const data = [
  { name: "Mon", present: 28, absent: 38, late: 2 },
  { name: "Tue", present: 35, absent: 52, late: 10 },
  { name: "Wed", present: 50, absent: 55, late: 0 },
  { name: "Thu", present: 60, absent: 30, late: 10 },
  { name: "Fri", present: 62, absent: 44, late: 15 },
];

export const adminSidebarItems: SidebarItemProps[] = [
  {
    id: 1,
    label: "Dashboard",
    icon: <Image src="/assets/svg/home.svg" alt="home" width={20} height={20} />,
    path: DashboardRoutes.dashboard,
  },
  {
    id: 2,
    label: "Children",
    icon: (
      <Image src="/assets/svg/hugeicons_child.svg" alt="children_logo" width={20} height={20} />
    ),
    path: DashboardRoutes.children,
  },
  {
    id: 3,
    label: "Parents",
    icon: <Image src="/assets/svg/mage_users.svg" alt="parent-logo" width={20} height={20} />,
    path: DashboardRoutes.parents,
  },
  {
    id: 4,
    label: "Teachers",
    icon: <TeacherIcon />,
    path: DashboardRoutes.teachers,
  },

  {
    id: 5,
    label: "Classrooms",
    path: DashboardRoutes.classRooms,
    icon: <ClassroomIcon />,
    matchPaths: [
      DashboardRoutes.classRooms,
      DashboardRoutes.classroomDetails,
      DashboardRoutes.classroomView,
      DashboardRoutes.classroomEdit,
      DashboardRoutes.roomsActivities,
    ],
  },
  {
    id: 6,
    label: "Admission",
    icon: <AdmissionIcon />,
    path: DashboardRoutes.events,
    matchPaths: [
      DashboardRoutes.events,
      DashboardRoutes.admission,
      DashboardRoutes.tours,
      DashboardRoutes.forms,
      DashboardRoutes.pipeline,
      DashboardRoutes.admissionReports,
    ],
  },
  {
    id: 7,
    label: "Attendance",
    icon: <AttendanceIcon />,
    path: DashboardRoutes.attendanceChildren,
  },
  {
    id: 8,
    label: "Learning",
    icon: <Image src="/assets/svg/books.svg" alt="book" width={18} height={18} />,
    path: DashboardRoutes.learningMilestones,
    matchPaths: [
      DashboardRoutes.learningMilestones,
      DashboardRoutes.learningSubjects,
      DashboardRoutes.learningAddSubject,
      DashboardRoutes.learningEditSubject,
      DashboardRoutes.learningTemplatesLibrary,
      DashboardRoutes.learningMyLibrary,
      DashboardRoutes.learningGrading,
      DashboardRoutes.learningReport,
      DashboardRoutes.learningTemplatesLibrary,
      DashboardRoutes.learningMyLibrary,
      DashboardRoutes.learningGrading,
      DashboardRoutes.learningReport,
      DashboardRoutes.curriculum,
    ],
  },

  {
    id: 9,
    label: "Communication",
    icon: <Image src="/assets/svg/messageIcon.svg" alt="volume" width={18} height={18} />,
    path: DashboardRoutes.messaging,
    matchPaths: [DashboardRoutes.messaging, DashboardRoutes.announcement],
  },
  {
    id: 10,
    label: "Invoicing",
    icon: <InvoiceIcon />,
    path: DashboardRoutes.invoices,
  },
  {
    id: 11,
    label: "Reports",
    icon: <AnalyticsIcon />,
    path: "/admin/reports",
  },
  // {
  //   id: 14,
  //   label: "Billings",
  //   icon: <BillingsIcon />,
  //   path: "/admin/billings",
  // },
  {
    id: 12,
    label: "Guides",
    icon: <Image src="/assets/svg/guidesIcon.svg" alt="guides" width={20} height={20} />,
    path: DashboardRoutes.guides,
  },
  {
    id: 13,
    label: "Settings",
    icon: <SettingsIcon />,
    path: DashboardRoutes.profileSettings,
    matchPaths: [
      DashboardRoutes.profileSettings,
      DashboardRoutes.accountSecuritySettings,
      DashboardRoutes.notificationSetting,
      DashboardRoutes.permissionSettings,
      DashboardRoutes.rolesSettings,
      DashboardRoutes.publicLinksSetting,
      DashboardRoutes.paymentMethodSetting,
    ],
  },
];

export const staffSidebarItems: SidebarItemProps[] = [
  {
    id: 1,
    label: "Dashboard",
    icon: <Image src="/assets/svg/home.svg" alt="home" width={18} height={18} />,
    path: StaffRoutes.dashboard,
  },
  {
    id: 2,
    label: "Children",
    icon: <Image src="/assets/svg/hugeicons_child.svg" alt="profile" width={18} height={18} />,
    path: StaffRoutes.children,
  },
  {
    id: 3,
    label: "Classroom",
    path: StaffRoutes.classRooms,
    icon: <ClassroomIcon />,
  },
  {
    id: 4,
    label: "Attendance",
    icon: <Image src="/assets/svg/check-square.svg" alt="profile" width={18} height={18} />,
    path: StaffRoutes.attendanceChildren,
  },
  {
    id: 5,
    label: "Activites",
    icon: <Image src="/assets/svg/clipboardOutline.svg" alt="room" width={18} height={18} />,
    path: StaffRoutes.activities,
  },
  {
    id: 6,
    label: "Learning",
    icon: <Image src="/assets/svg/books.svg" alt="book" width={18} height={18} />,
    path: StaffRoutes.learning,
  },
  {
    id: 7,
    label: "Communication",
    icon: <Image src="/assets/svg/messageIcon.svg" alt="volume" width={18} height={18} />,
    path: StaffRoutes.messaging,
    matchPaths: [StaffRoutes.messaging, StaffRoutes.announcement],
  },
  {
    id: 9,
    label: "Guides",
    icon: <Image src="/assets/svg/guidesIcon.svg" alt="guides" width={20} height={20} />,
    path: StaffRoutes.guides,
  },
  {
    id: 8,
    label: "Settings",
    icon: <Image src="/assets/svg/settings-icon.svg" alt="settings" width={18} height={18} />,
    path: StaffRoutes.accountSecuritySettings,
    matchPaths: [
      StaffRoutes.accountSecuritySettings,
      StaffRoutes.notificationSetting,
      StaffRoutes.permissionSettings,
      StaffRoutes.resetPin,
    ],
  },
];

export const parentSidebarItems: SidebarItemProps[] = [
  {
    id: 1,
    label: "Dashboard",
    icon: <Image src="/assets/svg/home.svg" alt="home" width={18} height={18} />,
    path: ParentRoutes.dashboard,
  },
  {
    id: 2,
    label: "Children",
    icon: <Image src="/assets/svg/hugeicons_child.svg" alt="profile" width={18} height={18} />,
    path: ParentRoutes.children,
  },
  {
    id: 3,
    label: "Activities",
    icon: <Image src="/assets/svg/clipboardOutline.svg" alt="room" width={18} height={18} />,
    path: ParentRoutes.activities,
  },
  {
    id: 4,
    label: "Communication",
    icon: <Image src="/assets/svg/messageIcon.svg" alt="volume" width={18} height={18} />,
    path: ParentRoutes.messaging,
    matchPaths: [ParentRoutes.messaging, ParentRoutes.announcement],
  },
  {
    id: 5,
    label: "Image Library",
    icon: <Image src="/assets/svg/photoIcon.svg" alt="photo" width={18} height={18} />,
    path: ParentRoutes.imageLibrary,
  },
  {
    id: 6,
    label: "Invoicing",
    icon: <InvoiceIcon />,
    path: ParentRoutes.invoicing,
  },
];

export const lowerSidebarItems: SidebarItemProps[] = [
  // {
  //   id: 10,
  //   label: "Profile",
  //   icon: <Image src="/assets/svg/profile-circle.svg" alt="profile" width={18} height={18} />,
  //   path: StaffRoutes.profile,
  // },
  {
    id: 11,
    label: "Settings",
    icon: <Image src="/assets/svg/settings-icon.svg" alt="settings" width={18} height={18} />,
    path: StaffRoutes.settings,
  },
];

export const dashboardStaffDataCards = [
  { title: "Total Signed in", value: 12 },
  { title: "Children Signed In", value: 9 },
  { title: "Children Late", value: 8 },
  { title: "Children Absent", value: 9 },
];

export const dashboardParentDataCards = [
  { title: "Enrolled", value: 12 },
  { title: "Signed In", value: 9 },
  { title: "Late", value: 8 },
  { title: "Out Sick", value: 9 },
];

export const dashboardAdminDataCards = [
  { title: "Students", value: 124684, percentage: "18%" },
  { title: "Teachers", value: 12184, percentage: "15%" },
  { title: "Classrooms", value: 100, percentage: "10%" },
  { title: "Admissions", value: 29300, percentage: "25%" },
];

export const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const dates = [
  { day: 28, events: [] },
  { day: 29, events: [] },
  { day: 30, events: [] },
  { day: 31, events: [] },
  { day: 1, events: ["Teacher Pro..."] },
  { day: 2, events: ["Students Day", "AP Calculus.."] },
  { day: 3, events: ["Spring Conc.."] },

  { day: 4, events: [] },
  { day: 5, events: ["Cinco de Ma.."] },
  { day: 6, events: [] },
  { day: 7, events: [] },
  { day: 8, events: ["Science Fair..", "Teacher Mee..", "Extra Event"] },
  { day: 9, events: ["Science Fair.."] },
  { day: 10, events: ["PTA Meeting"] },

  { day: 11, events: [] },
  { day: 12, events: ["English Liter.."] },
  { day: 13, events: [] },
  { day: 14, events: [] },
  { day: 15, events: ["Varsity Trac.."] },
  { day: 16, events: ["Junior Prom"] },
  { day: 17, events: [] },

  { day: 18, events: [] },
  { day: 19, events: ["Senior Proje..", "Teacher Mee.."] },
  { day: 20, events: [] },
  { day: 21, events: ["English Liter.."] },
  { day: 22, events: ["Art Exhibito.."] },
  { day: 23, events: ["Drama Club.."] },
  { day: 24, events: ["PTA Meeting"] },
];

export const chatMessages: ChatMessage[] = [
  {
    name: "Dr. Lila Ramirez",
    preview:
      "Please ensure the monthly attendance report is accurate before the October 31st deadline...",
    time: "9:00 AM",
    profile: <div className="w-10 h-10 bg-gray-300 rounded-full mx-2"></div>,
  },
  {
    name: "Ms. Heather Morris",
    preview: "Don’t forget the staff training on digital tools scheduled on the 2nd of November...",
    time: "10:15 AM",
    profile: <div className="w-10 h-10 bg-gray-300 rounded-full mx-2"></div>,
  },
  {
    name: "Officer Dan Brooks",
    preview: "Review the updated security protocols effective...",
    time: "3:10 PM",
    unread: 2,
    profile: <div className="w-10 h-10 bg-gray-300 rounded-full mx-2"></div>,
  },
  {
    name: "Ms. Tina Goldberg",
    preview: "Reminder: Major IT system upgrade on May 8th from 1pm to 4pm...",
    time: "5:00 PM",
    unread: 6,
    profile: <div className="w-10 h-10 bg-gray-300 rounded-full mx-2"></div>,
  },
  {
    name: "Robert Gracias",
    preview: "Reminder: Don't forget - Major IT system upgrade on May 8th from 1pm to 4pm...",
    time: "5:00 PM",
    profile: <div className="w-10 h-10 bg-gray-300 rounded-full mx-2"></div>,
  },
  {
    name: "Mr. Reed",
    preview: "Reminder: Major IT system upgrade on May 8th...",
    time: "5:00 PM",
    profile: <div className="w-10 h-10 bg-gray-300 rounded-full mx-2"></div>,
  },
];

export const dummyMessages = [
  {
    id: "msg1",
    sender: false,
    name: "Mr. Franklin",
    role: "School Secretary",
    time: "2025-09-09T08:00:00",
    message:
      "Good morning, everyone! Please remember to update your calendars. The school board meeting has been rescheduled to April 27th at 10 AM.",
    profile: "/assets/avatars/daniel.png",
    status: "",
  },
  {
    id: "msg2",
    sender: false,
    name: "Mrs. Thompson",
    role: "Vice Principal",
    time: "2025-09-09T08:05:00",
    message:
      "Thanks for the heads-up, Ms. Franklin. I'll make sure the agenda items from each department are ready by next Monday...",
    profile: "/assets/avatars/sophia.png",
    status: "",
  },
  {
    id: "msg3",
    sender: true,
    name: undefined,
    role: undefined,
    time: "2025-09-09T08:15:00",
    message: "Got it! I'll send a reminder to the Science Club too.",
    profile: undefined,
    status: "read",
  },
  {
    id: "msg4",
    sender: false,
    name: "Officer Dan Brooks",
    role: undefined,
    time: "2025-09-09T15:10:00",
    message: "Review the updated security protocols effective May 1st.",
    profile: "/assets/avatars/john.png",
    status: "",
  },
  {
    id: "msg5",
    sender: true,
    name: undefined,
    role: undefined,
    time: "2025-09-09T15:12:00",
    message: "Thanks for the update. I'll notify the staff.",
    profile: undefined,
    status: "waiting",
  },
  {
    id: "msg6",
    sender: true,
    name: undefined,
    role: undefined,
    time: "2025-09-09T15:16:00",
    message: "Hmmm...",
    profile: undefined,
    status: "read",
  },
  {
    id: "msg7",
    sender: false,
    name: "Chief CEO",
    role: undefined,
    time: "2025-09-09T16:15:00",
    message:
      "I am also reviewing the dev team’s salaries, particularly Niyi’s, given their exceptional hard work — their increase is set at 250%.",
    profile: "/assets/avatars/john.png",
    status: "",
  },
  {
    id: "msg6",
    sender: true,
    name: undefined,
    role: undefined,
    time: "2025-09-09T16:25:00",
    message: "Wow!!!! thank you sir, ...",
    profile: undefined,
    status: "received",
  },
  {
    id: "msg7",
    sender: false,
    name: "Chief CEO",
    role: undefined,
    time: "2025-09-09T17:22:00",
    message: "I love the team-spirit",
    profile: "/assets/avatars/john.png",
    status: "",
  },
];

// Dummy chart data
export const feesData = [
  { month: "Jan", value: 500 },
  { month: "Feb", value: 1000 },
  { month: "Mar", value: 2500 },
  { month: "Apr", value: 2000 },
  { month: "May", value: 4000 },
  { month: "Jun", value: 3000 },
  { month: "Jul", value: 7000 },
  { month: "Aug", value: 5000 },
  { month: "Sep", value: 7500 },
  { month: "Oct", value: 6000 },
];

// Payment history dummy data
export const paymentHistory = [
  {
    name: "Sophia Wilson",
    class: "11A",
    tuition: "$4,500",
    activities: "$300",
    misc: "$200",
    amount: "$5,000",
    status: "Paid",
  },
  {
    name: "Ethan Lee",
    class: "10B",
    tuition: "$4,500",
    activities: "$250",
    misc: "$150",
    amount: "$4,900",
    status: "Pending",
  },
  {
    name: "Michael Brown",
    class: "12 A",
    tuition: "$4,800",
    activities: "$300",
    misc: "$200",
    amount: "$5,300",
    status: "Paid",
  },
  {
    name: "Ava Smith",
    class: "9B",
    tuition: "$4,500",
    activities: "$250",
    misc: "$100",
    amount: "$4,850",
    status: "Overdue",
  },
];

export const dashboardCards = [
  { status: "Total Amount", value: "$126,450", trend: { value: "+15%", up: true } },
  { status: "Paid Amount", value: "$67,200", trend: { value: "+15%", up: true } },
  { status: "Pending Amount", value: "$8,000", trend: { value: "-3%", up: false } },
  { status: "Overdue Invoices", value: "$6,150", trend: { value: "-3%", up: false } },
];

export const paymentHistoryHeaders = [
  "Student Name",
  "Class",
  "Tuition Fee",
  "Activities Fee",
  "Miscellaneous",
  "Amount",
  "Status",
  "Action",
];

// const STATUS_STYLES: Record<string, { dot: string; chip: string }> = {
//   Paid: {
//     dot: 'bg-green-500',
//     chip: 'bg-green-100 text-green-700',
//   },
//   Pending: {
//     dot: 'bg-yellow-500',
//     chip: 'bg-yellow-100 text-yellow-700',
//   },
//   Overdue: {
//     dot: 'bg-red-500',
//     chip: 'bg-red-100 text-red-700',
//   },
// };

// const DEFAULT_STYLE = {
//   dot: 'bg-gray-400',
//   chip: 'bg-gray-100 text-gray-700',
// };

// const getStatusConfig = (status: string) => STATUS_STYLES[status] ?? DEFAULT_STYLE;

// const StatusCell = ({ status }: { status: string }) => {
//   const { dot, chip } = getStatusConfig(status);

//   return (
//     <div className={`flex items-center gap-2 px-2 py-1 rounded-full w-fit ${chip}`}>
//       <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
//       <span className="text-xs font-light">{status}</span>
//     </div>
//   );
// };

export const LockIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
    <path
      d="M7 11V8a5 5 0 0110 0v3"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const EyeIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);
export const DownloadIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 3v12"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 11l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 21H3"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const MoreIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

/* ---------- Toggle ---------- */
export function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked ? "true" : "false"}
      aria-label={disabled ? "Toggle (disabled)" : "Toggle"}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex items-center h-4 w-7 rounded-full transition-colors focus:outline-none ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${checked ? "bg-teal-600" : "bg-gray-200"}`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white border border-brandColor-active shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* ---------- Row item ---------- */
export function RowItem({
  title,
  subtitle,
  control,
}: {
  title: string;
  subtitle?: string;
  control?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm text-gray-700 font-medium">{title}</div>
        {subtitle && <div className="mt-0.5 text-xs text-gray-400">{subtitle}</div>}
      </div>
      <div className="ml-4 flex items-center gap-3">{control}</div>
    </div>
  );
}

export const dropdownOptions = [
  { value: "Today", label: "Today" },
  { value: "This Week", label: "This Week" },
];

export const classOptions = [
  { value: "All Classes", label: "All Classes" },
  { value: "Nursery A", label: "Nursery A" },
];

export const sectionOptions = [
  { value: "All Sections", label: "All Sections" },
  { value: "Section A", label: "Section A" },
];

export const pipelineTableHeaders = [
  "Child",
  "Age",
  "Toured",
  "Parent(s)",
  "Status",
  "Sources",
  "Action",
];

export const statusOptions = ["All Status", "Pass", "Failed"];

export const insights = [
  { name: "Tours This Month", value: 42 },
  { name: "Applications", value: 28 },
  { name: "Interviews Scheduled", value: 15 },
  { name: "New Enrolment", value: 7 },
];

export const ITEMS_PER_PAGE = 10;
export const DEFAULT_DEBOUNCE_DELAY = 300;

export const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

export const STALE_TIME = 1800000;
export const OTP_COUNTDOWN_DURATION = 180;
export const GET_BANK_LIST_STALE_TIME = 86400000;

export const DEFAULT_DROPDOWN_WIDTH = 180;
export const DEFAULT_DROPDOWN_MAX_HEIGHT = 250;

export const PERIOD_OPTIONS = [
  {
    name: "Today",
  },
  {
    name: "This week",
  },
  {
    name: "This month",
  },
  {
    name: "Last month",
  },
  {
    name: "This year",
  },
  {
    name: "Last year",
  },
  {
    name: "Custom",
  },
];

/** Attendance period type for dashboard analytics API (no UI for switching yet) */
export type AttendancePeriodType = "daily" | "weekly" | "monthly" | "yearly";

export const ATTENDANCE_PERIOD_TYPES: AttendancePeriodType[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

export const DEFAULT_ATTENDANCE_PERIOD_TYPE: AttendancePeriodType = "weekly";
export const CLASSROOM_OPTIONS = [
  {
    name: "Grade 3",
    isActive: true,
  },
  {
    name: "Grade 1",
    isActive: true,
  },
  {
    name: "Pre K",
    isActive: true,
  },
];

export const ACTIVITIES_OPTIONS = [
  {
    name: "Nap",
    isActive: true,
  },
  {
    name: "Meal",
    isActive: true,
  },
  {
    name: "Water",
    isActive: true,
  },
  {
    name: "Photo",
    isActive: true,
  },
  {
    name: "Medication",
    isActive: true,
  },
  {
    name: "Bathroom",
    isActive: true,
  },
];

// export const ACTIVITIES_OPTIONS = [
//   {
//     name: "Nap",
//   },
//   {
//     name: "Meal",
//   },
//   {
//     name: "Water",
//   },
//   {
//     name: "Photo",
//   },
//   {
//     name: "Medication",
//   },
//   {
//     name: "Bathroom",
//   },
// ];

export const SETTINGS_ROUTES_OPTIONS = [
  {
    label: "School Profile",
    href: DashboardRoutes.profileSettings,
  },
  {
    label: "Account & Security",
    href: DashboardRoutes.accountSecuritySettings,
  },
  {
    label: "Billings",
    href: DashboardRoutes.billings,
  },
  {
    label: "Notifications",
    href: DashboardRoutes.notificationSetting,
  },
  {
    label: "Public Links",
    href: DashboardRoutes.publicLinksSetting,
  },
  {
    label: "Admin Users",
    href: DashboardRoutes.permissionSettings,
  },
  {
    label: "Roles & Permissions",
    href: DashboardRoutes.rolesSettings,
  },
  {
    label: "Payment Methods",
    href: DashboardRoutes.paymentMethodSetting,
  },
];

export const STAFF_SETTINGS_ROUTES_OPTIONS = [
  {
    label: "Account & Security",
    href: StaffRoutes.accountSecuritySettings,
  },
  {
    label: "Notifications",
    href: StaffRoutes.notificationSetting,
  },
  {
    label: "Kiosk PIN",
    href: StaffRoutes.resetPin,
  },
];
export const NAIRA = {
  id: 107,
  name: "Nigerian naira",
  symbol: "₦",
  code: "NGN",
  countryCode: "NG",
  countryName: "Nigeria",
  createdAt: "2023-08-03T01:58:30.334Z",
  updatedAt: "2023-08-03T01:58:30.334Z",
  deletedAt: null,
  delete: "2023-08-03T01:58:30.334Z",
};

export const VALID_GENERAL_SEARCH_URL = [
  DashboardRoutes.dashboard,
  StaffRoutes.dashboard,
  ParentRoutes.dashboard,
];

export const DATE_FILTER_PERIOD: any = {
  Today: "hourly",
  "This Week": "daily",
  "This Month": "weekly",
  "This Year": "monthly",
};
