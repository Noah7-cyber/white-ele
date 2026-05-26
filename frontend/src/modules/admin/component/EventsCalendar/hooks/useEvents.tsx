/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { scheduleTourServices, BookedTour } from "@/services/tour.service";
import { EventLike } from "../EventTypes";

const useEvents = () => {
  const [allBookings, setAllBookings] = useState<BookedTour[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { mutateAsync: getBookedTours } = useMutationService({
    service: scheduleTourServices.getBookedTours,
    options: {
      disableToast: true,
    },
  });

  // Fetch all booked tours with pagination for scalability
  useEffect(() => {
    const fetchAllBookedTours = async () => {
      try {
        setIsLoading(true);
        const DELTA = 100; // Page size
        let allBookingsList: BookedTour[] = [];
        let pos = 0;
        let totalCount = 0;

        // Fetch first page to get total count
        const firstPageRes: any = await getBookedTours({
          delta: DELTA,
          pos: 0,
        } as any);

        const firstPageList = firstPageRes?.bookings || firstPageRes?.data || [];
        const paginationInfo = firstPageRes?.pagination || {};
        totalCount = paginationInfo?.count || paginationInfo?.total || firstPageList.length;
        
        if (Array.isArray(firstPageList)) {
          allBookingsList = [...firstPageList];
        }

        // If there are more bookings, fetch remaining pages
        if (totalCount > DELTA) {
          const totalPages = Math.ceil(totalCount / DELTA);
          
          // Fetch remaining pages in parallel for better performance
          const remainingPagePromises = [];
          for (let page = 2; page <= totalPages; page++) {
            pos = (page - 1) * DELTA;
            remainingPagePromises.push(
              getBookedTours({
                delta: DELTA,
                pos: pos,
              } as any)
            );
          }

          const remainingPages = await Promise.all(remainingPagePromises);
          
          remainingPages.forEach((res: any) => {
            const list = res?.bookings || res?.data || [];
            if (Array.isArray(list)) {
              allBookingsList = [...allBookingsList, ...list];
            }
          });
        }

        setAllBookings(allBookingsList);
      } catch (error) {
        console.error("Failed to fetch all booked tours", error);
        setAllBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllBookedTours();
  }, [getBookedTours]);
  // Map booked tours to calendar events format - only show accepted tours
  const events: EventLike[] = useMemo(() => {
    // Filter to only include accepted tours
    const activeBookings = allBookings.filter((booking: BookedTour) =>booking.complete === false);
    
    return activeBookings.map((booking: BookedTour) => {
      // Parse the date and startTime from slot
      const bookingDate = booking.slot?.date || booking.date; // Format: "2025-12-16"
      const startTime = booking.slot?.startTime || "00:00:00"; // Format: "10:03:00"
      
      // Combine date and time for start
      const startDateTime = `${bookingDate}T${startTime}`;
      const start = new Date(startDateTime);

      // Calculate end time: startTime + duration (in minutes)
      const duration = booking.tourEvent?.duration || 0; // Duration in minutes
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + duration);

      // Determine color based on status or use a default
      const colorMap: Record<string, string> = {
        active: "teal",
        scheduled: "teal",
        completed: "blue",
        cancelled: "orange",
      };
      const color = colorMap[booking.status?.toLowerCase()] || "teal";

      // Handle parents names - array of strings
      const parentsNames = Array.isArray(booking.names) ? booking.names : [];
      const organizerDisplay = parentsNames.length > 0 ? parentsNames.join(", ") : "";

      return {
        id: booking.id,
        title: booking.tourEvent?.title || `Tour - ${organizerDisplay}`,
        start: start.toISOString(),
        end: end.toISOString(),
        extendedProps: {
          status: booking.status === "active" ? "Scheduled" : booking.status,
          organizer: organizerDisplay,
          note: booking.note || "",
          email: booking.email,
          referralSource: booking.referralSource,
          guests: booking.guests || [],
          color: color,
          bookingId: booking.id,
          tourEventId: booking.tourEvent?.id,
          slotId: booking.slot?.id,
          date: bookingDate,
          time: startTime,
          booking,
        },
      } as EventLike;
    });
  }, [allBookings]);

  // Refetch all booked tours
  const refetch = useCallback(() => {
    // Trigger refetch by clearing and letting useEffect handle it
    setAllBookings([]);
    // Re-run the fetch effect
    const fetchAllBookedTours = async () => {
      try {
        setIsLoading(true);
        const DELTA = 100; // Page size
        let allBookingsList: BookedTour[] = [];
        let pos = 0;
        let totalCount = 0;

        // Fetch first page to get total count
        const firstPageRes: any = await getBookedTours({
          delta: DELTA,
          pos: 0,
        } as any);

        const firstPageList = firstPageRes?.bookings || firstPageRes?.data || [];
        const paginationInfo = firstPageRes?.pagination || {};
        totalCount = paginationInfo?.count || paginationInfo?.total || firstPageList.length;
        
        if (Array.isArray(firstPageList)) {
          allBookingsList = [...firstPageList];
        }

        // If there are more bookings, fetch remaining pages
        if (totalCount > DELTA) {
          const totalPages = Math.ceil(totalCount / DELTA);
          
          // Fetch remaining pages in parallel for better performance
          const remainingPagePromises = [];
          for (let page = 2; page <= totalPages; page++) {
            pos = (page - 1) * DELTA;
            remainingPagePromises.push(
              getBookedTours({
                delta: DELTA,
                pos: pos,
              } as any)
            );
          }

          const remainingPages = await Promise.all(remainingPagePromises);
          
          remainingPages.forEach((res: any) => {
            const list = res?.bookings || res?.data || [];
            if (Array.isArray(list)) {
              allBookingsList = [...allBookingsList, ...list];
            }
          });
        }

        setAllBookings(allBookingsList);
      } catch (error) {
        console.error("Failed to fetch all booked tours", error);
        setAllBookings([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllBookedTours();
  }, [getBookedTours]);

  return {
    events,
    isLoading,
    refetch,
  };
};

export default useEvents;

