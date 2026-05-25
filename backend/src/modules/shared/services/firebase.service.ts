import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";
import { firebaseConfig } from "../../core/config/firebase";
import { logger } from "../utils/logger";

/**
 * Two separate Firebase accounts (same as ZippyPay):
 * - Storage: uses env vars (FIREBASE_* for storage project)
 * - Notifications: uses service account JSON file (FCM)
 */

const NOTIFICATION_SERVICE_ACCOUNT_PATH =
    process.env["FIREBASE_NOTIFICATION_SERVICE_ACCOUNT_PATH"] ||
    path.resolve(process.cwd(), "cw-firebase-notification-adminsdk.json");

const STORAGE_APP_NAME = "storage";

function loadNotificationServiceAccount(): admin.ServiceAccount | null {
    try {
        if (!fs.existsSync(NOTIFICATION_SERVICE_ACCOUNT_PATH)) {
            logger.warn(
                `Firebase notification service account not found at: ${NOTIFICATION_SERVICE_ACCOUNT_PATH}`
            );
            return null;
        }

        const raw = fs.readFileSync(NOTIFICATION_SERVICE_ACCOUNT_PATH, "utf8");
        const parsed = JSON.parse(raw);

        if (!parsed.private_key || !parsed.client_email) {
            logger.error("Invalid Firebase notification service account JSON format");
            return null;
        }

        parsed.private_key = (parsed.private_key as string).replace(/\\n/g, "\n");
        return parsed as admin.ServiceAccount;
    } catch (err) {
        logger.error("Failed to load Firebase notification service account JSON:", err);
        return null;
    }
}

/**
 * Firebase app for push notifications (FCM). Uses service account JSON file.
 */
export function getFirebaseApp(): admin.app.App | null {
    const defaultApp = admin.apps.find((a) => a?.name === "[DEFAULT]");
    if (defaultApp) return defaultApp as admin.app.App;

    const serviceAccount = loadNotificationServiceAccount();
    if (!serviceAccount) {
        logger.warn(
            "Firebase notification service account could not be loaded, FCM disabled"
        );
        return null;
    }

    try {
        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        logger.info("Firebase admin initialized (push notifications, from JSON)");
        return app;
    } catch (err) {
        logger.error("Error initializing Firebase admin for notifications:", err);
        return null;
    }
}

/**
 * Firebase app for storage only. Uses env vars (separate project/account).
 */
export function getFirebaseStorageApp(): admin.app.App | null {
    try {
        return admin.app(STORAGE_APP_NAME);
    } catch {
        /* not yet initialized */
    }

    const cfg = firebaseConfig;
    if (!cfg?.projectId || !cfg?.clientEmail || !cfg?.privateKey?.trim()) {
        logger.warn(
            "Firebase storage env vars (FIREBASE_PROJECT_ID, FIREBASE_EMAIL_CLIENT, FIREBASE_PRIVATE_KEY) not set. Storage disabled."
        );
        return null;
    }

    try {
        const credential = admin.credential.cert({
            projectId: cfg.projectId,
            clientEmail: cfg.clientEmail,
            privateKey: cfg.privateKey,
        } as admin.ServiceAccount);

        const app = admin.initializeApp(
            {
                credential,
                storageBucket: cfg.storage_bucket,
            },
            STORAGE_APP_NAME
        );

        logger.info("Firebase storage app initialized (from env)");
        return app;
    } catch (err) {
        logger.error("Error initializing Firebase storage app:", err);
        return null;
    }
}

/**
 * FCM push notification helper. Uses the default app (notification JSON).
 */
export class FirebaseNotification {
    private app: admin.app.App | null = null;
    private messaging: admin.messaging.Messaging | null = null;
    private readonly isConfigured: boolean;

    constructor() {
        this.app = getFirebaseApp();
        if (!this.app) {
            this.isConfigured = false;
            return;
        }
        this.messaging = this.app.messaging();
        this.isConfigured = true;
    }

    async notify(
        pushToken: string | string[],
        data: Record<string, any>,
        notification: { title: string; body: string }
    ): Promise<unknown> {
        const stringData: Record<string, string> = {};
        for (const key in data) {
            stringData[key] = String(data[key] ?? "");
        }

        if (!this.isConfigured || !this.messaging) {
            logger.warn("Firebase FCM not configured, skipping push");
            return null;
        }

        try {
            if (typeof pushToken === "string") {
                const result = await this.messaging.send({
                    token: pushToken,
                    data: { ...stringData, type: "notification" },
                    notification: {
                        title: notification.title,
                        body: notification.body,
                    },
                    android: { priority: "high" },
                    apns: {
                        headers: { "apns-priority": "10" },
                        payload: { aps: { sound: "default", contentAvailable: true } },
                    },
                    webpush: {
                        headers: { Urgency: "high" },
                        notification: {
                            title: notification.title,
                            body: notification.body,
                        },
                    },
                });
                logger.info("Firebase notification sent:", result);
                return result;
            }

            return await this.messaging.sendEachForMulticast({
                tokens: pushToken,
                data: stringData,
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
            });
        } catch (error: any) {
            logger.error(
                `Firebase push failed (code: ${error?.code || "UNKNOWN"}): ${error?.message}`,
                error
            );
            return { error, isConfigured: this.isConfigured };
        }
    }
}
