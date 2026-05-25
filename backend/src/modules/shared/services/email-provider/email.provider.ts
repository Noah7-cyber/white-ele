import { EmailProviderType, EmailMessage, EmailSendResult, IEmailProvider } from "./types";
import { SendGridProvider, ResendProvider, GmailProvider, EtherealProvider, MailtrapProvider } from "./providers";

export class EmailProvider {
  private provider?: IEmailProvider;

  private async getProvider(): Promise<IEmailProvider> {
    if (this.provider) return this.provider;

    const providerEnv = process.env["EMAIL_PROVIDER"];

    // Validate that EMAIL_PROVIDER is set
    if (!providerEnv) {
      throw new Error(`EMAIL_PROVIDER environment variable is required. ` + `Valid values: ${Object.values(EmailProviderType).join(", ")}`);
    }

    // Validate that the provider is a valid EmailProviderType
    const validProviders = Object.values(EmailProviderType);
    if (!validProviders.includes(providerEnv as EmailProviderType)) {
      throw new Error(`Invalid EMAIL_PROVIDER: "${providerEnv}". ` + `Valid values are: ${validProviders.join(", ")}`);
    }

    const type = providerEnv as EmailProviderType;
    const fromEmail = process.env["EMAIL_FROM"] || "";
    const fromName = process.env["SENDER_NAME"] || "WhitePenguin";
    const replyTo = process.env["EMAIL_REPLY_TO"] || fromEmail;

    const sendgridApiKey = process.env["SENDGRID_API_KEY"] || "";
    const resendApiKey = process.env["RESEND_API_KEY"] || "";
    const gmailUser = process.env["GMAIL_USER"] || "";
    const gmailPassword = process.env["GMAIL_PASSWORD"] || "";
    const mailtrapApiKey = process.env["MAILTRAP_API_KEY"] || "";

    let instance: IEmailProvider;

    console.log({ type });

    switch (type) {
      case EmailProviderType.SENDGRID:
        instance = new SendGridProvider(sendgridApiKey, fromEmail, fromName, replyTo);
        break;

      case EmailProviderType.RESEND:
        instance = new ResendProvider(resendApiKey, fromEmail, fromName, replyTo);
        break;

      case EmailProviderType.GMAIL:
        instance = new GmailProvider(gmailUser, gmailPassword, fromName);
        break;

      case EmailProviderType.ETHEREAL:
        instance = new EtherealProvider(fromEmail, fromName);
        break;

      case EmailProviderType.MAILTRAP:
        instance = new MailtrapProvider(mailtrapApiKey, fromEmail, fromName, replyTo);
        break;

      default:
        throw new Error(`Unsupported email provider type: ${type}`);
    }

    await instance.init();
    this.provider = instance;
    return instance;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    // Global Test Override
    if (process.env["NODE_ENV"] === "test") {
      return { success: true, messageId: "test-id" };
    }

    try {
      const provider = await this.getProvider();

      if (!provider.isConfigured()) {
        throw new Error(`Provider ${process.env["EMAIL_PROVIDER"]} failed to initialize.`);
      }

      return await provider.send(message);
    } catch (error: any) {
      console.error("Email Service Error:", error.message);
      return { success: false, error: error.message };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (process.env["NODE_ENV"] === "test") {
        return true;
      }

      const provider = await this.getProvider();

      if (!provider.isConfigured()) {
        console.error("Email provider is not configured");
        return false;
      }

      console.log(`✅ Email provider (${process.env["EMAIL_PROVIDER"]}) is configured and ready`);
      return true;
    } catch (error) {
      console.error("Email provider connection test failed:", error);
      return false;
    }
  }
}
