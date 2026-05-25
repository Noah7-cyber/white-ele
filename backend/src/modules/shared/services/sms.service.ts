import crypto from 'crypto';
import { Twilio } from "twilio";

export interface SMSVerificationResult {
    success: boolean;
    message: string;
    code?: string; // Only for development/testing
}

export interface SMSCodeValidation {
    isValid: boolean;
    phone?: string;
}

class SMSService {
    private verificationCodes: Map<string, { code: string; expiresAt: Date; attempts: number }> = new Map();
    private readonly CODE_EXPIRY_MINUTES = 10;
    private readonly MAX_ATTEMPTS = 3;

    /**
     * Send SMS verification code
     */
    async sendVerificationCode(phone: string): Promise<SMSVerificationResult> {
        try {
            // Validate phone number format
            if (!this.isValidPhoneNumber(phone)) {
                return {
                    success: false,
                    message: 'Invalid phone number format',
                };
            }

            // Generate 6-digit verification code
            const code = this.generateVerificationCode();
            const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

            // Store verification code
            this.verificationCodes.set(phone, {
                code,
                expiresAt,
                attempts: 0,
            });

            // In development or test, we'll just log the code instead of sending SMS
            if (process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'test' || !process.env['NODE_ENV']) {
                console.log(`SMS Verification Code for ${phone}: ${code}`);
                return {
                    success: true,
                    message: 'Verification code sent successfully',
                    code, // Include code in development/test for testing
                };
            }

            // In production, integrate with Twilio or other SMS provider
            await this.sendSMSViaTwilio(phone, code);

            return {
                success: true,
                message: 'Verification code sent successfully',
            };
        } catch (error) {
            console.error('Failed to send SMS verification code:', error);
            return {
                success: false,
                message: 'Failed to send verification code',
            };
        }
    }

    /**
     * Verify SMS code
     */
    verifyCode(phone: string, code: string): SMSCodeValidation {
        const storedData = this.verificationCodes.get(phone);

        if (!storedData) {
            return { isValid: false };
        }

        // Check if code has expired
        if (new Date() > storedData.expiresAt) {
            this.verificationCodes.delete(phone);
            return { isValid: false };
        }

        // Check if max attempts exceeded
        if (storedData.attempts >= this.MAX_ATTEMPTS) {
            this.verificationCodes.delete(phone);
            return { isValid: false };
        }

        // Increment attempts
        storedData.attempts++;

        // Verify code
        if (storedData.code === code) {
            this.verificationCodes.delete(phone);
            return { isValid: true, phone };
        }

        return { isValid: false };
    }

    /**
     * Validate phone number format
     */
    private isValidPhoneNumber(phone: string): boolean {
        // Basic international phone number validation
        // Accepts formats like: +1234567890, +12 345 678 9012, etc.
        const phoneRegex = /^\+[1-9]\d{4,14}$/;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(cleanPhone);
    }

    /**
     * Normalize phone number (remove spaces, dashes, etc.)
     */
    normalizePhoneNumber(phone: string): string {
        return phone.replace(/[\s\-\(\)]/g, '');
    }

    /**
     * Generate 6-digit verification code
     */
    private generateVerificationCode(): string {
        return crypto.randomInt(100000, 999999).toString();
    }

    /**
     * Send SMS via Twilio (production implementation)
     */
    private async sendSMSViaTwilio(phone: string, code: string): Promise<void> {
        const accountSid = process.env['TWILIO_ACCOUNT_SID'];
        const authToken = process.env['TWILIO_AUTH_TOKEN'];
        const fromNumber = process.env['TWILIO_PHONE_NUMBER'];

        if (!accountSid || !authToken || !fromNumber) {
            throw new Error('Twilio configuration is missing');
        }

        const client = new Twilio(accountSid, authToken);

        await client.messages.create({
            body: `Your verification code is: ${code}. This code will expire in ${this.CODE_EXPIRY_MINUTES} minutes.`,
            from: fromNumber,
            to: phone
        });

        console.log(`SMS verification code sent to ${phone}`);
    }

    /**
     * Send phone change verification code
     */
    async sendPhoneChangeVerification(newPhone: string, code: string): Promise<boolean> {
        try {
            // Validate phone number format
            if (!this.isValidPhoneNumber(newPhone)) {
                return false;
            }

            // In development or test, we'll just log the code instead of sending SMS
            if (process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'test' || !process.env['NODE_ENV']) {
                console.log(`Phone Change Verification Code for ${newPhone}: ${code}`);
                return true;
            }

            // In production, integrate with Twilio or other SMS provider
            await this.sendSMSViaTwilio(newPhone, code);
            return true;
        } catch (error) {
            console.error('Failed to send phone change verification code:', error);
            return false;
        }
    }

    /**
     * Clean up expired codes (should be called periodically)
     */
    cleanupExpiredCodes(): void {
        const now = new Date();
        for (const [phone, data] of this.verificationCodes.entries()) {
            if (now > data.expiresAt) {
                this.verificationCodes.delete(phone);
            }
        }
    }

    /**
     * Get verification code for testing purposes (only in test environment)
     */
    getVerificationCodeForPhone(phone: string): string | null {
        if (process.env['NODE_ENV'] !== 'test') {
            throw new Error('This method is only available in test environment');
        }

        const data = this.verificationCodes.get(phone);
        return data ? data.code : null;
    }

    /**
     * Clear all verification codes (only in test environment)
     */
    clearVerificationCodes(): void {
        if (process.env['NODE_ENV'] !== 'test') {
            throw new Error('This method is only available in test environment');
        }
        this.verificationCodes.clear();
    }


    /**
     * Send a generic SMS message
     */
    async sendSms(phone: string, message: string): Promise<{ success: boolean; message: string }> {
        try {
            // Validate phone number format
            if (!this.isValidPhoneNumber(phone)) {
                return {
                    success: false,
                    message: "Invalid phone number format",
                };
            }

            // In development or test, we'll just log the message
            if (process.env["NODE_ENV"] === "development" || process.env["NODE_ENV"] === "test" || !process.env["NODE_ENV"]) {
                console.log(`SMS to ${phone}: ${message}`);
                return {
                    success: true,
                    message: "SMS sent successfully (mock)",
                };
            }

            // In production, integrate with Twilio
            const accountSid = process.env["TWILIO_ACCOUNT_SID"];
            const authToken = process.env["TWILIO_AUTH_TOKEN"];
            const fromNumber = process.env["TWILIO_PHONE_NUMBER"];

            if (!accountSid || !authToken || !fromNumber) {
                console.warn("Twilio configuration is missing");
                return {
                    success: false,
                    message: "SMS configuration missing",
                };
            }

            const client = new Twilio(accountSid, authToken);

            await client.messages.create({
                body: message,
                from: fromNumber,
                to: phone
            });

            console.log(`SMS sent to ${phone}`);

            return {
                success: true,
                message: "SMS sent successfully",
            };
        } catch (error) {
            console.error("Failed to send SMS:", error);
            return {
                success: false,
                message: "Failed to send SMS",
            };
        }
    }
}

export const smsService = new SMSService();

// Clean up expired codes every 5 minutes (only in production)
if (process.env['NODE_ENV'] !== 'test') {
    setInterval(() => {
        smsService.cleanupExpiredCodes();
    }, 5 * 60 * 1000);
}