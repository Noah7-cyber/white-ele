/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

const notificationRoot = "/api/v1/notifications";

export interface NotificationItem {
  id: number;
  userId: number;
  schoolId: number;
  type: string;
  priority: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  actionLabel: string | null;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  metadata: Record<string, any>;
  sentInApp: boolean;
  sentEmail: boolean;
  sentSms: boolean;
  sentWhatsApp: boolean;
  emailSentAt: string | null;
  smsSentAt: string | null;
  whatsAppSentAt: string | null;
  whatsAppMessageId: string | null;
  whatsAppStatus: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  message: string;
  notifications: NotificationItem[];
  pagination: {
    pos: number;
    delta: number;
    count: number;
  };
}

const notificationEndpoints = {
  getNotifications: { path: notificationRoot, method: ApiMethods.GET },
  readAll: { path: `${notificationRoot}/read-all`, method: ApiMethods.PATCH },
};

export const notificationDynamicEndpoints = {
  markAsRead: (notificationId: number) => ({
    path: `${notificationRoot}/${notificationId}/read`,
    method: ApiMethods.PATCH,
  }),
  readAll: notificationEndpoints.readAll,
};

export const notificationServices = {
  getNotifications: notificationEndpoints.getNotifications,
};
