"use client";

import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChatModal } from "./chatModal";

export const ChatModalWrapper = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const conversationId = searchParams.get("conversationId");

  const onClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("modal");
    params.delete("conversationId");
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!conversationId) return null;

  return (
    <ChatModal
      isOpen={true}
      onClose={onClose}
      selectedChat={{ id: conversationId }}
    />
  );
};
