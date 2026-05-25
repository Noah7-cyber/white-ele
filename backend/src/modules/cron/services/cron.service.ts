import cron, { ScheduledTask } from "node-cron";
import { AppDataSource } from "../../core/config/database";
import { Invoice } from "../../shared/entities/Invoice";
import { Attendance } from "../../shared/entities/Attendance";
import { TourBooking } from "../../shared/entities/TourBooking";
import { TourEvent } from "../../shared/entities/TourEvent";
import { User } from "../../shared/entities/User";
import { logger } from "../../shared/utils/logger";
import { BookingStatus, InvoiceType, InvoiceStatus, BillingPeriod, SubscriptionStatus, TourStatus, UserRole } from "../../shared/entities/EntityEnums";
import { MoreThan, IsNull, Between, Not, In, LessThan } from "typeorm";
import { Subscription } from "../../shared/entities/Subscription";
import { Item } from "../../shared/entities/Item";
import { notificationService } from "../../notification";
import { NotificationType } from "../../shared/entities/Notification";
import { emailService } from "../../shared/services/email.service";
import {
  dedupeEmails,
  getTourStartAt,
  isReminderDue,
  minimumNoticeToMs,
  normalizeTourDate,
  TOUR_REMINDER_ELIGIBLE_STATUSES,
} from "../../event/utils/tour-reminder.util";



const SUBSCRIPTION_RENEWAL_REMINDER_OFFSETS = new Set([7, 3, 0, -1, -3, -7]);

export class CronService {
    private jobs: Map<string, ScheduledTask> = new Map();
    private invoiceRepository = AppDataSource.getRepository(Invoice);
    private attendanceRepository = AppDataSource.getRepository(Attendance);
    private tourBookingRepository = AppDataSource.getRepository(TourBooking);
    private tourEventRepository = AppDataSource.getRepository(TourEvent);
    private userRepository = AppDataSource.getRepository(User);
    private subscriptionRepository = AppDataSource.getRepository(Subscription);

    // In-memory cache to prevent spamming late pickup alerts (reset daily)
    private sentLateNotifications: Set<string> = new Set();
    private lastResetDate: string = "";

    private subscriptionRenewalReminderKeys: Set<string> = new Set();
    private subscriptionRenewalReminderResetDay: string = "";

    constructor() {
        this.jobs = new Map();
    }


    initialize(): void {
        logger.info("⏰ Initializing Cron Service...");

        this.scheduleJob("recurring-invoice-generation", "0 7 * * *", async () => {
            await this.generateRecurringInvoices();
        });

        this.scheduleJob("invoice-reminders", "0 9 * * *", async () => {
            await this.checkInvoiceDueDates();
        });

        this.scheduleJob("late-pickup-alert", "*/30 14-20 * * 1-5", async () => {
            await this.checkLatePickups();
        });

        this.scheduleJob("tour-follow-up-24h", "0 10 * * *", async () => {
            await this.checkTourFollowUps();
        });

        this.scheduleJob("tour-completed-2h", "0 * * * *", async () => {
            await this.checkTourCompletedFollowUps();
        });

        this.scheduleJob("admission-offer-nudge", "0 11 * * *", async () => {
            await this.checkAdmissionOfferNoResponse();
        });

        this.scheduleJob("subscription-expiry-job", "0 10 * * *", async () => {
            await this.processSubscriptionExpiry();
        });

        this.scheduleJob("subscription-reminder-job", "0 10 * * *", async () => {
            await this.processSubscriptionReminders();
        });

        this.scheduleJob("tour-booking-reminder", "*/1 * * * *", async () => {
            await this.processTourBookingReminders();
        });

        logger.info(`✅ Cron Service initialized with ${this.jobs.size} jobs.`);
    }


    private scheduleJob(name: string, schedule: string, task: () => Promise<void> | void): void {
        if (this.jobs.has(name)) {
            logger.warn(`⚠️ Job ${name} already exists. Skipping.`);
            return;
        }

        const job = cron.schedule(schedule, async () => {
            try {
                await task();
            } catch (error: any) {
                logger.error(`❌ Cron job failed: ${name}`, error.message || error);
            }
        });

        this.jobs.set(name, job);
        logger.info(`📅 Scheduled job: ${name} (${schedule})`);
    }


    private getNextGenerationDate(lastDate: Date, billingPeriod: BillingPeriod): Date {
        const next = new Date(lastDate);
        switch (billingPeriod) {
            case BillingPeriod.MONTHLY:
                next.setMonth(next.getMonth() + 1);
                break;
            case BillingPeriod.Termly:
                next.setMonth(next.getMonth() + 4);
                break;
            case BillingPeriod.YEARLY:
                next.setFullYear(next.getFullYear() + 1);
                break;
        }
        return next;
    }

    private async generateRecurringInvoices(): Promise<void> {
        logger.info("🔄 Starting recurring invoice generation...");

        const recurringInvoices = await this.invoiceRepository.find({
            where: {
                invoiceType: InvoiceType.RECURRING,
                status: Not(In([InvoiceStatus.VOID]))
            },
            relations: ["items", "student", "student.parents", "student.parents.user", "student.user", "school"]
        });

        if (recurringInvoices.length === 0) {
            logger.info("🔄 No recurring invoices found.");
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let generated = 0;
        let skipped = 0;

        const { invoiceService } = await import("../../invoice/services/invoice.service");

        await this.processInBatches(recurringInvoices, 10, async (invoice) => {
            if (!invoice.billingPeriod) {
                skipped++;
                return;
            }

            const referenceDate = invoice.lastGeneratedDate || invoice.issueDate;
            const nextGenDate = this.getNextGenerationDate(new Date(referenceDate), invoice.billingPeriod);
            nextGenDate.setHours(0, 0, 0, 0);

            if (today < nextGenDate) {
                skipped++;
                return;
            }

            try {
                const originalDuration = new Date(invoice.dueDate).getTime() - new Date(invoice.issueDate).getTime();
                const newIssueDate = new Date();
                const newDueDate = new Date(newIssueDate.getTime() + originalDuration);

                const itemsData = (invoice.items || []).map((item: Item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    rate: Number(item.rate),
                    tax: item.tax || 0
                }));

                await invoiceService.createInvoice({
                    classroomId: invoice.classroomId,
                    studentId: invoice.studentId,
                    notes: invoice.notes,
                    issueDate: newIssueDate,
                    dueDate: newDueDate,
                    amountPaid: 0,
                    billingPeriod: invoice.billingPeriod,
                    items: itemsData,
                    schoolId: invoice.schoolId
                });

                // Update lastGeneratedDate on the original recurring invoice
                await this.invoiceRepository.update(invoice.id, { lastGeneratedDate: new Date() });

                generated++;
                logger.info(`🔄 Generated recurring invoice from ${invoice.invoiceNumber} for student ${invoice.studentId}`);
            } catch (error: any) {
                logger.error(`❌ Failed to generate recurring invoice from ${invoice.invoiceNumber}:`, error.message || error);
            }
        });

        logger.info(`🔄 Recurring invoice generation complete: ${generated} generated, ${skipped} skipped.`);
    }

    private async checkInvoiceDueDates(): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);

        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);

        const dueToday = await this.invoiceRepository.find({
            where: {
                dueDate: today,
                balance: MoreThan(0)
            },
            relations: ["parents", "parents.user", "school", "student", "student.user"]
        });

        if (dueToday.length > 0) {
            await this.processInBatches(dueToday, 20, async (invoice) => {
                if (invoice.parents && invoice.parents.length > 0) {
                    for (const parent of invoice.parents) {
                        if (parent.user?.id) {
                            await notificationService.sendNotification({
                                userId: parent.user.id,
                                schoolId: invoice.schoolId,
                                title: `Invoice Reminder - Due Today`,
                                message: `Dear ${parent.user.firstName || 'Parent'},\n\nThis is a reminder that invoice ${invoice.invoiceNumber} for ${invoice.student?.user?.firstName || 'your child'} is due today.\n\nAmount Due: ${invoice.balance}\n\nPlease verify in your portal.`,
                                type: NotificationType.INVOICE,
                                sendEmail: true
                            });
                        }
                    }
                }
            });
        }


        const upcoming = await this.invoiceRepository.find({
            where: {
                dueDate: threeDaysFromNow,
                balance: MoreThan(0)
            },
            relations: ["parents", "parents.user", "school", "student", "student.user"]
        });

        if (upcoming.length > 0) {
            await this.processInBatches(upcoming, 20, async (invoice) => {
                if (invoice.parents && invoice.parents.length > 0) {
                    for (const parent of invoice.parents) {
                        if (parent.user?.id) {
                            await notificationService.sendNotification({
                                userId: parent.user.id,
                                schoolId: invoice.schoolId,
                                title: `Upcoming Invoice Reminder`,
                                message: `Dear ${parent.user.firstName || 'Parent'},\n\nThis is a reminder that invoice ${invoice.invoiceNumber} for ${invoice.student?.user?.firstName || 'your child'} will be due on ${invoice.dueDate}.\n\nAmount Due: ${invoice.balance}`,
                                type: NotificationType.INVOICE,
                                sendEmail: true
                            });
                        }
                    }
                }
            });
        }


        const overdue = await this.invoiceRepository.find({
            where: {
                dueDate: threeDaysAgo,
                balance: MoreThan(0)
            },
            relations: ["parents", "parents.user", "school", "student", "student.user"]
        });

        if (overdue.length > 0) {
            await this.processInBatches(overdue, 20, async (invoice) => {
                if (invoice.parents && invoice.parents.length > 0) {
                    for (const parent of invoice.parents) {
                        if (parent.user?.id) {
                            await notificationService.sendNotification({
                                userId: parent.user.id,
                                schoolId: invoice.schoolId,
                                title: `Invoice Reminder - 3 Days Overdue`,
                                message: `Dear ${parent.user.firstName || 'Parent'},\n\nThis is an urgent reminder that invoice ${invoice.invoiceNumber} for ${invoice.student?.user?.firstName || 'your child'} is 3 days overdue.\n\nAmount Due: ${invoice.balance}\n\nPlease make payment immediately to avoid interruptions.`,
                                type: NotificationType.INVOICE,
                                sendEmail: true
                            });
                        }
                    }
                }
            });
        }
    }


    private async checkLatePickups(): Promise<void> {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0] || "";

        // Reset cache if new day
        if (this.lastResetDate !== todayStr) {
            this.sentLateNotifications.clear();
            this.lastResetDate = todayStr;
        }




        const activeAttendances = await this.attendanceRepository.find({
            where: {
                date: todayStr as any,
                timeOut: IsNull(),
            },
            relations: ["school", "student", "student.user", "parent", "parent.user"]
        });

        if (activeAttendances.length === 0) return;

        const latePickups: Attendance[] = [];

        for (const attendance of activeAttendances) {
            if (!attendance.school || !attendance.school.schoolClosingTime) continue;


            const [hours = 0, minutes = 0] = attendance.school.schoolClosingTime.split(':').map(Number);
            const closingTime = new Date(now);
            closingTime.setHours(hours, minutes, 0, 0);

    
            const lateThreshold = new Date(closingTime.getTime() + 30 * 60000);

            if (now > lateThreshold) {
                const cacheKey = `${attendance.id}-${todayStr}`;
                if (!this.sentLateNotifications.has(cacheKey)) {
                    latePickups.push(attendance);
                    this.sentLateNotifications.add(cacheKey);
                }
            }
        }

        if (latePickups.length > 0) {
            logger.info(`⚠️ Sending ${latePickups.length} late pickup alerts`);
            await this.processInBatches(latePickups, 20, async (attendance) => {
                const parentName = attendance.parent?.user?.firstName || 'Parent';
                const studentName = attendance.student?.user?.firstName || 'Student';

                if (attendance.parent?.user?.id && attendance.schoolId && attendance.school?.schoolClosingTime) {
                    const [hours = 0, minutes = 0] = attendance.school.schoolClosingTime.split(':').map(Number);
                    const closingTime = new Date(now);
                    closingTime.setHours(hours, minutes, 0, 0);
                    const lateThreshold = new Date(closingTime.getTime() + 30 * 60000);
                    const minutesLate = Math.floor((now.getTime() - lateThreshold.getTime()) / 60000);

                    await notificationService.sendNotification({
                        userId: attendance.parent.user.id,
                        schoolId: attendance.schoolId,
                        title: `Late Pickup Alert`,
                        message: `Dear ${parentName},\n\nThis is a reminder that ${studentName} is yet to be picked up. School closed at ${attendance.school.schoolClosingTime}. It's currently ${minutesLate} minutes past the grace period.`,
                        type: NotificationType.ATTENDANCE,
                        sendEmail: true,
                        data: {
                            studentName,
                            minutesLate,
                            closingTime: attendance.school.schoolClosingTime
                        }
                    });
                }
            });
        }
    }

    private async checkTourFollowUps(): Promise<void> {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];



        const tours = await this.tourBookingRepository.find({
            where: {
                date: yesterdayStr,
                status: BookingStatus.COMPLETED
            },
            relations: ["school"]
        });

        if (tours.length > 0) {
            await this.processInBatches(tours, 20, async (tour) => {
                if (tour.schoolId) {
                    await notificationService.notifyAdmins({
                        schoolId: tour.schoolId,
                        title: `Tour Follow-Up Reminder (24h)`,
                        message: `A tour was completed 24 hours ago for ${tour.names?.[0] || 'Guest'}. Please ensure follow-up actions have been taken.`,
                        type: NotificationType.INFO,
                        data: { tourId: tour.id }
                    });
                }
            });
        }
    }


    private async checkTourCompletedFollowUps(): Promise<void> {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);



        const tours = await this.tourBookingRepository.find({
            where: {
                status: BookingStatus.COMPLETED,
                updatedAt: Between(threeHoursAgo, twoHoursAgo)
            },
            relations: ["school"]
        });

        if (tours.length > 0) {
            await this.processInBatches(tours, 20, async (tour) => {
                if (tour.schoolId) {
                    await notificationService.notifyAdmins({
                        schoolId: tour.schoolId,
                        title: `Action Required: Tour Completed 2 Hours Ago`,
                        message: `The tour for ${tour.names?.[0] || 'Guest'} was marked as completed 2 hours ago. Please initiate post-tour follow-up.`,
                        type: NotificationType.INFO,
                        data: { tourId: tour.id }
                    });
                }
            });
        }
    }


    private async checkAdmissionOfferNoResponse(): Promise<void> {
        const now = new Date();
        const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);



        const ninetySixHoursAgo = new Date(now.getTime() - 96 * 60 * 60 * 1000);

        const offers = await this.tourBookingRepository.find({
            where: {
                status: BookingStatus.OFFER_SENT,
                updatedAt: Between(ninetySixHoursAgo, seventyTwoHoursAgo)
            },
            relations: ["school"]
        });

        if (offers.length > 0) {
            await this.processInBatches(offers, 20, async (tour) => {
                if (tour.schoolId) {
                    await notificationService.notifyAdmins({
                        schoolId: tour.schoolId,
                        title: `Nudge: Admission Offer Pending (72h)`,
                        message: `An admission offer was sent to ${tour.names?.[0] || 'Applicant'} over 72 hours ago and is still pending.`,
                        type: NotificationType.WARNING,
                        data: { tourId: tour.id }
                    });
                }
            });
        }
    }

    private async getSchoolStaffEmails(schoolId?: number): Promise<string[]> {
        if (!schoolId) return [];
        const admins = await this.userRepository.find({
            where: [
                { schoolId, role: UserRole.ADMIN, isActive: true },
                { schoolId, role: UserRole.SUPER_ADMIN, isActive: true },
            ],
            select: { email: true },
        });
        return admins.map((u) => u.email).filter((e): e is string => !!e?.trim());
    }

    private async processTourBookingReminders(): Promise<void> {
        const batchSize = 10;
        let lastEventId = 0;
        let totalSent = 0;
        let eventsScanned = 0;
        let pendingBookings = 0;
        let skippedNotDue = 0;
        let skippedNoRecipients = 0;

        logger.info("tour-booking-reminder: tick started");

        while (true) {
            const events = await this.tourEventRepository.find({
                where: {
                    status: TourStatus.PUBLISHED,
                    id: MoreThan(lastEventId),
                },
                relations: ["school", "school.creator"],
                order: { id: "ASC" },
                take: batchSize,
            });

            if (events.length === 0) break;

            eventsScanned += events.length;

            await this.processInBatches(events, batchSize, async (event) => {
                const bookings = await this.tourBookingRepository.find({
                    where: {
                        tourEventId: event.id,
                        hasSentReminder: false,
                        status: In(TOUR_REMINDER_ELIGIBLE_STATUSES),
                        deletedAt: IsNull(),
                    },
                    relations: ["slot", "school"],
                });

                for (const booking of bookings) {
                    pendingBookings++;

                    if (!isReminderDue(booking, event)) {
                        skippedNotDue++;
                        const slotStartTime = booking.slot?.startTime ?? "missing";
                        const tourDateLabel = normalizeTourDate(booking.date);
                        let reminderAtLabel = "n/a";
                        let tourStartLabel = "n/a";
                        if (booking.date && booking.slot?.startTime) {
                            const tourStart = getTourStartAt(booking.date, booking.slot.startTime);
                            if (!Number.isNaN(tourStart.getTime())) {
                                tourStartLabel = tourStart.toISOString();
                                const reminderAt = new Date(
                                    tourStart.getTime() -
                                        minimumNoticeToMs(
                                            event.minimumNotice ?? 0,
                                            event.minimumNoticeUnit,
                                        ),
                                );
                                reminderAtLabel = reminderAt.toISOString();
                            }
                        }
                        logger.info(
                            `tour-booking-reminder: skippedNotDue bookingId=${booking.id} ` +
                                `date=${tourDateLabel} startTime=${slotStartTime} ` +
                                `tourStart=${tourStartLabel} reminderAt=${reminderAtLabel} ` +
                                `minimumNotice=${event.minimumNotice ?? 0} ${event.minimumNoticeUnit}`,
                        );
                        continue;
                    }

                    const bookerName = booking.names?.[0] || "Guest";
                    const school = event.school ?? booking.school;
                    const schoolName = school?.schoolName || "School";
                    const location = event.location || school?.address || "School Campus";
                    const tourTime = booking.slot?.startTime || "TBD";
                    const duration = `${event.duration || 30} minutes`;
                    const tourDateLabelForSend = normalizeTourDate(booking.date);

                    const bookerEmail = (booking.email || "").trim();
                    const adminEmails = await this.getSchoolStaffEmails(
                        school?.id ?? booking.schoolId,
                    );
                    const schoolEmails = dedupeEmails([
                        school?.creator?.email,
                        school?.email,
                        ...adminEmails,
                    ]);

                    if (!bookerEmail && schoolEmails.length === 0) {
                        skippedNoRecipients++;
                        logger.warn(
                            `tour-booking-reminder: booking ${booking.id} is due but has no recipient emails`,
                        );
                        continue;
                    }

                    try {
                        const sendTasks: Promise<void>[] = [];

                        if (bookerEmail) {
                            sendTasks.push(
                                emailService.sendTourUpcomingReminderBookerEmail({
                                    email: bookerEmail,
                                    parentName: bookerName,
                                    schoolName,
                                    tourDate: tourDateLabelForSend,
                                    tourTime,
                                    location,
                                    duration,
                                    phoneNumber: school?.phoneNumber,
                                }),
                            );
                        }

                        if (schoolEmails.length > 0) {
                            sendTasks.push(
                                emailService.sendTourUpcomingReminderSchoolEmail({
                                    emails: schoolEmails,
                                    schoolName,
                                    bookerName,
                                    bookerEmail: bookerEmail || "No email provided",
                                    tourDate: tourDateLabelForSend,
                                    tourTime,
                                    location,
                                    duration,
                                    guestCount: booking.guests?.length || 0,
                                    note: booking.note,
                                }),
                            );
                        }

                        await Promise.all(sendTasks);

                        await this.tourBookingRepository.update(booking.id, {
                            hasSentReminder: true,
                        });
                        totalSent++;
                    } catch (error) {
                        logger.error(
                            `Failed to send tour reminder for booking ${booking.id}:`,
                            error,
                        );
                    }
                }
            });

            lastEventId = events[events.length - 1]!.id;
        }

        logger.info(
            `tour-booking-reminder: tick done — events=${eventsScanned}, pending=${pendingBookings}, ` +
                `sent=${totalSent}, skippedNotDue=${skippedNotDue}, skippedNoRecipients=${skippedNoRecipients}`,
        );
    }

    private calendarDaysRenewalMinusToday(renewalDate: Date): number {
        const r = new Date(renewalDate);
        r.setHours(0, 0, 0, 0);
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return Math.round((r.getTime() - t.getTime()) / 86_400_000);
    }

    private subscriptionRenewalReminderMessage(offset: number): { title: string; message: string } {
        if (offset === 7) {
            return {
                title: "Subscription renews in 7 days",
                message: "Your school subscription renewal date is in 7 days. Please renew in billing to avoid interruption.",
            };
        }
        if (offset === 3) {
            return {
                title: "Subscription renews in 3 days",
                message: "Your school subscription renewal date is in 3 days. Please complete payment soon.",
            };
        }
        if (offset === 0) {
            return {
                title: "Subscription renewal due today",
                message: "Your school subscription renewal date is today. Please renew to keep full access.",
            };
        }
        if (offset === -1) {
            return {
                title: "Subscription renewal overdue",
                message: "Your school subscription was due for renewal yesterday. Renew now to restore access after payment clears.",
            };
        }
        if (offset === -3) {
            return {
                title: "Subscription renewal reminder (3 days overdue)",
                message: "Your school subscription renewal is 3 days overdue. Renew under Subscriptions to continue.",
            };
        }
        return {
            title: "Subscription renewal reminder (7 days overdue)",
            message: "Your school subscription renewal is 7 days overdue. Renew under Subscriptions to continue.",
        };
    }

    private async processSubscriptionExpiry(): Promise<void> {
        logger.info("Starting subscription-expiry-job (active -> past_due)...");

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const overdueActive = await this.subscriptionRepository.find({
            where: {
                status: SubscriptionStatus.ACTIVE,
                isCancelled: false,
                renewalDate: LessThan(startOfToday),
            },
        });

        for (const sub of overdueActive) {
            sub.status = SubscriptionStatus.PAST_DUE;
            await this.subscriptionRepository.save(sub);
        }

        if (overdueActive.length > 0) {
            logger.info(`Marked ${overdueActive.length} active subscription(s) as past_due (renewal date before today).`);
        }

        logger.info("subscription-expiry-job finished.");
    }

    private async processSubscriptionReminders(): Promise<void> {
        logger.info("Starting subscription-reminder-job...");

        const dayKey = new Date().toISOString().split("T")[0] || "";
        if (this.subscriptionRenewalReminderResetDay !== dayKey) {
            this.subscriptionRenewalReminderKeys.clear();
            this.subscriptionRenewalReminderResetDay = dayKey;
        }

        const reminderCandidates = await this.subscriptionRepository.find({
            where: {
                status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE]),
                isCancelled: false,
            },
        });

        for (const sub of reminderCandidates) {
            const offset = this.calendarDaysRenewalMinusToday(sub.renewalDate);
            if (!SUBSCRIPTION_RENEWAL_REMINDER_OFFSETS.has(offset)) {
                continue;
            }
            const dedupeKey = `${sub.id}-${offset}-${dayKey}`;
            if (this.subscriptionRenewalReminderKeys.has(dedupeKey)) {
                continue;
            }
            this.subscriptionRenewalReminderKeys.add(dedupeKey);
            const { title, message } = this.subscriptionRenewalReminderMessage(offset);
            try {
                await notificationService.notifyAdmins({
                    schoolId: sub.schoolId,
                    title,
                    message,
                    type: NotificationType.PAYMENT,
                    data: { subscriptionId: sub.id, renewalOffsetDays: offset },
                });
            } catch (err: any) {
                logger.error(`Failed subscription renewal reminder for school ${sub.schoolId}:`, err?.message || err);
            }
        }

        logger.info("subscription-reminder-job finished.");
    }


    stopJob(name: string): void {
        const job = this.jobs.get(name);
        if (job) {
            job.stop();
            logger.info(`🛑 Stopped job: ${name}`);
        } else {
            logger.warn(`⚠️ Job not found: ${name}`);
        }
    }


    stopAll(): void {
        this.jobs.forEach((job, name) => {
            job.stop();
            logger.info(`🛑 Stopped job: ${name}`);
        });
    }

    /**
     * Generic batch processor for heavy operations
     * @param items Array of items to process
     * @param batchSize Number of items to process in parallel
     * @param processor Function to process a single item
     */
    async processInBatches<T>(
        items: T[],
        batchSize: number,
        processor: (item: T) => Promise<void>
    ): Promise<{ success: number; failed: number }> {
        if (!items || items.length === 0) {
            return { success: 0, failed: 0 };
        }

        let successCount = 0;
        let failedCount = 0;


        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);


            const results = await Promise.allSettled(batch.map((item) => processor(item)));

            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    successCount++;
                } else {
                    failedCount++;
                    logger.error("❌ Error processing item in batch:", result.reason);
                }
            });


            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        if (failedCount > 0) {
            logger.warn(`⚠️ Batch processing completed with ${failedCount} failures out of ${items.length} items`);
        }
        return { success: successCount, failed: failedCount };
    }
}

export const cronService = new CronService();  
