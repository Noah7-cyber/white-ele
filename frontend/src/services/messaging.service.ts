/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// Teacher ROOT
// ========================
const messagingRoot = "/api/v1/messaging";

const messagingEndpoints = {
  getMessages: { path: `${messagingRoot}`, method: ApiMethods.GET },
  sendMessage: { path: messagingRoot, method: ApiMethods.POST },
  deleteBulkConversations: { path: `${messagingRoot}/bulk-delete`, method: ApiMethods.POST },
  deleteBulkMessages: { path: `${messagingRoot}/messages/bulk-delete`, method: ApiMethods.POST },
};

export const messageDynamicEndpoints = {
  getConversation: (conversationId: string | number) => ({
    path: `${messagingRoot}/${conversationId}`,
    method: ApiMethods.GET,
  }),
  deleteConversation: (conversationId: string | number) => ({
    path: `${messagingRoot}/${conversationId}`,
    method: ApiMethods.DELETE,
  }),
  /** Mark conversation as unread for the current user (persists across refresh if backend supports it) */
  markAsUnread: (conversationId: string | number) => ({
    path: `${messagingRoot}/${conversationId}/mark-unread`,
    method: ApiMethods.PATCH,
  }),
  deleteMessage: (messageId: string | number) => ({
    path: `${messagingRoot}/messages/${messageId}`,
    method: ApiMethods.DELETE,
  }),
  updateMessage: (messageId: string | number) => ({
    path: `${messagingRoot}/messages/${messageId}`,
    method: ApiMethods.PATCH,
  }),
};

// ========================
// SERVICE GENERATOR
// ========================
type ServiceInterface = {
  path: string;
  method: ApiMethods;
};

function generateServices<T extends Record<string, { path: string; method: ApiMethods }>>(
  endpoints: T,
) {
  const services: Record<keyof T, ServiceInterface> = {} as any;
  for (const key in endpoints) {
    services[key] = {
      path: endpoints[key].path,
      method: endpoints[key].method,
    };
  }
  return services;
}

// ========================
// EXPORTS
// ========================
export const messageServices = generateServices(messagingEndpoints);
