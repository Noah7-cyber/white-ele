// components/ActivityFeed.tsx
import React from "react";
import WeekCalendar from "../../modules/admin/component/WeekCalendar/weekCalendar";

interface Activity {
  id: string | number;
  message: string;
  time: string; // e.g. "17:16 pm"
}

interface ActivityFeedProps {
  month: number; // 0-11 (0 = Jan, 8 = Sep)
  year: number;
  activeDay?: number;
  activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ month, year, activeDay, activities }) => {
  return (
    <div className="bg-white p-4 h-[517px] max-w-full font-sans">
      {/* Header with Month */}
      <WeekCalendar initialMonth={month} initialYear={year} activeDay={activeDay} />

      {/* Activity List */}
      <div className="relative">
        <h2 className="font-semibold mb-2">Recent Activity</h2>
        <a href="#" className="absolute right-0 top-0 text-sm text-gray-500 hover:underline">
          View All
        </a>
        <ul className="space-y-4 text-xs">
          {activities.map((activity, idx: number) => (
            <li key={activity.id} className="relative pl-6">
              <span
                className={`absolute left-[3px] top-2 w-[1px] h-16 border-gray-200 border border-dashed ${
                  idx === activities.length - 1 ? "hidden" : ""
                }`}
              ></span>
              <span className="absolute left-0 top-2 w-2 h-2 bg-gray-300 rounded-full"></span>
              <p className="text-sm">{activity.message}</p>
              <span className="block text-xs text-gray-500">{activity.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ActivityFeed;
