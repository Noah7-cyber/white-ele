"use client";

import { useMutationService } from "@/utils/hooks/useMutationService";
import { scheduleTourServices, ScheduleTourRequest } from "@/services/tour.service";

export const useScheduleTour = () => {

  const { mutateAsync: scheduleTourAsync, isPending: isSchedulingTour } = useMutationService({
    service: scheduleTourServices.scheduleTour,
    options: {
      successTitle: "Tour Scheduled Successfully",
      successMessage: "Your tour has been scheduled. We've sent a confirmation email.",
      errorTitle: "Failed to Schedule Tour",
    },
  });

  const scheduleTour = async (requestData: ScheduleTourRequest) => {
    try {
      await scheduleTourAsync(requestData);
      return true;
    } catch (error) {
      console.error("Error scheduling tour:", error);
      return false;
    }
  };

  return {
    scheduleTour,
    isSchedulingTour,
  };
};
