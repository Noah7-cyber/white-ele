"use client";
import React, { useState, useEffect, useMemo, useContext, SetStateAction } from "react";
import { getDummyScheduleData, generateScheduleFromAvailability, TimeSlot } from "./helpers";
import TimeSlotsPanel from "./components/TimeSlotPanel";
import CalendarView from "./components/Calendar";
import TourDetailsPanel from "./components/TourDetails";
import { useRouter } from "next/navigation";
import BookingForm from "./components/BookingForm";
import TourConfirmation from "./components/TourConfirmation";
import { TourContext } from "@/contexts/TourContext";
import { ScheduleTourRequest, Tours } from "@/services/tour.service";

interface TourPreviewProps {
  tourData?: Tours; // API-fetched tour data for public page (optional for admin preview)
  isPublic?: boolean; // true for public booking page, false for admin preview
  // disableActions?: boolean; // Disable actions like booking, confirmation, etc.
}

const TourPreview: React.FC<TourPreviewProps> = ({ tourData, isPublic = false }) => {
  const router = useRouter();
  const context = useContext(TourContext);
  const requestBody = context?.requestBody;
  const TODAY = new Date();
  // State for the currently displayed month/year in the calendar
  const [currentMonth, setCurrentMonth] = useState(TODAY.getMonth() + 1); // 1-indexed month
  const [currentYear, setCurrentYear] = useState(TODAY.getFullYear());

  // State for the user's selected date (key: "YYYY-MM-DD")
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // NEW STATE: Tracks the final confirmation status
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedFormData, setConfirmedFormData] = useState<ScheduleTourRequest | null>(null);
  // NEW STATE: Stores the final selected time slot, triggering the switch to the booking form
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Determine data source: use tourData prop if provided, otherwise use context
  const availability = tourData?.availability || requestBody?.availability;
  const duration = tourData?.duration || requestBody?.basicInfo?.duration;
  const timeSlotInterval =
    tourData?.timeSlotInterval || requestBody?.notification?.timeSlotInterval;
  const minimumNotice = tourData?.minimumNotice || requestBody?.notification?.minimumNotice;
  const minimumNoticeUnit =
    tourData?.minimumNoticeUnit || requestBody?.notification?.minimumNoticeUnit;

  // State to trigger real-time updates
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Generate schedule data based on the currently viewed month/year
  const scheduleData = useMemo(() => {
    // Use tour data if available, otherwise fall back to dummy data
    if (availability && duration && timeSlotInterval) {
      return generateScheduleFromAvailability(
        availability,
        duration,
        currentMonth,
        currentYear,
        timeSlotInterval,
        minimumNotice,
        minimumNoticeUnit,
      );
    }
    return getDummyScheduleData(currentMonth, currentYear, minimumNotice, minimumNoticeUnit);
  }, [
    currentMonth,
    currentYear,
    availability,
    duration,
    timeSlotInterval,
    minimumNotice,
    minimumNoticeUnit,
    updateTrigger,
  ]);

  // EFFECT: Real-time update every second to filter slots based on minimum notice
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger((prev) => prev + 1);
    }, 5000); // Update every 5 second

    return () => clearInterval(interval);
  }, []);

  // EFFECT: Set the first available date as selected by default
  useEffect(() => {
    // Only set a default if no date is currently selected (like after a month change or initial load)
    if (!selectedDate) {
      const firstAvailableDateKey = Object.keys(scheduleData)
        .sort() // Ensure we get the earliest date numerically
        .find((dateKey) => scheduleData[dateKey].length > 0);

      if (firstAvailableDateKey) {
        setSelectedDate(firstAvailableDateKey);
      }
    }
    // Re-run when scheduleData changes (i.e., month/year changes) or when selectedDate is reset to null.
  }, [scheduleData, selectedDate]);

  // Handler to transition to the booking form
  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  // Handler to go back to the calendar view
  const handleBackToCalendar = () => {
    setSelectedSlot(null);
    // Keep the current month/year and selected date for continuity
  };
  const handleBookingConfirmed = (formData: SetStateAction<ScheduleTourRequest | null>) => {
    setConfirmedFormData(formData);
    setIsConfirmed(true);
  };
  // Handlers to update month/year and clear date selection
  const handleSetCurrentMonth = (newMonth: number) => {
    setCurrentMonth(newMonth);
    setSelectedDate(null);
  };

  const handleSetCurrentYear = (newYear: number) => {
    setCurrentYear(newYear);
    setSelectedDate(null);
  };
  const tourId = tourData?.id;
  return (
    <div className="min-h-[130vh]  bg-gray-100 p-4 lg:p-10 flex flex-col justify-between items-center">
      {isConfirmed && selectedSlot && confirmedFormData ? (
        <TourConfirmation tourData={tourData} slot={selectedSlot} formData={confirmedFormData} />
      ) : selectedSlot ? (
        <div className="bg-white lg:mt-4 mt-2 rounded-xl shadow-md overflow-hidden max-w-5xl w-full">
          <div className="lg:flex divide-y py-2 lg:divide-y-0 lg:divide-x divide-gray-100">
            <TourDetailsPanel tourData={tourData} slot={selectedSlot!} />
            <BookingForm
              onBack={handleBackToCalendar}
              onBookingConfirmed={handleBookingConfirmed}
              selectedDate={selectedDate || ""}
              selectedSlot={selectedSlot}
              tourId={tourId}
              tourQuestions={tourData?.tourQuestions ?? []}
            />
          </div>
        </div>
      ) : (
        // SELECTION STAGE: Show event details, calendar, and time slots
        <div className="bg-white lg:mt-20 mt-10 rounded-xl shadow-2xl overflow-hidden max-w-6xl w-full">
          <div className="lg:flex divide-y py-2 lg:divide-y-0 lg:divide-x divide-gray-100">
            <TourDetailsPanel tourData={tourData} slot={null} />

            <CalendarView
              currentMonth={currentMonth}
              currentYear={currentYear}
              scheduleData={scheduleData}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              setCurrentMonth={handleSetCurrentMonth}
              setCurrentYear={handleSetCurrentYear}
              isInteractive={isPublic}
            />

            <TimeSlotsPanel
              selectedDate={selectedDate}
              scheduleData={scheduleData}
              onSlotSelect={handleSlotSelect} // New prop
              isInteractive={isPublic}
            />
          </div>
        </div>
      )}
      <div
        className="text-input-gray cursor-pointer font-medium"
        onClick={() => router.push("/dashboard")}
      >
        Powered by <span className="text-[#008080] font-bold">WhitePenguin</span>
      </div>
    </div>
  );
};

export default TourPreview;
