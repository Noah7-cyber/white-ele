import { AppDataSource } from "../../core";
import { Announcement } from "../../shared/entities/Announcement";
import { Parent } from "../../shared/entities/Parent";
import { Staff } from "../../shared/entities/Staff";
import { AnnouncementType, AnnouncementStatus, AdminRole } from "../../shared/entities/EntityEnums";
import { logger } from "../../shared";
import { emailService } from "../../shared/services/email.service";
import { Admin } from "../../shared/entities/Admin";
import { notificationService } from "../../notification";
import { NotificationType } from "../../shared/entities/Notification";


export type RoleSegment = "admin" | "staff" | "parents";

export interface RecipientGroups {
  parents: boolean;
  teachers: boolean;
  admins: boolean;
}

/**
 * Which recipient groups should receive the announcement email for a given type.
 * Parents: general, event. Teachers: general, urgent, academic, event. Admins: all types.
 */
export function getRecipientGroupsForType(announcementType: AnnouncementType): RecipientGroups {
  const type = announcementType ?? AnnouncementType.GENERAL;
  return {
    parents: type === AnnouncementType.GENERAL || type === AnnouncementType.EVENT,
    teachers: type === AnnouncementType.GENERAL || type === AnnouncementType.URGENT || type === AnnouncementType.ACADEMIC || type === AnnouncementType.EVENT,
    admins:
      type === AnnouncementType.ADMINISTRATIVE ||
      type === AnnouncementType.GENERAL ||
      type === AnnouncementType.URGENT ||
      type === AnnouncementType.ACADEMIC ||
      type === AnnouncementType.EVENT,
  };
}

interface Recipient {
  userId: number;
  email: string;
  name: string;
  roleSegment: RoleSegment;
}

/**
 * Send announcement-published emails to all eligible recipients (school creator + role-based).
 * Runs async; catch errors per recipient and log. Batched sends for scale.
 */
export async function sendAnnouncementPublishedEmails(announcementId: number): Promise<void> {
  const announcementRepo = AppDataSource.getRepository(Announcement);
  const adminRepo = AppDataSource.getRepository(Admin);
  const parentRepo = AppDataSource.getRepository(Parent);
  const staffRepo = AppDataSource.getRepository(Staff);

  try {
    const announcement = await announcementRepo.findOne({
      where: { id: announcementId },
      relations: ["school", "school.creator", "creator"],
    });

    if (!announcement || announcement.announcementStatus !== AnnouncementStatus.PUBLISHED) {
      return;
    }

    const schoolId = announcement.schoolId;
    const schoolName = announcement.school?.schoolName ?? "Your school";
    const type = announcement.announcementType ?? AnnouncementType.GENERAL;
    const groups = getRecipientGroupsForType(type);

    const recipientsByEmail = new Map<string, Recipient>();

    // Priority: admin > staff > parents (so one email per person with correct dashboard link)
    function addRecipient(userId: number | undefined, email: string | undefined, name: string, segment: RoleSegment) {
      if (!userId || !email || !email.trim()) return;
      const key = email.toLowerCase().trim();
      const existing = recipientsByEmail.get(key);
      const priority: Record<RoleSegment, number> = { admin: 3, staff: 2, parents: 1 };
      if (!existing || priority[segment] >= priority[existing.roleSegment]) {
        recipientsByEmail.set(key, { userId, email: email.trim(), name: name || "there", roleSegment: segment });
      }
    }

    const creator = announcement.school?.creator;
    if (creator?.email) {
      const name = [creator.firstName, creator.lastName].filter(Boolean).join(" ") || "there";
      addRecipient(creator.id, creator.email, name, "admin");
    }

    // 2) Admins (schoolId + role ADMIN/SUPER_ADMIN)
    if (groups.admins) {
      const admins = await adminRepo.find({
        where: [
          { schoolId, role: AdminRole.ADMIN },
          { schoolId, role: AdminRole.SUPER_ADMIN },
        ],
        select: { id: true, user: { email: true, firstName: true, lastName: true, isActive: true } },
      });
      for (const u of admins) {
        if (u.user?.isActive && u.user?.email && u.user?.id) {
          const name = [u.user?.firstName, u.user?.lastName].filter(Boolean).join(" ") || "there";
          addRecipient(u.user?.id, u.user?.email, name, "admin");
        }
      }
    }

    // 3) Teachers (Staff for school)
    if (groups.teachers) {
      const staffList = await staffRepo.find({
        where: { schoolId },
        relations: ["user"],
      });
      for (const s of staffList) {
        const u = s.user;
        if (u?.isActive && u.email && u.id) {
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "there";
          addRecipient(u.id, u.email, name, "staff");
        }
      }
    }

    // 4) Parents
    if (groups.parents) {
      const parents = await parentRepo.find({
        where: { schoolId },
        relations: ["user"],
      });
      for (const p of parents) {
        const u = p.user;
        if (u?.isActive && u.email && u.id) {
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "there";
          addRecipient(u.id, u.email, name, "parents");
        }
      }
    }

    const recipients = Array.from(recipientsByEmail.values());
    if (recipients.length === 0) {
      return;
    }

    const senderName = announcement.creator
      ? [announcement.creator.firstName, announcement.creator.lastName].filter(Boolean).join(" ")
      : "School Administration";

    const postDate = announcement.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const postTime = announcement.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const payload = {
      id: announcement.id,
      subject: announcement.subject,
      content: announcement.content,
      announcementType: announcement.announcementType,
      senderName,
      date: postDate,
      time: postTime,
    };

    // Group by role segment so we send one bundled email per segment (To + BCC)
    const bySegment = new Map<RoleSegment, string[]>();
    for (const r of recipients) {
      const list = bySegment.get(r.roleSegment) ?? [];
      list.push(r.email);
      bySegment.set(r.roleSegment, list);
    }

    const segments: RoleSegment[] = ["admin", "staff", "parents"];
    let sentSegments = 0;
    let failedSegments = 0;

    for (const segment of segments) {
      const emails = bySegment.get(segment);
      if (!emails?.length) continue;
      try {
        await emailService.sendAnnouncementPublishedEmailBulk(emails, payload, schoolName, segment, announcement.school?.subDomain);
        sentSegments += 1;
      } catch (err) {
        failedSegments += 1;
        logger.error(
          `Announcement email failed for ${segment} (${emails.length} recipients): ${(err as Error)?.message ?? err}`,
        );
      }
    }

    // Send Bulk In-App Notifications
    try {
      const userIds = recipients.map(r => r.userId);
      await notificationService.sendBulkNotifications({
        userIds,
        schoolId,
        type: NotificationType.ANNOUNCEMENT,
        title: "New Announcement",
        message: announcement.subject,
        actionUrl: `/dashboard/announcements/${announcement.id}`,
        actionLabel: "View Announcement",
        metadata: {
          announcementId: announcement.id,
          type: announcement.announcementType
        }
      });
    } catch (err) {
      logger.error(`Announcement bulk notification failed:`, err);
    }

    if (failedSegments > 0) {
      logger.warn(
        `Announcement published emails (id=${announcementId}): ${sentSegments} segment(s) sent, ${failedSegments} failed.`,
      );
    }
  } catch (err) {
    logger.error(`sendAnnouncementPublishedEmails(${announcementId}) failed:`, err);
  }
}
