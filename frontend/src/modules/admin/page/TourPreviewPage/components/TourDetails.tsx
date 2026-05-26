"use client";
import { TimeSlot } from "../helpers";
import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg";
import GlobeIcon from "@/modules/shared/assets/svgs/globe.svg";
import SchoolLogo from "@/modules/shared/assets/svgs/schoolLogo.svg";
import CalendarIcon from "@/modules/shared/assets/svgs/calendarLinear.svg";
import { TourContext } from "../../../../../contexts/TourContext";
import { useContext } from "react";
import { Tours } from "@/services/tour.service";
import Image from "next/image";

const TourDetailsPanel: React.FC<{ tourData: Tours | undefined; slot: TimeSlot | null }> = ({
  tourData,
  slot,
}) => {
  const context = useContext(TourContext);
  const requestBody = context?.requestBody;
  const isBookingStage = !!slot;
  let formattedDate = "";
  let startTime = "";
  let endTime = "";
  const duration = tourData?.duration || requestBody?.basicInfo?.duration;
  const description = tourData?.description || requestBody?.basicInfo?.description;
  const location = tourData?.location || requestBody?.basicInfo?.location;
  const schoolMail = tourData?.school?.email || requestBody?.basicInfo?.schoolMail;
  const phoneNumber = tourData?.school?.phoneNumber || requestBody?.basicInfo?.phoneNumber;
  const schoolLogoUrl =
    tourData?.school?.schoolLogoUrl || requestBody?.basicInfo?.schoolLogoUrl || SchoolLogo;

  // Calculate date and time strings only if in the booking stage
  if (isBookingStage && slot) {
    formattedDate = slot.dateTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    startTime = slot.dateTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Calculate end time
    const endDate = new Date(slot.dateTime.getTime() + (duration || 0) * 60000);
    endTime = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div className="p-6 border-r border-gray-100 shrink-0 w-full lg:w-[30%] min-w-80">
      <div className="flex items-start mb-4">
        <Image src={schoolLogoUrl} alt="School Logo" width={60} height={60} />
      </div>

      <div className="">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{location}</h2>
        <p className="text-gray-600 text-xs mb-3">{description}</p>

        <div className="mt-2 space-y-3 text-gray-700">
          <div className="flex items-center text-sm mb-4">
            <p className="font-semibold">{tourData?.title || '--'}</p>
          </div>
          {isBookingStage && slot ? (
            <>
              <div className="flex items-center text-sm gap-3">
                <CalendarIcon />
                <div className="">
                  <p>{formattedDate}</p>
                  <p className=" mt-1">
                    {startTime} - {endTime}
                  </p>
                </div>
              </div>
            </>
          ) : null}
          <div className="flex items-center gap-3 text-sm">
            <ClockIcon />
            <p>{duration} minutes</p>
          </div>
          <div className="flex items-center text-sm gap-3">
            <GlobeIcon />
            <p>GMT+1</p>
          </div>
        </div>
      </div>

      {!isBookingStage && (
        <footer className="flex flex-col h-[35%] pb-2 justify-end  w-full  border-gray-100 text-sm text-gray-500">
          <div className="flex gap-2">
            <p className="font-semibold mb-2">Got a Question?</p>
            <p className="text-gray-700">{phoneNumber}</p>
          </div>
          <p className="text-gray-700">{schoolMail}</p>
        </footer>
      )}
    </div>
  );
};

export default TourDetailsPanel;
