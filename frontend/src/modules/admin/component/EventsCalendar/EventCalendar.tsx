/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import type { CalendarApi } from "@fullcalendar/core";
import { EventClickArg } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { useMediaQuery } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import dayjs, { Dayjs } from "dayjs";
import LeftIcon from "@/modules/shared/assets/svgs/chevronLeft.svg";
import RightIcon from "@/modules/shared/assets/svgs/chevronRight.svg";
import "./calendar.css";
import "tippy.js/dist/tippy.css";
import useEvents from "./hooks/useEvents";
import ClockIcon from "@/modules/shared/assets/svgs/clock.svg";
import EventDetailsModal from "./components/EventDetailModal";
import ViewTourBookingModal from "@/modules/admin/component/EventModal/ViewTourBookingModal";
import { BookedTour } from "@/services/tour.service";
import { EventDetails, EventLike, ModalPosition } from "./EventTypes";
import CustomViewSelect from "./components/ViewDropdown";



const colorClassMap: Record<string, string> = {
  teal: "teal",
  orange: "orange",
  purple: "purple",
  blue: "blue",
  green: "green",
};

const EVENT_LEGEND = [
  { label: "PTA", color: "#127A8A" },
  { label: "EVENTS", color: "#FE4711" },
  { label: "ASSIGNMENTS", color: "#7C3AEC" },
  { label: "EXTRA", color: "#17B26A" },
];

function CalendarLegend({ className = "" }: { className?: string }) {
  return (
    <div className={`calendar-legend ${className}`.trim()}>
      {EVENT_LEGEND.map((item) => (
        <div key={item.label} className="calendar-legend-item">
          <span
            className="calendar-legend-dot"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function CalendarView() {
  const isMobile = useMediaQuery("(max-width:768px)");
  const [calendarApi, setCalendarApi] = useState<CalendarApi | null>(null);
  const [rangeLabel, setRangeLabel] = useState("");
  const [view, setView] = useState("timeGridWeek");

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [modalPosition, setModalPosition] = useState<ModalPosition | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookedTour | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { events: bookedTourEvents, refetch } = useEvents();

  const activeView = isMobile ? "timeGridDay" : view;
  const mobileSlotMinTime = "09:00:00";
  const mobileSlotMaxTime = "18:00:00";

  useEffect(() => {
    const handleTourDeleted = () => {
      refetch();
    };

    window.addEventListener("tourDeleted", handleTourDeleted);
    return () => {
      window.removeEventListener("tourDeleted", handleTourDeleted);
    };
  }, [refetch]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const rect = clickInfo.el.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    const position: ModalPosition = {
      x: containerRect ? rect.left - containerRect.left : rect.left,
      y: containerRect ? rect.top - containerRect.top : rect.top,
    };

    const eventDetails = {
      id: event.id,
      title: event.title,
      start: event.start,
      extendedProps: event.extendedProps as EventDetails["extendedProps"],
    };

    setSelectedEvent(eventDetails);
    setModalPosition(position);
    setModalOpen(true);
    clickInfo.jsEvent.preventDefault();
  };

  useEffect(() => {
    const calendarEl = document.querySelector<HTMLElement>(".fc-timegrid-body");
    if (!calendarEl || !calendarApi) return;

    let line = calendarEl.querySelector<HTMLDivElement>(".custom-now-line");
    if (!line) {
      line = document.createElement("div");
      line.classList.add("custom-now-line");
      calendarEl.appendChild(line);
    }

    const updateLinePosition = () => {
      if (!line || !calendarApi) return;

      const slotMinTime = calendarApi.getOption("slotMinTime") as string;
      const slotMaxTime = calendarApi.getOption("slotMaxTime") as string;

      const parseTime = (timeStr: string): number => {
        const parts = timeStr.split(":").map(Number);
        return parts[0] + (parts[1] || 0) / 60 + (parts[2] || 0) / 3600;
      };

      const minHours = parseTime(slotMinTime || "00:00:00");
      const maxHours = parseTime(slotMaxTime || "24:00:00");
      const visibleRange = maxHours - minHours;

      const now = new Date();
      const currentHours =
        now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

      if (currentHours < minHours || currentHours > maxHours) {
        line.style.display = "none";
        return;
      }

      line.style.display = "block";

      const relativePosition = (currentHours - minHours) / visibleRange;
      const totalHeight = calendarEl.scrollHeight;
      const top = relativePosition * totalHeight;
      line.style.top = `${top}px`;
    };

    updateLinePosition();
    const intervalId = setInterval(updateLinePosition, 60000);

    return () => {
      clearInterval(intervalId);
      line?.remove();
    };
  }, [calendarApi, activeView, isMobile]);

  const updateRangeLabel = useCallback(
    (api: CalendarApi, baseDate?: Date) => {
      if (isMobile) {
        const date = baseDate ?? api.getDate();
        setRangeLabel(
          date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        );
        return;
      }

      const currentView = api.view;
      const start = currentView.currentStart;
      const end = new Date(currentView.currentEnd.getTime() - 1);
      const startDay = start.getDate();
      const endDay = end.getDate();
      const month = start.toLocaleString(undefined, { month: "long" });
      const year = start.getFullYear();
      setRangeLabel(`${startDay} - ${endDay} ${month}, ${year}`);
    },
    [isMobile],
  );

  useEffect(() => {
    if (!calendarApi) return;

    try {
      calendarApi.changeView(activeView);
      calendarApi.gotoDate(selectedDate);
      updateRangeLabel(calendarApi, selectedDate);
    } catch {
      // ignore while calendar is still initializing
    }
  }, [activeView, calendarApi, selectedDate, updateRangeLabel]);

  function shiftDate(days: number) {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + days);
      return next;
    });
  }

  function goPrev() {
    if (isMobile) {
      shiftDate(-1);
      return;
    }

    const api = calendarApi;
    api?.prev();
    if (api) updateRangeLabel(api);
  }

  function goNext() {
    if (isMobile) {
      shiftDate(1);
      return;
    }

    const api = calendarApi;
    api?.next();
    if (api) updateRangeLabel(api);
  }

  function goToday() {
    const today = new Date();
    setSelectedDate(today);
    calendarApi?.today();
    if (calendarApi) updateRangeLabel(calendarApi, today);
  }

  function formatTimeRange(start?: Date | null, end?: Date | null) {
    if (!start) return "";
    const s = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const e = end ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    return e ? `${s} - ${e}` : s;
  }

  function splitAcrossMidnight(ev: EventLike) {
    const start = new Date(ev.start);
    const end = new Date(ev.end);
    const segments = [];
    let cur = new Date(start);

    const endOfDay = (d: Date) => {
      const o = new Date(d);
      o.setHours(23, 59, 59, 999);
      return o;
    };

    let idx = 0;
    while (cur <= end) {
      const dayStart = idx === 0 ? new Date(start) : new Date(cur.setHours(0, 0, 0, 0));
      const thisSegEnd = new Date(Math.min(end.getTime(), endOfDay(dayStart).getTime()));

      segments.push({
        ...ev,
        id: `${ev.id || "evt"}-${idx}`,
        start: dayStart.toISOString(),
        end: thisSegEnd.toISOString(),
      });

      cur = new Date(dayStart);
      cur.setDate(cur.getDate() + 1);
      cur.setHours(0, 0, 0, 0);
      idx += 1;
      if (cur > end) break;
    }

    return segments;
  }

  const displayedEvents = useMemo(
    () =>
      bookedTourEvents.flatMap((ev: EventLike) => {
        try {
          const s = new Date(ev.start);
          const e = new Date(ev.end);
          if (s.toDateString() !== e.toDateString()) {
            return splitAcrossMidnight(ev).map((seg) => ({
              ...seg,
              id: seg.id ? String(seg.id) : undefined,
            }));
          }
        } catch {
          // fall through and return original event
        }

        return {
          ...ev,
          id: ev.id ? String(ev.id) : undefined,
        };
      }),
    [bookedTourEvents],
  );

  const eventDates = useMemo(() => {
    const map = new Map<string, string[]>();
    displayedEvents.forEach((event) => {
      const date = dayjs(
        event.start instanceof Date ? event.start : new Date(event.start),
      ).format("YYYY-MM-DD");
      const colorKey = event.extendedProps?.color || "teal";
      // Map color keys to actual hex colors from legend if possible, or use a default
      const color =
        EVENT_LEGEND.find((l) => l.label.toLowerCase() === colorKey.toLowerCase())
          ?.color ||
        (colorKey === "teal" ? "#127A8A" : colorKey);

      if (!map.has(date)) map.set(date, []);
      const current = map.get(date)!;
      if (!current.includes(color)) {
        current.push(color);
      }
    });
    return map;
  }, [displayedEvents]);

  const renderMobileTopBar = () => (
    <div className="rounded-md bg-[#F3FAFB] p-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            aria-label="Previous day"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#127A8A]"
          >
            <LeftIcon />
          </button>
          <div className="text-base font-semibold tracking-[-0.02em] text-[#1D2939]">
            {rangeLabel || dayjs(selectedDate).format("MMM D")}
          </div>
          <button
            onClick={goNext}
            aria-label="Next day"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#127A8A]"
          >
            <RightIcon />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full" />
        </div>
      </div>

      <div className="mt-4 rounded-sm bg-white px-2 py-2">
        <DateCalendar
          value={dayjs(selectedDate)}
          onChange={(value: Dayjs | null) => {
            if (value) setSelectedDate(value.toDate());
          }}
          views={["day"]}
          showDaysOutsideCurrentMonth
          reduceAnimations
          sx={{
            width: "100%",
            maxWidth: "100%",
            "& .MuiPickersCalendarHeader-root": {
              paddingLeft: 1,
              paddingRight: 1,
              marginTop: 0,
              marginBottom: 1,
            },
            "& .MuiPickersCalendarHeader-label": {
              fontSize: "1rem",
              fontWeight: 700,
              color: "#1D2939",
            },
            "& .MuiPickersArrowSwitcher-root button": {
              color: "#667085",
            },
            "& .MuiDayCalendar-weekDayLabel": {
              color: "#98A2B3",
              fontSize: "0.65rem",
              fontWeight: 700,
            },
            "& .MuiPickersDay-root": {
              fontSize: "0.85rem",
              color: "#1D2939",
            },
            "& .Mui-selected": {
              backgroundColor: "#127A8A !important",
              color: "#fff !important",
            },
          }}
          slotProps={{
            day: (ownerState: any) => {
              const dateStr = dayjs(ownerState.day).format("YYYY-MM-DD");
              const colors = eventDates.get(dateStr) || [];
              const hasEvents = colors.length > 0;

              return {
                sx: {
                  position: "relative",
                  "&::after": hasEvents
                    ? {
                      content: '""',
                      position: "absolute",
                      bottom: 4,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 4,
                      height: 4,
                      borderRadius: "9999px",
                      backgroundColor: colors[0],
                      boxShadow:
                        colors.length > 1
                          ? colors
                            .slice(1, 3)
                            .map(
                              (c, i) =>
                                `${(i === 0 ? -6 : 6)}px 0 0 0 ${c}`,
                            )
                            .join(", ")
                          : "none",
                    }
                    : {},
                },
              };
            },
          }}
        />
        <CalendarLegend className="mt-2 border-t-0 px-3 pb-1 pt-2" />
      </div>
    </div>
  );

  return (
    <div className={isMobile ? "pb-16 bg-white" : "mr-5 pb-20"}>
      {isMobile ? (
        <div className="mb-4">{renderMobileTopBar()}</div>
      ) : (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 rounded-md border border-text-tertiary/20 bg-slate-50 text-sm">
              <button
                onClick={goPrev}
                aria-label="prev"
                className="rounded border border-text-tertiary/20 pr-2 py-1"
              >
                <LeftIcon />
              </button>
              <div className="px-2 text-xs font-medium">
                {rangeLabel || "13 - 19 January, 2025"}
              </div>
              <button
                onClick={goNext}
                aria-label="next"
                className="rounded border border-text-tertiary/20 px-1 py-1"
              >
                <RightIcon />
              </button>
            </div>
            <CustomViewSelect view={view} setView={setView} />
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`relative bg-white shadow-sm ${isMobile ? "events-calendar-mobile rounded-md" : "rounded-md"}`}
      >
        {!isMobile && (
          <div className="absolute top-4 left-6 z-1000">
            <ClockIcon />
          </div>
        )}

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={activeView}
          ref={calendarRef}
          nowIndicator={false}
          headerToolbar={false}
          allDaySlot={false}
          eventClick={handleEventClick}
          slotDuration="01:00:00"
          slotLabelInterval="01:00:00"
          slotMinTime={isMobile ? mobileSlotMinTime : "06:00:00"}
          slotMaxTime={isMobile ? mobileSlotMaxTime : "24:00:00"}
          slotEventOverlap={false}
          dayHeaderContent={(arg: { date: Date }) => (
            <div className="flex items-center justify-center py-5">
              <div className="text-xs font-semibold text-slate-600">
                {arg.date.toLocaleString("en-US", { weekday: "long" })}
              </div>
              <div className="px-2 text-xs text-slate-500">{arg.date.getDate()}</div>
            </div>
          )}
          events={displayedEvents}
          editable
          selectable
          businessHours={false}
          eventDrop={() => { }}
          viewDidMount={(arg) => {
            const api = arg.view.calendar as CalendarApi;
            setCalendarApi(api);
            updateRangeLabel(api, selectedDate);
          }}
          datesSet={(arg) => {
            const api = arg.view.calendar as CalendarApi;
            setCalendarApi(api);
            updateRangeLabel(api, selectedDate);
          }}
          eventContent={(arg) => {
            const start = arg.event.start;
            const end = arg.event.end;
            const timeText = formatTimeRange(start, end);
            const colorKey = arg.event.extendedProps?.color || "teal";
            const colorClass = colorClassMap[colorKey] || colorClassMap.teal;
            const location =
              arg.event.extendedProps?.booking?.tourEvent?.location ||
              arg.event.extendedProps?.location ||
              "";

            if (isMobile) {
              return (
                <div className={`mobile-event-card ${colorClass}`}>
                  <span className="mobile-event-accent" />
                  <div className="min-w-0 pl-4">
                    <div className="line-clamp-2 text-base font-semibold text-[#27303A]">
                      {arg.event.title}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium text-white">
                      <AccessTimeOutlinedIcon sx={{ fontSize: 14 }} />
                      <span>{timeText}</span>
                    </div>
                    {location && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-white">
                        <PlaceOutlinedIcon sx={{ fontSize: 14 }} />
                        <span className="truncate">{location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div
                className={`flex h-full w-full flex-col justify-center rounded-md border px-2 ${colorClass}`}
              >
                <div className="flex items-center justify-start gap-2">
                  <span className="rounded-md px-2 py-0.5 text-[10px] font-medium text-white">
                    {timeText}
                  </span>
                </div>
                <div className="mt-1 truncate text-xs font-medium">{arg.event.title}</div>
              </div>
            );
          }}
          height="auto"
        />

        {modalOpen && selectedEvent && modalPosition && (
          <EventDetailsModal
            event={selectedEvent}
            onClose={() => {
              setModalOpen(false);
              setModalPosition(null);
            }}
            position={modalPosition}
            onViewTourDetails={(booking) => {
              setSelectedBooking(booking);
              setModalOpen(false);
            }}
          />
        )}

        <ViewTourBookingModal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
        />

        {!isMobile && <CalendarLegend className="px-6 py-4" />}
      </div>
    </div>
  );
}
