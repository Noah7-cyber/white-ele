/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import { TextField } from "@/modules/shared/component/TextField";
import { Button } from "@/modules/shared/component/Button";
import { Modal } from "@/modules/shared/component/modal";
import { TextArea } from "@/modules/shared/component/TextArea";
import { calculateGrade } from "@/modules/shared/component/Learning/grading.utils";

interface ManageAssessmentScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  student?: { name: string; score?: number; grade?: string; comment?: string };
}

export function ManageAssessmentScoreModal({
  isOpen,
  onClose,
  onSave,
  student,
}: ManageAssessmentScoreModalProps) {
  const [form, setForm] = useState({
    name: "",
    score: "",
    grade: "",
    comment: "",
  });

  // Populate form when editing existing record
  useEffect(() => {
    if (student) {
      setForm({
        name: student.name || "",
        score: student.score?.toString() || "",
        grade: student.grade || "",
        comment: student.comment || "",
      });
    }
  }, [student]);

  // Auto calculate grade based on score
  useEffect(() => {
    if (form.score) {
      const g = calculateGrade(form.score);
      setForm((f) => ({ ...f, grade: g }));
    }
  }, [form.score]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="!rounded-lg !p-6 !w-[600px]">
      <Box className="flex justify-between items-center gap-10">
        <div>
          <p className="text-xl font-semibold text-gray-800">Edit Score</p>
          <p className="text-sm text-gray-500 mt-1 max-w-[80%]">
            Update the score for {form.name || "this student"}. The grade will be auto-calculated.
          </p>
        </div>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <hr className="mt-3 border-[#D1D1D1]" />

      <Box className="flex flex-col gap-5 mt-5">
        <TextField
          label="Name"
          labelOnTop
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
          className="w-full"
          fullWidth
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        <TextField
          label="Score"
          labelOnTop
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
          className="w-full"
          fullWidth
          type="number"
          value={form.score}
          onChange={(e) => handleChange("score", e.target.value)}
        />
        <TextField
          label="Auto Grade"
          labelOnTop
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
          className="w-full"
          fullWidth
          value={form.grade}
        // disabled
        />
        <TextArea
          label="Comment"
          labelOnTop
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-xs !px-3.5 !py-3 !h-24 !text-input-gray placeholder:!text-input-gra"
          rows={5}
          className="w-full"
          placeholder="Type your message..."
          value={form.comment}
          onChange={(e) => handleChange("comment", e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            className="!rounded-lg !bg-[#F6F6F680]  !text-[#022F2F] !w-[100px] normal-case !border !border-border-gray"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="!rounded-lg normal-case !w-[100px]">
            Save
          </Button>
        </div>
      </Box>
    </Modal>
  );
}
