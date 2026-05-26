"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { useRouter } from "next/navigation";
import CurriculumCardItem from "../CurriculumPage/CurriculumCardItem";
import useCurriculumPage from "../CurriculumPage/hooks/useCurriculumPage";

export default function TemplateLibraryPage() {
  const router = useRouter();
  const { templateLibraryCards } = useCurriculumPage();

  return (
    <Box className="h-full p-5 space-y-6">
      <Box className="flex items-center gap-2">
        <ButtonIcon
          className="rounded-full !border !border-brandColor-active/20 !p-2 flex items-center justify-center"
          onClick={() => router.back()}
        >
          <Image src={LeftIcon} alt="" />
        </ButtonIcon>
        <Typography className="!text-xl !font-semibold !text-text-primary">
          Templates Library
        </Typography>
      </Box>

      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templateLibraryCards.length === 0 ? (
          <Typography className="!text-sm !text-input-gray col-span-full">
            No templates available.
          </Typography>
        ) : (
          templateLibraryCards.map((card) => (
            <CurriculumCardItem
              key={card.id}
              card={card}
              showUseTemplate
              onUseTemplate={() => {}}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
