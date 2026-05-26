// ProfileInfoCard.tsx
import React from "react";
import classNames from "classnames";

type InfoItem = {
  label?: string;
  value: string | number;
};

export default function ProfileInfoCard({
  title,
  data = [],
  compact,
}: {
  title?: string;
  data: InfoItem[];
  /** Attendance / detail mobile: tighter typography and spacing */
  compact?: boolean;
}) {
  return (
    <div
      className={classNames(
        "w-full bg-white border border-gray-200 rounded-xl",
        compact ? "p-4 shadow-sm border-[#E4E7EC]" : "p-6",
      )}
    >
      {title && (
        <h2
          className={classNames(
            "font-semibold text-gray-800 mb-4",
            compact ? "text-base" : "text-xl",
          )}
        >
          {title}
        </h2>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4 w-full">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span
              className={classNames(
                compact ? "text-xs text-[#5B6B88] font-medium" : "text-sm text-gray-500",
              )}
            >
              {item.label}
            </span>
            <span
              className={classNames(
                compact ? "text-sm font-semibold text-[#022F2F]" : "text-sm text-gray-800",
              )}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
