import Image from "next/image";
import { TimeSlot } from "../helpers";
import SchoolLogo from "@/modules/shared/assets/svgs/schoolLogo.svg";
import sucesss from "@/modules/shared/assets/images/success.png";
import { ScheduleTourRequest, Tours } from "@/services/tour.service";

const TourConfirmation: React.FC<{
  tourData: Tours | undefined;
  slot: TimeSlot;
  formData: ScheduleTourRequest;
}> = ({ slot, formData, tourData }) => {

  const duration = tourData?.duration
  const description = tourData?.description
  const location = tourData?.location;
  // Calculate date and time strings
  const formattedDate = slot.dateTime.toLocaleDateString("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const startTime = slot.dateTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const endDate = new Date(slot.dateTime.getTime() + (duration || 0) * 60000);
  const endTime = endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const timeZoneShort =
    slot.dateTime.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ")[2] || "";

  const dataRow = (label: string, value: React.ReactNode) => (
    <div className="flex text-sm py-2 first:pt-0 last:pb-0 last:border-b-0">
      <p className="w-1/3 font-medium shrink-0">{label}</p>
      <div className="w-2/3 font-mormal text-[#022F2F]">{value}</div>
    </div>
  );

  return (
    <div className="">

      <div className="p-5 ">
        <div className="flex items-center justify-start gap-3 mb-10">
          <SchoolLogo />
          <h2 className="text-xl text-[#007C79] font-bold text-left">{location}</h2>
        </div>

        <div className="text-center w-2xl rounded-lg  p-8 bg-white border-gray-100">
          {/* Checkmark Icon */}
          <div className="flex justify-center mb-6">
            <Image src={sucesss} alt="Success Image" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">This tour is scheduled</h1>
          <p className="text-gray-500 mb-10 text-sm border-b border-gray-300 pb-5">
            We sent an email with a calendar invitation with the details to everyone.
          </p>

          <div className="text-left pl-5 space-y-4">
            {dataRow("Description:", <p>{description}</p>)}

            {dataRow(
              "Date/Time:",
              <p className="flex flex-col gap-2">
                <span className="">{formattedDate}</span>
                <span>
                  {startTime} - {endTime} ({timeZoneShort})
                </span>

              </p>,
            )}

            {dataRow(
              "School:",
              <span className="flex items-center">
                {tourData?.school?.schoolName || location || '--'}{" "}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-success-green text-white text-[10px] font-medium">
                  Host
                </span>
              </span>,
            )}

            {dataRow(
              "Parents:",
              <div className="space-y-1">
                {formData.names && formData.names.length > 0 ? (
                  formData.names.map((name, idx) => (
                    <p key={idx}>{name}</p>
                  ))
                ) : (
                  <p>—</p>
                )}
                <p className="text-xs text-primary-lightGreen/30">{formData.email}</p>
                {formData.guests?.map((guest, idx) => (
                  <p key={idx} className="text-xs text-primary-lightGreen/30">
                    {guest}
                  </p>
                ))}
              </div>,
            )}

            {dataRow("Location:", <p>{location}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourConfirmation;
