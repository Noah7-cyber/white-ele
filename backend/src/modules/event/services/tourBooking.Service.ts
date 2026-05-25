import { AppDataSource } from "../../core";
import { TourBooking } from "../../shared/entities/TourBooking";
import { TourSlot } from "../../shared/entities/TourSlot";
import { TourEvent } from "../../shared/entities/TourEvent";
import { logger } from "../../shared";
import { TourAvailability } from "../../shared/entities/TourAvailability";
import { BookingStatus, FormResponseStatus, InvoiceSource, ParentStatus, PaymentMethod, RelationshipType, StudentStatus } from "../../shared/entities/EntityEnums";
import { FormResponse } from "../../shared/entities/FormResponse";
import { AdmissionOfferData } from "../../shared/entities/AdmissionOfferData";
import { invoiceService } from "../../invoice/services/invoice.service";
import { Parent } from "../../shared/entities/Parent";
import { Student } from "../../shared/entities/StudentEntity";
import { User } from "../../shared/entities/User";
import { emailService } from "../../shared/services/email.service";
import { Invoice } from "../../shared/entities/Invoice";
import { notificationService } from "../../notification";
import { NotificationType } from "../../shared/entities/Notification";
import { pdfService } from "../../shared/services/pdf.service";
import { basename } from "path";


interface BookingDTO {
  names: string[];   // array of names
  email: string;  // new field
  note?: string;  // new field
  referralSource?: TourBooking["referralSource"]; // new field
  guests?: string[]; // new field
  tourEventId: number;
  availabilityId: number;
  date: string;       // e.g. "2025-12-04"
  startTime: string;  // e.g. "09:00:00"
}

interface BookingStatusUpdateResult {
  booking: TourBooking;
  message?: string;
}

export class TourBookingService {
  private bookingRepository = AppDataSource.getRepository(TourBooking);
  private slotRepository = AppDataSource.getRepository(TourSlot);
  private tourEventRepository = AppDataSource.getRepository(TourEvent)
  private availabilityRepository = AppDataSource.getRepository(TourAvailability);
  private getPrimaryProspectName(names?: string[], fallback = "Prospect"): string {
    return names?.[0] ?? fallback;
  }

  private getSchoolNameFromEvent(tourEvent?: TourEvent | null, fallback = "the School"): string {
    return tourEvent?.school?.schoolName || fallback;
  }

  private getTourLocationFromEvent(tourEvent?: TourEvent | null, fallback = "School Campus"): string {
    return tourEvent?.location || tourEvent?.school?.address || fallback;
  }

  private contentTypeToExtension(contentType: string): string {
    const normalized = contentType.split(";")[0]?.trim().toLowerCase();
    if (normalized === "application/pdf") return "pdf";
    if (normalized === "image/png") return "png";
    if (normalized === "image/jpeg") return "jpg";
    if (normalized === "image/webp") return "webp";
    if (normalized === "text/plain") return "txt";
    return "bin";
  }

  private async resolveRequestAttachments(
    attachmentRefs?: string[]
  ): Promise<Array<{ filename: string; content: Buffer | string; contentType: string }>> {
    if (!attachmentRefs || attachmentRefs.length === 0) {
      return [];
    }

    const resolved: Array<{ filename: string; content: Buffer | string; contentType: string }> = [];

    for (let i = 0; i < attachmentRefs.length; i++) {
      const ref = String(attachmentRefs[i] || "").trim();
      if (!ref) continue;

      try {
        if (ref.startsWith("data:")) {
          const match = ref.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) {
            logger.warn(`Skipping unsupported data attachment format at index ${i}`);
            continue;
          }
          const contentType = match[1] || "application/octet-stream";
          const base64 = match[2] || "";
          const ext = this.contentTypeToExtension(contentType);
          resolved.push({
            filename: `Attachment_${i + 1}.${ext}`,
            content: Buffer.from(base64, "base64"),
            contentType,
          });
          continue;
        }

        if (ref.startsWith("http://") || ref.startsWith("https://")) {
          const response = await fetch(ref);
          if (!response.ok) {
            logger.warn(`Skipping attachment URL (status ${response.status}): ${ref}`);
            continue;
          }
          const arrayBuffer = await response.arrayBuffer();
          const contentType = response.headers.get("content-type") || "application/octet-stream";
          const parsedName = basename(new URL(ref).pathname);
          const ext = this.contentTypeToExtension(contentType);
          const filename = parsedName && parsedName !== "/" ? parsedName : `Attachment_${i + 1}.${ext}`;

          resolved.push({
            filename,
            content: Buffer.from(arrayBuffer),
            contentType,
          });
          continue;
        }

        logger.warn(`Skipping unsupported attachment reference at index ${i}: ${ref}`);
      } catch (error) {
        logger.warn(`Failed to resolve attachment at index ${i}: ${ref}`, error);
      }
    }

    return resolved;
  }

  async bookSlot(dto: BookingDTO) {
    const availability = await this.availabilityRepository.findOne({
      where: { id: dto.availabilityId },
      relations: ["slots", "tourEvent", "tourEvent.school"],
    });

    if (!availability) {
      throw new Error("Availability not found");
    }

    const tourEvent = availability.tourEvent;

    if (!tourEvent || !tourEvent.timeSlotInterval) {
      throw new Error("Tour event or time slot interval not found");
    }


    // Find existing slot
    let slot = await this.slotRepository.findOne({
      where: {
        availabilityId: dto.availabilityId,
        date: dto.date,
        startTime: dto.startTime,
      },
      relations: ["bookings"],
    });

    // Create slot if it doesn't exist
    if (!slot) {
      slot = this.slotRepository.create({
        availability,
        availabilityId: dto.availabilityId,
        date: dto.date,
        startTime: dto.startTime,
        schoolId: tourEvent.schoolId,
      });
      await this.slotRepository.save(slot);
    }

    // Check if slot is already booked
    if (slot.bookings && slot.bookings.length > 0) {
      throw new Error("Slot is already booked");
    }

    const booking = this.bookingRepository.create({
      names: dto.names,
      email: dto.email,
      note: dto.note,
      referralSource: dto.referralSource,
      guests: dto.guests,
      tourEventId: dto.tourEventId,
      slotId: slot.id,
      date: dto.date,
      schoolId: tourEvent.schoolId,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    // Send confirmation email
    try {
      const parentName = this.getPrimaryProspectName(savedBooking.names, "Prospect");
      const tourEvent = availability.tourEvent;
      const schoolName = this.getSchoolNameFromEvent(tourEvent, "the School");

      await emailService.sendTourBookingConfirmationEmail({
        email: savedBooking.email,
        parentName,
        schoolName,
        tourDate: savedBooking.date,
        tourTime: slot!.startTime,
        duration: `${tourEvent?.duration || 30} minutes`,
        location: this.getTourLocationFromEvent(tourEvent, "School Campus"),
        guideName: "Admissions Team",
      });
    } catch (emailError) {
      logger?.error?.(`Failed to send tour booking confirmation email: ${emailError}`);
    }

    // Send admin email alert
    if (savedBooking.schoolId) {
      try {
        const prospectName = this.getPrimaryProspectName(savedBooking.names, "A prospect");
        const tourLocation = this.getTourLocationFromEvent(availability?.tourEvent, "School Campus");
        const schoolName = this.getSchoolNameFromEvent(availability?.tourEvent, "the School");
        const bookerEmail = savedBooking?.email || "No email provided";
        const tourDate = savedBooking?.date || "Date not provided";
        const tourTime = slot?.startTime || "Time not provided";

        await emailService.sendTourBookedAdminNotificationEmail({  
          schoolId: savedBooking?.schoolId,
          schoolName,
          bookerName: prospectName,
          bookerEmail,
          tourDate,
          tourTime,
          location: tourLocation,
          guestCount: savedBooking.guests?.length || 0,
          note: savedBooking.note,
        });
      } catch (adminEmailError) {
        logger?.error?.(`Failed to send admin tour-booked email: ${adminEmailError}`);
      }
    }

    // Notify admins in-app
    if (savedBooking.schoolId) {
      await notificationService.notifyAdmins({
        schoolId: savedBooking.schoolId,
        title: "New Tour Booking",
        message: `${this.getPrimaryProspectName(savedBooking.names, "A prospect")} has booked a tour for ${savedBooking.date} at ${slot!.startTime}.`,
        type: NotificationType.BOOKING,
        data: { bookingId: savedBooking.id }
      });
    }

    return savedBooking;
  }


  async clientGetTourEventByUrl(url: string): Promise<TourEvent | null> {
    try {
      const tourEvent = await this.tourEventRepository
        .createQueryBuilder("tourEvent")
        .leftJoinAndSelect("tourEvent.availability", "availability")
        .leftJoinAndSelect("availability.slots", "slots")
        .leftJoinAndSelect("slots.bookings", "slotBookings")
        .leftJoinAndSelect("tourEvent.tourQuestions", "questions")
        .leftJoinAndSelect("tourEvent.school", "school")
        .where("tourEvent.url = :url", { url })
        .getOne();

      if (!tourEvent) return null;

      const interval = tourEvent.timeSlotInterval || 15;
      const today = new Date();
      const weekdayNames = [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday",
      ];


      for (const availability of tourEvent.availability ?? []) {
        const dbOriginalSlots = [...(availability.slots ?? [])];
        if (!availability.slots) availability.slots = [];

        const upcomingSlots: Array<{
          id?: number;
          availabilityId: number;
          date: string;
          startTime: string;
          bookings: any[];
          booked: boolean;
        }> = [];

        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          if (weekdayNames[date.getDay()] !== availability.day) continue;
          const dateString = date.toISOString().split("T")[0];

          let nextAvailableTimeMinutes: number | null = null;

          const generatedSlots = availability.generateSlots(dateString!, interval) ?? [];
          const dbSlotsForDate = dbOriginalSlots.filter((s) => s.date === dateString);

          for (const genSlot of generatedSlots) {
            const startParts = genSlot.startTime.split(":").map(Number);
            let startMinutes = startParts[0]! * 60 + startParts[1]!;

            // 🔹 CHANGED: Ensure slot starts after previous booking + duration + afterTour
            if (nextAvailableTimeMinutes !== null && startMinutes < nextAvailableTimeMinutes) {
              startMinutes = nextAvailableTimeMinutes;
            }

            const hh = Math.floor(startMinutes / 60).toString().padStart(2, "0");
            const mm = (startMinutes % 60).toString().padStart(2, "0")
            const newStartTime = `${hh}:${mm}:00`

            // 🔹 FIX: Match DB slot using final newStartTime
            const dbMatch = dbSlotsForDate.find((db) => db.startTime === newStartTime);

            // 🔹 NEW: Check if this slot is blocked due to beforeTour
            let beforeBlocked = false;
            if (tourEvent.beforeTour && dbOriginalSlots.length > 0) {
              for (const bookedSlot of dbOriginalSlots.filter(s => s.bookings?.length! > 0)) {
                const bookedStartParts = bookedSlot.startTime.split(":").map(Number);
                const bookedStartMinutes = bookedStartParts[0]! * 60 + bookedStartParts[1]!;

                // Slot end time
                const slotEndMinutes = startMinutes + (tourEvent.duration || 0);

                // If slot end encroaches into booked start - beforeTour
                if (slotEndMinutes > bookedStartMinutes - (tourEvent.beforeTour || 0) &&
                  startMinutes < bookedStartMinutes) {
                  beforeBlocked = true;
                  break;
                }
              }
            }

            const isBlocked = dbMatch?.bookings?.length! > 0 || beforeBlocked; // 🔹 CHANGED: include beforeTour

            upcomingSlots.push({
              id: dbMatch?.id,
              availabilityId: genSlot.availabilityId ?? availability.id,
              date: genSlot.date,
              startTime: newStartTime,
              bookings: dbMatch?.bookings ?? [],
              booked: isBlocked,
            });

            // 🔹 CHANGED: Update nextAvailableTimeMinutes for afterTour logic
            if (dbMatch?.bookings?.length! > 0) {
              const occupied = (tourEvent.duration || 0) + (tourEvent.afterTour || 0);
              nextAvailableTimeMinutes = startMinutes + occupied;
            } else {
              nextAvailableTimeMinutes = startMinutes + interval;
            }
          }
        }

        (availability as any).slots = upcomingSlots;
      }

      return tourEvent;
    } catch (error: any) {
      console.log(error);
      logger?.error?.(error, error);
      throw new Error("Failed to fetch tour event by URL");
    }
  }

  async getAllBookedTours(date?: string, schoolId?: number, isAdmission?: boolean): Promise<TourBooking[]> {
    try {
      const queryBuilder = this.bookingRepository
        .createQueryBuilder("booking")
        .leftJoinAndSelect("booking.slot", "slot")
        .leftJoinAndSelect("slot.availability", "availability")
        .leftJoinAndSelect("booking.tourEvent", "tourEvent");

      // Filter by schoolId if provided
      if (schoolId !== undefined) {
        queryBuilder.where("booking.schoolId = :schoolId", { schoolId });
      }

      if (date) {
        if (schoolId !== undefined) {
          queryBuilder.andWhere("booking.date = :date", { date });
        } else {
          queryBuilder.where("booking.date = :date", { date });
        }
      }

      // Filter by isAdmission if provided
      if (isAdmission !== undefined) {
        if (schoolId !== undefined || date) {
          queryBuilder.andWhere("booking.isAdmission = :isAdmission", { isAdmission });
        } else {
          queryBuilder.where("booking.isAdmission = :isAdmission", { isAdmission });
        }
      }

      // If isAdmission filter is true, join students with their user and classroom relations
      if (isAdmission === true) {
        queryBuilder
          .leftJoinAndSelect("booking.students", "students")
          .leftJoinAndSelect("students.user", "studentUser")
          .leftJoinAndSelect("students.currentClassroom", "studentClassroom");
      }

      const bookings = await queryBuilder
        .orderBy("booking.createdAt", "DESC")
        .getMany();

      return bookings;
    } catch (error: any) {
      logger?.error?.(error, error);
      throw new Error("Failed to fetch booked tours");
    }
  }

  async getBookingById(id: number, schoolId?: number): Promise<TourBooking | null> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: [
        "slot",
        "slot.availability",
        "tourEvent",
        "students",
        "students.user",
        "students.currentClassroom",
      ],
    });

    if (!booking) {
      return null;
    }

    if (schoolId !== undefined && booking.schoolId !== schoolId) {
      return null;
    }

    return booking;
  }

  async getAdmissionsBookingsCombined(
    schoolId: number,
    filters: {
      search?: string;
      startDate?: string;
      endDate?: string;
      pos?: number;
      delta?: number;
      /** When set, only rows matching this admission flag (tour `isAdmission` / form response `isAdmission`). */
      isAdmission?: boolean;
    }
  ): Promise<{ bookings: any[]; count: number; pagination: { pos: number; delta: number; count: number } }> {
    const { search, startDate, endDate, pos: posFilter, delta: deltaFilter, isAdmission: isAdmissionFilter } = filters;
    const usePagination = posFilter !== undefined || deltaFilter !== undefined;
    const pos = usePagination ? (posFilter ?? 0) : 0;
    const delta = usePagination ? (deltaFilter ?? 20) : Number.MAX_SAFE_INTEGER;
    const values: Array<string | number | Date | boolean> = [];
    const addValue = (value: string | number | Date | boolean): string => {
      values.push(value);
      return `$${values.length}`;
    };

    const searchPattern = search ? `%${search}%` : undefined;
    const hasDateFilter = Boolean(startDate && endDate);
    const start = hasDateFilter ? new Date(startDate as string) : undefined;
    const end = hasDateFilter ? new Date(endDate as string) : undefined;

    const tourWhere = [`tb."schoolId" = ${addValue(schoolId)}`, `tb."deletedAt" IS NULL`];
    if (hasDateFilter && start && end) {
      tourWhere.push(`tb."createdAt" BETWEEN ${addValue(start)} AND ${addValue(end)}`);
    }
    if (searchPattern) {
      const placeholder = addValue(searchPattern);
      tourWhere.push(`(
        tb."email" ILIKE ${placeholder}
        OR CAST(tb."status" AS text) ILIKE ${placeholder}
        OR te."title" ILIKE ${placeholder}
        OR tb."names" ILIKE ${placeholder}
        OR EXISTS (
          SELECT 1
          FROM student s
          INNER JOIN users su ON su.id = s."userId"
          WHERE s."tourBookingId" = tb.id
            AND s."deletedAt" IS NULL
            AND (
              su."firstName" ILIKE ${placeholder}
              OR su."lastName" ILIKE ${placeholder}
              OR trim(both ' ' FROM COALESCE(su."firstName", '') || ' ' || COALESCE(su."lastName", '')) ILIKE ${placeholder}
            )
        )
        OR EXISTS (
          SELECT 1
          FROM student s
          INNER JOIN parent_student ps ON ps."studentId" = s.id
          INNER JOIN parents p ON p.id = ps."parentId" AND p."deletedAt" IS NULL
          INNER JOIN users pu ON pu.id = p."userId"
          WHERE s."tourBookingId" = tb.id
            AND s."deletedAt" IS NULL
            AND (
              pu."firstName" ILIKE ${placeholder}
              OR pu."lastName" ILIKE ${placeholder}
              OR trim(both ' ' FROM COALESCE(pu."firstName", '') || ' ' || COALESCE(pu."lastName", '')) ILIKE ${placeholder}
            )
        )
      )`);
    }

    if (isAdmissionFilter === true) {
      tourWhere.push(`tb."isAdmission" = ${addValue(true)}`);
    } else if (isAdmissionFilter === false) {
      tourWhere.push(`(tb."isAdmission" IS NULL OR tb."isAdmission" = ${addValue(false)})`);
    }

    const formWhere = [`f."schoolId" = ${addValue(schoolId)}`];
    if (hasDateFilter && start && end) {
      formWhere.push(`fr."createdAt" BETWEEN ${addValue(start)} AND ${addValue(end)}`);
    }
    if (searchPattern) {
      const placeholder = addValue(searchPattern);
      formWhere.push(`(
        fr."email" ILIKE ${placeholder}
        OR CAST(fr."status" AS text) ILIKE ${placeholder}
        OR f."title" ILIKE ${placeholder}
        OR fr."names" ILIKE ${placeholder}
        OR EXISTS (
          SELECT 1
          FROM student s
          INNER JOIN users su ON su.id = s."userId"
          WHERE s."formResponseId" = fr.id
            AND s."deletedAt" IS NULL
            AND (
              su."firstName" ILIKE ${placeholder}
              OR su."lastName" ILIKE ${placeholder}
              OR trim(both ' ' FROM COALESCE(su."firstName", '') || ' ' || COALESCE(su."lastName", '')) ILIKE ${placeholder}
            )
        )
        OR EXISTS (
          SELECT 1
          FROM student s
          INNER JOIN parent_student ps ON ps."studentId" = s.id
          INNER JOIN parents p ON p.id = ps."parentId" AND p."deletedAt" IS NULL
          INNER JOIN users pu ON pu.id = p."userId"
          WHERE s."formResponseId" = fr.id
            AND s."deletedAt" IS NULL
            AND (
              pu."firstName" ILIKE ${placeholder}
              OR pu."lastName" ILIKE ${placeholder}
              OR trim(both ' ' FROM COALESCE(pu."firstName", '') || ' ' || COALESCE(pu."lastName", '')) ILIKE ${placeholder}
            )
        )
        OR EXISTS (
          SELECT 1
          FROM parents p
          INNER JOIN users pu ON pu.id = p."userId"
          WHERE fr."userId" IS NOT NULL
            AND p."userId" = fr."userId"
            AND p."deletedAt" IS NULL
            AND (fr."schoolId" IS NULL OR p."schoolId" = fr."schoolId")
            AND (
              pu."firstName" ILIKE ${placeholder}
              OR pu."lastName" ILIKE ${placeholder}
              OR trim(both ' ' FROM COALESCE(pu."firstName", '') || ' ' || COALESCE(pu."lastName", '')) ILIKE ${placeholder}
            )
        )
      )`);
    }

    if (isAdmissionFilter === true) {
      formWhere.push(`fr."isAdmission" = ${addValue(true)}`);
    } else     if (isAdmissionFilter === false) {
      formWhere.push(`(fr."isAdmission" IS NULL OR fr."isAdmission" = ${addValue(false)})`);
    }

    const tourParentsSql = `
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', x.id,
              'firstName', x."firstName",
              'lastName', x."lastName",
              'fullName', x."fullName"
            )
            ORDER BY x."fullName"
          )
          FROM (
            SELECT DISTINCT
              p.id AS id,
              NULLIF(trim(both ' ' FROM COALESCE(u."firstName", '')), '') AS "firstName",
              NULLIF(trim(both ' ' FROM COALESCE(u."lastName", '')), '') AS "lastName",
              trim(both ' ' FROM COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) AS "fullName"
            FROM student s
            INNER JOIN parent_student ps ON ps."studentId" = s.id
            INNER JOIN parents p ON p.id = ps."parentId" AND p."deletedAt" IS NULL
            INNER JOIN users u ON u.id = p."userId"
            WHERE s."tourBookingId" = tb.id
              AND s."deletedAt" IS NULL
              AND length(trim(both ' ' FROM COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", ''))) > 0
          ) x
        ),
        (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', NULL,
                'firstName', NULL,
                'lastName', NULL,
                'fullName', trim(both ' ' FROM n.name)
              )
              ORDER BY trim(both ' ' FROM n.name)
            ),
            '[]'::jsonb
          )
          FROM unnest(string_to_array(tb."names", ',')) AS n(name)
          WHERE length(trim(both ' ' FROM n.name)) > 0
        )
      )`;

    const tourStudentsSql = `
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', x.id,
              'firstName', x."firstName",
              'lastName', x."lastName",
              'fullName', x."fullName"
            )
            ORDER BY x."fullName"
          )
          FROM (
            SELECT DISTINCT
              s.id AS id,
              NULLIF(trim(both ' ' FROM COALESCE(u."firstName", '')), '') AS "firstName",
              NULLIF(trim(both ' ' FROM COALESCE(u."lastName", '')), '') AS "lastName",
              trim(both ' ' FROM COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) AS "fullName"
            FROM student s
            INNER JOIN users u ON u.id = s."userId"
            WHERE s."tourBookingId" = tb.id
              AND s."deletedAt" IS NULL
              AND length(trim(both ' ' FROM COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", ''))) > 0
          ) x
        ),
        '[]'::jsonb
      )`;

    const formParentsSql = `
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', x.id,
              'firstName', x."firstName",
              'lastName', x."lastName",
              'fullName', x."fullName"
            )
            ORDER BY x."fullName"
          )
          FROM (
            SELECT DISTINCT
              p.id AS id,
              NULLIF(trim(both ' ' FROM COALESCE(u."firstName", '')), '') AS "firstName",
              NULLIF(trim(both ' ' FROM COALESCE(u."lastName", '')), '') AS "lastName",
              trim(both ' ' FROM COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) AS "fullName"
            FROM student s
            INNER JOIN parent_student ps ON ps."studentId" = s.id
            INNER JOIN parents p ON p.id = ps."parentId" AND p."deletedAt" IS NULL
            INNER JOIN users u ON u.id = p."userId"
            WHERE s."formResponseId" = fr.id
              AND s."deletedAt" IS NULL
              AND length(trim(both ' ' FROM COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", ''))) > 0
            UNION
            SELECT DISTINCT
              p.id AS id,
              NULLIF(trim(both ' ' FROM COALESCE(u."firstName", '')), '') AS "firstName",
              NULLIF(trim(both ' ' FROM COALESCE(u."lastName", '')), '') AS "lastName",
              trim(both ' ' FROM COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) AS "fullName"
            FROM parents p
            INNER JOIN users u ON u.id = p."userId"
            WHERE fr."userId" IS NOT NULL
              AND p."userId" = fr."userId"
              AND p."deletedAt" IS NULL
              AND (fr."schoolId" IS NULL OR p."schoolId" = fr."schoolId")
              AND length(trim(both ' ' FROM COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", ''))) > 0
          ) x
        ),
        (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', NULL,
                'firstName', NULL,
                'lastName', NULL,
                'fullName', trim(both ' ' FROM n.name)
              )
              ORDER BY trim(both ' ' FROM n.name)
            ),
            '[]'::jsonb
          )
          FROM unnest(string_to_array(fr."names", ',')) AS n(name)
          WHERE length(trim(both ' ' FROM n.name)) > 0
        )
      )`;

    const formStudentsSql = `
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', x.id,
              'firstName', x."firstName",
              'lastName', x."lastName",
              'fullName', x."fullName"
            )
            ORDER BY x."fullName"
          )
          FROM (
            SELECT DISTINCT
              s.id AS id,
              NULLIF(trim(both ' ' FROM COALESCE(u."firstName", '')), '') AS "firstName",
              NULLIF(trim(both ' ' FROM COALESCE(u."lastName", '')), '') AS "lastName",
              trim(both ' ' FROM COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) AS "fullName"
            FROM student s
            INNER JOIN users u ON u.id = s."userId"
            WHERE s."formResponseId" = fr.id
              AND s."deletedAt" IS NULL
              AND length(trim(both ' ' FROM COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", ''))) > 0
          ) x
        ),
        '[]'::jsonb
      )`;

    const unionQuery = `
      SELECT
        tb."id"::int AS "id",
        'tour_booking' AS "type",
        CASE WHEN tb."names" IS NULL OR tb."names" = '' THEN NULL ELSE string_to_array(tb."names", ',') END AS "names",
        tb."email" AS "email",
        tb."note" AS "note",
        CAST(tb."referralSource" AS text) AS "referralSource",
        CASE WHEN tb."guests" IS NULL OR tb."guests" = '' THEN NULL ELSE string_to_array(tb."guests", ',') END AS "guests",
        tb."date" AS "date",
        CAST(tb."status" AS text) AS "status",
        tb."accepted" AS "accepted",
        tb."complete" AS "complete",
        tb."isAdmission" AS "isAdmission",
        tb."createdAt" AS "createdAt",
        tb."tourEventId"::int AS "tourEventId",
        NULL::int AS "formId",
        CASE
          WHEN ts.id IS NULL THEN NULL::jsonb
          ELSE jsonb_build_object(
            'id', ts.id,
            'date', ts."date",
            'startTime', ts."startTime",
            'availabilityId', ts."availabilityId"
          )
        END AS "slot",
        CASE
          WHEN ta.id IS NULL THEN NULL::jsonb
          ELSE jsonb_build_object(
            'id', ta.id,
            'tourEventId', ta."tourEventId",
            'day', CAST(ta."day" AS text),
            'startHour', ta."startHour",
            'startMinute', ta."startMinute",
            'startMeridiem', CAST(ta."startMeridiem" AS text),
            'endHour', ta."endHour",
            'endMinute', ta."endMinute",
            'endMeridiem', CAST(ta."endMeridiem" AS text),
            'startTime', ta."startTime",
            'endTime', ta."endTime",
            'createdAt', ta."createdAt",
            'updatedAt', ta."updatedAt"
          )
        END AS "availability",
        ${tourParentsSql} AS "parents",
        ${tourStudentsSql} AS "students"
      FROM "tour_bookings" tb
      LEFT JOIN "tour_events" te ON te."id" = tb."tourEventId"
      LEFT JOIN "tour_slots" ts ON ts."id" = tb."slotId"
      LEFT JOIN "tour_availabilities" ta ON ta."id" = ts."availabilityId"
      WHERE ${tourWhere.join(" AND ")}

      UNION ALL

      SELECT
        fr."id"::int AS "id",
        'form_response' AS "type",
        CASE WHEN fr."names" IS NULL OR fr."names" = '' THEN NULL ELSE string_to_array(fr."names", ',') END AS "names",
        fr."email" AS "email",
        NULL::text AS "note",
        CAST(fr."referralSource" AS text) AS "referralSource",
        CASE WHEN fr."additionalContacts" IS NULL OR fr."additionalContacts" = '' THEN NULL ELSE string_to_array(fr."additionalContacts", ',') END AS "guests",
        COALESCE(fr."submittedAt"::date, fr."createdAt"::date) AS "date",
        CAST(fr."status" AS text) AS "status",
        NULL::boolean AS "accepted",
        NULL::boolean AS "complete",
        fr."isAdmission" AS "isAdmission",
        fr."createdAt" AS "createdAt",
        NULL::int AS "tourEventId",
        fr."formId"::int AS "formId",
        NULL::jsonb AS "slot",
        NULL::jsonb AS "availability",
        ${formParentsSql} AS "parents",
        ${formStudentsSql} AS "students"
      FROM "formResponses" fr
      LEFT JOIN "forms" f ON f."id" = fr."formId"
      WHERE ${formWhere.join(" AND ")}
    `;

    const countQuery = `SELECT COUNT(*)::int AS "count" FROM (${unionQuery}) AS admissions_bookings_union`;
    const countResult = await AppDataSource.query(countQuery, values);
    const count = Number(countResult?.[0]?.count ?? 0);

    const dataQuery = `
      SELECT * FROM (${unionQuery}) AS admissions_bookings_union
      ORDER BY "createdAt" DESC
      ${usePagination ? `LIMIT ${addValue(delta)} OFFSET ${addValue(pos)}` : ""}
    `;
    const bookings = await AppDataSource.query(dataQuery, values);

    return {
      bookings,
      count,
      pagination: {
        pos,
        delta: usePagination ? delta : count,
        count,
      },
    };
  }

  async softDeleteBooking(id: number, schoolId?: number): Promise<boolean> {
    try {
      const booking = await this.bookingRepository.findOne({
        where: { id },
        relations: ["slot", "tourEvent", "tourEvent.school"]
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Verify schoolId matches if provided
      if (schoolId !== undefined && booking.schoolId !== schoolId) {
        throw new Error("You do not have permission to delete this booking");
      }

      // Update status to DELETED
      await this.bookingRepository.update(id, { status: BookingStatus.DELETED });

      // Perform soft delete (sets deletedAt)
      const result = await this.bookingRepository.softDelete(id);

      if (result.affected && result.affected > 0) {
        // Send cancellation email
        try {
          const parentName = this.getPrimaryProspectName(booking.names, "Prospect");
          const schoolName = this.getSchoolNameFromEvent(booking.tourEvent, "the School");

          await emailService.sendTourCancelledEmail({
            email: booking.email,
            parentName,
            schoolName,
            tourDate: booking.date,
            tourTime: booking.slot?.startTime || "TBD",
          });
        } catch (emailError) {
          logger?.error?.(`Failed to send tour cancellation email: ${emailError}`);
        }

        // Notify admins in-app
        if (booking.schoolId) {
          await notificationService.notifyAdmins({
            schoolId: booking.schoolId,
            title: "Tour Booking Cancelled",
            message: `The tour booking for ${this.getPrimaryProspectName(booking.names, "a prospect")} on ${booking.date} has been cancelled.`,
            type: NotificationType.WARNING,
            data: { bookingId: id }
          });
        }
      }

      return result.affected !== undefined && result.affected > 0;
    } catch (error: any) {
      logger?.error?.(error, error);
      throw new Error(error.message || "Failed to delete booking");
    }
  }

  async updateBookingStatus(
    id: number,
    updates: {
      accepted?: boolean;
      complete?: boolean;
      status?: string;
      reschedule?: { slotId: number; date?: string; startTime?: string }
    },
    schoolId?: number
  ): Promise<BookingStatusUpdateResult> {
    try {
      const booking = await this.bookingRepository.findOne({
        where: { id },
        relations: ["slot", "slot.availability", "slot.availability.tourEvent", "slot.availability.tourEvent.school"]
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Verify schoolId matches if provided
      if (schoolId !== undefined && booking.schoolId !== schoolId) {
        throw new Error("You do not have permission to update this booking");
      }

      const requestedStatus = this.parseBookingStatusUpdate(updates.status);
      if (requestedStatus === BookingStatus.WITHDRAW) {
        return this.processWithdrawStatusUpdate(booking, schoolId);
      }

      if (requestedStatus !== undefined) {
        booking.status = requestedStatus;
      }

      // Update accepted and complete status
      if (updates.accepted !== undefined) {
        booking.accepted = updates.accepted;
      }

      if (updates.complete !== undefined) {
        booking.complete = updates.complete;
      }

      // Handle reschedule updates
      if (updates.reschedule) {
        const { slotId, date, startTime } = updates.reschedule;

        // Verify that the slotId matches the booking's current slot
        if (booking.slotId !== slotId) {
          throw new Error("Slot ID does not match the booking's current slot");
        }

        // Find the slot by ID
        const slot = await this.slotRepository.findOne({
          where: { id: slotId },
          relations: ["availability", "availability.tourEvent", "bookings"]
        });

        if (!slot) {
          throw new Error("Slot not found");
        }

        if (!slot.availability) {
          throw new Error("Slot availability not found");
        }

        const availability = slot.availability;
        const tourEvent = availability.tourEvent;

        if (!tourEvent) {
          throw new Error("Tour event not found");
        }

        // Determine new date and startTime values (use provided or keep existing)
        const newDate = date !== undefined ? date : slot.date;
        const newStartTime = startTime !== undefined ? startTime : slot.startTime;

        // Check if there are any changes
        if (slot.date !== newDate || slot.startTime !== newStartTime) {
          // Check if another slot already exists with the new date/time combination
          const conflictingSlot = await this.slotRepository.findOne({
            where: {
              availabilityId: availability.id,
              date: newDate,
              startTime: newStartTime,
            },
            relations: ["bookings"],
          });

          // If another slot exists with the same date/time (excluding current slot)
          if (conflictingSlot && conflictingSlot.id !== slotId) {
            const otherBookings = conflictingSlot.bookings?.filter(b => b.id !== id) || [];
            if (otherBookings.length > 0) {
              throw new Error("Slot is already booked by another booking");
            }
            // If the conflicting slot is available, use it (move booking to it)
            booking.slotId = conflictingSlot.id;
            booking.slot = conflictingSlot;
            booking.date = newDate;
            booking.hasSentReminder = false;
            // Update status to RESCHEDULED when rescheduling
            booking.status = BookingStatus.RESCHEDULED;
          } else {
            // No conflict exists, update the existing slot's date and/or startTime directly
            slot.date = newDate;
            slot.startTime = newStartTime;
            await this.slotRepository.save(slot);

            // Update booking's date to match
            booking.date = newDate;
            booking.hasSentReminder = false;
            // Update status to RESCHEDULED when rescheduling
            booking.status = BookingStatus.RESCHEDULED;
          }
        } else {
          // No changes to date/time, just ensure booking date matches slot date
          booking.date = newDate;
        }
      }

      const updatedBooking = await this.bookingRepository.save(booking);

      // Load the updated booking with relations for return
      const bookingWithRelations = await this.bookingRepository.findOne({
        where: { id: updatedBooking.id },
        relations: ["slot", "slot.availability", "tourEvent"]
      });

      if (!bookingWithRelations) {
        throw new Error("Failed to retrieve updated booking");
      }

      // Send emails based on updates
      if (updates.complete === true) {
        try {
          const parentName = this.getPrimaryProspectName(bookingWithRelations.names, "Prospect");
          const schoolName = this.getSchoolNameFromEvent(bookingWithRelations.tourEvent, "the School");

          await emailService.sendTourCompletedFollowUpEmail({
            email: bookingWithRelations.email,
            parentName,
            schoolName,
            phoneNumber: bookingWithRelations.tourEvent?.school?.phoneNumber || "the Admissions Office",
          });
        } catch (emailError) {
          logger?.error?.(`Failed to send tour completion email: ${emailError}`);
        }
      }

      if (updates.reschedule) {
        try {
          const parentName = this.getPrimaryProspectName(bookingWithRelations.names, "Prospect");
          const schoolName = this.getSchoolNameFromEvent(bookingWithRelations.tourEvent, "the School");

          await emailService.sendTourRescheduledEmail({
            email: bookingWithRelations.email,
            parentName,
            schoolName,
            oldDate: booking.date, // Previous date
            oldTime: booking.slot?.startTime || "TBD",
            newDate: bookingWithRelations.date,
            newTime: bookingWithRelations.slot?.startTime || "TBD",
            location: this.getTourLocationFromEvent(bookingWithRelations.tourEvent, "School Campus"),
          });
        } catch (emailError) {
          logger?.error?.(`Failed to send tour reschedule email: ${emailError}`);
        }

        // Notify admins in-app
        if (booking.schoolId) {
          await notificationService.notifyAdmins({
            schoolId: booking.schoolId,
            title: "Tour Rescheduled",
            message: `The tour for ${this.getPrimaryProspectName(bookingWithRelations.names, "a prospect")} has been rescheduled to ${bookingWithRelations.date} at ${bookingWithRelations.slot?.startTime}.`,
            type: NotificationType.INFO,
            data: { bookingId: id }
          });
        }
      }

      return { booking: bookingWithRelations };
    } catch (error: any) {
      logger?.error?.(error, error);
      throw new Error(error.message || "Failed to update booking status");
    }
  }

  // Keep for backward compatibility
  async updateBookingAcceptedStatus(id: number, accepted: boolean): Promise<TourBooking> {
    const result = await this.updateBookingStatus(id, { accepted });
    return result.booking;
  }

  private parseBookingStatusUpdate(status?: string): BookingStatus | undefined {
    if (!status) return undefined;
    const normalized = status.trim().toLowerCase();
    if (normalized === "withdraw" || normalized === "withdrawn") {
      return BookingStatus.WITHDRAW;
    }
    const match = Object.values(BookingStatus).find((value) => value === normalized);
    return match;
  }

  private async processWithdrawStatusUpdate(
    booking: TourBooking,
    schoolId?: number,
  ): Promise<BookingStatusUpdateResult> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const bookingRepo = queryRunner.manager.getRepository(TourBooking);
      const invoiceRepo = queryRunner.manager.getRepository(Invoice);
      const studentRepo = queryRunner.manager.getRepository(Student);
      const parentRepo = queryRunner.manager.getRepository(Parent);
      const userRepo = queryRunner.manager.getRepository(User);

      const managedBooking = await bookingRepo.findOne({
        where: { id: booking.id },
        relations: ["slot", "slot.availability", "tourEvent"],
      });
      if (!managedBooking) {
        throw new Error("Booking not found");
      }

      if (schoolId !== undefined && managedBooking.schoolId !== schoolId) {
        throw new Error("You do not have permission to update this booking");
      }

      const invoice = await invoiceRepo.findOne({
        where: {
          tourBookingId: managedBooking.id,
          schoolId: managedBooking.schoolId,
          source: InvoiceSource.ADMISSION,
        },
        relations: ["students", "parents"],
        order: { id: "DESC" },
      });

      if (invoice && Number(invoice.amountPaid || 0) > 0) {
        managedBooking.status = BookingStatus.ACCEPTED;
        await bookingRepo.save(managedBooking);
        await queryRunner.commitTransaction();
        return {
          booking: managedBooking,
          message: "offer has already been accepted",
        };
      }

      const candidateStudentIds = new Set<number>();
      const candidateParentIds = new Set<number>();

      if (invoice?.students?.length) {
        for (const student of invoice.students) candidateStudentIds.add(student.id);
      }
      if (invoice?.parents?.length) {
        for (const parent of invoice.parents) candidateParentIds.add(parent.id);
      }

      const bookingStudents = await studentRepo.find({
        where: { tourBookingId: managedBooking.id },
        relations: ["parents"],
      });
      for (const student of bookingStudents) {
        candidateStudentIds.add(student.id);
        for (const parent of student.parents || []) {
          candidateParentIds.add(parent.id);
        }
      }

      if (invoice) {
        await invoiceRepo.remove(invoice);
      }

      const studentsForCleanup = candidateStudentIds.size
        ? await studentRepo
            .createQueryBuilder("student")
            .leftJoinAndSelect("student.parents", "parents")
            .where("student.id IN (:...ids)", { ids: Array.from(candidateStudentIds) })
            .getMany()
        : [];

      for (const student of studentsForCleanup) {
        const otherInvoiceLinks = await queryRunner.manager
          .createQueryBuilder()
          .from("invoice_student", "is")
          .where("is.studentId = :studentId", { studentId: student.id })
          .getCount();

        const otherPrimaryInvoices = await invoiceRepo
          .createQueryBuilder("invoice")
          .where("invoice.studentId = :studentId", { studentId: student.id })
          .getCount();

        const hasOtherAssociations =
          otherInvoiceLinks > 0 ||
          otherPrimaryInvoices > 0 ||
          (student.formResponseId != null) ||
          (student.tourBookingId != null && student.tourBookingId !== managedBooking.id);

        if (hasOtherAssociations || student.status !== StudentStatus.INACTIVE) {
          if (student.tourBookingId === managedBooking.id) {
            student.tourBookingId = null as any;
          }
          await studentRepo.save(student);
          continue;
        }

        await userRepo.delete(student.userId);
      }

      const parentsForCleanup = candidateParentIds.size
        ? await parentRepo
            .createQueryBuilder("parent")
            .where("parent.id IN (:...ids)", { ids: Array.from(candidateParentIds) })
            .getMany()
        : [];

      for (const parent of parentsForCleanup) {
        const parentStudentLinks = await queryRunner.manager
          .createQueryBuilder()
          .from("parent_student", "ps")
          .where("ps.parentId = :parentId", { parentId: parent.id })
          .getCount();

        const parentInvoiceLinks = await queryRunner.manager
          .createQueryBuilder()
          .from("invoice_parent", "ip")
          .where("ip.parentId = :parentId", { parentId: parent.id })
          .getCount();

        if (parentStudentLinks > 0 || parentInvoiceLinks > 0 || parent.status !== ParentStatus.INACTIVE) {
          continue;
        }

        await userRepo.delete(parent.userId);
      }

      managedBooking.status = BookingStatus.WITHDRAW;
      await bookingRepo.save(managedBooking);
      await queryRunner.commitTransaction();

      return {
        booking: managedBooking,
        message: "Booking withdrawn successfully",
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async sendOffer(data: {
    bookedTourId?: number;
    formResponseId?: number;
    parent: {
      firstName: string;
      lastName: string;
    };
    students: Array<{
      firstName: string;
      lastName: string;
      classroomId: number;
      dateOfBirth: string;
    }>;
    items: Array<{
      description: string;
      quantity: number;
      rate: number;
      tax?: number;
    }>;
    notes?: string;
    email: {
      receipient: string;
      subject: string;
      body: string;
      attachment?: string[];
    };
    schoolId: number;
    /** When set, used for invoice PDF, persisted on invoice, and admission-offer email payment block (must belong to school). */
    bankAccountId?: number;
    /** Same as create invoice; stored on the admission invoice. */
    paymentMethod?: PaymentMethod;
  }): Promise<{ success: boolean; message: string; invoices?: any[] }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fromTour = data.bookedTourId != null;
      const fromForm = data.formResponseId != null;
      if (fromTour === fromForm) {
        throw new Error("Provide exactly one of bookedTourId or formResponseId");
      }

      let booking: TourBooking | null = null;
      let formResponse: FormResponse | null = null;

      if (fromTour) {
        booking = await queryRunner.manager.findOne(TourBooking, {
          where: { id: data.bookedTourId },
          relations: ["tourEvent", "school"],
        });
        if (!booking) {
          throw new Error("Tour booking not found");
        }
        if (booking.schoolId !== data.schoolId) {
          throw new Error("Tour booking does not belong to your school");
        }
        if (!booking.email) {
          throw new Error("Tour booking email is required");
        }
      } else {
        formResponse = await queryRunner.manager.findOne(FormResponse, {
          where: { id: data.formResponseId },
          relations: ["form", "form.school"],
        });
        if (!formResponse?.form) {
          throw new Error("Form response not found");
        }
        if (formResponse.form.schoolId !== data.schoolId) {
          throw new Error("Form response does not belong to your school");
        }
        if (!formResponse.email?.trim()) {
          throw new Error("Form response email is required");
        }
        if (formResponse.schoolId == null) {
          formResponse.schoolId = formResponse.form.schoolId;
        }
      }

      const prospectEmailForLookup = (fromTour ? booking!.email! : formResponse!.email!).trim().toLowerCase();
      const schoolForBranding = fromTour ? booking!.school : formResponse!.form.school;

      // Import required services
      const { authService } = await import("../../auth/services/auth.service");
      const { profileService } = await import("../../user/services/profile.service");
      const { studentService } = await import("../../student/services/student.service");
      const { parentService } = await import("../../parent/services/parent.service");
      const { UserRole } = await import("../../shared/entities/EntityEnums");
      const { User } = await import("../../shared/entities/User");
      const { Classroom } = await import("../../shared/entities/Classroom");

      // Validate classrooms exist and belong to school
      for (const studentData of data.students) {
        const classroom = await queryRunner.manager.findOne(Classroom, {
          where: { id: studentData.classroomId, schoolId: data.schoolId }
        });
        if (!classroom) {
          throw new Error(`Classroom ${studentData.classroomId} not found or does not belong to your school`);
        }
      }

      // Create parent user
      let existingParentUser = await queryRunner.manager.findOne(User, {
        where: { email: prospectEmailForLookup, admin: { schoolId: data.schoolId } }
      });

      let parentUserId: number;
      let parentEntity: Parent | null = null;

      if (existingParentUser) {
        parentUserId = existingParentUser.id;
      } else {
        // Create new parent user
        const parentResult = await authService.registerParentViaAdmin({
          firstName: data.parent.firstName,
          lastName: data.parent.lastName,
          email: fromTour ? booking!.email! : formResponse!.email!,
          phone: undefined,
          address: undefined,
          suffix: undefined,
          tempPassword: true,
          role: UserRole.PARENT,
          schoolId: data.schoolId
        }, { manager: queryRunner.manager });

        if (!parentResult.user) {
          throw new Error("Could not create parent as a user");
        }
        parentUserId = parentResult.user.id;
      }

      // Ensure a parent entity exists for the resolved user (existing or newly created).
      parentEntity = await parentService.findParentByUserId(parentUserId);
      if (!parentEntity) {
        const { ParentStatus } = await import("../../shared/entities/EntityEnums");
        parentEntity = await parentService.createParent({
          userId: parentUserId,
          relationship: RelationshipType.GUARDIAN, // Default relationship
          schoolId: data.schoolId,
          status: ParentStatus.INACTIVE // Set to INACTIVE when created via sendOffer
        }, { manager: queryRunner.manager });
      }

      if (!parentEntity) {
        throw new Error("Failed to create or retrieve parent entity");
      }

      // Pre-calculate admission numbers to avoid duplicates when creating multiple students
      // Get the current count of students in the school (using transaction manager to see committed records)
      const existingStudents = await queryRunner.manager.find(Student, {
        where: { schoolId: data.schoolId }
      });
      const baseStudentCount = existingStudents.length;

      // Import admission number generator
      const { generateAdmissionNumber } = await import("../../shared/services/utils");
      const { StudentRepository } = await import("../../core/StudentRepository");
      const studentRepository = new StudentRepository();
      const { classroomService } = await import("../../classroom/services/classroom.service");

      // Create students
      const createdStudents: Student[] = [];
      for (let index = 0; index < data.students.length; index++) {
        const studentData = data.students[index]!;
        if (studentData.classroomId) {
          const capacityCheck = await classroomService.ensureClassroomHasCapacityForAssignment(
            studentData.classroomId,
            { manager: queryRunner.manager }
          );
          if (!capacityCheck.success) {
            throw new Error(capacityCheck.message);
          }
        }
        // Create student user
        const studentUserResult = await profileService.createUser({
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          dateOfBirth: studentData.dateOfBirth,
          role: UserRole.STUDENT,
          schoolId: data.schoolId,
        }, { manager: queryRunner.manager });

        if (!studentUserResult.id) {
          throw new Error(`Failed to create student user for ${studentData.firstName} ${studentData.lastName}`);
        }

        // Calculate admission number: baseCount + 1 + index
        // Example: If baseCount is 8 and we're creating 2 students:
        // - First student (index 0): 8 + 1 + 0 = 9
        // - Second student (index 1): 8 + 1 + 1 = 10
        const admissionNumberBase = baseStudentCount + 1 + index;
        const admissionNumber = await generateAdmissionNumber(
          data.schoolId,
          studentRepository,
          admissionNumberBase
        );

        // Create student entity with pre-calculated admission number
        const { StudentStatus } = await import("../../shared/entities/EntityEnums");
        const studentEntity = await studentService.createStudent({
          userId: studentUserResult.id,
          schoolId: data.schoolId,
          classroomId: studentData.classroomId,
          enrolmentDate: new Date(),
          admissionNumber: admissionNumber,
          status: StudentStatus.INACTIVE,
          tourBookingId: fromTour ? booking!.id : undefined,
          formResponseId: fromForm ? formResponse!.id : undefined,
        }, { manager: queryRunner.manager });

        // Link student to parent
        await parentService.attachParentToStudent(studentEntity.id, parentEntity.id, { manager: queryRunner.manager });

        // Reload student with relations
        const studentWithRelations = await queryRunner.manager.findOne(Student, {
          where: { id: studentEntity.id },
          relations: ["user", "currentClassroom", "parents"]
        });

        if (studentWithRelations) {
          createdStudents.push(studentWithRelations);
        } else {
          createdStudents.push(studentEntity);
        }
      }

      // Generate invoice number
      const invoiceNumber = await invoiceService.generateInvoiceNumber();

      // Calculate invoice totals from items
      const subtotal = data.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.rate;
        return sum + itemTotal;
      }, 0);

      const tax = data.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.rate;
        const itemTaxPercentage = item.tax || 0;
        const itemTaxAmount = itemTotal * (itemTaxPercentage / 100);
        return sum + itemTaxAmount;
      }, 0);

      const discount = 0;
      const total = subtotal + tax - discount;
      const amountPaid = 0;
      const balance = total - amountPaid;

      // Get classroomId from first student (since all students belong to same parent, use first student's classroom)
      const firstStudent = createdStudents[0]!;
      const classroomId = firstStudent.currentClassroom?.id;
      if (!classroomId) {
        throw new Error(`Student ${firstStudent.id} does not have a classroom assigned`);
      }

      // Create single invoice for all students (linked to first student)
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 30); // Default 30 days from today

      const invoiceData: Partial<Invoice> = {
        invoiceNumber,
        issueDate: today,
        dueDate: dueDate,
        subTotal: subtotal,
        discount,
        tax,
        amountPaid,
        balance,
        total,
        notes: data.notes,
        billingPeriod: undefined,
        paymentMethod: data.paymentMethod,
        bankAccountId: data.bankAccountId,
        studentId: firstStudent.id, // Link to first student
        classroomId: classroomId,
        schoolId: data.schoolId,
        tourBookingId: fromTour ? booking!.id : undefined,
        formResponseId: fromForm ? formResponse!.id : undefined,
        source: InvoiceSource.ADMISSION,
      };

      const invoice = queryRunner.manager.create(Invoice, invoiceData);
      const savedInvoice = await queryRunner.manager.save(invoice);

      // Create items for the invoice
      const itemsData = data.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        tax: item.tax || 0,
        schoolId: data.schoolId,
        invoiceId: savedInvoice.id,
      }));

      const { itemService } = await import("../../item/services/item.service");
      await itemService.createItems(itemsData, { manager: queryRunner.manager });

      // Link invoice to parent and students
      const invoiceWithRelations = await queryRunner.manager.findOne(Invoice, {
        where: { id: savedInvoice.id },
        relations: ["parents", "students"]
      });

      if (invoiceWithRelations) {
        invoiceWithRelations.parents = [parentEntity];
        invoiceWithRelations.students = createdStudents;
        await queryRunner.manager.save(invoiceWithRelations);
      }

      // Reload invoice with items for email
      const invoiceWithItems = await queryRunner.manager.findOne(Invoice, {
        where: { id: savedInvoice.id },
        relations: ["items"]
      });

      const createdInvoice = invoiceWithItems || savedInvoice;

      let admissionOfferData = await queryRunner.manager.findOne(AdmissionOfferData, {
        where: fromTour ? { tourBookingId: booking!.id } : { formResponseId: formResponse!.id },
      });

      if (admissionOfferData) {
        admissionOfferData.notes = data.notes;
        admissionOfferData.emailRecipient = data.email.receipient;
        admissionOfferData.emailSubject = data.email.subject;
        admissionOfferData.emailBody = data.email.body;
        admissionOfferData.emailAttachment = data.email.attachment;
        if (fromTour) {
          admissionOfferData.tourBookingId = booking!.id;
          admissionOfferData.formResponseId = null;
        } else {
          admissionOfferData.formResponseId = formResponse!.id;
          admissionOfferData.tourBookingId = null;
        }
      } else {
        admissionOfferData = queryRunner.manager.create(AdmissionOfferData, {
          notes: data.notes,
          emailRecipient: data.email.receipient,
          emailSubject: data.email.subject,
          emailBody: data.email.body,
          emailAttachment: data.email.attachment,
          ...(fromTour
            ? { tourBookingId: booking!.id, formResponseId: null }
            : { formResponseId: formResponse!.id, tourBookingId: null }),
        });
      }

      await queryRunner.manager.save(admissionOfferData);

      if (fromTour) {
        booking!.status = BookingStatus.OFFER_SENT;
        booking!.isAdmission = true;
        await queryRunner.manager.save(booking!);
      } else {
        formResponse!.status = FormResponseStatus.OFFER_SENT;
        formResponse!.isAdmission = true;
        await queryRunner.manager.save(formResponse!);
      }

      await notificationService.notifyAdmins({
        schoolId: data.schoolId,
        title: "Admission Offer Sent",
        message: `An admission offer has been sent to ${data.parent.firstName} ${data.parent.lastName} for ${data.students.length} student(s).`,
        type: NotificationType.SUCCESS,
        data: fromTour ? { bookingId: booking!.id } : { formResponseId: formResponse!.id },
      });

      await queryRunner.commitTransaction();

      // Send email with invoice data
      const studentNames = createdStudents.map(s => s.user ? `${s.user.firstName || ""} ${s.user.lastName || ""}`.trim() : "Student").join(", ");
      const childNamesOverride = data.students
        .map((student) => `${student.firstName || ""} ${student.lastName || ""}`.trim())
        .filter((name) => name.length > 0);
      const schoolName = schoolForBranding?.schoolName || "School";
      const recipientName = parentEntity?.user
        ? `${parentEntity.user.firstName || ""} ${parentEntity.user.lastName || ""}`.trim() || "there"
        : "there";

      // Generate PDFs and request attachments
      const finalAttachments: {
        filename: string;
        content: Buffer | string;
        contentType: string;
      }[] = [];

      const extraRequestAttachments = await this.resolveRequestAttachments(data.email.attachment);
      finalAttachments.push(...extraRequestAttachments);

      // Generate Invoice PDF (bank from bankAccountId or school default); reuse result for email payment block
      let invoicePdfResult: Awaited<ReturnType<typeof invoiceService.generateInvoicePDF>> | undefined;
      try {
        invoicePdfResult = await invoiceService.generateInvoicePDF(
          createdInvoice.id,
          data.schoolId,
          data.bankAccountId,
          data.email.receipient || schoolForBranding?.email,
          childNamesOverride,
        );
        if (invoicePdfResult.success && invoicePdfResult.pdf) {
          finalAttachments.push({
            filename: `Invoice_${createdInvoice.invoiceNumber}.pdf`,
            content: invoicePdfResult.pdf,
            contentType: "application/pdf",
          });
          logger.info(`Invoice PDF generated and attached for invoice ${createdInvoice.id}`);
        } else {
          logger.error(`Failed to generate invoice PDF for invoice ${createdInvoice.id}: ${invoicePdfResult.message}`);
        }
      } catch (pdfError) {
        logger.error(`Failed to generate invoice PDF in sendOffer:`, pdfError);
      }

      // Generate Admission Acceptance Letter PDF for each student
      for (const student of createdStudents) {
        try {
          const letterBuffer = await pdfService.generateAdmissionAcceptanceLetterPDF({
            school: schoolForBranding,
            studentName: `${student.user?.firstName || ""} ${student.user?.lastName || ""}`.trim(),
            parentName: recipientName,
            className: student.currentClassroom?.classroomName || "the Program",
            dueDate: createdInvoice.dueDate,
          });

          finalAttachments.push({
            filename: `Admission_Acceptance_${(student.user?.firstName || "Student")}_${(student.user?.lastName || "")}.pdf`.replace(/\s+/g, "_"),
            content: letterBuffer,
            contentType: "application/pdf",
          });
          logger.info(`Admission Acceptance Letter generated and attached for student ${student.id}`);
        } catch (letterError) {
          logger.error(`Failed to generate admission letter for student ${student.id}:`, letterError);
        }
      }

      const invoiceItems = createdInvoice.items?.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: Number(item.rate),
        tax: item.tax || 0
      })) || [];

      const emailSubtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      const emailTax = invoiceItems.reduce((sum, item) => {
        const itemTotal = item.quantity * item.rate;
        return sum + (itemTotal * (item.tax / 100));
      }, 0);

      logger.info(`[TourBookingService] Preparing to send admission offer email with ${finalAttachments.length} attachments.`);
      if (finalAttachments.length === 0) {
        logger.warn(
          `[TourBookingService] Admission offer email has no attachments (invoice PDF generation may have failed).`
        );
      }

      const bankDetailsForOfferEmail =
        invoicePdfResult?.bankDetails ??
        (await invoiceService.resolveBankDetailsForSchool(data.schoolId, data.bankAccountId));

      await emailService.sendAdmissionOfferEmail({
        to: data.email.receipient,
        subject: data.email.subject,
        recipientName,
        schoolName,
        body: data.email.body,
        invoiceNumber: createdInvoice.invoiceNumber,
        studentNames,
        issueDate: createdInvoice.issueDate,
        dueDate: createdInvoice.dueDate,
        items: invoiceItems,
        subtotal: emailSubtotal,
        tax: emailTax,
        total: emailSubtotal + emailTax,
        notes: data.notes,
        logoUrl: schoolForBranding?.schoolLogoUrl,
        attachments: finalAttachments,
        bankDetails: bankDetailsForOfferEmail,
      });

      return {
        success: true,
        message: "Offer sent successfully",
        invoices: [createdInvoice]
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      logger?.error?.(error, error);
      throw new Error(error.message || "Failed to send offer");
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Resend admission offer email (PDF invoice + acceptance letters) using the latest admission invoice
   * for the tour booking or form response. Requires a prior successful send-offer.
   */
  async resendOffer(data: {
    bookedTourId?: number;
    formResponseId?: number;
    schoolId: number;
    bankAccountId?: number;
    email?: { receipient?: string; subject?: string; body?: string; attachment?: string[] };
  }): Promise<{ success: boolean; message: string }> {
    const fromTour = data.bookedTourId != null;
    const fromForm = data.formResponseId != null;
    if (fromTour === fromForm) {
      throw new Error("Provide exactly one of bookedTourId or formResponseId");
    }

    if (fromTour) {
      const b = await this.bookingRepository.findOne({ where: { id: data.bookedTourId! } });
      if (!b || b.schoolId !== data.schoolId) {
        throw new Error("Tour booking not found");
      }
    } else {
      const fr = await AppDataSource.getRepository(FormResponse).findOne({
        where: { id: data.formResponseId! },
        relations: ["form"],
      });
      if (!fr?.form || fr.form.schoolId !== data.schoolId) {
        throw new Error("Form response not found");
      }
    }

    const offerRepo = AppDataSource.getRepository(AdmissionOfferData);
    const admissionOfferData = await offerRepo.findOne({
      where: fromTour ? { tourBookingId: data.bookedTourId! } : { formResponseId: data.formResponseId! },
    });
    if (!admissionOfferData) {
      throw new Error("No admission offer found; send an offer first");
    }

    const invRepo = AppDataSource.getRepository(Invoice);
    const qb = invRepo
      .createQueryBuilder("inv")
      .leftJoinAndSelect("inv.items", "items")
      .leftJoinAndSelect("inv.students", "students")
      .leftJoinAndSelect("students.user", "studentUser")
      .leftJoinAndSelect("students.currentClassroom", "studentClassroom")
      .leftJoinAndSelect("inv.parents", "parents")
      .leftJoinAndSelect("parents.user", "parentUser")
      .leftJoinAndSelect("inv.school", "school")
      .where("inv.schoolId = :schoolId", { schoolId: data.schoolId })
      .andWhere("inv.source = :src", { src: InvoiceSource.ADMISSION });

    if (fromTour) {
      qb.andWhere("inv.tourBookingId = :tid", { tid: data.bookedTourId! });
    } else {
      qb.andWhere("inv.formResponseId = :fid", { fid: data.formResponseId! });
    }

    const invoice = await qb.orderBy("inv.id", "DESC").getOne();
    if (!invoice) {
      throw new Error("No admission invoice found to resend");
    }

    const schoolForBranding = invoice.school;
    const effectiveBankId = data.bankAccountId ?? invoice.bankAccountId;
    const to = (data.email?.receipient ?? admissionOfferData.emailRecipient).trim();
    const subject = data.email?.subject ?? admissionOfferData.emailSubject;
    const body = data.email?.body ?? admissionOfferData.emailBody;

    const firstParent = invoice.parents?.[0];
    const recipientName = firstParent?.user
      ? `${firstParent.user.firstName || ""} ${firstParent.user.lastName || ""}`.trim() || "there"
      : "there";

    const studentNames =
      (invoice.students ?? [])
        .map((s) => (s.user ? `${s.user.firstName || ""} ${s.user.lastName || ""}`.trim() : "Student"))
        .join(", ") || "Student";
    const childNamesOverride = (invoice.students ?? [])
      .map((s) => (s.user ? `${s.user.firstName || ""} ${s.user.lastName || ""}`.trim() : ""))
      .filter((name) => name.length > 0);

    const finalAttachments: { filename: string; content: Buffer | string; contentType: string }[] = [];
    const extraRequestAttachments = await this.resolveRequestAttachments(data.email?.attachment);
    finalAttachments.push(...extraRequestAttachments);
    let invoicePdfResult: Awaited<ReturnType<typeof invoiceService.generateInvoicePDF>> | undefined;
    try {
      invoicePdfResult = await invoiceService.generateInvoicePDF(
        invoice.id,
        data.schoolId,
        effectiveBankId,
        to || schoolForBranding?.email,
        childNamesOverride,
      );
      if (invoicePdfResult.success && invoicePdfResult.pdf) {
        finalAttachments.push({
          filename: `Invoice_${invoice.invoiceNumber}.pdf`,
          content: invoicePdfResult.pdf,
          contentType: "application/pdf",
        });
      } else {
        logger.error(`resendOffer: failed to generate invoice PDF: ${invoicePdfResult?.message}`);
      }
    } catch (e) {
      logger.error("resendOffer: invoice PDF error", e);
    }

    for (const student of invoice.students ?? []) {
      try {
        const letterBuffer = await pdfService.generateAdmissionAcceptanceLetterPDF({
          school: schoolForBranding,
          studentName: `${student.user?.firstName || ""} ${student.user?.lastName || ""}`.trim(),
          parentName: recipientName,
          className: student.currentClassroom?.classroomName || "the Program",
          dueDate: invoice.dueDate,
        });
        finalAttachments.push({
          filename: `Admission_Acceptance_${(student.user?.firstName || "Student")}_${(student.user?.lastName || "")}.pdf`.replace(/\s+/g, "_"),
          content: letterBuffer,
          contentType: "application/pdf",
        });
      } catch (letterError) {
        logger.error(`resendOffer: letter PDF failed for student ${student.id}`, letterError);
      }
    }

    const invoiceItems =
      invoice.items?.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: Number(item.rate),
        tax: Number(item.tax) || 0,
      })) || [];

    const emailSubtotal = invoiceItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const emailTax = invoiceItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.rate;
      return sum + itemTotal * (item.tax / 100);
    }, 0);

    const bankDetailsForOfferEmail =
      invoicePdfResult?.bankDetails ??
      (await invoiceService.resolveBankDetailsForSchool(data.schoolId, effectiveBankId));

    await emailService.sendAdmissionOfferEmail({
      to,
      subject,
      recipientName,
      schoolName: schoolForBranding?.schoolName || "School",
      body,
      invoiceNumber: invoice.invoiceNumber,
      studentNames,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      items: invoiceItems,
      subtotal: emailSubtotal,
      tax: emailTax,
      total: emailSubtotal + emailTax,
      notes: invoice.notes ?? undefined,
      logoUrl: schoolForBranding?.schoolLogoUrl,
      attachments: finalAttachments,
      bankDetails: bankDetailsForOfferEmail,
    });

    return { success: true, message: "Admission offer email resent successfully" };
  }
}

