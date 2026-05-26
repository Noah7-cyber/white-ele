import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import React from "react";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { Button } from "@/modules/shared/component/Button";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { ScheduleTourRequest, TourQuestion } from "@/services/tour.service";
import { TimeSlot } from "../helpers";
import { useBookingForm, SOURCE_OPTIONS } from "../hooks/useBookingForm";

const BookingForm: React.FC<{
  onBack: () => void;
  onBookingConfirmed: (formData: ScheduleTourRequest) => void;
  tourId?: number;
  selectedDate: string;
  selectedSlot: TimeSlot;
  tourQuestions?: TourQuestion[];
}> = ({ onBack, onBookingConfirmed, selectedDate, selectedSlot, tourId, tourQuestions = [] }) => {
  const {
    control,
    setValue,
    formHandleSubmit,
    handleSubmit,
    extraKeysWithQuestion,
    isSchedulingTour,
  } = useBookingForm({
    tourId,
    selectedDate,
    selectedSlot,
    tourQuestions,
    onBookingConfirmed,
  });

  return (
    <div className="pt-4 pb-4 pl-8 pr-4 border-l border-[#7D7D7DCC]/80 w-full lg:w-2/3 min-h-[min(70vh,660px)] flex flex-col">
      <form
        onSubmit={formHandleSubmit(handleSubmit)}
        className="flex flex-col flex-1 min-h-0 w-full"
      >
        <div className="flex-1 flex flex-col justify-start gap-4 py-4">
          <CWTextField
            control={control}
            name="parentName"
            label="Parent Name"
            placeholder="Enter name"
            labelOnTop
            requiredAsterisk
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
            className="w-full"
          />

          <CWTextField
            control={control}
            name="email"
            label="Email Address"
            placeholder="Enter email address"
            labelOnTop
            requiredAsterisk
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
            className="w-full"
            type="email"
          />

          {extraKeysWithQuestion.map(({ key, question }) => {
            const label =
              question.label || "" +
              (question.isRequired === true ? <span className="text-red-500 ml-0.5">*</span> : "");
            const placeholder = question.placeHolder || "";
            if (question.inputType === "longText") {
              return (
                <CWTextArea
                  key={key}
                  control={control}
                  name={`extraQuestions.${key}`}
                  label={label}
                  placeholder={placeholder}
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !text-input-gray !h-24"
                  className="w-full"
                />
              );
            }
            if (question.inputType === "guests") {
              return (
                <CWTextField
                  key={key}
                  control={control}
                  name={`extraQuestions.${key}`}
                  label={label}
                  placeholder="Enter email addresses (comma separated)"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                  className="w-full"
                />
              );
            }
            if (question.inputType === "phoneNumber") {
              return (
                <CWTextField
                  key={key}
                  control={control}
                  name={`extraQuestions.${key}`}
                  label={label}
                  placeholder="Enter phone number"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                  className="w-full"
                  type="tel"
                />
              );
            }
            return (
              <CWTextField
                key={key}
                control={control}
                name={`extraQuestions.${key}`}
                label={label}
                placeholder={placeholder}
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
                type={question.inputType === "phone" ? "tel" : "text"}
              />
            );
          })}

          <div className="space-y-1">
            <div>
              <label className="text-sm font-medium text-gray-600">
                How did you hear about us?<span className="text-red-500 ml-0.5">*</span>
              </label>
              <Dropdown
                options={SOURCE_OPTIONS}
                isForm
                onChangeValue={(v) => setValue("source", v as string)}
                textFieldProps={{
                  labelOnTop: false,
                  placeholder: "Select source",
                  inputClasses: "mt-1 !text-sm !h-10",
                  className: "!w-full",
                }}
                dialogBodyClassName="!p-2 !overflow-hidden"
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col pt-4 border-t border-border-light mt-auto">
          <div className="flex items-center text-sm py-4">
            By proceeding, you agree to our <span className="font-semibold mx-1">Terms</span>and{" "}
            <span className="font-semibold mx-1">Privacy Policy.</span>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              onClick={onBack}
              className="rounded-lg! px-8! border! border-border-gray! bg-background-offwhite/50! text-primary-lightGreen!"
              disabled={isSchedulingTour}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="!px-9 !py-2 !rounded-lg !bg-[#007C79] !text-white !disabled:!opacity-50 !disabled:!cursor-not-allowed"
              disabled={isSchedulingTour}
            >
              {isSchedulingTour ? "Confirming..." : "Confirm"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
