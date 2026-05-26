"use client";

import React, { useState } from "react";
import { Box, Typography, Popover } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Button } from "@/modules/shared/component/Button";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { CurriculumCard } from "../learning.constants";
import ChildIcon from "@/modules/shared/assets/svgs/childIcons-small.svg";
import SubjectIcon from "@/modules/shared/assets/svgs/subjectRound.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

const TAG_COLORS: Record<string, string> = {
  yellow: "!bg-amber-200 !text-amber-900",
  pink: "!bg-pink-200 !text-pink-900",
  green: "!bg-green-200 !text-green-900",
  blue: "!bg-blue-200 !text-blue-900",
};

interface CurriculumCardItemProps {
  card: CurriculumCard;
  onUseTemplate?: (card: CurriculumCard) => void;
  showUseTemplate?: boolean;
  onClick?: (card: CurriculumCard) => void;
  isTemplate?: boolean;
  onDelete?: (card: CurriculumCard) => void;
}

export default function CurriculumCardItem({
  card,
  onUseTemplate,
  showUseTemplate = false,
  onClick,
  onDelete,
  isTemplate = false,
}: CurriculumCardItemProps) {
  const isMobile = useMediaQuery("(max-width:768px)");
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const tagClass = (card.tagColor && TAG_COLORS[card.tagColor]) || "!bg-gray-200 !text-gray-800";

  const closeMenus = () => {
    setAnchorEl(null);
    setMobileActionsOpen(false);
  };

  const handleMenuButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isMobile) setMobileActionsOpen(true);
    else setAnchorEl(e.currentTarget);
  };

  return (
    <Box className="rounded-xl border border-brandColor-active/20  bg-white p-4 flex flex-col gap-4 h-full relative">
      <Box className="flex items-center justify-between w-full">
        <Box className="flex flex-wrap gap-1 items-center uppercase flex-1">
          {card.skillTags && card.skillTags.length > 0 ? (
            <>
              {card.skillTags.slice(0, 3).map((skill) => (
                <span
                  key={skill.name}
                  className={`inline-flex px-2 py-0.5 rounded-full !text-[10px] font-medium ${skill.color.bg} ${skill.color.text}`}
                >
                  {skill.name}
                </span>
              ))}
              {card.skillTags.length > 3 && (
                <span className="inline-flex px-2 py-0.5 rounded-full !text-[10px] font-medium !bg-gray-100 !text-gray-600">
                  +{card.skillTags.length - 3}
                </span>
              )}
            </>
          ) : card.tag ? (
            <span
              className={`inline-flex px-2 py-0.5 uppercase  rounded-full !text-[10px] font-medium ${tagClass}`}
            >
              {card.tag}
            </span>
          ) : (
            <span className="inline-flex uppercase px-2 py-0.5  rounded-full !text-[10px] font-medium !bg-gray-200 !text-gray-800">
              No tag
            </span>
          )}
        </Box>

        {!isTemplate && (
          <button
            type="button"
            className="p-1 rounded-full hover:bg-gray-100 shrink-0 ml-2"
            aria-label="More options"
            onClick={handleMenuButtonClick}
          >
            {isMobile ? (
              <MoreHorizIcon className="text-gray-500" fontSize="small" />
            ) : (
              <EllipsesIcon className="!w-4 !h-4 rotate-90" />
            )}
          </button>
        )}
      </Box>

      <Box
        className={`flex flex-col gap-1 h-full -mt-0 ${onClick ? "cursor-pointer" : ""}`}
        onClick={() => onClick?.(card)}
      >
        <Typography className="!text-lg !font-semibold !text-primary-dark mb-">
          {card.title}
        </Typography>
        <Typography className="!text-xs !text-input-gray flex-1 line-clamp-3">
          {card.description}
        </Typography>
      </Box>
      <Box className="flex flex-col gap-2 text-xs text-input-gray">
        <span className="flex items-center gap-1">
          <ChildIcon />
          Age Range: {card.ageRange}
        </span>
        <span className="flex items-center gap-1">
          <SubjectIcon />
          Subject: {card.subjectCount} Core modules
        </span>
      </Box>
      {showUseTemplate && onUseTemplate && (
        <Button
          variant="outlined"
          className="!rounded-lg !mt- !border-brandColor-active !text-primary-dark hover:!bg-brandColor-active/5"
          onClick={() => onUseTemplate(card)}
        >
          Use template
        </Button>
      )}
      {anchorEl && !isMobile && (
        <Box onClick={() => setAnchorEl(null)} className="fixed inset-0 bg-black/40 z-1000" />
      )}

      {!isMobile && (
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ className: "!rounded-lg !min-w-[120px] !p-2 ml-2" }}
        >
          <button
            className="w-full text-left px-3 !cursor-pointer py-2 text-sm hover:bg-gray-100 rounded"
            onClick={() => {
              setAnchorEl(null);
              onClick?.(card);
            }}
          >
            View
          </button>
          <button
            className="w-full text-left px-3 !cursor-pointer py-2 text-sm text-red-500 hover:bg-gray-100 rounded"
            onClick={() => {
              setAnchorEl(null);
              onDelete?.(card);
            }}
          >
            Delete
          </button>
        </Popover>
      )}

      {isMobile && (
        <Drawer
          anchor="bottom"
          open={mobileActionsOpen}
          onClose={() => setMobileActionsOpen(false)}
          PaperProps={{
            className: "rounded-t-2xl",
            style: { maxHeight: "70vh" },
          }}
        >
          <div className="px-6 pt-3 pb-8">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <button
              type="button"
              className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
              onClick={() => {
                closeMenus();
                onClick?.(card);
              }}
            >
              View
            </button>
            <button
              type="button"
              className="w-full text-left py-4 text-sm font-medium text-red-500"
              onClick={() => {
                closeMenus();
                onDelete?.(card);
              }}
            >
              Delete
            </button>
          </div>
        </Drawer>
      )}
    </Box>
  );
}
