"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Button } from "../../../shared/component/Button";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Modal } from "@/modules/shared/component/modal";
import { Question, QuestionModalProps } from "../../page/CreateTourPage/tour.constants";

const inputTypes = ["Phone", "Short Text", "Long Text", "Multiple Emails"];

/** Map display label to API payload inputType (camelCase / expected values) */
const displayLabelToInputType: Record<string, string> = {
  Phone: "phone",
  "Short Text": "shortText",
  "Long Text": "longText",
  "Multiple Emails": "guests",
};

export default function QuestionAddModal({ isOpen, onClose, onSave }: QuestionModalProps) {
  const [type, setType] = useState<string>("Short Text");
  const { control, handleSubmit } = useForm<Question>();
  const [required, setRequired] = useState<boolean>(true);
  const handleSave = (data: Question) => {
    const inputType = displayLabelToInputType[type] ?? type;
    const payload = {
      inputType,
      label: data.label,
      placeHolder: data.placeHolder,
      isRequired: required,
    };
    onSave(payload);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="rounded-lg p-5 w-[640px]">
      <form onSubmit={handleSubmit(handleSave)}>
        <div className="flex items-center justify-between border-b border-[#008080]/20">
          <div className="">
            <h1 className="text-lg font-semibold">Add a question</h1>
            <p className="text-sm text-gray-500 mb-4">
              Customize the questions asked on the booking page
            </p>
          </div>
          <button type="button" aria-label="Close" className="cursor-pointer" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Input Type</label>
            <Dropdown
              options={inputTypes}
              isForm
              value={type}
              onChangeValue={(v) => setType(v as string)}
              textFieldProps={{
                labelOnTop: false,
                placeholder: "Select input type",
                inputClasses: "mt-1 !text-sm !h-10",
                className: "!w-full",
              }}
              dialogBodyClassName="!p-2 !overflow-hidden"
            />
          </div>

          <div>
            <CWTextField
              control={control}
              name="label"
              placeholder="Label"
              label="Label"
              labelClassName="!text-sm !font-medium !text-input-gray"
              labelOnTop
              inputClasses="mt-1 !text-sm !h-10"
            />
          </div>

          <div>
            <CWTextField
              control={control}
              name="placeHolder"
              placeholder="Placeholder"
              label="Placeholder"
              labelClassName="!text-sm !font-medium !text-input-gray"
              labelOnTop
              inputClasses="mt-1 !text-sm !h-10"
            />
          </div>

          <div className="flex items-center  mb-5 border-b border-[#008080]/20 py-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-[#007C79]"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
              />
              <span className="text-sm">Make this field required</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 mb-4">
            <Button
              onClick={onClose}
              className="rounded-lg! px-8! border! border-border-gray! bg-background-offwhite/50! text-primary-lightGreen!"
            >
              Cancel
            </Button>
            <button type="submit" className="px-9 py-2 rounded-lg bg-[#007C79] text-white">
              Save
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
