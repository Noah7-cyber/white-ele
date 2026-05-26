"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Button } from "../../../shared/component/Button";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Modal } from "@/modules/shared/component/modal";
import { Question, QuestionModalProps } from "../../page/CreateTourPage/tour.constants";

export default function QuestionLongTextModal({ isOpen, onClose, onSave }: QuestionModalProps) {
  const { control, handleSubmit } = useForm<Question>();
  const [required, setRequired] = useState<boolean>(true);
  const [minChars, setMinChars] = useState<number>(0);
  const [maxChars, setMaxChars] = useState<number>(1000);

  const handleSave = (data: Question) => {
    const payload = {
      inputType: "longText",
      label: data.label,
      placeHolder: data.placeHolder,
      maxChar: data.maxChar,
      minChar: data.minChar,
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
            <CWTextField
              control={control}
              name="InputType"
              type="number"
              label="Input Type"
              labelOnTop
              value={"longText"}
              labelClassName="!text-sm !font-medium !text-input-gray"
              placeholder="Long Text"
              inputClasses="mt-1 !text-sm !h-10"
              disabled
            />
          </div>

          <div>
            <CWTextField
              control={control}
              name="label"
              label="Label"
              labelClassName="!text-sm !font-medium !text-input-gray"
              labelOnTop
              placeholder="Additional Notes"
              inputClasses="mt-1 !text-sm !h-10"
            />
          </div>

          <div>
            <CWTextField
              control={control}
              name="placeholder"
              label="Placeholder"
              labelClassName="!text-sm !font-medium !text-input-gray"
              labelOnTop
              placeholder="Enter brief description"
              inputClasses="mt-1 !text-sm !h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="minChars" className="text-sm font-medium text-gray-600">
                Minimum Characters
              </label>
              <input
                id="minChars"
                type="number"
                value={minChars}
                onChange={(e) => setMinChars(Number(e.target.value))}
                className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                min={0}
                placeholder="0"
                aria-label="Minimum characters"
              />
            </div>
            <div>
              <label htmlFor="maxChars" className="text-sm font-medium text-gray-600">
                Maximum Characters
              </label>
              <input
                id="maxChars"
                type="number"
                value={maxChars}
                onChange={(e) => setMaxChars(Number(e.target.value))}
                className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                min={0}
                placeholder="1000"
                aria-label="Maximum characters"
              />
            </div>
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
