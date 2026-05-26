/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// TOUR ROOT
// ========================
const tourRoot = "/api/v1/tour-events";
const scheduleTourRoot = "/api/v1/tour-bookings";

// ========================
// TYPES
// ========================
export interface Tours {
  id: number;
  title: string;
  name: string;
  description: string;
  url: string;
  duration: number;
  location: string;
  type: string;
  status: string;
  slug: string;
  school: {
    schoolName: string;
    schoolLogoUrl: string;
    email: string;
    phoneNumber: string;
  };
  availability: TourAvailability[];
  beforeTour: number;
  afterTour: number;
  minimumNotice: number;
  minimumNoticeUnit: string;
  timeSlotInterval: number;
  limitTotalTourDuration: boolean;
  limitNumberOfUpcomingTours: boolean;
  createdAt: string;
  updatedAt: string;
  tourQuestions: TourQuestion[];
}

// ---- Basic Info ----
export interface TourBasicInfo {
  title: string;
  description: string;
  url: string;
  duration: number;
  location: string;
  schoolLogoUrl?: string | null;
  schoolMail?: string;
  phoneNumber?: string;
}

interface AvailableSlots {
  id: number;
  availabilityId: number;
  date: string;
  startTime: string;
  booked: boolean;
}
// ---- Availability ----
export interface TourAvailability {
  day: string;
  startHour: number;
  startMinute: number;
  startMeridiem: string;
  endHour: number;
  endMinute: number;
  endMeridiem: string;
  id: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  slots: AvailableSlots[];
}
// ---- Notification ----
export interface TourNotification {
  beforeTour: number;
  afterTour: number;
  minimumNotice: number;
  minimumNoticeUnit: string;
  timeSlotInterval: number;
  limitTotalTourDuration: boolean;
  limitNumberOfUpcomingTours: boolean;
}

// ---- Questions ----
export interface TourQuestion {
  inputType: string;
  label: string;
  placeHolder: string;
  isRequired: boolean;
}

// ---- Booking options (requires confirmation, disable cancelling, disable rescheduling) ----
export interface TourBookingOptions {
  requiresConfirmation: boolean;
  disableCancelling: boolean;
  disableRescheduling: boolean;
}

// ---- Create Tour Request ----
export interface CreateTourRequest {
  basicInfo: TourBasicInfo;
  availability: TourAvailability[];
  notification: TourNotification;
  questions: TourQuestion[];
  bookingOptions: TourBookingOptions;
}

export interface CreateTourResponse {
  status: string;
  message: string;
  data: any;
}

// // ---- Update Tour Request ----

export interface UpdateTourResponse {
  status: string;
  message: string;
  data: any;
}

// ---- Get All Tours ----
export interface GetAllToursResponse {
  success: boolean;
  message: string;
  tourEvents: Tours[];
}

// ---- Get Tour By ID ----
export interface GetTourByIdResponse {
  status: string;
  message: string;
  data: Tours;
}
export interface GetTourByUrlResponse {
  data: Tours;
}
//Schedule Tour Request
export interface ScheduleTourRequest {
  tourEventId: number;
  email: string;
  note?: string;
  referralSource: string;
  date: string;
  startTime: string;
  guests?: string[];
  names?: string[];
  additionalResponses?: Record<string, any>;
  availabilityId?: number;
}
// ---- Booked Tour Interfaces ---

export interface BookedTourEvent {
  id: number;
  title: string;
  description: string;
  url: string;
  duration: number;
  location: string;
  beforeTour: number;
  afterTour: number;
  minimumNotice: number;
  minimumNoticeUnit: string;
  limitTotalTourDuration: boolean;
  timeSlotInterval: number;
  status: string;
  limitNumberOfUpcomingTours: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookedTour {
  id: number;
  names: string[]; // Array of parent names
  email: string;
  note: string;
  referralSource: string;
  guests: string[];
  date: string;
  status: string;
  accepted?: boolean; // Whether the tour has been accepted
  complete?: boolean; // Whether the tour has been completed
  createdAt: string;
  slot: AvailableSlots;
  availability: TourAvailability;
  tourEvent: BookedTourEvent;
}

export interface GetBookedToursResponse {
  success: boolean;
  message: string;
  bookings: BookedTour[];
}

export interface GetTourBookingByIdResponse {
  success: boolean;
  message: string;
  booking: BookedTour;
}

export interface AdmissionBooking {
  id: number;
  type: "tour_booking" | "form_response";
  names: string[];
  email: string;
  note: string | null;
  referralSource: string;
  guests: string[] | null;
  date: string;
  status: string;
  accepted: boolean | null;
  complete: boolean | null;
  isAdmission: boolean | null;
  createdAt: string;
  tourEventId: number | null;
  formId: number | null;
  slot: any;
}

export interface GetAdmissionBookingsResponse {
  success: boolean;
  message: string;
  bookings: AdmissionBooking[];
  count: number;
  pagination: {
    pos: number;
    delta: number;
    count: number;
  };
}

export type SendOfferPayload = SendOfferPayloadBase &
  (
    | { bookedTourId: number | string; formResponseId?: never }
    | { formResponseId: number | string; bookedTourId?: never }
  );

export interface SendOfferPayloadBase {
  parent: {
    firstName: string;
    lastName: string;
  };
  students: {
    firstName: string;
    lastName: string;
    classroomId: number | string;
    dateOfBirth: string;
  }[];
  items: {
    description: string;
    quantity: number;
    tax: number;
    rate: number;
  }[];
  notes: string;
  paymentMethod?: string;
  bankAccountId?: number;
  email: {
    receipient: string;
    subject: string;
    body: string;
    attachment: string[]; // filenames or URLs
  };
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const tourEndpoints = {
  createTour: { path: `${tourRoot}`, method: ApiMethods.POST },
  getAllTours: { path: `${tourRoot}`, method: ApiMethods.GET },
  getAdmissions: { path: `/api/v1/tour-bookings/admissions`, method: ApiMethods.GET },
};

const scheduleTourEndpoints = {
  scheduleTour: { path: `${scheduleTourRoot}`, method: ApiMethods.POST },
  getBookedTours: { path: `${scheduleTourRoot}`, method: ApiMethods.GET },
  getAdmissionBookings: {
    path: `${scheduleTourRoot}/admissions/bookings`,
    method: ApiMethods.GET,
  },
  sendOffer: { path: `${scheduleTourRoot}/send-offer`, method: ApiMethods.POST },
  resendOffer: { path: `${scheduleTourRoot}/resend-offer`, method: ApiMethods.POST },
};

// Dynamic endpoints (require TourId)
export const tourDynamicEndpoints = {
  getTourById: (tourId: string | number) => ({
    path: `${tourRoot}/${tourId}`,
    method: ApiMethods.GET,
  }),
  updateTour: (tourId: string | number) => ({
    path: `${tourRoot}/${tourId}`,
    method: ApiMethods.PUT,
  }),
  getAvailableTourEvents: (tourId: string | number) => ({
    path: `${tourRoot}/available-tour-events/${tourId}`,
    method: ApiMethods.GET,
  }),
  getTourByUrl: (tourUrl: string) => ({
    path: `${scheduleTourRoot}/${tourUrl}`,
    method: ApiMethods.GET,
  }),
  updateBookedTour: (tourId: string | number) => ({
    path: `${scheduleTourRoot}/${tourId}`,
    method: ApiMethods.PUT,
  }),
  deleteTour: (tourId: string | number) => ({
    path: `${tourRoot}/${tourId}`,
    method: ApiMethods.DELETE,
  }),
  deleteBookedTour: (tourId: string | number) => ({
    path: `${scheduleTourRoot}/${tourId}`,
    method: ApiMethods.DELETE,
  }),
  getTourBookingById: (tourBookingId: string | number) => ({
    path: `${scheduleTourRoot}/bookings/${tourBookingId}`,
    method: ApiMethods.GET,
  }),
};

// ========================
// SERVICE GENERATOR
// ========================
type ServiceInterface = {
  path: string;
  method: ApiMethods;
};

function generateServices<T extends Record<string, { path: string; method: ApiMethods }>>(
  endpoints: T,
) {
  const services: Record<keyof T, ServiceInterface> = {} as any;
  for (const key in endpoints) {
    services[key] = {
      path: endpoints[key].path,
      method: endpoints[key].method,
    };
  }
  return services;
}

// ========================
// EXPORTS
// ========================
export const tourServices = generateServices(tourEndpoints);
export const scheduleTourServices = generateServices(scheduleTourEndpoints);
