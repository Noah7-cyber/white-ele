/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef } from "react";
import { Box, ButtonBase, Checkbox, IconButton, Typography } from "@mui/material";
import DeleteOutlineIcon from "@/modules/shared/assets/svgs/deleteIcon.svg";
import { MessageItem } from "@/modules/shared/component/MessageItem";
import { ActionModal } from "@/modules/shared/component/ActionModal/actionModal";
import ArrowDown from "@/modules/shared/assets/svgs/caretDown.svg";
import { Button } from "@/modules/shared/component/Button";
import { useMessaging } from "./hooks/useMessaging";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { ChatModal } from "@/modules/shared/component/ChatModal";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import { useQueryClient } from "@tanstack/react-query";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";

export const Messaging = () => {
  const checkBoxButtonRef = useRef<HTMLButtonElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const mobileFilterButtonRef = useRef<HTMLButtonElement>(null);

  const queryClient = useQueryClient();
  const {
    isLoading,
    deleteSelectedConversations,
    isDeletingBulk,
    selectedChat,
    setSelectedChat,
    selectedIds,
    clearAllModalOpen,
    setClearAllModalOpen,
    toggleSelectAll,
    toggleSelectOne,
    readFilterActions,
    recipientFilterActions,
    isAllSelected,
    isIndeterminate,
    formatMessageTime,
    filteredMessages,
    displayConversations,
    chatSearchQuery,
    setChatSearchQuery,
    readFilter,
    recipientFilter,
    resolveOtherParticipant,
    isMarkedUnread,
    clearMarkedUnread,
    messageQueryKey,
  } = useMessaging();

  const isMobile = useMediaQuery("(max-width:768px)");
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  return (
    <Box className="md:bg-white sm:p-4 h-full flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <div className="hidden md:flex items-center gap-1 px-1">
          <Checkbox
          className="max-md:!hidden"
            sx={{
              padding: 0.5,
              color: "#D0D5DD",
              "&.Mui-checked": {
                color: "#008080",
              },
              "&.Mui-indeterminate": {
                color: "#008080",
              },
              "&.Mui-disabled": { color: "#D0D5DD" },
              "&.Mui-checked.Mui-disabled": { color: "#008080", backgroundColor: "#008080" },
              "&.Mui-indeterminate.Mui-disabled": {
                color: "#008080",
                backgroundColor: "#008080",
              },
            }}
            size="small"
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={toggleSelectAll}
          />
          <ButtonBase
            ref={checkBoxButtonRef}
            className="!py-2 !px-1"
            style={{ position: "relative" }}
          >
            <ArrowDown />
          </ButtonBase>
          <ActionModal
            actions={readFilterActions}
            classNames="items-center !gap-0 !p-1 -2"
            customModalclassNames="!p-0"
            externalTrigger={checkBoxButtonRef}
          />
          {(isAllSelected || selectedIds.size > 0) && (
            <IconButton
              size="small"
              onClick={() => setClearAllModalOpen(true)}
              className="!ml-1 !p-2"
              aria-label="Clear all conversations"
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </div>
        <div className="md:flex items-center gap-4 flex-1 justify-end min-w-0">
          <div className="w-full  lg:w-fit lg:max-w-[320px]">
            <SearchTextfield
              value={chatSearchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setChatSearchQuery(e.target.value)}
              placeholder="Search chats by name"
              isRounded={isMobile}
              fullWidth={isMobile}
              className="max-w-full bg-white rounded-lg sm:bg-transparent border-0"
              inputClasses="max-w-full !border-0 !border-transparent"
              endIcon={
                <button
                  className="md:hidden"
                  onClick={() => setMobileFilterOpen(true)}
                  aria-label="Filter"
                >
                  <FilterIcon className="text-gray-500" />
                </button>
              }
            />
          </div>
          <Button
            ref={filterButtonRef}
            isRounded={false}
            className="!hidden md:flex gap-2 items-center !rounded-lg !border !border-[#D0D5DD] !text-[#022F2F]  !bg-transparent shrink-0"
            style={{ position: "relative" }}
          >
            <Typography className="!text-sm !font-medium">
              {recipientFilter === "All" ? "Filter by" : recipientFilter}
            </Typography>
            <ArrowDown />
          </Button>
          <ActionModal
            actions={recipientFilterActions}
            classNames="items-center !gap-0 !p-1 !w-[100px]"
            customModalclassNames="!p-0 mt-2 !w-[120px] !text-left justify-center"
            externalTrigger={filterButtonRef}
            edgePadding={-10}
          />
          <ActionModal
            actions={recipientFilterActions}
            classNames="items-center !gap-0 !p-1 !w-[100px]"
            customModalclassNames="!p-0 mt-2 !w-[120px] !text-left justify-center md:hidden"
            externalTrigger={mobileFilterButtonRef}
            edgePadding={-10}
          />
        </div>
      </div>
      <DataRenderer isLoading={isLoading} isEmpty={!filteredMessages?.length}>
        {() => (
          <div className="space-y-1 flex-1 overflow-y-auto !bg-white sm:bg-transparent rounded-lg p-4 sm:p-0">
            {displayConversations.map((conv: any, index: number) => {
              const id = conv?.id ?? conv?.conversationId ?? index;
              const sender = resolveOtherParticipant(conv) ?? conv?.sender2 ?? conv?.sender1;
              const lastMsg = conv?.lastMessage;
              // Extract grade and student display
              let grade = "";
              let student = "";

              if (sender?.role === "parent" && sender?.parentData?.children?.length > 0) {
                const children = sender.parentData.children;
                grade = children[0]?.className || "";
                student = `${children[0]?.firstName || ""} ${children[0]?.lastName || ""}`;
                if (children.length > 1) {
                  student += ` +${children.length - 1}`;
                }
              }
              return (
                <MessageItem
                  key={id}
                  isActive={selectedChat?.id === conv?.id}
                  name={`${sender?.firstName || ""} ${sender?.lastName || ""}`}
                  tag={capitalizeFirstLetter(sender?.role)}
                  // subject={lastMsg?.messageSubject ?? ""}
                  preview={lastMsg?.content ?? ""}
                  time={formatMessageTime(lastMsg?.createdAt)}
                  avatar={sender?.profile?.photo || ""}
                  grade={grade ?? ""}
                  student={student ?? ""}
                  isUnread={isMarkedUnread(conv?.id ?? conv?.conversationId)}
                  onClick={() => {
                    clearMarkedUnread(conv?.id ?? conv?.conversationId);
                    setSelectedChat(conv);
                  }}
                  checked={selectedIds.has(id)}
                  onCheckChange={(checked) => toggleSelectOne(id, checked)}
                  unread={
                    selectedChat &&
                    (conv?.id === selectedChat?.id ||
                      conv?.conversationId === selectedChat?.conversationId)
                      ? 0
                      : conv?.unreadCount
                  }
                />
              );
            })}
          </div>
        )}
      </DataRenderer>
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onApply={() => setMobileFilterOpen(false)}
        onReset={() => {
          recipientFilterActions.find(a => a.label?.toString().toLowerCase().includes("all"))?.onClick?.();
          setMobileFilterOpen(false);
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Filter by Recipient</Typography>
            <Dropdown
              isForm
              options={recipientFilterActions.map(a => ({ name: a.label as string, value: a.label as string }))}
              value={recipientFilter}
              onSelect={(val) => {
                recipientFilterActions.find(a => a.label === val)?.onClick?.();
              }}
              textFieldProps={{ placeholder: "Select recipient type", isRounded: true }}
            />
          </div>
        </div>
      </MobileFilterDrawer>
      <ChatModal
        selectedChat={selectedChat}
        isOpen={!!selectedChat}
        onClose={() => setSelectedChat(null)}
        onConversationDeleted={() => {
          setSelectedChat(null);
          queryClient.invalidateQueries({ queryKey: messageQueryKey });
        }}
      />
      <ConfirmModal
        open={clearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        onConfirm={() => deleteSelectedConversations()}
        title={isAllSelected ? "Clear all conversations?" : "Delete selected conversations?"}
        description={
          isAllSelected
            ? "Do you want to clear all your conversations? This action is irreversible."
            : "Do you want to delete the selected conversations? This action is irreversible."
        }
        confirmLabel={isAllSelected ? "Clear all" : "Delete"}
        loading={isDeletingBulk}
        confirmLabelClassName="!bg-[#CF000B] !text-white hover:!bg-[#CF000B]/80"
      />
    </Box>
  );
};
