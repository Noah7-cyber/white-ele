"use client";

import Image from "next/image";
import defaultImage from "@/modules/shared/assets/images/Image (7).png";
import { ButtonBase } from "@mui/material";

interface AnnouncementCardProps {
  title: string;
  author: string;
  time: string;
  description: string;
  image: string;
  onClick?: () => void;
}

const AnnouncementCard = ({
  title,
  author,
  time,
  description,
  image,
  onClick,
}: AnnouncementCardProps) => {
  return (
    <div onClick={onClick} className="bg-white rounded-2xl p-4 space-y-3 cursor-pointer">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <ButtonBase className="!px-4 !py-0.5 !bg-[#e5f2f2] !rounded-full !text-xs">
            Event
          </ButtonBase>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{author}</span>
          <span>{time}</span>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed mt-3">{description}</p>
      </div>

      <div className="w-full h-36 relative rounded-xl overflow-hidden">
        <Image
          src={image || defaultImage?.src}
          alt={title}
          height={300}
          width={300}
          className="object-cover"
        />
      </div>
    </div>
  );
};

export default AnnouncementCard;
