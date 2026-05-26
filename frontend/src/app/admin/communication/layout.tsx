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
  const [isNewMessage, setIsNewMessage] = useState(false);
  const pathname = usePathname();
  const handleOpenNewMessage = () => setIsNewMessage(true);

  useEffect(() => {
    window.addEventListener("open-new-message", handleOpenNewMessage);
    return () => window.removeEventListener("open-new-message", handleOpenNewMessage);
  }, []);

  const tabs = useMemo(
    () => [
      { href: "/admin/communication/messaging", label: "Messages", key: "messages" },
      { href: "/admin/communication/announcement", label: "Announcements", key: "announcements" },
    ],
    [],
  );

  const isDetailPage = useMemo(
    () =>
      Boolean(
        pathname?.includes("/admin/communication/announcement/add") ||
          pathname?.includes("/admin/communication/announcement/edit") ||
          pathname?.match(/\/admin\/communication\/announcement\/[^/]+$/) ||
          pathname?.includes("/admin/communication/messaging/create") ||
          pathname?.match(/\/admin\/communication\/messaging\/[^/]+$/),
      ),
    [pathname],
  );

  if (isDetailPage) {
    return <>{children}</>;
  }

  return (
    <Box className="h-full p-5 space-y-6">
      <Box className="hidden md:flex items-center justify-between">
        <Typography className="text-xl! font-semibold! text-primary-gray! ">
          Communication
        </Typography>
        <Button className="!rounded-lg !px-4 !py-2" onClick={handleOpenNewMessage}>
          + New Message
        </Button>
      </Box>

      <ScrollableTabBar className="border-b! border-border-lighten!">
        {tabs.map((tab) => {
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

      <NewMessageModal
        isOpen={isNewMessage}
        onClose={() => {
          setIsNewMessage(false);
        }}
      />
    </Box>
  );
}
