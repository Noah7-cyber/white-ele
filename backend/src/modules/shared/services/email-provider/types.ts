export enum EmailProviderType {
  SENDGRID = "sendgrid",
  MAILTRAP = "mailtrap",
  ETHEREAL = "ethereal",
  RESEND = "resend",
  GMAIL = "gmail",
}

export interface EmailMessage {
  /** Single address or array (one send; providers may deliver so recipients don't see each other) */
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export abstract class IEmailProvider {
  protected configured: boolean = false;

  abstract init(): Promise<void> | void;
  abstract send(message: EmailMessage): Promise<EmailSendResult>;

  isConfigured(): boolean {
    return this.configured;
  }

  protected htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}
