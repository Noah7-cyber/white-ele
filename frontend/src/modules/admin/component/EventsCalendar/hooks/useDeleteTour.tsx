/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import { tourDynamicEndpoints } from "@/services/tour.service";
import { showToast } from "@/modules/shared/component/Toast";
import client from "@/utils/client";

/**
 * Hook for deleting booked tours without fetching data
 * Use this in modals to avoid triggering unnecessary data fetches
 */
const useDeleteTour = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete a booked tour
  const deleteBookedTour = useCallback(
    async (bookingId: number) => {
      try {
        setIsDeleting(true);

        // Call delete API using client directly for dynamic endpoint
        const deleteEndpoint = tourDynamicEndpoints.deleteBookedTour(bookingId);
        await client.request({
          path: deleteEndpoint.path,
          method: deleteEndpoint.method,
        });

        showToast({
          message: "Tour Deleted",
          description: "The booked tour has been successfully deleted.",
          severity: "success",
          duration: 3000,
        });
      } catch (error: any) {
        showToast({
          message: "Error",
          description: error?.response?.data?.message || "Unable to delete booked tour.",
          severity: "error",
          duration: 3000,
        });
        throw error; // Re-throw so caller can handle if needed
      } finally {
        setIsDeleting(false);
      }
    },
    [],
  );

  return {
    deleteBookedTour,
    isDeleting,
  };
};

export default useDeleteTour;

