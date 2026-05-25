import { BookingStatus, MinimumNoticeUnit } from "../../shared/entities/EntityEnums";
import { TourBooking } from "../../shared/entities/TourBooking";
import { TourEvent } from "../../shared/entities/TourEvent";

export function minimumNoticeToMs(notice: number, unit: MinimumNoticeUnit): number {
  const value = Math.max(0, notice);
  switch (unit) {
    case MinimumNoticeUnit.Minutes:
      return value * 60 * 1000;
    case MinimumNoticeUnit.Hours:
      return value * 60 * 60 * 1000;
    case MinimumNoticeUnit.Days:
      return value * 24 * 60 * 60 * 1000;
    default:
      return value * 60 * 60 * 1000;
  }
}

/** Normalize DB `date` column (string or Date) to YYYY-MM-DD for parsing. */
export function normalizeTourDate(date: string | Date): string {
  if (date instanceof Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const raw = String(date).trim();
  return raw.split("T")[0]!;
}

export function getTourStartAt(date: string | Date, startTime: string): Date {
  const datePart = normalizeTourDate(date);
  const timePart = startTime.length === 5 ? `${startTime}:00` : startTime;
  return new Date(`${datePart}T${timePart}`);
}

export function isReminderDue(
  booking: Pick<TourBooking, "date"> & { slot?: { startTime?: string } | null },
  tourEvent: Pick<TourEvent, "minimumNotice" | "minimumNoticeUnit">,
  now: Date = new Date(),
): boolean {
  const startTime = booking.slot?.startTime;
  if (!startTime || !booking.date) return false;

  const tourStart = getTourStartAt(booking.date, startTime);
  if (Number.isNaN(tourStart.getTime())) return false;
  if (now >= tourStart) return false;

  const noticeMs = minimumNoticeToMs(
    tourEvent.minimumNotice ?? 0,
    tourEvent.minimumNoticeUnit,
  );
  const reminderAt = new Date(tourStart.getTime() - noticeMs);
  return now >= reminderAt;
}

export const TOUR_REMINDER_ELIGIBLE_STATUSES: BookingStatus[] = [
  BookingStatus.ACTIVE,
  BookingStatus.TOUR_BOOKED,
  BookingStatus.RESCHEDULED,
  BookingStatus.ACCEPTED,
];

export function dedupeEmails(emails: (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of emails) {
    const normalized = (raw || "").trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push((raw || "").trim());
  }
  return result;
}
