import { Box, ButtonBase } from "@mui/material";
import Image from "next/image";
import defaultImage from "@/modules/shared/assets/images/Image (7).png";
import { Button } from "../../../shared/component/Button";
import { useModalRoute } from "@/utils/hooks/useModalRoute";

export const AnnouncementDetailModal = () => {
  const { closeModal } = useModalRoute();
  return (
    <Box className="max-w-3xl mx-auto bg-white min-w-[40vw] px-6">
      <Box className="flex items-center justify-between">
        <ButtonBase className="!px-4 !py-0.5 !bg-[#e5f2f2] !rounded-full !text-xs">
          Event
        </ButtonBase>

        <Box></Box>
      </Box>
      <h3 className="text-sm font-semibold mt-5">Upcoming Science Fair - Join Us Next Week</h3>

      <div className="flex items-center gap-4 text-sm text-gray-500 mt-6">
        <span>Ms. Grace Chen . Director . </span>
        <span>Today, 9:45 AM</span>
      </div>

      <div className="w-full h-36 relative rounded-xl overflow-hidden mt-5">
        <Image src={defaultImage} alt="" height={300} width={900} className="object-cover" />
      </div>

      <p className="text-gray-600 text-sm leading-relaxed mt-4">
        We’re excited to announce our upcoming field trip to the children’s museum this Friday,
        January 10th. The bus will leave exactly by 9:00 AM. The event will run from 2:00 PM to 4:00
        PM in the main hall. Parents and families are encouraged to attend and celebrate our young
        scientists achievements.
      </p>

      <div className="bg-[#f2f4f4] p-4 rounded-md mt-4">
        <h3 className="text-sm font-semibold">Event Details</h3>

        <div className="flex mt-8">
          <DataView name="Date" value="Jan 10th, 2025" />
          <DataView name="Location" value="WhitePenguin Learning Center" />
        </div>
        <div className="flex mt-5">
          <DataView name="Time" value="9:45 AM" />
          <DataView name="RSVP" value="Required" />
        </div>
      </div>

      <Box className="flex justify-end mt-5">
        <Button onClick={() => closeModal()}>Close</Button>
      </Box>
    </Box>
  );
};

function DataView({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex-1">
      <div className="font-light">{name}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
