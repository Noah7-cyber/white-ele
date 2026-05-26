/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Box, Typography, IconButton, Collapse } from "@mui/material";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { useRouter } from "next/navigation";

import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import CalendarIcon from "@/modules/shared/assets/svgs/calendarLinear.svg";
import ChevronDownIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import EditIcon from "@/modules/shared/assets/svgs/editColored.svg";
import TrashIcon from "@/modules/shared/assets/svgs/trash.svg";
import useManageCurriculum from "./hooks/useManageCurriculum";
import Image from "next/image";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { DropdownOption } from "@/modules/shared/component/Dropdown";
import { Button } from "@/modules/shared/component/Button";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import {
  academicYear,
  terms,
} from "@/modules/shared/component/Learning/manageCurriculum.constants";
import PlusIcon from "@/modules/shared/assets/svgs/addBorder.svg";
import SendIcon from "@/modules/shared/assets/svgs/publish.svg";
import { AddSubjectModal } from "@/modules/shared/component/Learning/AddSubjectModal/AddSubjectModal";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import { SubjectAttachment } from "@/modules/shared/component/Learning/manageCurriculum.constants";
import { Controller } from "react-hook-form";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";

export function ManageCurriculum() {
  const router = useRouter();
  const {
    control,
    setValue,
    curriculumId,
    handleSubmit,
    handleSaveDraft,
    setSelectedCategories,
    subjects,
    isSubjectModalOpen,
    openAddSubjectModal,
    openEditSubjectModal,
    closeSubjectModal,
    handleAddSubject,
    handleDeleteSubject,
    editingSubject,
    expandedSubjects,
    toggleSubjectExpand,
    subjectControl,
    staffOptions,
    classroomOptions,
    isCreatingCurriculum,
    isUpdatingCurriculum,
    isLoadingCurriculum,
  } = useManageCurriculum();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getFileTypeLabel = (typeOrName: string): string => {
    // If it's a MIME type
    if (typeOrName === "application/pdf") return "PDF";
    if (typeOrName === "application/msword") return "DOC";
    if (typeOrName === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      return "DOCX";

    // If it's a file name, infer from extension
    const name = typeOrName.toLowerCase();
    if (name.endsWith(".pdf")) return "PDF";
    if (name.endsWith(".doc")) return "DOC";
    if (name.endsWith(".docx")) return "DOCX";
    if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) return "IMG";

    return "Unknown";
  };

  // Type guard to check if item is a backend document object (with docName and documentUrl)
  const isBackendDocument = (item: any): boolean => {
    return (
      item &&
      typeof item === "object" &&
      "docName" in item &&
      "documentUrl" in item &&
      !(item instanceof File)
    );
  };

  // Helper to get file name
  const getAttachmentFileName = (attachment: File | SubjectAttachment | any): string => {
    if (attachment instanceof File) return attachment.name;
    if (attachment && typeof attachment === "object") {
      if ("name" in attachment) return attachment.name;
      if (isBackendDocument(attachment) && "docName" in attachment) return attachment.docName;
    }
    return "Unknown";
  };

  // Helper to get file size
  const getAttachmentFileSize = (attachment: File | SubjectAttachment | any): number | null => {
    if (attachment instanceof File) return attachment.size;
    if (attachment && typeof attachment === "object" && "size" in attachment) {
      return attachment.size;
    }
    // Backend documents don't have size
    return null;
  };

  const getAttachmentType = (attachment: File | SubjectAttachment | unknown): string => {
    // If it's a SubjectAttachment with type property
    if (attachment && typeof attachment === "object" && "type" in attachment) {
      const att = attachment as { type?: string };
      if (att.type) return att.type;
    }
    // If it's a File object
    if (attachment instanceof File) return attachment.type;
    // If it's a backend document, infer from docName
    if (isBackendDocument(attachment)) {
      const docName = (attachment as any).docName?.toLowerCase() || "";
      if (docName.endsWith(".pdf")) return "application/pdf";
      if (docName.endsWith(".doc")) return "application/msword";
      if (docName.endsWith(".docx"))
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (docName.endsWith(".png")) return "image/png";
      if (docName.endsWith(".jpg") || docName.endsWith(".jpeg")) return "image/jpeg";
    }
    // Otherwise, infer from name
    if (attachment && typeof attachment === "object" && "name" in attachment) {
      const att = attachment as { name?: string };
      return att.name || "";
    }
    return "";
  };

  // if (isLoadingCurriculum) {
  //   return (
  //     <Box className="h-full p-5 pb-8 flex items-center justify-center">
  //       <Typography className="!text-lg !text-text-tertiary">Loading curriculum...</Typography>
  //     </Box>
  //   );
  // }

  return (
    <>
      <Box className="h-full p-5 pb-8 space-y-6">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <ButtonIcon
              className="rounded-full !border !border-brandColor-active/20 !p- flex items-center justify-center"
              onClick={() => router.back()}
            >
              <Image src={LeftIcon} alt="" />
            </ButtonIcon>
            <Typography className="!text-xl !font-semibold !text-text-primary">
              {curriculumId ? "Edit Curriculum" : "Create Curriculum"}
            </Typography>
          </Box>
          <Box className="flex gap-2">
            {!curriculumId && (
              <Button
                className="!rounded-lg !px-4 !bg-transparent !text-sm !text-primary-dark !border !border-border-table"
                onClick={handleSaveDraft}
                startIcon={<EditIcon />}
              >
                Save to Draft
              </Button>
            )}
            <Button
              disabled={subjects.length === 0}
              loading={isCreatingCurriculum || isUpdatingCurriculum}
              className="!rounded-lg !px-4 !text-sm disabled:cursor-no-drop"
              onClick={handleSubmit}
              startIcon={!curriculumId && <SendIcon />}
            >
              {curriculumId ? "Save" : "Publish"}
            </Button>
          </Box>
        </Box>
        <DataRenderer isLoading={isLoadingCurriculum}>
          {() => (
            <>
              <Box className="bg-white p-4 rounded-xl">
                <Box className=" flex flex-col gap-3">
                  <Box className="flex gap-3 w-full">
                    <CWTextField
                      control={control}
                      name="title"
                      label="Curriculum Title"
                      placeholder="Enter curriculum title"
                      labelOnTop
                      labelClassName="!text-sm !font-medium !text-input-gray"
                      inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                      className="flex-1"
                    />
                    <Controller
                      name="classroomIds"
                      control={control}
                      defaultValue={[]}
                      render={({ field: { value } }) => {
                        const arrayValue = Array.isArray(value) ? value : [];

                        return (
                          <CWDropdown
                            key={`classroom-ids-${classroomOptions.length}`}
                            name="classroomIds"
                            control={control}
                            options={classroomOptions}
                            isMultipleSelect
                            hasSearch
                            isForm
                            selectedValues={arrayValue}
                            onSelectedValues={(vals: any[]) => {
                              // Extract just the IDs (values) from the selected options
                              const ids = vals.map((val: any) => {
                                if (typeof val === "number") return val;
                                if (typeof val === "object" && val?.value !== undefined)
                                  return val.value;
                                return val;
                              });
                              setSelectedCategories(ids);
                              setValue("classroomIds", ids, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }}
                            textFieldProps={{
                              label: "Class (select more than 1)",
                              labelClassName: "!text-sm !font-medium !text-input-gray",
                              placeholder: "Select classroom(s)",
                              inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                              labelOnTop: true,
                              className: "!w-full",
                            }}
                            dialogBodyClassName="!p-0"
                            maxDialogWidth={100}
                          />
                        );
                      }}
                    />
                  </Box>
                  <Box className=" flex gap-3">
                    <CWDropdown
                      name="academicYear"
                      control={control}
                      options={academicYear.map((item) => ({
                        value: item.value,
                        name: item.label,
                      }))}
                      isForm
                      textFieldProps={{
                        label: "Academic year",
                        labelClassName: "!text-sm !font-medium !text-input-gray",
                        placeholder: "Select academic year",
                        inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                        labelOnTop: true,
                        className: "!w-full",
                      }}
                      dialogBodyClassName="!p-0"
                      maxDialogWidth={100}
                    />
                    <CWDropdown
                      name="term"
                      control={control}
                      options={terms.map((item) => ({
                        value: item.value,
                        name: item.label,
                      }))}
                      isForm
                      textFieldProps={{
                        label: "Term",
                        labelClassName: "!text-sm !font-medium !text-input-gray",
                        placeholder: "Select term",
                        inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                        labelOnTop: true,
                        className: "!flex !justify-center ",
                      }}
                    />
                    {/* {!curriculumId && (
                <Dropdown
                  options={assignedStaff}
                  isForm
                  textFieldProps={{
                    label: "Assigned Staff",
                    labelClassName: "!text-sm !font-medium !text-input-gray",
                    placeholder: "Select staff",
                    inputClasses: "mt-1 !text-xs !h-10 !text-input-gray",
                    labelOnTop: true,
                    className: "!flex !justify-center ",
                  }}
                />
              )} */}
                  </Box>
                  <Box className=" flex gap-3">
                    <CWTextField
                      control={control}
                      name="startDate"
                      label="Start Date"
                      placeholder="dd/mm/yyyy"
                      labelOnTop
                      slots={{ openPickerIcon: CalendarIcon }}
                      labelClassName="!text-sm !font-medium placeholder:!text-input-gray"
                      inputClasses="mt-1 !text-xs !h-10 !text-input-gray"
                      className="w-full"
                      type="date"
                    />
                    <CWTextField
                      control={control}
                      name="endDate"
                      label="End Date"
                      placeholder="dd/mm/yyyy"
                      labelOnTop
                      slots={{ openPickerIcon: CalendarIcon }}
                      labelClassName="!text-sm !font-medium placeholder:!text-input-gray"
                      inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                      className="w-full"
                      type="date"
                    />
                  </Box>
                  <Box className="">
                    <CWTextArea
                      control={control}
                      name="description"
                      label="Description"
                      placeholder="Enter brief description..."
                      labelOnTop
                      labelClassName="!text-sm !font-medium !text-input-gray"
                      inputClasses="mt-1 !text-xs !px-3.5 !py-3 !text-input-gray placeholder:!text-input-gra"
                      className="w-full"
                    />
                  </Box>
                </Box>
              </Box>

              <Box className="bg-white p-5  rounded-xl">
                <Box className="flex items-center justify-between mb-4">
                  <Box className="flex flex-col gap-1">
                    <Typography className="!text-sm !font-semibold !text-primary-dark">
                      Subjects ({subjects.length})
                    </Typography>
                    <Typography className="!text-xs !text-text-tertiary/70">
                      Add subjects that will be part of this curriculum
                    </Typography>
                  </Box>
                  <Button
                    className="!rounded-lg !px-4 !bg-transparent !text-text-tertiary/70 !border-none !text-sm !border-border-table"
                    // startIcon={<Image src={PlusIcon} alt="Add" width={16} height={16} />}
                    startIcon={<PlusIcon />}
                    onClick={openAddSubjectModal}
                  >
                    Add Subject
                  </Button>
                </Box>

                {subjects.length === 0 ? (
                  <Box className="flex flex-col items-center justify-center py-12">
                    <Typography className="!text-lg !font-medium !text-primary-lightGreen/30">
                      No subjects added yet
                    </Typography>
                  </Box>
                ) : (
                  <Box className="flex flex-col gap-3 ">
                    {subjects.map((subject) => {
                      const isExpanded = expandedSubjects.has(String(subject.id));
                      return (
                        <Box
                          key={String(subject.id)}
                          className="border border-border-input rounded-lg overflow-hidden"
                        >
                          <Box className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <Box className="flex items-center gap-3 flex-1">
                              <Box className="flex flex-col flex-1">
                                <Typography className="!text-sm !font-semibold !text-text-tertiary">
                                  {subject.title || subject.name}
                                </Typography>
                                <Typography className="!text-xs !text-text-tertiary/70">
                                  {subject.attachments.length} attachment
                                  {subject.attachments.length !== 1 ? "s" : ""}
                                </Typography>
                              </Box>
                            </Box>
                            <Box className="flex items-center gap-3.5">
                              <IconButton
                                size="small"
                                onClick={() => toggleSubjectExpand(subject.id)}
                                className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              >
                                <ChevronDownIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => openEditSubjectModal(subject)}
                              >
                                <EditIcon className="w-5" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSubject(subject.id)}
                              >
                                <TrashIcon className="w-" />
                              </IconButton>
                            </Box>
                          </Box>

                          <Collapse in={isExpanded}>
                            <Box className="px-4 pb-4 pt-2 border-t border-border-input">
                              <Box className="flex flex-col gap-4 mt-4">
                                <Box>
                                  <Typography className="!text-sm !font-semibold !text-primary-dark mb-2">
                                    Description
                                  </Typography>
                                  <Typography className="!text-sm !text-gray-700">
                                    {subject.description}
                                  </Typography>
                                </Box>

                                {(subject.assignedStaff || subject.assignedTeachers) && (
                                  <Box>
                                    <Typography className="!text-sm !font-semibold !text-primary-dark mb-2">
                                      Assigned Staff
                                    </Typography>
                                    <Box className="flex flex-wrap gap-2">
                                      {(() => {
                                        // Normalize to array format for display
                                        let staffToDisplay: Array<
                                          number | { id: number; name: string }
                                        > = [];

                                        if (
                                          subject.assignedStaff &&
                                          Array.isArray(subject.assignedStaff)
                                        ) {
                                          staffToDisplay = subject.assignedStaff;
                                        } else if (subject.assignedTeachers) {
                                          if (Array.isArray(subject.assignedTeachers)) {
                                            staffToDisplay = subject.assignedTeachers;
                                          } else {
                                            // Single value - convert to array
                                            staffToDisplay = [subject.assignedTeachers];
                                          }
                                        }

                                        return staffToDisplay.map(
                                          (
                                            staffIdOrObj: number | { id: number; name: string },
                                            index: number,
                                          ) => {
                                            // Handle both number IDs and objects with id/name
                                            const staffId =
                                              typeof staffIdOrObj === "object" && staffIdOrObj?.id
                                                ? staffIdOrObj.id
                                                : (staffIdOrObj as number);
                                            const staffName =
                                              typeof staffIdOrObj === "object" && staffIdOrObj?.name
                                                ? staffIdOrObj.name
                                                : undefined;
                                            const staff = staffOptions.find(
                                              (opt) => opt.value === staffId,
                                            );
                                            return (
                                              <Box
                                                key={`staff-${staffId}-${index}`}
                                                className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg"
                                              >
                                                <Typography className="!text-xs !font-medium !text-blue-700">
                                                  {staffName ||
                                                    staff?.name ||
                                                    `Staff ID: ${staffId}`}
                                                </Typography>
                                              </Box>
                                            );
                                          },
                                        );
                                      })()}
                                    </Box>
                                  </Box>
                                )}

                                {subject.attachments.length > 0 && (
                                  <Box>
                                    <Typography className="!text-sm !font-semibold !text-primary-dark mb-2">
                                      Attachments
                                    </Typography>
                                    <Box className="grid grid-cols-2 gap-3">
                                      {subject.attachments.map((attachment, index) => {
                                        const attachmentType = getAttachmentType(attachment);
                                        const fileName = getAttachmentFileName(attachment);
                                        const fileSize = getAttachmentFileSize(attachment);
                                        const fileTypeLabel = getFileTypeLabel(
                                          attachmentType || fileName || "",
                                        );

                                        return (
                                          <Box
                                            key={`${subject.id}-attachment-${index}`}
                                            className="flex items-center gap-3 p-3 border border-border-input rounded-lg bg-gray-50"
                                          >
                                            <Box className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                              <Typography className="!text-xs !font-semibold !text-blue-600">
                                                {fileTypeLabel}
                                              </Typography>
                                            </Box>
                                            <Box className="flex flex-col flex-1 min-w-0">
                                              <Typography className="!text-sm !font-medium !text-primary-text truncate">
                                                {fileName}
                                              </Typography>
                                              <Typography className="!text-xs !text-gray-500">
                                                File Format: {fileTypeLabel}
                                                {fileSize !== null &&
                                                  ` • File Size: ${formatFileSize(fileSize)}`}
                                              </Typography>
                                            </Box>
                                          </Box>
                                        );
                                      })}
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </>
          )}
        </DataRenderer>
      </Box>

      <AddSubjectModal
        key={editingSubject ? `edit-${editingSubject.id}` : "add-new"}
        isOpen={isSubjectModalOpen}
        onClose={closeSubjectModal}
        onSubmit={handleAddSubject}
        control={subjectControl}
        // attachments={subjectAttachments}
        // onFileUpload={handleSubjectFileUpload}
        // onRemoveAttachment={handleRemoveSubjectAttachment}
        isEditing={!!editingSubject}
        staffOptions={staffOptions as unknown as DropdownOption<number>[]}
      />
    </>
  );
}
