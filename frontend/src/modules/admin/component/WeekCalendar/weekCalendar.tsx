import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekCalendarProps {
  initialMonth?: number; // 0-11
  initialYear?: number;
  activeDay?: number;
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WeekCalendar: React.FC<WeekCalendarProps> = ({ initialMonth, initialYear, activeDay }) => {
  const [currentDate, setCurrentDate] = useState(
    dayjs(
      new Date(
        initialYear ?? dayjs().year(),
        initialMonth ?? dayjs().month(),
        activeDay ?? dayjs().date(),
      ),
    ),
  );

  // Find start of the week (Sunday) and end of the week (Saturday)
  const startOfWeek = currentDate.startOf('week');
  const weekDays = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));

  const monthName = currentDate.format('MMMM YYYY');

  const handlePrevWeek = () => setCurrentDate(currentDate.subtract(1, 'week'));
  const handleNextWeek = () => setCurrentDate(currentDate.add(1, 'week'));

  return (
    <div className="bg-white p-4 rounded-2xl font-sans w-full max-w-md">
      {/* Header with navigation */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevWeek} className="cursor-pointer">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-base font-semibold">{monthName}</span>
        <button onClick={handleNextWeek} className="cursor-pointer">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500 mb-2">
        {weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {/* Week day numbers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((day) => (
          <span
            key={day.format('DD-MM-YYYY')}
            className={`h-10 flex items-center justify-center rounded text-sm ${
              currentDate.isSame(day, 'day') ? 'bg-brandColor-active text-white' : 'text-gray-800'
            }`}
          >
            {day.date()}
          </span>
        ))}
      </div>
    </div>
  );
};

export default WeekCalendar;
