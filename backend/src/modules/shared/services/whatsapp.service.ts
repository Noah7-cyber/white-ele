import axios from "axios";
import { logger } from "../utils/logger";

export interface WhatsAppTemplateComponent {
    type: "header" | "body" | "footer" | "button";
    parameters: Array<{
        type: "text" | "image" | "document" | "video" | "location";
        text?: string;
        image?: { link: string };
        document?: { link: string; filename?: string };
        video?: { link: string };
    }>;
}

export class WhatsAppService {
    private readonly accessToken: string;
    private readonly phoneNumberId: string;
    private readonly baseUrl: string;

    constructor() {
        this.accessToken = process.env["WHATSAPP_ACCESS_TOKEN"] || "";
        this.phoneNumberId = process.env["WHATSAPP_PHONE_NUMBER_ID"] || "";
        this.baseUrl = `https://graph.facebook.com/v17.0/${this.phoneNumberId}/messages`;

        if (!this.accessToken || !this.phoneNumberId) {
            logger.warn("WhatsApp service is not fully configured. Check environment variables.");
        }
    }

    /**
     * Send a template-based message (Required for outbound notifications)
     */
    async sendTemplateMessage(
        to: string,
        templateName: string,
        languageCode: string = "en_US",
        components: WhatsAppTemplateComponent[] = []
    ): Promise<{ success: boolean; messageId?: string; error?: any }> {
        try {
            const data = {
                messaging_product: "whatsapp",
                to: this.formatPhoneNumber(to),
                type: "template",
                template: {
                    name: templateName,
                    language: {
                        code: languageCode,
                    },
                    components,
                },
            };

            const response = await axios.post(this.baseUrl, data, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            logger.info(`WhatsApp template message sent to ${to}. ID: ${response.data.messages[0].id}`);
            return { success: true, messageId: response.data.messages[0].id };
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            logger.error(`Failed to send WhatsApp template message: ${errorMessage}`, {
                to,
                templateName,
                details: error.response?.data,
            });
            return { success: false, error: error.response?.data || error.message };
        }
    }

    /**
     * Send a direct text message (Only works if user messaged first within 24h)
     */
    async sendDirectMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: any }> {
        try {
            const data = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: this.formatPhoneNumber(to),
                type: "text",
                text: {
                    preview_url: false,
                    body: message,
                },
            };

            const response = await axios.post(this.baseUrl, data, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            logger.info(`WhatsApp direct message sent to ${to}. ID: ${response.data.messages[0].id}`);
            return { success: true, messageId: response.data.messages[0].id };
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            logger.error(`Failed to send WhatsApp direct message: ${errorMessage}`, {
                to,
                details: error.response?.data,
            });
            return { success: false, error: error.response?.data || error.message };
        }
    }

    /**
     * Helper to format phone number to E.164 (without +)
     */
    private formatPhoneNumber(phone: string): string {
        // Remove any non-numeric characters
        const cleaned = phone.replace(/\D/g, "");
        // Ensure it doesn't have a leading + if we were to add it, Meta expects just the digits
        return cleaned;
    }
}

export const whatsappService = new WhatsAppService();
