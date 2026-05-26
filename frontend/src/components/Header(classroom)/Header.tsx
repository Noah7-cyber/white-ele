"use client";

import { Bell, UserCircle2 } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  currentClassName?: string;
  currentClassSubtitle?: string;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

export default function Header({
  title = "Classroom",
  subtitle = "Manage classroom capacity, staff assignments and student enrollment",
  currentClassName = "Nursery A",
  currentClassSubtitle = "Class Assigned",
  onNotificationClick,
  onProfileClick,
}: HeaderProps) {
  return (
    <div className="bg-white rounded-2xl px-6 pt-6 pb-4 mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-green-900">{title}</h1>
        <p className="font-semibold text-green-900">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="relative p-2 rounded-full hover:bg-gray-100"
          onClick={onNotificationClick}
          title="Notifications"
        >
          <Bell className="w-6 h-6 text-green-900" />
          <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        <button
          className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-full"
          onClick={onProfileClick}
        >
          <UserCircle2 className="w-8 h-8 text-green-700" />
          <div className="flex flex-col items-start text-left">
            <span className="font-medium text-sm text-green-900">{currentClassName}</span>
            <span className="text-xs text-gray-500">{currentClassSubtitle}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
