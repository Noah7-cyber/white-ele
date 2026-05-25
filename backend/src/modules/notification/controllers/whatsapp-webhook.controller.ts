import { Request, Response } from "express";
import { AppDataSource } from "../../core/config/database";
import { Notification } from "../../shared/entities/Notification";
import { logger } from "../../shared/utils/logger";

export class WhatsAppWebhookController {
    /**
     * Meta Webhook Verification (GET)
     */
    async verify(req: Request, res: Response) {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        const verifyToken = process.env["WHATSAPP_WEBHOOK_VERIFY_TOKEN"];

        logger.info(`[WhatsApp Webhook] Verify Payload Received:`, req.query);
        logger.info(`[WhatsApp Webhook] Expected Token Length: ${verifyToken?.length}`);

        if (mode && token) {
            if (mode === "subscribe" && token === verifyToken) {
                logger.info("WhatsApp Webhook Verified successfully.");
                return res.status(200).send(String(challenge));
            } else {
                logger.warn(`WhatsApp Webhook verification failed! Mode: ${mode}, Token matched: ${token === verifyToken}`);
                return res.sendStatus(403);
            }
        }

        logger.warn(`WhatsApp Webhook Bad Request! Mode or Token missing. req.query: ${JSON.stringify(req.query)}`);
        return res.sendStatus(400);
    }

    /**
     * Meta Webhook Notification (POST)
     */
    async handleEvent(req: Request, res: Response) {
        try {
            const body = req.body;

            // Check if it's a WhatsApp event
            if (body.object === "whatsapp_business_account") {
                for (const entry of body.entry) {
                    for (const change of entry.changes) {
                        const value = change.value;

                        // Handle Status Updates (sent, delivered, read, failed)
                        if (value.statuses) {
                            for (const status of value.statuses) {
                                const messageId = status.id;
                                const statusValue = status.status;

                                await this.updateNotificationStatus(messageId, statusValue);
                            }
                        }

                        // Handle Inbound Messages (optional for now)
                        if (value.messages) {
                            for (const message of value.messages) {
                                logger.info(`Received a new WhatsApp message from ${message.from}`);
                                // Here you could trigger an automated reply or save to a Chat module
                            }
                        }
                    }
                }
                return res.status(200).send("EVENT_RECEIVED");
            } else {
                return res.sendStatus(404);
            }
        } catch (error) {
            logger.error("Error in WhatsApp webhook:", error);
            return res.sendStatus(500);
        }
    }

    private async updateNotificationStatus(messageId: string, status: string) {
        try {
            const notificationRepo = AppDataSource.getRepository(Notification);
            const notification = await notificationRepo.findOne({ where: { whatsAppMessageId: messageId } });

            if (notification) {
                notification.whatsAppStatus = status;
                await notificationRepo.save(notification);
                logger.debug(`Notification ${notification.id} WhatsApp status updated to ${status}`);
            }
        } catch (error) {
            logger.error(`Failed to update notification status for WhatsApp message ${messageId}:`, error);
        }
    }
}

export const whatsAppWebhookController = new WhatsAppWebhookController();
