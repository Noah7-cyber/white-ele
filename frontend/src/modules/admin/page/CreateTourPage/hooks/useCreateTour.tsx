/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  tourServices,
  CreateTourRequest,
  GetTourByIdResponse,
  Tours,
  tourDynamicEndpoints,
} from "@/services/tour.service";
import { schoolDynamicEndpoints } from "@/services/school.service";
import { GetSchoolResponse } from "@/services/school.service";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { AllTourFormData, initialValues, validationSchema } from "../tour.constants";
import { useCallback, useEffect } from "react";
import { useTourContext } from "../../../../../contexts/TourContext";

type TourPageMode = "create" | "edit";

const normalizeMeridiem = (value: string | null | undefined): "AM" | "PM" =>
  String(value ?? "")
    .trim()
    .toUpperCase() === "PM"
    ? "PM"
    : "AM";

const mapTourToFormData = (tour: Tours): AllTourFormData => ({
  basicInfo: {
    title: tour.title || "",
    description: tour.description || "",
    url: tour.url || "",
    duration: tour.duration || 0,
    location: tour.location || "",
  },
  availability:
    tour.availability?.map((slot) => ({
      day: slot.day,
      startHour: slot.startHour,
      startMinute: slot.startMinute,
      startMeridiem: normalizeMeridiem(slot.startMeridiem),
      endHour: slot.endHour,
      endMinute: slot.endMinute,
      endMeridiem: normalizeMeridiem(slot.endMeridiem),
    })) || [],
  notification: {
    beforeTour: tour.beforeTour || 0,
    afterTour: tour.afterTour || 0,
    minimumNotice: tour.minimumNotice || 0,
    minimumNoticeUnit: tour.minimumNoticeUnit || "Hours",
    timeSlotInterval: tour.timeSlotInterval || 0,
    limitTotalTourDuration: tour.limitTotalTourDuration ?? true,
    limitNumberOfUpcomingTours: tour.limitNumberOfUpcomingTours ?? true,
    confirmation: true,
  },
  questions:
    tour.tourQuestions?.map((question) => ({
      inputType: question.inputType,
      label: question.label,
      placeHolder: question.placeHolder,
      isRequired: question.isRequired,
    })) || [],
  bookingOptions: {
    requiresConfirmation: false,
    disableCancelling: false,
    disableRescheduling: false,
  },
});

export const useCreateTour = ({ mode = "create", tourId }: { mode?: TourPageMode; tourId?: string }) => {
  const router = useRouter();
  const { requestBody, setRequestBody, clearTourData } = useTourContext();
  const isEditMode = mode === "edit" && Boolean(tourId);

  const { data: schoolData } = useQueryService<Record<string, never>, GetSchoolResponse>({
    service: schoolDynamicEndpoints.getParticularSchool(),
    options: {},
  });

  const school = schoolData?.school;
  const { data: existingTourData, isLoading: isLoadingExistingTour } = useQueryService<
    Record<string, never>,
    GetTourByIdResponse
  >({
    service: tourDynamicEndpoints.getTourById(tourId ?? ""),
    options: {
      enabled: isEditMode,
      keys: ["tour-events", "by-id", tourId ?? ""],
    },
  });

  // Helper function to build request body from form data
  const buildRequestBody = useCallback(
    (formData: any): CreateTourRequest => {
      const minimumNotice = Number(formData.notification?.minimumNotice);
      return {
        basicInfo: {
          title: formData.basicInfo?.title || "",
          description: formData.basicInfo?.description || "",
          url: formData.basicInfo?.url || "",
          duration: formData.basicInfo?.duration || 0,
          location: formData.basicInfo?.location || "",
          schoolLogoUrl: school?.schoolLogoUrl ?? null,
          schoolMail: school?.email ?? "",
          phoneNumber: school?.phoneNumber ?? "",
        },
      availability: formData.availability || [],
      notification: {
        beforeTour: formData.notification?.beforeTour || 0,
        afterTour: formData.notification?.afterTour || 0,
        minimumNotice: minimumNotice || 0,
        minimumNoticeUnit: formData.notification?.minimumNoticeUnit || "Hours",
        timeSlotInterval: formData.notification?.timeSlotInterval || formData.basicInfo.duration || 0,
        limitTotalTourDuration: formData.notification?.limitTotalTourDuration || false,
        limitNumberOfUpcomingTours: formData.notification?.limitNumberOfUpcomingTours || false,
      },
      questions: formData.questions || [],
      bookingOptions: {
        requiresConfirmation: formData.bookingOptions?.requiresConfirmation ?? false,
        disableCancelling: formData.bookingOptions?.disableCancelling ?? false,
        disableRescheduling: formData.bookingOptions?.disableRescheduling ?? false,
      },
    };
  }, [school]);

  const formInstance = useFormValidator<AllTourFormData>({
    validationSchema,
    defaultValues: initialValues as AllTourFormData,
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
  });

  const { control, setValue, getValues, trigger, formState } = formInstance;

  // Mutation for creating tour
  const { mutateAsync: createTourAsync, isPending: isCreatingTour } = useMutationService({
    service: tourServices.createTour,
    options: {
      successTitle: "Tour Created Successfully",
      successMessage: "You've successfully created a new tour event.",
      errorTitle: "Failed to Create Tour",
    },
  });
  const { mutateAsync: updateTourAsync, isPending: isUpdatingTour } = useMutationService({
    service: tourDynamicEndpoints.updateTour(tourId ?? ""),
    options: {
      successTitle: "Tour Updated Successfully",
      successMessage: "You've successfully updated this tour event.",
      errorTitle: "Failed to Update Tour",
    },
  });

  // Function to update request body from current form values
  const updateRequestBody = useCallback(() => {
    const currentFormData = getValues();
    const request = buildRequestBody(currentFormData);
    setRequestBody(request);
    return request;
  }, [getValues, buildRequestBody, setRequestBody]);

  useEffect(() => {
    if (!isEditMode || !existingTourData?.data) return;
    const mapped = mapTourToFormData(existingTourData.data);
    formInstance.reset(mapped);
  }, [existingTourData?.data, formInstance, isEditMode]);

  // Handle form submission
  const onSubmit = async (formData: any) => {

    try {
      const request = buildRequestBody(formData);

      if (isEditMode) {
        await updateTourAsync(request);
        clearTourData();
      } else {
        // Persist create-flow payload for preview and related flow only.
        setRequestBody(request);
        await createTourAsync(request);
        clearTourData();
      }

      router.push(DashboardRoutes.tours);
    } catch (error) {
      console.error("Error creating tour:", error);
    }
  };

  const handleSave = async () => {
    const currentFormData = getValues();
    try {
      await onSubmit(currentFormData);
    } catch (error) {
      console.error(error);
    }
  };

  return {
    ...formInstance,
    control,
    setValue,
    getValues,
    trigger,
    formState,
    handleSave,
    isCreatingTour: isCreatingTour || isUpdatingTour,
    isLoadingExistingTour,
    isEditMode,
    requestBody,
    setRequestBody,
    updateRequestBody,
    reset: formInstance.reset,
    clearTourData,
  };
};
