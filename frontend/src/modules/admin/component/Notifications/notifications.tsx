"use client";

import * as React from "react";
import { Modal, Box } from "@mui/material";
import useNotifications from "./hooks/useNotifications";
import BellIcon from "@/modules/shared/assets/svgs/bell-icon.svg";
import CheckRead from "@/modules/shared/assets/svgs/checkRead.svg";

interface NotificationsProps {
  open?: boolean;
  onClose?: () => void;
}

type TabType = "all" | "unread";

const Notifications: React.FC<NotificationsProps> = () => {
  const { notifications, isLoading, removeNotification, markAllAsRead, handleNotificationClick } =
    useNotifications();
  const [activeTab] = React.useState<TabType>("all");
  const [open, setOpen] = React.useState(false);
  const [openAllModal, setOpenAllModal] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayedNotifications =
    activeTab === "all" ? notifications : notifications.filter((n) => !n.read);
  const filteredNotifications = displayedNotifications.filter((n) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      n.title.toLowerCase().includes(query) ||
      n.text.toLowerCase().includes(query) ||
      n.time.toLowerCase().includes(query)
    );
  });
  const compactNotifications = displayedNotifications.slice(0, 6);

  return (
    <>
      <Box
        onClick={handleOpen}
        className="!bg-background relative flex items-center bg-gray-100 cursor-pointer p-2 !text-sm hover:bg-gray-100 rounded-full transition"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center min-w-4">
            {unreadCount}
          </span>
        )}
      </Box>

      <Modal
        open={open}
        onClose={handleClose}
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          pr: { xs: 2, sm: 4, md: 6 },
          pt: 7,
          backdropFilter: "none",
        }}
      >
        <Box className="w-[400px] bg-white rounded-xl text-sm" sx={{ outline: "none" }}>
          <div className="flex items-center justify-start gap-2 px-4 py-2">
            <span className="text-base font-semibold text-gray-900">Notifications</span>
          </div>

          <div className="max-h-96 flex flex-col overflow-y-auto hide-scrollbar">
            {isLoading ? (
              <div className="text-center text-gray-500 py-6">Loading...</div>
            ) : compactNotifications.length > 0 ? (
              compactNotifications.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(n)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleNotificationClick(n);
                  }}
                  className={`flex justify-between items-start px-4 py-3 rounded-none cursor-pointer hover:bg-gray-50 ${n.read === false ? "bg-brandColor-active/5" : "!bg-transparent"}`}
                >
                  <div className="flex-1 mr-3">
                    <div className="font-semibold text-gray-900 mb-0.5 text-sm">{n.title}</div>
                    <div className="text-gray-600 leading-relaxed mb-2 text-[13px]">{n.text}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] font-normal">{n.time}</p>
                      {n.actionUrl && n.actionLabel && (
                        <span className="text-[11px] font-medium text-brandColor-active">
                          {n.actionLabel} →
                        </span>
                      )}
                    </div>
                  </div>

                  {n.read === false && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(n.id);
                      }}
                      className="text-gray-600 hover:text-gray-800 w-1.5 h-1.5 rounded-full bg-brandColor-active transition-colors cursor-pointer shrink-0"
                      aria-label="Mark as read"
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-6">No notifications</div>
            )}
          </div>

          <div className="border-t border-gray-200 flex py-2 justify-between w-full">
            <button
              type="button"
              onClick={markAllAsRead}
              className="w-full text-mediumGray font-medium hover:text-black flex items-center px-4 gap-0.5 rounded-lg cursor-pointer"
            >
              <CheckRead />
              Mark all as read
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setOpenAllModal(true);
              }}
              className="w-full text-mediumGray font-medium hover:text-black flex justify-end px-4 rounded-lg cursor-pointer"
            >
              View all
            </button>
          </div>
        </Box>
      </Modal>

      <Modal
        open={openAllModal}
        onClose={() => setOpenAllModal(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Box className="w-full max-w-[680px] bg-white rounded-xl text-sm" sx={{ outline: "none" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="text-base font-semibold text-gray-900">All Notifications</span>
            <button
              type="button"
              onClick={() => setOpenAllModal(false)}
              className="text-mediumGray font-medium hover:text-black cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="max-h-[70vh] flex flex-col overflow-y-auto hide-scrollbar">
            <div className="px-4 py-3 border-b border-gray-100">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notifications"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brandColor-active/30 focus:border-brandColor-active"
              />
            </div>
            {isLoading ? (
              <div className="text-center text-gray-500 py-6">Loading...</div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(n)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleNotificationClick(n);
                  }}
                  className={`flex justify-between items-start px-4 py-3 rounded-none cursor-pointer hover:bg-gray-50 ${n.read === false ? "bg-brandColor-active/5" : "!bg-transparent"}`}
                >
                  <div className="flex-1 mr-3">
                    <div className="font-semibold text-gray-900 mb-0.5 text-sm">{n.title}</div>
                    <div className="text-gray-600 leading-relaxed mb-2 text-[13px]">{n.text}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] font-normal">{n.time}</p>
                      {n.actionUrl && n.actionLabel && (
                        <span className="text-[11px] font-medium text-brandColor-active">
                          {n.actionLabel} →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-6">No matching notifications</div>
            )}
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default Notifications;
