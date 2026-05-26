"use client";
import React, { useMemo } from "react";

import { ScheduleData, TimeSlot } from "../helpers";
const TimeSlotsPanel: React.FC<{
  selectedDate: string | null;
  scheduleData: ScheduleData;
  onSlotSelect: (slot: TimeSlot) => void;
  isInteractive?: boolean;
}> = ({ selectedDate, scheduleData, onSlotSelect, isInteractive = false }) => {
  
  const slots = selectedDate ? scheduleData[selectedDate] : [];
  
  // Format the date for the header (e.g., "FRI 31")
  const headerDate = useMemo(() => {
    if (!selectedDate) return 'Select Date';
    try {
        const date = new Date(selectedDate);
        const dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
        const dayOfMonth = date.getDate();
        return `${dayOfWeek} ${dayOfMonth}`;
    } catch {
        return 'Select Date';
    }
  }, [selectedDate]);


  return (
    <div className="p-6 border-l border-gray-100 shrink-0 w-full lg:w-[30%]">
      <h3 className="text-[#001F1FB2]/70 font-semibold mb-6 text-left">
        {headerDate}
      </h3>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden pr-2">
        {slots && slots.length > 0 ? (
          slots.map((slot, index) => (
            isInteractive ? (
              <button
                key={index}
                className={`w-full py-3 px-4 rounded-lg text-input-gray text-center font-medium text-xs transition duration-150 ease-in-out shadow-sm
                  ${slot.available 
                    ? 'bg-white border border-border-input hover:bg-[#008080]/10 hover:text-[#008080]'
                    : 'hidden'
                  }`}
                disabled={!slot.available}
                onClick={() => {
                  if (slot.available) {
                    onSlotSelect(slot);
                  }
                }}
              >
                {slot.time}
              </button>
            ) : (
              <div
                key={index}
                className={`w-full py-3 px-4 rounded-lg text-input-gray text-center font-medium text-xs transition duration-150 ease-in-out shadow-sm
                  ${slot.available 
                    ? 'bg-white border border-border-input'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
              >
                {slot.time}
              </div>
            )
          ))
        ) : (
          <div className="text-center text-gray-500 py-10">
            {selectedDate 
                ? "No available slots on this date." 
                : "Please select an available date on the calendar."
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotsPanel;