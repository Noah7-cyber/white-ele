// components/Calendar.tsx
'use client'
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  initialMonth?: number; // 0-11
  initialYear?: number;
  activeDay?: number;
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar: React.FC<CalendarProps> = ({ initialMonth, initialYear, activeDay }) => {
  const [currentMonth, setCurrentMonth] = useState(initialMonth ?? dayjs().month());
  const [currentYear, setCurrentYear] = useState(initialYear ?? dayjs().year());

  const monthStart = dayjs(new Date(currentYear, currentMonth, 1));
  const monthEnd = monthStart.endOf('month');
  const startDay = monthStart.day(); // weekday index (0=Sun)
  const daysInMonth = monthEnd.date();

  // Build calendar grid (42 cells = 6 weeks × 7 days)
  const calendarDays: (dayjs.Dayjs | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null); // empty slots before month starts
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(dayjs(new Date(currentYear, currentMonth, d)));
  }
  while (calendarDays.length < 42) {
    calendarDays.push(null); // fill trailing slots
  }

  const monthName = dayjs(new Date(currentYear, currentMonth)).format('MMMM YYYY');

  const handlePrevMonth = () => {
    const newDate = dayjs(new Date(currentYear, currentMonth, 1)).subtract(1, 'month');
    setCurrentMonth(newDate.month());
    setCurrentYear(newDate.year());
  };

  const handleNextMonth = () => {
    const newDate = dayjs(new Date(currentYear, currentMonth, 1)).add(1, 'month');
    setCurrentMonth(newDate.month());
    setCurrentYear(newDate.year());
  };

  return (
    <div className="bg-white p-4 rounded-2xl font-sans w-full max-w-md">
      {/* Header with navigation */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth}>
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-base font-semibold">{monthName}</span>
        <button onClick={handleNextMonth}>
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500 mb-2">
        {weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map((day, i) => (
          <span
            key={i}
            className={`h-10 flex items-center justify-center rounded text-sm ${
              day
                ? activeDay === day.date() &&
                  day.month() === currentMonth &&
                  day.year() === currentYear
                  ? 'bg-green-600 text-white'
                  : 'text-gray-800'
                : 'text-transparent'
            }`}
          >
            {day ? day.date() : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
