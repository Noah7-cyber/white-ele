/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { showToast } from "@/modules/shared/component/Toast";
import { useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { AnnouncementProps, initialValue, validationSchema } from "../announcement.constant";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { announcementServices } from "@/services/announcements.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { schoolDynamicEndpoints, GetSchoolResponse } from "@/services/school.service";
import { serializeAnnouncementContent } from "@/utils/announcementContent";

const useCreateAnnouncementPage = () => {
  const formInstance = useFormValidator<AnnouncementProps>({
    validationSchema,
    defaultValues: initialValue as AnnouncementProps,
    reValidateMode: "onChange",
  });
  const router = useRouter();
  const { control, setValue, getValues } = formInstance;
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const { mutateAsync, isPending } = useMutationService({
    service: announcementServices.createAnnouncement,
  });

  const { data: schoolData } = useQueryService<any, GetSchoolResponse>({
    service: schoolDynamicEndpoints.getParticularSchool(),
  });

  const persistAnnouncement = async (
    values: any,
    announcementStatus: "draft" | "published",
  ) => {
    const parsedContent = serializeAnnouncementContent(values?.content);

    await mutateAsync({
      subject: values?.title,
      content: parsedContent,
      schoolId: schoolData?.school?.id,
      announcementStatus,
      mediaUrl: "",
      link: "",
    });
    showToast({
      message: "Announcement Created Successfully.",
      description:
        announcementStatus === "draft"
          ? "Your announcement was saved as a draft."
          : "You've successfully published the announcement.",
      severity: "success",
      duration: 5000,
    });
    router.push(DashboardRoutes.announcement);
  };

  const onSave = async (values: any) => {
    try {
      await persistAnnouncement(values, "published");
    } catch (error: any) {
      showToast({
        message: "Error saving announcement",
        description: error?.message,
        severity: "error",
        duration: 5000,
      });
    }
  };

  const onSaveDraft = async (values: any) => {
    setIsSavingDraft(true);
    try {
      await persistAnnouncement(values, "draft");
    } catch (error: any) {
      showToast({
        message: "Error saving draft",
        description: error?.message,
        severity: "error",
        duration: 5000,
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  return {
    ...formInstance,
    isPending,
    control,
    setValue,
    getValues,
    onSave,
    onSaveDraft,
    isSavingDraft,
  };
};
export default useCreateAnnouncementPage;
