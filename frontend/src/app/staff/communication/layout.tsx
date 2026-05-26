"use client";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Typography, Box } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NewMessageModal } from "@/modules/shared/component/NewMessageModal";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";
import { Button } from "@/modules/shared/component/Button";

interface CommunicationLayoutProps {
  children?: React.ReactNode;
}

export default function CommunicationLayout({ children }: CommunicationLayoutProps) {
  const pathname = usePathname();
  const [isNewMessage, setIsNewMessage] = useState(false);
  const handleOpenNewMessage = () => setIsNewMessage(true);

  const isDetailPage = useMemo(
    () =>
      Boolean(
        pathname?.includes("/staff/communication/announcement/add") ||
          pathname?.match(/\/staff\/communication\/announcement\/[^/]+$/) ||
          pathname?.includes("/staff/communication/messaging/create") ||
          pathname?.match(/\/staff\/communication\/messaging\/[^/]+$/),
      ),
    [pathname],
  );

  useEffect(() => {
    window.addEventListener("open-new-message", handleOpenNewMessage);
    return () => window.removeEventListener("open-new-message", handleOpenNewMessage);
  }, []);

  if (isDetailPage) {
    return <>{children}</>;
  }

  return (
    <Box className="h-full p-5 space-y-6">
      <Box className="hidden sm:flex items-center justify-between">
        <Typography className="text-xl! font-semibold! text-primary-gray! md:block hidden">
          Communication
        </Typography>
        <Button className="!hidden md:flex !rounded-lg !px-4 !py-2" onClick={handleOpenNewMessage}>
          + New Message
        </Button>
      </Box>

      <ScrollableTabBar className="border-b! border-border-lighten!">
        {[
          { href: "/staff/communication/messaging", label: "Messages" },
          { href: "/staff/communication/announcement", label: "Announcements" },
        ].map((tab) => {
          const active = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 whitespace-nowrap text-sm! font-normal! pb-2 px-3 ${
                active
                  ? "font-medium! border-b! border-brandColor-active! text-brandColor-active!"
                  : "text-[#475467]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </ScrollableTabBar>

      {children}

      <NewMessageModal isOpen={isNewMessage} onClose={() => setIsNewMessage(false)} />
    </Box>
  );
}
