import { Request, Response } from "express";
import { TourBookingService } from "../services/tourBooking.Service";
import { admissionService, AdmissionFilters } from "../services/admission.service";
import { validationResult } from "express-validator";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { requireSchoolId } from "../../shared/utils/tenant-context";
import { AppDataSource } from "../../core/config/database";
import { ActivityLog } from "../../shared/entities/ActivityLog";
import { ActivityLogPriority } from "../../shared/entities/EntityEnums";

interface ClientSlot {
  id?: number;
  availabilityId: number;
  date: string;
  startTime: string;
  booked: boolean;
}


export class TourBookingController {
  private bookingService = new TourBookingService();

  async bookSlot(req: Request, res: Response) {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

      const {names, email, note, referralSource, guests, tourEventId, availabilityId, date, startTime } = req.body;

      if (!tourEventId || !availabilityId || !date || !startTime) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const booking = await this.bookingService.bookSlot({
        names, email,  note, referralSource, guests,
        tourEventId, availabilityId, date, startTime,
      });

      // High-priority activity log for tour booking creation
      await AppDataSource.getRepository(ActivityLog).save(
        AppDataSource.getRepository(ActivityLog).create({
          resource: "tour-bookings",
          action: "create",
          title: "Tour booking created",
          priority: ActivityLogPriority.HIGH,
          description: JSON.stringify({
            bookingId: booking.id,
            tourEventId,
            availabilityId,
            date,
            startTime,
            email,
          }),
        }),
      );

      return res.status(201).json({
        message: "Slot booked successfully",
        booking,
      });
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
  }

  async clientGetTourEventById(req: Request, res: Response) {
      try {
        const url = req.params["url"];
        if (!url || typeof url !== "string") {
            return res.status(400).json({ error: "Invalid tour event URL" });
        }
  
        const tourEvent = await this.bookingService.clientGetTourEventByUrl(url);
  
        if (!tourEvent) {
          return res.status(404).json({ error: "Tour event not found" });
        }
  
        // Slots are already filtered in the service, so we just return the object
  
        const result = {
        id: tourEvent?.id,
        title: tourEvent?.title,
        description: tourEvent?.description,
        url: tourEvent?.url,
        duration: tourEvent?.duration,
        location: tourEvent?.location,
        beforeTour: tourEvent?.beforeTour,
        afterTour: tourEvent?.afterTour,
        minimumNotice: tourEvent?.minimumNotice,
        minimumNoticeUnit: tourEvent?.minimumNoticeUnit,
        limitTotalTourDuration: tourEvent?.limitTotalTourDuration,
        timeSlotInterval: tourEvent?.timeSlotInterval,
        status: tourEvent?.status,
        limitNumberOfUpcomingTours: tourEvent?.limitNumberOfUpcomingTours,
        createdAt: tourEvent?.createdAt,
        updatedAt: tourEvent?.updatedAt,
        school: tourEvent?.school ? {
          schoolName: tourEvent.school.schoolName,
          schoolLogoUrl: tourEvent.school.schoolLogoUrl,
          email: tourEvent.school.email,
          phoneNumber: tourEvent.school.phoneNumber
        } : null,
        availability: tourEvent?.availability?.map(av => ({
          id: av?.id,
          tourEventId: av?.tourEventId,
          day: av?.day,
          startHour: av?.startHour,
          startMinute: av?.startMinute,
          startMeridiem: av?.startMeridiem,
          endHour: av?.endHour,
          endMinute: av?.endMinute,
          endMeridiem: av?.endMeridiem,
          startTime: av?.startTime,
          endTime: av?.endTime,
          createdAt: av?.createdAt,
          updatedAt: av?.updatedAt,
          slots: (av?.slots as unknown as ClientSlot[])?.map((sl: ClientSlot) => ({
            id: sl?.id,
            availabilityId: sl?.availabilityId,
            date: sl?.date,
            startTime: sl?.startTime,
            booked: sl?.booked
          })) ?? []
        })) ?? [],
        tourQuestions: tourEvent?.tourQuestions?.map(q => ({
          id: q?.id,
          inputType: q?.inputType,
          label: q?.label,
          placeHolder: q?.placeHolder,
          isRequired: q?.isRequired,
          createdAt: q?.createdAt,
          updatedAt: q?.updatedAt
        })) ?? []
      };
  
  
  
        return res.status(200).json(result);
      } catch (error: any) {
        return res.status(500).json({ error: "Failed to fetch tour event" });
      }
    }

  async getAllBookedTours(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const schoolId = requireSchoolId(authReq);
      const date = req.query['date'] as string | undefined;
      const isAdmissionParam = req.query['isAdmission'] as string | undefined;
      const isAdmission = isAdmissionParam === 'true' ? true : isAdmissionParam === 'false' ? false : undefined;
      const bookings = await this.bookingService.getAllBookedTours(date, schoolId, isAdmission);

      const result = (bookings || [])?.map(booking => ({
        id: booking?.id,
        names: booking?.names,
        email: booking?.email,
        note: booking?.note,
        referralSource: booking?.referralSource,
        guests: booking?.guests,
        date: booking?.date,
        status: booking?.status,
        accepted: booking?.accepted,
        complete: booking?.complete,
        isAdmission: booking?.isAdmission,
        createdAt: booking?.createdAt,
        slot: booking?.slot ? {
          id: booking.slot?.id,
          date: booking.slot?.date,
          startTime: booking.slot?.startTime,
          availabilityId: booking.slot?.availabilityId,
        } : null,
        availability: booking?.slot?.availability ? {
          id: booking.slot.availability?.id,
          tourEventId: booking.slot.availability?.tourEventId,
          day: booking.slot.availability?.day,
          startHour: booking.slot.availability?.startHour,
          startMinute: booking.slot.availability?.startMinute,
          startMeridiem: booking.slot.availability?.startMeridiem,
          endHour: booking.slot.availability?.endHour,
          endMinute: booking.slot.availability?.endMinute,
          endMeridiem: booking.slot.availability?.endMeridiem,
          startTime: booking.slot.availability?.startTime,
          endTime: booking.slot.availability?.endTime,
          createdAt: booking.slot.availability?.createdAt,
          updatedAt: booking.slot.availability?.updatedAt,
        } : null,
        tourEvent: booking?.tourEvent ? {
          id: booking.tourEvent?.id,
          title: booking.tourEvent?.title,
          description: booking.tourEvent?.description,
          url: booking.tourEvent?.url,
          duration: booking.tourEvent?.duration,
          location: booking.tourEvent?.location,
          beforeTour: booking.tourEvent?.beforeTour,
          afterTour: booking.tourEvent?.afterTour,
          minimumNotice: booking.tourEvent?.minimumNotice,
          minimumNoticeUnit: booking.tourEvent?.minimumNoticeUnit,
          limitTotalTourDuration: booking.tourEvent?.limitTotalTourDuration,
          timeSlotInterval: booking.tourEvent?.timeSlotInterval,
          status: booking.tourEvent?.status,
          limitNumberOfUpcomingTours: booking.tourEvent?.limitNumberOfUpcomingTours,
          createdAt: booking.tourEvent?.createdAt,
          updatedAt: booking.tourEvent?.updatedAt,
        } : null,
        students: booking?.isAdmission === true && booking?.students ? booking.students.map(student => ({
          firstName: student?.user?.firstName,
          lastName: student?.user?.lastName,
          dateOfBirth: student?.user?.dateOfBirth,
          classroomId: student?.classroomId,
        })) : undefined,
      }));

      return res.status(200).json({
        success: true,
        message: "Booked tours retrieved successfully",
        bookings: result,
        count: result.length,
      });
    } catch (error: any) {
      return res.status(500).json({ 
        success: false,
        error: error.message || "Failed to fetch booked tours" 
      });
    }
  }

  async getBookingById(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const schoolId = requireSchoolId(authReq);
      const id = parseInt(req.params["id"] as string, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid booking ID",
        });
      }

      const booking = await this.bookingService.getBookingById(id, schoolId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      const result = {
        id: booking.id,
        names: booking.names,
        email: booking.email,
        note: booking.note,
        referralSource: booking.referralSource,
        guests: booking.guests,
        date: booking.date,
        status: booking.status,
        accepted: booking.accepted,
        complete: booking.complete,
        isAdmission: booking.isAdmission,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        slot: booking.slot ? {
          id: booking.slot.id,
          date: booking.slot.date,
          startTime: booking.slot.startTime,
          availabilityId: booking.slot.availabilityId,
        } : null,
        availability: booking.slot?.availability ? {
          id: booking.slot.availability.id,
          tourEventId: booking.slot.availability.tourEventId,
          day: booking.slot.availability.day,
          startHour: booking.slot.availability.startHour,
          startMinute: booking.slot.availability.startMinute,
          startMeridiem: booking.slot.availability.startMeridiem,
          endHour: booking.slot.availability.endHour,
          endMinute: booking.slot.availability.endMinute,
          endMeridiem: booking.slot.availability.endMeridiem,
          startTime: booking.slot.availability.startTime,
          endTime: booking.slot.availability.endTime,
          createdAt: booking.slot.availability.createdAt,
          updatedAt: booking.slot.availability.updatedAt,
        } : null,
        tourEvent: booking.tourEvent ? {
          id: booking.tourEvent.id,
          title: booking.tourEvent.title,
          description: booking.tourEvent.description,
          url: booking.tourEvent.url,
          duration: booking.tourEvent.duration,
          location: booking.tourEvent.location,
          beforeTour: booking.tourEvent.beforeTour,
          afterTour: booking.tourEvent.afterTour,
          minimumNotice: booking.tourEvent.minimumNotice,
          minimumNoticeUnit: booking.tourEvent.minimumNoticeUnit,
          limitTotalTourDuration: booking.tourEvent.limitTotalTourDuration,
          timeSlotInterval: booking.tourEvent.timeSlotInterval,
          status: booking.tourEvent.status,
          limitNumberOfUpcomingTours: booking.tourEvent.limitNumberOfUpcomingTours,
          createdAt: booking.tourEvent.createdAt,
          updatedAt: booking.tourEvent.updatedAt,
        } : null,
        students: booking.isAdmission === true && booking.students
          ? booking.students.map((student) => ({
              firstName: student?.user?.firstName,
              lastName: student?.user?.lastName,
              dateOfBirth: student?.user?.dateOfBirth,
              classroomId: student?.classroomId,
            }))
          : undefined,
      };

      return res.status(200).json({
        success: true,
        message: "Booking retrieved successfully",
        booking: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch booking",
      });
    }
  }

  async deleteBooking(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const schoolId = requireSchoolId(authReq);
      const id = parseInt(req.params['id'] as string);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid booking ID"
        });
      }

      const deleted = await this.bookingService.softDeleteBooking(id, schoolId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Booking not found or already deleted"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Booking deleted successfully"
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to delete booking"
      });
    }
  }

  async updateBookingAcceptedStatus(req: Request, res: Response) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const authReq = req as AuthenticatedRequest;
      const schoolId = requireSchoolId(authReq);
      const id = parseInt(req.params['id'] as string);
      const { accepted, complete, status, reschedule } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid booking ID"
        });
      }

      const updateResult = await this.bookingService.updateBookingStatus(id, { 
        accepted, 
        complete, 
        status,
        reschedule
      }, schoolId);
      const updatedBooking = updateResult.booking;

      const messages: string[] = [];
      if (accepted !== undefined) {
        messages.push(`Booking ${accepted ? "accepted" : "rejected"}`);
      }
      if (complete !== undefined) {
        messages.push(`Booking ${complete ? "marked as complete" : "marked as incomplete"}`);
      }
      if (reschedule) {
        const rescheduleUpdates: string[] = [];
        if (reschedule.date !== undefined) {
          rescheduleUpdates.push("date");
        }
        if (reschedule.startTime !== undefined) {
          rescheduleUpdates.push("time");
        }
        if (rescheduleUpdates.length > 0) {
          messages.push(`Booking ${rescheduleUpdates.join(" and ")} rescheduled`);
        }
      }
      if (status !== undefined && updateResult.message) {
        messages.push(updateResult.message);
      }

      const responseMessage = updateResult.message
        ? updateResult.message
        : messages.length > 0
          ? `${messages.join(" and ")} successfully`
          : "Booking status updated successfully";

      return res.status(200).json({
        success: true,
        message: responseMessage,
        booking: updatedBooking
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to update booking status"
      });
    }
  }

  async sendOffer(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const authReq = req as AuthenticatedRequest;
      const { bookedTourId, formResponseId, parent, students, items, notes, email, bankAccountId, paymentMethod } = req.body;
      const schoolId = requireSchoolId(authReq);

      const result = await this.bookingService.sendOffer({
        bookedTourId:
          bookedTourId !== undefined && bookedTourId !== null
            ? typeof bookedTourId === "string"
              ? parseInt(bookedTourId, 10)
              : bookedTourId
            : undefined,
        formResponseId:
          formResponseId !== undefined && formResponseId !== null
            ? typeof formResponseId === "string"
              ? parseInt(formResponseId, 10)
              : formResponseId
            : undefined,
        parent,
        students,
        items,
        notes,
        email,
        schoolId,
        bankAccountId:
          bankAccountId !== undefined && bankAccountId !== null
            ? typeof bankAccountId === "string"
              ? parseInt(bankAccountId, 10)
              : bankAccountId
            : undefined,
        paymentMethod,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to send offer"
      });
    }
  }

  async resendOffer(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const authReq = req as AuthenticatedRequest;
      const { bookedTourId, formResponseId, email, bankAccountId } = req.body;
      const schoolId = requireSchoolId(authReq);

      const result = await this.bookingService.resendOffer({
        bookedTourId:
          bookedTourId !== undefined && bookedTourId !== null
            ? typeof bookedTourId === "string"
              ? parseInt(bookedTourId, 10)
              : bookedTourId
            : undefined,
        formResponseId:
          formResponseId !== undefined && formResponseId !== null
            ? typeof formResponseId === "string"
              ? parseInt(formResponseId, 10)
              : formResponseId
            : undefined,
        schoolId,
        bankAccountId:
          bankAccountId !== undefined && bankAccountId !== null
            ? typeof bankAccountId === "string"
              ? parseInt(bankAccountId, 10)
              : bankAccountId
            : undefined,
        email,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to resend offer",
      });
    }
  }

  async listAdmissions(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const schoolId = requireSchoolId(authReq);
      if (!schoolId) {
        return res.status(400).json({ success: false, message: "School ID is required" });
      }

      const posQuery = req.query["pos"];
      const deltaQuery = req.query["delta"];
      const pos = posQuery !== undefined ? parseInt(posQuery as string, 10) : undefined;
      const delta = deltaQuery !== undefined ? parseInt(deltaQuery as string, 10) : undefined;

      const filters: AdmissionFilters = {
        search: req.query["search"] as string | undefined,
        startDate: req.query["startDate"] as string | undefined,
        endDate: req.query["endDate"] as string | undefined,
        pos: pos !== undefined && !isNaN(pos) ? pos : undefined,
        delta: delta !== undefined && !isNaN(delta) ? delta : undefined,
      };

      const result = await admissionService.listAdmissions(schoolId, filters);

      return res.status(200).json({
        success: true,
        message: "Admissions retrieved successfully",
        data: result.data,
        count: result.data.length,
        pagination: result.pagination
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error"
      });
    }
  }

  async listAdmissionsBookings(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const schoolId = requireSchoolId(authReq);
      if (!schoolId) {
        return res.status(400).json({ success: false, message: "School ID is required" });
      }

      const posQuery = req.query["pos"];
      const deltaQuery = req.query["delta"];
      const pos = posQuery !== undefined ? parseInt(posQuery as string, 10) : undefined;
      const delta = deltaQuery !== undefined ? parseInt(deltaQuery as string, 10) : undefined;
      const isAdmissionParam = req.query["isAdmission"] as string | undefined;
      const isAdmission =
        isAdmissionParam === "true" ? true : isAdmissionParam === "false" ? false : undefined;

      const result = await this.bookingService.getAdmissionsBookingsCombined(schoolId, {
        search: req.query["search"] as string | undefined,
        startDate: req.query["startDate"] as string | undefined,
        endDate: req.query["endDate"] as string | undefined,
        pos: pos !== undefined && !isNaN(pos) ? pos : undefined,
        delta: delta !== undefined && !isNaN(delta) ? delta : undefined,
        isAdmission,
      });

      return res.status(200).json({
        success: true,
        message: "Booked tours retrieved successfully",
        bookings: result.bookings,
        count: result.count,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}
