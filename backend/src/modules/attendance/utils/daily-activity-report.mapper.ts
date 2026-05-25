import { ClassroomActivity } from "../../shared/entities/ClassroomActivity";
import { ActivityType, MealType } from "../../shared/entities/EntityEnums";
import type { AttendancePdfRow, DailyActivityPdfModel, LearningPdfRow } from "../../shared/services/pdf.service";
import { formatDateKey } from "../../shared/utils/date-util";

/** Minutes from midnight (Africa/Lagos) for snack AM vs PM split (default: noon). */
export const SNACK_CUTOFF_MINUTES = 12 * 60;

function getMinutesInTimezone(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  return h * 60 + m;
}

/**
 * Parse a time string (12h or 24h) to minutes from midnight.
 */
export function parseFlexibleTimeToMinutes(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  const m12 = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)\b/.exec(s);
  if (m12) {
    let h = parseInt(m12[1] ?? "0", 10);
    const min = parseInt(m12[2] ?? "0", 10);
    const ap = m12[4] ?? "";
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    if (h >= 24 || min >= 60) return null;
    return h * 60 + min;
  }
  const m24 = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (m24) {
    const h = parseInt(m24[1] ?? "0", 10);
    const min = parseInt(m24[2] ?? "0", 10);
    if (h >= 24 || min >= 60) return null;
    return h * 60 + min;
  }
  return null;
}

export function getMinutesForActivity(activity: ClassroomActivity): number {
  if (activity.timeGiven?.trim()) {
    const p = parseFlexibleTimeToMinutes(activity.timeGiven.trim());
    if (p !== null) return p;
  }
  return getMinutesInTimezone(activity.createdAt, "Africa/Lagos");
}

export function isPmSnack(activity: ClassroomActivity): boolean {
  return getMinutesForActivity(activity) >= SNACK_CUTOFF_MINUTES;
}

type MealSlotKey = "breakfast" | "amSnack" | "lunch" | "pmSnack" | "dinner";

interface SlotAcc {
  times: string[];
  parts: string[];
}

function emptySlot(): SlotAcc {
  return { times: [], parts: [] };
}

function pushSlot(
  slot: SlotAcc,
  activity: ClassroomActivity,
  isWeekly: boolean,
  timeDisplay: string,
  contents: string
): void {
  const datePrefix = isWeekly ? `${formatDateKey(activity.createdAt)} — ` : "";
  if (timeDisplay) slot.times.push(datePrefix + timeDisplay);
  else if (isWeekly) slot.times.push(`${formatDateKey(activity.createdAt)}`);
  slot.parts.push(`${datePrefix}${contents}`);
}

function joinUniqueTimes(times: string[]): string {
  return times.filter(Boolean).join("; ");
}

function joinParts(parts: string[]): string {
  return parts.filter(Boolean).join("\n");
}

function formatFoodContents(activity: ClassroomActivity): string {
  const base = (activity.foodItems || "").trim();
  return base || "—";
}

/**
 * Build PDF row model from classroom activities for a date range (single day or week-to-date).
 */
export function buildDailyActivityPdfModel(
  activities: ClassroomActivity[],
  opts: {
    childFullName: string;
    schoolName: string;
    teacherName: string;
    isWeekly: boolean;
    dateRangeLabel: string;
    galleryUrl: string;
    attendanceRows: AttendancePdfRow[];
    learningRows: LearningPdfRow[];
    overallDevelopmentPercent: number | null;
  }
): DailyActivityPdfModel {
  const slots: Record<MealSlotKey, SlotAcc> = {
    breakfast: emptySlot(),
    amSnack: emptySlot(),
    lunch: emptySlot(),
    pmSnack: emptySlot(),
    dinner: emptySlot(),
  };

  const hydrationRows: { time: string; notes: string }[] = [];
  const medicationRows: { time: string; name: string; dosage: string; notes: string }[] = [];
  const napRows: { start: string; end: string; notes: string }[] = [];
  const hygieneRows: { time: string; type: string; notes: string }[] = [];
  const photoUrls: string[] = [];
  const parentNotesLines: string[] = [];

  const isWeekly = opts.isWeekly;

  for (const a of activities) {
    const timeDisplay = (a.timeGiven || "").trim();

    switch (a.activityType) {
      case ActivityType.MEAL: {
        const contents = formatFoodContents(a);
        const mt = a.mealType;
        if (mt === MealType.BREAKFAST) {
          pushSlot(slots.breakfast, a, isWeekly, timeDisplay, contents);
        } else if (mt === MealType.LUNCH) {
          pushSlot(slots.lunch, a, isWeekly, timeDisplay, contents);
        } else if (mt === MealType.DINNER) {
          pushSlot(slots.dinner, a, isWeekly, timeDisplay, contents);
        } else if (mt === MealType.SNACK) {
          const slot = isPmSnack(a) ? slots.pmSnack : slots.amSnack;
          pushSlot(slot, a, isWeekly, timeDisplay, contents);
        } else {
          pushSlot(slots.lunch, a, isWeekly, timeDisplay, contents);
        }
        break;
      }
      case ActivityType.WATER: {
        const datePrefix = isWeekly ? `${formatDateKey(a.createdAt)} — ` : "";
        hydrationRows.push({
          time: datePrefix + (timeDisplay || "—"),
          notes: (a.notes || "").trim() || "—",
        });
        break;
      }
      case ActivityType.MEDICATION: {
        const datePrefix = isWeekly ? `${formatDateKey(a.createdAt)} — ` : "";
        medicationRows.push({
          time: datePrefix + (timeDisplay || "—"),
          name: (a.medicationName || "").trim() || "—",
          dosage: (a.dosage || "").trim() || "—",
          notes: (a.notes || "").trim() || "—",
        });
        break;
      }
      case ActivityType.NAP: {
        const datePrefix = isWeekly ? `${formatDateKey(a.createdAt)} — ` : "";
        napRows.push({
          start: datePrefix + ((a.startTime || "").trim() || "—"),
          end: (a.endTime || "").trim() || "—",
          notes: (a.notes || "").trim() || "—",
        });
        break;
      }
      case ActivityType.BATHROOM: {
        const datePrefix = isWeekly ? `${formatDateKey(a.createdAt)} — ` : "";
        const bt = a.bathroomType ? String(a.bathroomType).replace(/_/g, " ") : "—";
        hygieneRows.push({
          time: datePrefix + (timeDisplay || "—"),
          type: bt,
          notes: (a.notes || "").trim() || "—",
        });
        break;
      }
      case ActivityType.PHOTO: {
        if (a.photoUrl) photoUrls.push(a.photoUrl);
        break;
      }
      default:
        break;
    }

    if (a.notifyParent && (a.notes || "").trim()) {
      const prefix = isWeekly ? `[${formatDateKey(a.createdAt)}] ` : "";
      parentNotesLines.push(`${prefix}${(a.notes || "").trim()}`);
    }
  }

  const reportTitle = isWeekly ? "Weekly Activity Report" : "Daily Activity Report";
  const periodLabel = isWeekly ? "this week" : "today";

  return {
    childFullName: opts.childFullName,
    schoolName: opts.schoolName,
    teacherName: opts.teacherName,
    reportTitle,
    dateRangeLabel: opts.dateRangeLabel,
    periodLabel,
    galleryUrl: opts.galleryUrl,
    breakfastTime: joinUniqueTimes(slots.breakfast.times),
    breakfastContents: joinParts(slots.breakfast.parts) || "—",
    amSnackTime: joinUniqueTimes(slots.amSnack.times),
    amSnackContents: joinParts(slots.amSnack.parts) || "—",
    lunchTime: joinUniqueTimes(slots.lunch.times),
    lunchContents: joinParts(slots.lunch.parts) || "—",
    pmSnackTime: joinUniqueTimes(slots.pmSnack.times),
    pmSnackContents: joinParts(slots.pmSnack.parts) || "—",
    dinnerTime: joinUniqueTimes(slots.dinner.times),
    dinnerContents: joinParts(slots.dinner.parts) || "—",
    hydrationRows,
    medicationRows,
    napRows,
    hygieneRows,
    photoUrls,
    parentNotesLines,
    isWeekly,
    overallDevelopmentPercent: opts.overallDevelopmentPercent,
    attendanceRows: opts.attendanceRows,
    learningRows: opts.learningRows,
  };
}
