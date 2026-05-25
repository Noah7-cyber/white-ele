import { AppDataSource } from "../../core";
import { TourBookingService } from "../services/tourBooking.Service";
import { TourBooking } from "../../shared/entities/TourBooking";
import { TourSlot } from "../../shared/entities/TourSlot";
import { TourEvent } from "../../shared/entities/TourEvent";
import { TourAvailability } from "../../shared/entities/TourAvailability";
import { emailService } from "../../shared/services/email.service";
import { notificationService } from "../../notification";

describe("TourBookingService.bookSlot", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sends both parent confirmation and admin booking email", async () => {
    const bookingRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };
    const slotRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const eventRepo = {};
    const availabilityRepo = {
      findOne: jest.fn(),
    };

    const school = {
      schoolName: "Jaz School",
      address: "123 Main St",
    };
    const tourEvent = {
      id: 100,
      schoolId: 10,
      timeSlotInterval: 15,
      duration: 45,
      location: "Front Office",
      school,
    };
    const availability = {
      id: 50,
      tourEvent,
      slots: [],
    };
    const createdSlot = {
      id: 77,
      availabilityId: 50,
      date: "2026-05-01",
      startTime: "09:00:00",
      bookings: [],
    };
    const createdBooking = {
      id: 88,
      names: ["Jane Doe"],
      email: "jane@example.com",
      note: "See you soon",
      guests: ["Guest 1", "Guest 2"],
      schoolId: 10,
      date: "2026-05-01",
    };

    availabilityRepo.findOne.mockResolvedValue(availability);
    slotRepo.findOne.mockResolvedValue(null);
    slotRepo.create.mockReturnValue(createdSlot);
    slotRepo.save.mockResolvedValue(createdSlot);
    bookingRepo.create.mockReturnValue(createdBooking);
    bookingRepo.save.mockResolvedValue(createdBooking);

    jest.spyOn(AppDataSource, "getRepository").mockImplementation((entity: any) => {
      if (entity === TourBooking) return bookingRepo as any;
      if (entity === TourSlot) return slotRepo as any;
      if (entity === TourEvent) return eventRepo as any;
      if (entity === TourAvailability) return availabilityRepo as any;
      throw new Error(`Unexpected repository request: ${entity?.name || "unknown"}`);
    });

    const parentEmailSpy = jest
      .spyOn(emailService, "sendTourBookingConfirmationEmail")
      .mockResolvedValue(undefined);
    const adminEmailSpy = jest
      .spyOn(emailService, "sendTourBookedAdminNotificationEmail")
      .mockResolvedValue(undefined);
    const notifyAdminsSpy = jest
      .spyOn(notificationService, "notifyAdmins")
      .mockResolvedValue(undefined as any);

    const service = new TourBookingService();
    await service.bookSlot({
      names: ["Jane Doe"],
      email: "jane@example.com",
      note: "See you soon",
      guests: ["Guest 1", "Guest 2"],
      tourEventId: 100,
      availabilityId: 50,
      date: "2026-05-01",
      startTime: "09:00:00",
    });

    expect(parentEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "jane@example.com",
        parentName: "Jane Doe",
        schoolName: "Jaz School",
        tourDate: "2026-05-01",
        tourTime: "09:00:00",
      }),
    );

    expect(adminEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: 10,
        schoolName: "Jaz School",
        bookerName: "Jane Doe",
        bookerEmail: "jane@example.com",
        tourDate: "2026-05-01",
        tourTime: "09:00:00",
        location: "Front Office",
        guestCount: 2,
        note: "See you soon",
      }),
    );

    expect(notifyAdminsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: 10,
        title: "New Tour Booking",
      }),
    );
  });
});
