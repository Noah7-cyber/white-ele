/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Toggle, RowItem } from "@/constants";
import { intervalOptions, resetOptions, unitOptions } from "../tour.constants";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import { useWatch } from "react-hook-form";

interface NotificationsProps {
  control: any;
  setValue: any;
  getValues: any;
}

const Notifications = ({ control, setValue, getValues }: NotificationsProps) => {
  const durationLimit = useWatch({
    control,
    name: "notification.limitTotalTourDuration",
    defaultValue: getValues("notification.limitTotalTourDuration") || false,
  });

  const upcomingLimit = useWatch({
    control,
    name: "notification.limitNumberOfUpcomingTours",
    defaultValue: getValues("notification.limitNumberOfUpcomingTours") || false,
  });

  const confirmation = useWatch({
    control,
    name: "notification.confirmation",
    defaultValue: getValues("notification.confirmation") || true,
  });

  // Helper function to update RHF state for a toggle
  const handleToggleChange = (name: string, newValue: boolean) => {
    setValue(`notification.${name}`, newValue, { shouldValidate: true, shouldDirty: true });
  };
  return (
    <div className="px-6 py-5">
      <div className="bg-white rounded-2xl p-6 space-y-6">
      <h2 className="text-lg font-semibold mb-4">Buffer Period</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <CWDropdown
              name="notification.beforeTour"
              control={control}
              options={resetOptions}
              isForm
              onChangeValue={(value) => {
                setValue("notification.beforeTour", value);
              }}
              textFieldProps={{
                label: "Before Tour",
                labelClassName: "!text-sm !font-medium !text-input-gray",
                labelOnTop: true,
                placeholder: "No reset time",
                inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                className: "!w-full",
              }}
            />
          </div>

          <div>
            <CWDropdown
              name="notification.afterTour"
              control={control}
              options={resetOptions}
              isForm
              onChangeValue={(value) => {
                setValue("notification.afterTour", value);
              }}
              textFieldProps={{
                label: "After Tour",
                labelClassName: "!text-sm !font-medium !text-input-gray",
                labelOnTop: true,
                placeholder: "No reset time",
                inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                className: "!w-full",
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col items-left justify-center gap-1">
            <div className="">
              <label className="block text-sm font-medium text-gray-700 mb-2 ">
                Minimum Notice (before tour)
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <CWTextField
                control={control}
                name="notification.minimumNotice"
                labelOnTop={false}
                placeholder="2"
                type="number"
                min={0}
                max={59}
                inputClasses="!text-sm !h-10"
                className="w-full"
              />

              <div className="">
                <CWDropdown
                  name="notification.minimumNoticeUnit"
                  control={control}
                  options={unitOptions}
                  isForm
                  onChangeValue={(value) =>
                    setValue("notification.minimumNoticeUnit", value, { shouldValidate: true })
                  }
                  textFieldProps={{
                    labelOnTop: false,
                    placeholder: "Hours",
                    inputClasses: "!text-sm !h-10 !text-input-gray",
                    className: "w-full",
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <CWDropdown
              name="notification.timeSlotInterval"
              options={intervalOptions}
              isForm
              control={control}
              onChangeValue={(value) =>
                setValue("notification.timeSlotInterval", value)
              }
              textFieldProps={{
                label: "Time-slot Intervals",
                labelClassName: "!text-sm !mb-2 !font-medium !text-input-gray",
                labelOnTop: true,
                placeholder: "Use tour length (default)",
                inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                className: "!w-full",
              }}
            />
          </div>
        </div>

        <div className="border-t border-[#008080]/20 py-6 flex flex-col gap">
          <RowItem
            title="Limit total tour duration"
            subtitle="Limit the total number of hours available for tours."
            control={
              <Toggle
                checked={durationLimit}
                onChange={(newValue) => handleToggleChange("limitTotalTourDuration", newValue)}
              />
            }
          />
          <div className="border-b border-[#008080]/20 my-3"></div>

          <RowItem
            title="Limit number of upcoming tours per family"
            subtitle="Restrict how many pending tour bookings a family can have."
            control={
              <Toggle
                checked={upcomingLimit}
                onChange={(newValue) => handleToggleChange("limitNumberOfUpcomingTours", newValue)}
              />
            }
          />
          <div className="border-b border-[#008080]/20 my-3"></div>

          <RowItem
            title="Confirmation"
            subtitle="The parents should select how to receive confirmations"
            control={
              <Toggle
                checked={confirmation}
                onChange={(newValue) => handleToggleChange("confirmation", newValue)}
              />
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Notifications;
