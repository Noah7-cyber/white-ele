"use client";

import React, { useEffect, useMemo, useState } from "react";

export default function KioskDateTime() {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => {
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(now);
    const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit" }).format(now);
    const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(now);
    const year = new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(now);
    return `${weekday}, ${day} ${month}, ${year}`;
  }, [now]);

  const formattedTime = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(now);
  }, [now]);

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-[#E4E7EC] bg-white px-3 py-1.5 text-[#022F2F] shadow-sm sm:px-4">
      <span className="text-[11px] font-medium sm:text-xs">{formattedDate}</span>
      <span className="h-3.5 w-px bg-[#D0D5DD]" aria-hidden="true" />
      <span className="text-[11px] font-semibold tabular-nums sm:text-xs">{formattedTime}</span>
    </div>
  );
}
