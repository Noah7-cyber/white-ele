"use client";

import React from "react";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";

export const MobileChildrenCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-4 flex items-center gap-3 animate-pulse">
    {/* Avatar placeholder */}
    <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0" />

    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
      {/* Left: name + age */}
      <div className="flex flex-col gap-3">
        <div className="h-3 w-28 bg-gray-200 rounded" />
        <div className="h-3 w-14 bg-gray-200 rounded" />
      </div>
      {/* Right: classroom + status */}
      <div className="flex flex-col gap-3 items-end">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
    </div>
  </div>
);

interface MobileChildrenCardProps {
  id: number;
  name: string;
  photoUrl?: string;
  classroom?: string | React.ReactNode;
  age: string;
  status?: string;
  onClick?: () => void;
  removePhoto?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-red-50 text-red-600",
};

export const MobileChildrenCard: React.FC<MobileChildrenCardProps> = ({
  name,
  photoUrl,
  classroom,
  age,
  status,
  onClick,
  removePhoto,
}) => {
  const statusKey = status?.toLowerCase();
  const statusStyle = STATUS_STYLES[statusKey || ""] ?? "bg-gray-100";
  const displayStatus =
    (status ?? "").charAt(0).toUpperCase() + (status ?? "").slice(1).toLowerCase();

  return (
    <div
      className="bg-white rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex flex-row gap-3">
            {!removePhoto && <InitialsAvatar
              src={photoUrl}
              name={name}
              className="w-6 h-6 shrink-0 p-1 object-cover truncate max-w-[180px]"
              imageClassName="rounded-full"
              initialsClassName="text-xs!"
            />}
            <div className="flex flex-col gap-3">
              <span className="text-sm text-blue-main font-medium truncate max-w-[180px]">{name}</span>
              <span className="text-xs text-blue-main">{age}</span>
            </div>
          </div>
          <div className="flex flex-col gap-4 self-start mt-2">
            {classroom ? (
              <>
                <span className="text-xs text-blue-main font-medium shrink-0">{classroom}</span>
                {status && (
                  <span
                    className={`text-xs text-blue-main font-medium rounded-full px-3 py-1 shrink-0 ${statusStyle}`}
                  >
                    {displayStatus}
                  </span>
                )}
              </>
            ) : (
              status && (
                <span
                  className={`text-xs text-blue-main font-medium rounded-full px-3 py-1 shrink-0 ${statusStyle}`}
                >
                  {displayStatus}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
