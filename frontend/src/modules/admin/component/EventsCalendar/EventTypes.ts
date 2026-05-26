export interface EventDetails {
  id: string | number;
  title: string;
  start: Date | null; 
  extendedProps: {
    organizer: string;
    status: string;
    [key: string]: unknown; // Allows other unknown properties
  };
}

export interface ModalPosition {
  x: number; // Left coordinate
  y: number; // Top coordinate
}
export type EventLike = {
  id?: string | number;
  title?: string;
  start: string | Date;
  end: string | Date;
  extendedProps?: Record<string, unknown>;
  [k: string]: unknown;
};

export interface EventDetailsModalProps {
  // This event can be the CalendarEventDetails type OR null
  event: EventDetails | null;
  position: ModalPosition | null;
  // A function that takes no arguments and returns nothing (void)
  onClose: () => void;
  // Function to delete a booked tour
  onDeleteTour?: (bookingId: number) => Promise<void>;
  // Open ViewTourBookingModal with full booking (same as Leads and Requests)
  onViewTourDetails?: (booking: import("@/services/tour.service").BookedTour) => void;
}