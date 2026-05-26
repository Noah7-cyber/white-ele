"use client";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { Box, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import Image from "next/image";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";

interface AssessmentViewLayoutProps {
  children?: React.ReactNode;
}
const AssessmentViewLayout = ({ children }: AssessmentViewLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const id = pathname.split("/")[4];
  const tabs = [
    { href: `/admin/learning/assessments/${id}/view`, label: "Details" },
    { href: `/admin/learning/assessments/${id}/view/results`, label: "Results" },
  ];
  return (
    <Box className="h-full p-5 space-y-6">

      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p- flex items-center justify-center"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="back" />
          </ButtonIcon>
          <Typography className="!text-xl !font-semibold !text-text-primary">
            Mid-Term Test Scoreboard: English | Total: 20 Marks
          </Typography>
        </Box>
      </Box>
      <Box>
        <ScrollableTabBar className="border-b border-border-lighten">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`shrink-0 whitespace-nowrap text-sm font-normal pb-2 px-3 ${
                  active
                    ? "font-medium border-b border-brandColor-active text-brandColor-active"
                    : "text-[#475467]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </ScrollableTabBar>
        {children}
      </Box>
    </Box>
  );
};

export default AssessmentViewLayout;
