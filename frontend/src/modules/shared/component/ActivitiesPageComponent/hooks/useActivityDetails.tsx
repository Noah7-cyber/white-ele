"use client";

import { useEffect, useState, useCallback } from "react";
import { activitiesDynamicEndpoints, GetActivityByIdResponse } from "@/services/activities.service";
import { showToast } from "@/modules/shared/component/Toast";
import client from "@/utils/client";

export const useActivityDetails = (activityId: number | null) => {
  const [activityData, setActivityData] = useState<GetActivityByIdResponse["activity"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActivity = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      const endpoint = activitiesDynamicEndpoints.getActivityById(id);
      const response = await client.request<GetActivityByIdResponse>({
        path: endpoint.path,
        method: endpoint.method,
      });

      if (
        typeof response === "object" &&
        response !== null &&
        "activity" in response
      ) {
        setActivityData((response as GetActivityByIdResponse).activity);
      } else {
        throw new Error("Invalid response received from server.");
      }
    } catch (error: unknown) {
      console.error("Error fetching activity:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch activity details.";
      showToast({
        message: "Error",
        description: errorMessage,
        severity: "error",
      });
      setActivityData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activityId) {
      setActivityData(null);
      setIsLoading(false);
      return;
    }

    fetchActivity(activityId);
  }, [activityId, fetchActivity]);

  return {
    activityData,
    isLoading,
  };
};
