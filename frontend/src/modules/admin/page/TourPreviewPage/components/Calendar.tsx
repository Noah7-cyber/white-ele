import React, { useCallback, useMemo } from "react";
import { ScheduleData } from "../helpers";
import { monthNames, dayNames } from "../helpers";
import IconRight from "@/modules/shared/assets/svgs/chevronRight.svg";
import IconLeft from "@/modules/shared/assets/svgs/chevronLeft.svg";

const CalendarView: React.FC<{
  currentMonth: number;
  currentYear: number;
  scheduleData: ScheduleData;
  selectedDate: string | null;
  setSelectedDate: (dateKey: string) => void;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
  isInteractive?: boolean;
}> = ({
  currentMonth,
  currentYear,
  scheduleData,
  selectedDate,
  setSelectedDate,
  setCurrentMonth,
  setCurrentYear,
  isInteractive = false,
}) => {
  const getCalendarDays = useCallback((month: number, year: number) => {
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (number | null)[] = [];

    // The calendar grid starts on Monday (0 is Monday, 6 is Sunday)
    // firstDayOfMonth (JS) returns: 0(Sun), 1(Mon), ..., 6(Sat)
    // Desired startOffset: 0(Mon), 1(Tue), ..., 6(Sun)
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    // Add nulls for the preceding days
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, []);

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth, currentYear),
    [currentMonth, currentYear, getCalendarDays],
  );

  const handleMonthChange = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDate(""); // Clear selected date on month change
  };

  const isDateAvailable = (day: number | null) => {
    if (!day) return false;
    const dateKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return !!scheduleData[dateKey] && scheduleData[dateKey].length > 0;
  };

  const handleDateClick = (day: number) => {
    if (!isInteractive) return;
    const dateKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (isDateAvailable(day)) {
      setSelectedDate(dateKey);
    }
  };

  return (
    <div className="p-6 shrink-0 w-full lg:w-[40%]">
      <h3 className="text-gray-800 font-normal mb-6">Select a Date & Time</h3>
      <div className="flex items-center justify-between mb-6">
        <button
          className="text-gray-400 hover:text-gray-700 transition"
          onClick={() => handleMonthChange(-1)}
          aria-label="Previous month"
        >
          {" "}
          <IconLeft />
        </button>
        <span className="font-bold text-sm text-gray-900">
          {monthNames[currentMonth - 1]} {currentYear}
        </span>
        <button
          className="text-gray-400 hover:text-gray-700 transition"
          onClick={() => handleMonthChange(1)}
          aria-label="Next month"
        >
          <IconRight />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-sm font-medium">
        {dayNames.map((day) => (
          <span key={day} className="text-gray-500 py-2">
            {day}
          </span>
        ))}
        {calendarDays.map((day, index) => {
          const dateKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isAvailable = isDateAvailable(day);
          const isSelected = selectedDate === dateKey;

          // Base class for circular, centered cell
          let dayClasses = "h-10 w-10 flex items-center justify-center p-1 rounded-full mx-auto";

          if (day !== null) {
            dayClasses += " font-medium";

            if (isAvailable) {
              // Base style for available dates: border and text color #008080
              dayClasses += " text-[#008080] transition";
              if (isInteractive) {
                dayClasses += " cursor-pointer";
              }
            } else {
              // Base style for non-available dates
              dayClasses += " text-gray-500";
            }

            if (isSelected) {
              // Selected style: solid background #008080, white text
              dayClasses = dayClasses.replace("text-[#008080]", "text-white");
              dayClasses += " bg-[#008080] shadow-md";
            } else if (isAvailable) {
              // Available but not selected: 20% opacity background
              dayClasses += " bg-[rgba(0,128,128,0.1)]";
              if (isInteractive) {
                dayClasses += " hover:bg-[rgba(0,128,128,0.3)]";
              }
            }
          } else {
            // Placeholder day
            dayClasses += " text-gray-500";
          }

          return (
            <div key={index} className="py-2">
              {day !== null ? (
                <div 
                  className={dayClasses}
                  onClick={() => day !== null && handleDateClick(day)}
                >
                  {day}
                </div>
              ) : (
                <div className="h-10"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
