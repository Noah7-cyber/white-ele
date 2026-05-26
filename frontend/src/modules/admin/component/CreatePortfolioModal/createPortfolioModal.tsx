/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { Modal } from "@/modules/shared/component/modal/modal";
import { Button } from "@/modules/shared/component/Button";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { useMutationService } from "@/utils/hooks/useMutationService";
import {
  portfolioDynamicEndpoints,
  portfolioServices,
  type UpdatePortfolioRequest,
} from "@/services/portfolio.service";
import { classroomServices } from "@/services/classroom.service";
import { childServices } from "@/services/child.service";
import { showToast } from "@/modules/shared/component/Toast";
import { DatePicker } from "@/modules/shared/component/DatePicker";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";

type CreatePortfolioModalProps = {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  onSuccess?: () => void;
  mode?: "create" | "edit";
  portfolioId?: number | null;
  initialValues?: {
    classroomId?: number | null;
    classroomName?: string | null;
    studentId?: number | null;
    studentName?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  };
};

type FormValues = {
  classroomId: string;
  studentId: string;
  startDate: string;
  endDate: string;
};

export default function CreatePortfolioModal({
  open,
  onClose,
  onSuccess,
  isLoading: isExternalLoading,
  mode = "create",
  portfolioId,
  initialValues,
}: CreatePortfolioModalProps) {
  const isMobile = useMediaQuery("(max-width:768px)");
  const [students, setStudents] = useState<{ value: string; name: string }[]>([]);

  const { control, handleSubmit, watch, reset, setValue, getValues, trigger } = useForm<FormValues>({
    defaultValues: {
      classroomId: "",
      studentId: "",
      startDate: "",
      endDate: "",
    },
  });

  const selectedClassroomId = watch("classroomId");

  const {
    data: classRoomData,
    hasNextPage: hasMoreClassRoom,
    fetchNextPage: fetchNextClassPage,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: { status: "active" },
    },
  });

  const classroomOptions = useMemo(() => {
    const list =
      classRoomData?.pages?.reduce<any[]>((acc, page) => {
        return acc.concat(page?.classrooms ?? page?.data ?? []);
      }, []) ?? [];
    const mapped = [
      { name: "All Classrooms", value: "" },
      ...list.map((c: any) => ({
        name: (c.classroomName ?? c.name ?? "") as string,
        value: String(c.id),
      })),
    ];
    if (
      mode === "edit" &&
      initialValues?.classroomId &&
      initialValues?.classroomName &&
      !mapped.some((c) => c.value === String(initialValues.classroomId))
    ) {
      mapped.push({
        name: String(initialValues.classroomName),
        value: String(initialValues.classroomId),
      });
    }
    return mapped;
  }, [classRoomData, initialValues?.classroomId, initialValues?.classroomName, mode]);

  const studentOptions = useMemo(() => {
    const list = [...students];
    if (
      mode === "edit" &&
      initialValues?.studentId &&
      initialValues?.studentName &&
      !list.some((s) => s.value === String(initialValues.studentId))
    ) {
      list.push({
        value: String(initialValues.studentId),
        name: String(initialValues.studentName),
      });
    }
    return list;
  }, [students, mode, initialValues?.studentId, initialValues?.studentName]);

  const fetchMoreClassRoom = async (): Promise<void> => {
    if (!hasMoreClassRoom) return;
    fetchNextClassPage();
  };

  const { mutateAsync: getStudents } = useMutationService({
    service: childServices.getAllChilds,
    options: { disableToast: true },
  });

  const { mutateAsync: createPortfolio, isPending } = useMutationService({
    service: portfolioServices.createPortfolio,
  });
  const { mutateAsync: updatePortfolio, isPending: isUpdating } = useMutationService<
    UpdatePortfolioRequest,
    any
  >({
    service: portfolioDynamicEndpoints.updatePortfolio(portfolioId || 0),
  });

  const fetchStudents = async (classroomId: number) => {
    if (!classroomId) {
      setStudents([]);
      return;
    }
    try {
      const res: any = await getStudents({ classroomId: classroomId, status: "active" });
      const list = res?.data?.students ?? res?.data ?? [];
      setStudents(
        list.map((s: any) => ({
          value: String(s.id),
          name: `${s?.user?.firstName ?? ""} ${s?.user?.lastName ?? ""}`.trim(),
        })),
      );
    } catch {}
  };

  useEffect(() => {
    if (!open) {
      reset();
      setStudents([]);
      return;
    }
    if (mode === "edit" && initialValues) {
      const startDate = initialValues.startDate
        ? new Date(initialValues.startDate).toISOString().split("T")[0]
        : "";
      const endDate = initialValues.endDate
        ? new Date(initialValues.endDate).toISOString().split("T")[0]
        : "";
      reset({
        classroomId: initialValues.classroomId ? String(initialValues.classroomId) : "",
        studentId: initialValues.studentId ? String(initialValues.studentId) : "",
        startDate,
        endDate,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initialValues]);

  useEffect(() => {
    if (mode === "edit") return;
    if (selectedClassroomId && Number(selectedClassroomId)) {
      setValue("studentId", ""); // Reset student
      fetchStudents(Number(selectedClassroomId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassroomId, mode]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (mode === "edit" && portfolioId) {
        await updatePortfolio({
          classroomId: Number(data.classroomId),
          studentId: Number(data.studentId),
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
        });
      } else {
        await createPortfolio({
          classroomId: Number(data.classroomId),
          studentId: Number(data.studentId),
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
        });
      }
      // showToast({
      //   message: mode === "edit" ? "Report updated successfully" : "Report created successfully",
      //   severity: "success",
      // });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      // showToast({
      //   message: error.message || (mode === "edit" ? "Failed to update report" : "Failed to create report"),
      //   severity: "error",
      // });
    }
  };

  const formId = `create-portfolio-form-${mode}`;
  const formContent = (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Box
        className={`flex flex-col gap-4 py-4 ${!isMobile ? "border-t border-border-light" : ""}`}
        sx={{
          maxHeight: !isMobile ? "380px" : "unset",
          overflowY: !isMobile ? "auto" : "unset",
        }}
      >
        <CWDropdown
          name="classroomId"
          control={control}
          options={classroomOptions}
          isForm
          requiredAsterisk
          textFieldProps={{
            label: "Classroom",
            labelClassName: "!text-sm !font-medium !text-input-gray",
            placeholder: "Select Classroom",
            inputClasses: "mt-1 !text-xs !h-10",
            labelOnTop: true,
            className: "!w-full",
            disabled: mode === "edit",
            isRounded: isMobile,
          }}
          dialogBodyClassName="!p-0"
          maxDialogWidth={100}
          onLoadMore={fetchMoreClassRoom}
          hasMore={hasMoreClassRoom}
        />

        <CWDropdown
          name="studentId"
          control={control}
          options={studentOptions}
          isForm
          requiredAsterisk
          textFieldProps={{
            label: "Student",
            labelClassName: "!text-sm !font-medium !text-input-gray",
            placeholder:
              selectedClassroomId && studentOptions.length === 0
                ? "No students available"
                : "Select Student",
            inputClasses: "mt-1 !text-xs !h-10",
            labelOnTop: true,
            className: "!w-full",
            disabled: mode === "edit" || !selectedClassroomId || studentOptions.length === 0,
            isRounded: isMobile,
          }}
          dialogBodyClassName="!p-0"
          maxDialogWidth={100}
        />

        <Box className="grid grid-cols-2 gap-4">
          <Controller
            name="startDate"
            control={control}
            rules={{
              required: "Start Date is required",
              validate: (val) => {
                const end = getValues("endDate");
                if (val && end && new Date(val) > new Date(end)) {
                  return "Start date cannot be later than end date";
                }
                return true;
              },
            }}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <DatePicker
                label="Start Dates"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray !mb-1"
                requiredAsterisk
                fullWidth
                value={value}
                onChange={(newVal) => {
                  onChange(newVal);
                  if (getValues("endDate")) {
                    trigger("endDate");
                  }
                }}
                errorText={error?.message}
                isRounded={isMobile}
              />
            )}
          />

          <Controller
            name="endDate"
            control={control}
            rules={{
              required: "End Date is required",
              validate: (val) => {
                const start = getValues("startDate");
                if (val && start && new Date(start) > new Date(val)) {
                  return "End date cannot be earlier than start date";
                }
                return true;
              },
            }}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <DatePicker
                label="End Date"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray !mb-1"
                requiredAsterisk
                fullWidth
                value={value}
                onChange={(newVal) => {
                  onChange(newVal);
                  if (getValues("startDate")) {
                    trigger("startDate");
                  }
                }}
                errorText={error?.message}
                isRounded={isMobile}
              />
            )}
          />
        </Box>
      </Box>

      {!isMobile && (
        <Box className="flex justify-end gap-3 pt-4 border-t border-border-light">
          <Button
            variant="outlined"
            onClick={onClose}
            className="!rounded-lg !px-6 !bg-background-offwhite/50 !text-primary-dark !border !border-border-table"
            disabled={isPending || isUpdating || isExternalLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="!px-6 !py-2 !rounded-lg"
            disabled={isPending || isUpdating || isExternalLoading}
          >
            {isPending || isUpdating ? (
              <CircularProgress size={20} className="!text-white" />
            ) : (
              "Save"
            )}
          </Button>
        </Box>
      )}
    </form>
  );

  const mobileFooter = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700"
        disabled={isPending || isUpdating || isExternalLoading}
      >
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        disabled={isPending || isUpdating || isExternalLoading}
        className="flex-1 py-3 rounded-lg bg-brandColor-active text-white text-sm font-medium flex items-center justify-center gap-2"
      >
        {isPending || isUpdating ? <CircularProgress size={16} className="!text-white" /> : "Save"}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer
        open={open}
        onClose={onClose}
        title={mode === "edit" ? "Edit Report" : "Create a New Report"}
        footer={mobileFooter}
      >
        <Box className="flex flex-col gap-3">
          <Box className="flex flex-col gap-1 py-4">
            <Typography className="!text-sm !text-[#475467] !font-normal">
              {mode === "edit"
                ? "Update the reporting duration for this child."
                : "Select a child to create a report for tracking their learnings."}
            </Typography>
          </Box>
          {formContent}
        </Box>
      </MobileFormDrawer>
    );
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="md:w-[500px] w-[90vw] !p-6 !rounded-md"
      width="500px"
    >
      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between">
          <Box className="flex flex-col gap-1">
            <Typography className="!text-lg !font-bold !text-text-primary">
              {mode === "edit" ? "Edit Report" : "Create a New Report"}
            </Typography>
            <Typography className="!text-sm !text-[#475467] !font-normal">
              {mode === "edit"
                ? "Update the reporting duration for this child."
                : "Select a child to create a report for tracking their learnings."}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" className="!p-0">
            <CloseIcon />
          </IconButton>
        </Box>

        {formContent}
      </Box>
    </Modal>
  );
}
