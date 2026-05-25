import sgMail from "@sendgrid/mail";
import { Resend } from "resend";
import { MailtrapClient } from "mailtrap";
import nodemailer, { Transporter } from "nodemailer";
import { IEmailProvider, EmailMessage, EmailSendResult } from "./types";

/** SendGrid requires base64; Buffer.toString("base64") is correct, but string content must be encoded explicitly. */
function attachmentToBase64(content: Buffer | string): string {
  if (Buffer.isBuffer(content)) {
    return content.toString("base64");
  }
  if (typeof content === "string") {
    return Buffer.from(content, "utf8").toString("base64");
  }
  return Buffer.from(content as Uint8Array).toString("base64");
}

//---------------------------------------------------
// --- SendGrid ---
//---------------------------------------------------
export class SendGridProvider extends IEmailProvider {
  constructor(private apiKey: string, private fromEmail: string, private fromName: string, private replyTo: string) {
    super();
  }

  init() {
    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
      this.configured = true;
    }
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const toList = Array.isArray(message.to) ? message.to : [message.to];
    const [response] = await sgMail.send({
      to: toList,
      from: `${this.fromName} <${this.fromEmail}>`,
      replyTo: this.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text || this.htmlToText(message.html),
      attachments: message.attachments?.map((attr) => ({
        content: attachmentToBase64(attr.content),
        filename: attr.filename,
        type: attr.contentType,
        disposition: "attachment",
      })),
    });
    return { success: true, messageId: response.headers["x-message-id"] as string };
  }
}

//---------------------------------------------------
// --- Resend ---
//---------------------------------------------------
export class ResendProvider extends IEmailProvider {
  private client?: Resend;
  constructor(private apiKey: string, private fromEmail: string, private fromName: string, private replyTo: string) {
    super();
  }

  init() {
    if (this.apiKey) {
      this.client = new Resend(this.apiKey);
      this.configured = true;
    }
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const toList = Array.isArray(message.to) ? message.to : [message.to];
    const { data, error } = await this.client!.emails.send({
      from: `${this.fromName} <${this.fromEmail}>`,
      to: toList,
      subject: message.subject,
      html: message.html,
      text: message.text || this.htmlToText(message.html),
      replyTo: this.replyTo,
      attachments: message.attachments?.map((attr) => ({
        filename: attr.filename,
        content: Buffer.isBuffer(attr.content) ? attr.content : Buffer.from(attr.content, "utf8"),
      })),
    });

    if (error) throw new Error(error.message);

    return { success: true, messageId: data?.id };
  }
}

//---------------------------------------------------
// --- Gmail / Nodemailer ---
//---------------------------------------------------
export class GmailProvider extends IEmailProvider {
  private transporter?: Transporter;
  constructor(private user: string, private pass: string, private fromName: string) {
    super();
  }

  init() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: this.user, pass: this.pass },
    });

    this.configured = true;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      if (!this.transporter) {
        return {
          success: false,
          error: "Gmail transporter is not initialized. Please check your GMAIL_USER and GMAIL_PASSWORD environment variables.",
        };
      }

      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.user}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text || this.htmlToText(message.html),
        attachments: message.attachments?.map((attr) => ({
          filename: attr.filename,
          content: attr.content,
          contentType: attr.contentType,
        })),
      });

      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      let errorMessage = "Unknown error";

      if (error?.code === "EAUTH") {
        errorMessage =
          `Gmail authentication failed. This usually means:\n` +
          `1. Your GMAIL_USER or GMAIL_PASSWORD is incorrect\n` +
          `2. Your Gmail account requires an "App Password" instead of your regular password\n` +
          `   (Enable 2FA and generate an app password at: https://myaccount.google.com/apppasswords)\n` +
          `3. "Less secure app access" is disabled (older Gmail accounts)`;
      } else if (error?.code === "EENVELOPE") {
        errorMessage = `Invalid email address: ${error.response || error.message || "Unknown"}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

//---------------------------------------------------
// --- Ethereal (Development) ---
//---------------------------------------------------
export class EtherealProvider extends IEmailProvider {
  private transporter?: Transporter;
  constructor(private fromEmail: string, private fromName: string) {
    super();
  }

  async init() {
    const account = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: account.user, pass: account.pass },
    });

    this.configured = true;

    console.log(`Ethereal initialized: ${account.user}`);
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const info = await this.transporter!.sendMail({
      from: `${this.fromName} <${this.fromEmail}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text || this.htmlToText(message.html),
      attachments: message.attachments?.map((attr) => ({
        filename: attr.filename,
        content: attr.content,
        contentType: attr.contentType,
      })),
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Preview email at: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId };
  }
}

//---------------------------------------------------
// --- Mailtrap ---
//---------------------------------------------------
export class MailtrapProvider extends IEmailProvider {
  private client?: MailtrapClient;
  constructor(private apiKey: string, private fromEmail: string, private fromName: string, private replyTo: string) {
    super();
  }

  init() {
    const useSandbox = process.env["MAILTRAP_USE_SANDBOX"] === "true";
    const inboxId = useSandbox ? process.env["MAILTRAP_INBOX_ID"] : undefined;

    if (this.apiKey && this.fromEmail) {
      this.client = new MailtrapClient({
        token: this.apiKey,
        sandbox: useSandbox,
        testInboxId: inboxId ? Number(inboxId) : undefined,
      });

      this.configured = true;
      const mode = useSandbox ? "Sandbox (testing)" : "Production (sending)";
      console.log(`✅ Email provider initialized: Mailtrap (${mode})`);
      if (!useSandbox) {
        console.log(`⚠️  Production mode: Make sure your sender domain (${this.fromEmail.split("@")[1]}) is verified in Mailtrap`);
      }
    }
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.client) {
      if (!this.apiKey) {
        return {
          success: false,
          error:
            "Mailtrap email requires MAILTRAP_API_KEY environment variable. " +
            "Please set MAILTRAP_API_KEY in your environment variables. " +
            "You can obtain an API key from https://mailtrap.io/api-tokens",
        };
      }
      return {
        success: false,
        error: "Mailtrap client is not initialized. Please check your configuration.",
      };
    }

    try {
      const toList = Array.isArray(message.to)
        ? message.to.map((e) => ({ email: e }))
        : [{ email: message.to }];
      const response = await this.client.send({
        from: {
          name: this.fromName,
          email: this.fromEmail,
        },
        to: toList,
        reply_to: this.replyTo
          ? {
            email: this.replyTo,
          }
          : undefined,
        subject: message.subject,
        html: message.html,
        text: message.text || this.htmlToText(message.html),
        attachments: message.attachments?.map((attr) => ({
          filename: attr.filename,
          content: attr.content,
          type: attr.contentType,
        })),
      });

      const messageId = response.message_ids?.[0] || "unknown";
      const useSandbox = process.env["MAILTRAP_USE_SANDBOX"] === "true";
      const mode = useSandbox ? "Sandbox (testing)" : "Production (sending)";

      console.log(`✅ Email sent successfully via Mailtrap (${mode}):`, messageId);
      if (useSandbox) {
        console.log("📧 Email captured in Mailtrap inbox for testing");
      }

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      let errorMessage = "Unknown error";
      const useSandbox = process.env["MAILTRAP_USE_SANDBOX"] === "true";
      const mode = useSandbox ? "Sandbox" : "Production";

      if (error?.response?.status === 401 || error?.cause?.code === "ERR_BAD_REQUEST") {
        errorMessage =
          `Mailtrap authentication failed (401 Unauthorized). ` +
          `This usually means:\n` +
          `1. Your MAILTRAP_API_KEY is invalid or expired\n` +
          `2. You're using a ${useSandbox ? "Sandbox" : "Production"} API key but the configuration doesn't match\n` +
          `3. For Production mode, your sender domain (${this.fromEmail.split("@")[1]}) must be verified in Mailtrap\n` +
          `4. Make sure you're using the correct API token from https://mailtrap.io/api-tokens\n` +
          `Current mode: ${mode}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
