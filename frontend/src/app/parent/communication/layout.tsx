"use client";
import type React from "react";
import { useEffect, useState } from "react";

import { Typography, Box } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";
import { NewMessageModal } from "@/modules/shared/component/NewMessageModal";
import { Button } from "@/modules/shared/component/Button";

interface CommunicationLayoutProps {
  children?: React.ReactNode;
}

export default function CommunicationLayout({ children }: CommunicationLayoutProps) {
  const pathname = usePathname();
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const handleOpenNewMessage = () => setIsNewMessageOpen(true);

  useEffect(() => {
    window.addEventListener("open-new-message", handleOpenNewMessage);
    return () => window.removeEventListener("open-new-message", handleOpenNewMessage);
  }, []);

  return (
    <Box className="h-full p-5 space-y-6 flex flex-col">
      <Box className="hidden md:flex items-center justify-between">
        <Typography className="hidden md:block !text-xl !font-semibold">Communication</Typography>
        <Button className="!rounded-lg !px-4 !py-2" onClick={handleOpenNewMessage}>
          + New Message
        </Button>
      </Box>

      <ScrollableTabBar className="!border-b !border-border-lighten">
        {[
          { href: "/parent/communication/messaging", label: "Messages" },
          { href: "/parent/communication/announcement", label: "Announcements" },
        ].map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 whitespace-nowrap !text-sm !font-normal pb-2 px-3 ${
                active
                  ? " !font-medium !border-b !border-brandColor-active !text-brandColor-active"
                  : "text-[#475467]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </ScrollableTabBar>

      <Box className="flex-1 overflow-y-auto">
        {children}
      </Box>
      <NewMessageModal isOpen={isNewMessageOpen} onClose={() => setIsNewMessageOpen(false)} />
    </Box>
  );
}
