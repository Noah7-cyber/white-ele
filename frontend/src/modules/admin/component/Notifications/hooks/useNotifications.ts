/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import {
  notificationServices,
  notificationDynamicEndpoints,
  type NotificationItem,
} from "@/services/notification.service";
import { DashboardRoutes } from "@/routes/dashboard.routes";

export interface Notification {
  id: number;
  title: string;
  text: string;
  read: boolean;
  time: string;
  actionUrl: string | null;
  actionLabel: string | null;
  raw: NotificationItem;
}

function formatNotificationTime(createdAt: string): string {
  try {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
}

/** Normalize action URL: students → children, staff → teachers (dashboard routes). */
function normalizeActionUrl(url: string | null): string | null {
  if (!url) return null;
  let normalized = url;
  normalized = normalized.replace(/\/students\//gi, `${DashboardRoutes.children}/`);
  normalized = normalized.replace(/\/staff\//gi, `${DashboardRoutes.teachers}/`);
  return normalized;
}

function mapApiNotificationToNotification(item: NotificationItem): Notification {
  return {
    id: item.id,
    title: item.title,
    text: item.message,
    read: item.isRead,
    time: formatNotificationTime(item.createdAt),
    actionUrl: normalizeActionUrl(item.actionUrl),
    actionLabel: item.actionLabel,
    raw: item,
  };
}

function getNotificationUrl(n: Notification, roleRoot: string): string | null {
  const metadata = n.raw.metadata || {};
  const type = n.raw.type;

  switch (type) {
    case "payment":
    case "invoice": {
      const invoiceId = metadata.invoiceId;
      if (roleRoot === "/parent") {
        return invoiceId
          ? `/parent/invoicing/invoices/${invoiceId}/view`
          : "/parent/invoicing";
      }
      return invoiceId
        ? `${roleRoot}/billing/invoices?modal=invoice-receipt&invoiceId=${invoiceId}`
        : `${roleRoot}/billing/invoices`;
    }
    case "announcement": {
      const announcementId = metadata.announcementId;
      return announcementId
        ? `${roleRoot}/communication/announcement/${announcementId}`
        : `${roleRoot}/communication/announcement`;
    }
    case "message": {
      const conversationId = metadata.conversationId;
      if (!conversationId) return `${roleRoot}/communication/messaging`;
      return `${roleRoot}/dashboard?modal=chat&conversationId=${conversationId}`;
    }
    case "admission":
    case "booking":
    case "tour":
    case "success":
    case "info": {
      // Handle student enrollment
      if (n.title.toLowerCase().includes("student") || n.title.toLowerCase().includes("enrolled")) {
        const studentId = metadata.studentId;
        return studentId ? `${roleRoot}/children/${studentId}/profile` : `${roleRoot}/children`;
      }
      // Handle admission/pipeline fallback
      if (n.title.toLowerCase().includes("admission")) {
        return `${roleRoot}/admission/events`;
      }
      // Handle tour rescheduled
      if (n.title.toLowerCase().includes("tour") || n.title.toLowerCase().includes("booking")) {
        const bookingId = metadata.bookingId;
        return bookingId ? `${roleRoot}/admission/tours/` : `${roleRoot}/admission/tours`;
      }
      return `${roleRoot}/admission/`;
    }
    default:
      return n.actionUrl;
  }
}

export default function useNotifications() {
  const router = useRouter();
  const pathname = usePathname();

  const roleRoot = pathname.startsWith("/admin")
    ? "/admin"
    : pathname.startsWith("/staff")
      ? "/staff"
      : pathname.startsWith("/parent")
        ? "/parent"
        : "/admin"; // fallback

  const { data, isLoading, refetch } = useQueryService<any, any>({
    service: {
      ...notificationServices.getNotifications,
      data: { delta: 50, pos: 0 },
    },
  });

  const notifications: Notification[] = Array.isArray(data?.notifications)
    ? data.notifications.map(mapApiNotificationToNotification)
    : [];

  const { mutateAsync: markAsReadMutation } = useMutationService<
    { id: number },
    unknown
  >({
    service: (variables) => notificationDynamicEndpoints.markAsRead(variables.id),
    options: { disableToast: true },
  });

  const { mutateAsync: markAllAsReadMutation } = useMutationService<Record<string, never>, unknown>({
    service: () => notificationDynamicEndpoints.readAll,
    options: { disableToast: true },
  });

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await markAsReadMutation({ id });
        refetch();
      } catch {
        refetch();
      }
    },
    [markAsReadMutation, refetch],
  );

  const removeNotification = useCallback(
    (id: number) => {
      markAsRead(id);
    },
    [markAsRead],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation({});
      refetch();
    } catch {
      refetch();
    }
  }, [markAllAsReadMutation, refetch]);

  const handleNotificationClick = useCallback(
    (n: Notification) => {
      if (!n.read) {
        markAsRead(n.id);
      }
      const targetUrl = getNotificationUrl(n, roleRoot);
      if (targetUrl) {
        router.push(targetUrl);
      }
    },
    [router, markAsRead, roleRoot],
  );

  return {
    notifications,
    isLoading,
    refetch,
    removeNotification,
    markAsRead,
    markAllAsRead,
    handleNotificationClick,
  };
}
