import type { DataPoint } from "@/components/Charts/AttendanceTrendChart/AttendanceTrendChart";

export const attendanceTrendDataByMonth: DataPoint[] = [
  { label: "Jan", absent: 62, present: 6 },
  { label: "Feb", absent: 8, present: 10 },
  { label: "Mar", absent: 54, present: 30 },
  { label: "Apr", absent: 72, present: 20 },
  { label: "May", absent: 6, present: 50 },
  { label: "Jun", absent: 78, present: 28 },
  { label: "Jul", absent: 88, present: 50 },
  { label: "Aug", absent: 9, present: 89 },
  { label: "Sep", absent: 83, present: 17 },
  { label: "Oct", absent: 61, present: 0 },
  { label: "Nov", absent: 79, present: 10 },
  { label: "Dec", absent: 9, present: 40 },
];

/** Days of the week for "This Week" period */
export const attendanceTrendDataByWeek: DataPoint[] = [
  { label: "Mon", absent: 5, present: 42 },
  { label: "Tue", absent: 3, present: 44 },
  { label: "Wed", absent: 8, present: 39 },
  { label: "Thu", absent: 4, present: 43 },
  { label: "Fri", absent: 6, present: 41 },
  { label: "Sat", absent: 2, present: 10 },
  { label: "Sun", absent: 1, present: 8 },
];

/** Hourly slots for "Today" period */
export const attendanceTrendDataByToday: DataPoint[] = [
  { label: "6AM", absent: 2, present: 5 },
  { label: "9AM", absent: 1, present: 28 },
  { label: "12PM", absent: 0, present: 32 },
  { label: "3PM", absent: 1, present: 30 },
  { label: "6PM", absent: 3, present: 18 },
  { label: "9PM", absent: 2, present: 6 },
  { label: "12AM", absent: 0, present: 2 },
];

/** @deprecated Use attendanceTrendDataByMonth for default month view */
export const attendanceTrendData = attendanceTrendDataByMonth;