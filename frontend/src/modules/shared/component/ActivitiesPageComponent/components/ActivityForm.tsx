"use client";
import React, { FC, useCallback, useState } from "react";
import { Box, Checkbox, FormControlLabel } from "@mui/material";
import { Button } from "../../Button";
import "./activities.css";
import {ACTIVITY_FIELD_MAP,ActivityFormProps,AllActivityFormData, bathroomTypeOptions, mealTypeOptions,} from "../activities.constants";
import { CWTextArea } from "../../FormFields/CWTextArea";
import { CWTextField } from "../../FormFields/CWTextField";
import { CWDropdown } from "../../FormFields/CWDropdown";
import { Controller } from "react-hook-form";
import { activitiesServices } from "@/services/activities.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import CloudIcon from "@/modules/shared/assets/svgs/cloudIcon.svg";
import useActivityPhotoUpload from "../hooks/useActivityPhotoUpload";
import { showToast } from "@/modules/shared/component/Toast";
import { useUploadFile } from "@/utils/hooks/useUploadFile";

export const ActivityForm: FC<ActivityFormProps> = ({
  activityType,
  onClose,
  formControl,
  formSetValue,
  formGetValues,
  formReset,
  onActivityCreated,
  classroomOptions,
  studentOptions,
  isClassroomsLoading,
  selectedClassroomId,
}) => {
  const { mutateAsync: createActivitiesAsync, isPending: isCreatingActivities } = useMutationService({
    service: activitiesServices.createActivities,
    options: {
      isFormData: true,
    },
  });
  const { uploadPhoto, isUploadingPhoto } = useActivityPhotoUpload();
  const { uploadFile, isUploadingFile } = useUploadFile();
  // Photo upload state
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<"image" | "video" | "document" | "text" | null>(null);

  const processPhotoFile = useCallback(
    async (file: File) => {
      try {
        setUploadError(null);
        setFileName(file.name);
        const isImage = file.type.startsWith("image/");
        const uploadResult = isImage
          ? await uploadPhoto(file)
          : await uploadFile({ file });

        setSelectedMediaType(isImage ? "image" : 'video');
        formSetValue("photoUrl", uploadResult.url, { shouldValidate: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Photo upload failed", error);
        setUploadError(
          `Failed to upload media: ${error?.response?.data?.message || error?.message || "Unknown error"}`,
        );
        setFileName(null);
        setSelectedMediaType(null);
        formSetValue("photoUrl", "", { shouldValidate: true });
      }
    },
    [formSetValue, uploadFile, uploadPhoto],
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        void processPhotoFile(file);
      }
    },
    [processPhotoFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      void processPhotoFile(file);
    }
  };

  const handleBrowseClick = () => {
    document.getElementById("photo-upload")?.click();
  };

  const handleSubmit = async () => {
    const currentFormData = formGetValues();
    if (activityType === "photo" && !currentFormData.photoUrl) {
      showToast({
        message: "Photo required",
        description: "Please upload a photo before saving.",
        severity: "error",
      });
      return;
    }
    const fieldsToSubmit = ACTIVITY_FIELD_MAP[activityType];

    const dataToSend = fieldsToSubmit.reduce((acc, key) => {
      const value = currentFormData[key];
      if (value !== undefined && value !== null) {
        // @ts-expect-error - TypeScript won't know the exact resulting shape, but it's fine for runtime
        acc[key] = value;
      }
      return acc;
    }, {} as Partial<AllActivityFormData>);

    // studentIds is always expected as an array in the API payload
    const studentIds = currentFormData.studentIds;
    const studentIdArray = Array.isArray(studentIds)
      ? studentIds
      : studentIds != null
        ? [studentIds]
        : [];

    // For photo type: include time the activity was created if no time field
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const isPhoto = activityType === "photo";

    // Always put studentIds (array) into the API payload (rename if backend expects 'studentId')
    const finalPayload = {
      ...dataToSend,
      activityType: activityType,
      studentIds: studentIdArray,
      ...(isPhoto && {
        ...(currentFormData.photoUrl && { photoUrl: currentFormData.photoUrl }),
        timeGiven: timeString,
      }),
    };
    // Remove studentIds from payload so we don't send duplicate/wrong key
    // delete (finalPayload as Record<string, unknown>).studentIds;

    try {
      await createActivitiesAsync(finalPayload);
      formReset();
      setFileName(null);
      setSelectedMediaType(null);
      setDragActive(false);
      onClose();
      onActivityCreated?.();
    } catch (error) {
      console.error(error);
    }
  };

  // Get the list of fields to render for the current activityType
  const fieldsToRender = ACTIVITY_FIELD_MAP[activityType] || [];
  const isMedication = activityType === "medication";
  const isWater = activityType === "water";
  const isMeal = activityType === "meal";
  const isBathroom = activityType === "bathroom";
  const isPhoto = activityType === "photo";
  const isStudentDropdownDisabled = !selectedClassroomId || !!isClassroomsLoading;

  return (
    <>
      <Box className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] md:max-h-[70vh] max-md:max-h-none ">
        {/* Classroom Dropdown */}
        {fieldsToRender.includes("classroomId") && (
          <CWDropdown
            name="classroomId"
            control={formControl}
            options={classroomOptions}
            isForm
            hasSearch
            isLoading={isClassroomsLoading}
            onChangeValue={(value) => {
              const numericValue =
                typeof value === "number"
                  ? value
                  : typeof value === "string"
                    ? Number(value)
                    : undefined;

              formSetValue(
                "classroomId",
                typeof numericValue === "number" && !Number.isNaN(numericValue) ? numericValue : 0,
                { shouldValidate: true },
              );
              formSetValue("studentIds", [], { shouldValidate: true });
            }}
            textFieldProps={{
              label: "Classroom",
              labelClassName: "!text-sm !font-medium !text-input-gray",
              placeholder: "Select classroom",
              inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
              labelOnTop: true,
              className: "!w-full",
            }}
            // dialogBodyClassName="!p-2 !overflow-hidden"
          />
        )}
        {fieldsToRender.includes("studentIds") && (
          <CWDropdown
            name="studentIds"
            control={formControl}
            options={studentOptions}
            isMultipleSelect
            isForm
            hasSearch
            disabled={isStudentDropdownDisabled}
            emptyState={
              selectedClassroomId
                ? "No students assigned to this classroom yet."
                : "Select a classroom to view its students."
            }
            textFieldProps={{
              label: "Student",
              labelClassName: "!text-sm !font-medium !text-input-gray",
              placeholder: selectedClassroomId ? "Select Student" : "Select a classroom first",
              inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
              labelOnTop: true,
              className: "!w-full",
            }}
            // dialogBodyClassName="!p-2 !overflow-hidden"
          />
        )}

        {/* === PHOTO SPECIFIC FIELDS === */}
        {isPhoto && (
          <>
            {/* File Upload Area */}
            {fieldsToRender.includes("photoUrl") && (
              <Box className="flex flex-col gap-2">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors ${
                    dragActive ? "border-[#007C79] bg-gray-50" : "border-gray-300 bg-white"
                  }`}
                >
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center text-center cursor-pointer"
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full mb-3">
                      <CloudIcon />
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="text-primary-text font-medium">Click to upload</span> or drag
                      and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Images or videos supported
                    </p>
                  </label>

                  <input
                    id="photo-upload"
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg,.gif,.mp4,.mov,.avi"
                    onChange={handleFileChange}
                    disabled={isUploadingPhoto || isUploadingFile}
                    className="hidden"
                  />

                  <div className="flex items-center my-1.5 w-full">
                    <div className="border-t border-gray-200 w-full"></div>
                    <span className="text-xs text-gray-400 px-2">OR</span>
                    <div className="border-t border-gray-200 w-full"></div>
                  </div>

                  <Button
                    onClick={handleBrowseClick}
                    className="px-5 py-2.5 rounded-lg! bg-[#007C79]! text-white"
                    type="button"
                    loading={isUploadingPhoto || isUploadingFile}
                    disabled={isUploadingPhoto || isUploadingFile}
                  >
                    Browse Files
                  </Button>

                  {fileName && (
                    <p className="text-sm text-gray-500 mt-3">
                      Selected: <span className="font-medium">{fileName}</span>
                      {selectedMediaType ? ` (${selectedMediaType})` : ""}
                    </p>
                  )}
                  {(isUploadingPhoto || isUploadingFile) && (
                    <p className="text-xs text-[#007C79] mt-2">Uploading media...</p>
                  )}
                  {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
                </div>
              </Box>
            )}
          </>
        )}
        {/* === COMMON FIELDS: Time Inputs (Start/End) === */}
        {fieldsToRender.includes("startTime") && (
          <div className="flex gap-6 ">
            <CWTextField
              control={formControl}
              name="startTime"
              label="Start Time"
              placeholder="--:--  --"
              labelOnTop
              type="time"
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray time-picker-lg-icon "
              className="w-full"
            />
            <CWTextField
              control={formControl}
              name="endTime"
              label="End Time"
              placeholder="--:--  --"
              labelOnTop
              type="time"
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray time-picker-lg-icon "
              className="w-full"
            />
          </div>
        )}

        {/* === BATHROOM SPECIFIC FIELDS === */}
        {isBathroom && (
          <>
            {/* Bathroom Type and Time Given (Side-by-side) */}
            <Box className="flex flex-row gap-6 items-end">
              {fieldsToRender.includes("bathroomType") && (
                <CWDropdown
                  name="bathroomType"
                  control={formControl}
                  options={bathroomTypeOptions}
                  isForm
                  onChangeValue={(value) => {
                    formSetValue("bathroomType", value, { shouldValidate: true });
                  }}
                  textFieldProps={{
                    label: "Bathroom Type",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select bathroom type",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                  }}
                  // dialogBodyClassName="!p-2 !overflow-hidden"
                />
              )}
              {/* Time Given field */}
              {fieldsToRender.includes("timeGiven") && (
                <CWTextField
                  control={formControl}
                  name="timeGiven"
                  label="Time"
                  placeholder="--:--  --"
                  type="time"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !h-10 !text-input-gray time-picker-lg-icon "
                  className="w-full"
                />
              )}
            </Box>
          </>
        )}

        {/* === MEAL SPECIFIC FIELDS === */}
        {isMeal && (
          <>
            {/* Meal Type and Time Given (Side-by-side) */}
            <Box className="flex flex-row gap-6 items-end">
              {fieldsToRender.includes("mealType") && (
                <CWDropdown
                  name="mealType"
                  control={formControl}
                  options={mealTypeOptions}
                  isForm
                  onChangeValue={(value) => {
                    formSetValue("mealType", value, { shouldValidate: true });
                  }}
                  textFieldProps={{
                    label: "Meal Type",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select meal type",
                    inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!w-full",
                  }}
                  // dialogBodyClassName="!p-2 !overflow-hidden"
                />
              )}
              {/* Time Given field */}
              {fieldsToRender.includes("timeGiven") && (
                <CWTextField
                  control={formControl}
                  name="timeGiven"
                  label="Time"
                  placeholder="--:--  --"
                  labelOnTop
                  type="time"
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !h-10 !text-input-gray time-picker-lg-icon "
                  className="w-full"
                />
              )}
            </Box>

            {/* Food Item field */}
            {fieldsToRender.includes("foodItem") && (
              <CWTextField
                control={formControl}
                name="foodItem"
                label="Food Item"
                placeholder="Enter Food Item"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
              />
            )}
          </>
        )}

        {/* === MEDICATION SPECIFIC FIELDS === */}
        {isMedication && (
          <>
            <CWTextField
              control={formControl}
              name="medicationName"
              label="Medication Name"
              placeholder="Enter Medication Name"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
              className="w-full"
            />
          </>
        )}

        {/* === TIME INPUTS (CONDITIONAL LOGIC) === */}
        {/* We need to render the single time field for Water and Medication */}
        {!isMeal && (isWater || isMedication) && fieldsToRender.includes("timeGiven") && (
          <Box className="flex flex-row gap-6 items-end">
            {/* Note: If you only render one input, you might not need the surrounding <Box> */}
            {isMedication && (
              <CWTextField
                control={formControl}
                name="dosage"
                label="Dosage"
                placeholder="Enter dosage"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
              />
            )}
            <CWTextField
              control={formControl}
              name="timeGiven"
              label={`Time ${!isWater ? "Given" : ""}`}
              placeholder="--:--  --"
              labelOnTop
              type="time"
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray time-picker-lg-icon "
              className={isWater ? "w-full" : undefined}
            />
          </Box>
        )}

        {/* === COMMON FIELD: Notes Textarea === */}
        {fieldsToRender.includes("notes") && (
          <CWTextArea
            control={formControl}
            name="notes"
            label="Notes (optional)"
            placeholder="Add notes..."
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-xs !px-3.5 !pt-2 !pb-4 !text-input-gray placeholder:!text-input-gra"
            className="w-full"
          />
        )}

        {/* === COMMON FIELD: Notify Checkbox === */}
        {fieldsToRender.includes("notifyParent") && (
          <div className="md:border-b pb-5 border-solid border-border-light">
            <Controller
              name="notifyParent" // Must match the key in AllActivityFormData
              control={formControl} // Pass the control instance from the hook
              render={({ field: { onChange, value } }) => (
                <FormControlLabel
                  value="end" // 💡 Connect the checkbox's checked state to RHF's value
                  control={
                    <Checkbox
                      sx={{
                        "& .MuiSvgIcon-root": { fontSize: 14 },
                        "&.Mui-checked": { color: "#007C79" },
                      }}
                      checked={!!value} // RHF default is usually undefined/false, explicitly check it
                      onChange={(e) => onChange(e.target.checked)}
                    />
                  }
                  label="Notify parent/guardian"
                  labelPlacement="end"
                  sx={{}}
                />
              )}
            />
          </div>
        )}
      </Box>

      <div className="flex justify-end gap-3 md:-mt-2 mt-8 mb-6">
        <Button
          onClick={onClose}
          className="rounded-lg! px-8! border! border-border-gray! bg-background-offwhite/50! text-primary-lightGreen! flex-1 md:flex-0"
        >
          Cancel
        </Button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isUploadingPhoto || isCreatingActivities}
          className={`px-9 py-2 rounded-lg bg-[#007C79] text-white flex-1 md:flex-0 ${
            isUploadingPhoto || isCreatingActivities ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isCreatingActivities ? "Saving" : "Save"}
        </button>
      </div>
    </>
  );
};
