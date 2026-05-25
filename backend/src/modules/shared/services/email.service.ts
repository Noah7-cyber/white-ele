import { User, School } from "../entities";
import { Invitation } from "../entities/Invitation";
import { EmailProvider } from "./email-provider";
import { getEmailTemplateHtml, getOtpBoxesHtml } from "./email-template";
import { capitalizeFirstLetter, getFrontendBaseUrl, getSchoolPortalUrl, joinFrontendUrl } from "./utils";
import { UserRole } from "../entities/EntityEnums";

const emailProvider = new EmailProvider();

const PARENT_EXPLAINER_VIDEO_URL = "https://tinyurl.com/wp-new-user-guide";
const PARENT_EXPLAINER_DESCRIPTION =
  "Watch this short explainer video for a quick walkthrough of how to navigate your portal, track your child, and manage key tasks easily.";
// Parent thumbnail is served from a remote URL so the image renders directly in mail clients without
// inlining or shipping the binary in the bundle.
const PARENT_EXPLAINER_THUMBNAIL_URL =
  "https://storage.googleapis.com/heimdall-projects.firebasestorage.app/uploads/1779291518568_3c2ea782597a7921.webp";

const ADMIN_EXPLAINER_VIDEO_URL =
  "https://firebasestorage.googleapis.com/v0/b/heimdall-projects.firebasestorage.app/o/whitepenguin%2Fvideos%2Fwb-admin-user-guide.mp4?alt=media&token=ab11e2d7-2a59-46cd-9ab8-25b6d810be87";
const ADMIN_EXPLAINER_DESCRIPTION =
  "Startup guide on how to make use of Kiosk attendance:";
// Admin thumbnail is served from a remote URL so the image renders directly in mail clients without
// inlining or shipping the binary in the bundle.
const ADMIN_EXPLAINER_THUMBNAIL_URL =
  "https://storage.googleapis.com/heimdall-projects.firebasestorage.app/uploads/1779291518568_3c2ea782597a7921.webp";

export interface EmailVerificationToken {
  token: string;
  expiresAt: Date;
}

export interface AdmissionOfferEmailOptions {
  to: string;
  subject: string;
  recipientName: string;
  schoolName: string;
  body: string;
  invoiceNumber: string;
  studentNames: string;
  issueDate: Date | string;
  dueDate: Date | string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    tax?: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  logoUrl?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
  bankDetails?: { bankName: string; accountNumber: string; accountName: string };
}

export interface EmailOptions {
  /** Single address or array for bulk send (one send per call) */
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

class EmailService {
  private verificationTokens: Map<string, { token: string; expiresAt: Date; email: string }> = new Map();

  private isAdminRole(role?: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  private buildExplainerVideoBlockHtml(options: {
    videoUrl: string;
    description: string;
    thumbnailSrc: string | null;
    imageAlt: string;
    fallbackLinkText: string;
  }): string {
    const imageMarkup = options.thumbnailSrc
      ? `
          <a href="${options.videoUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block;">
            <img
              src="${options.thumbnailSrc}"
              alt="${options.imageAlt}"
              style="display: block; max-width: 100%; width: 320px; height: auto; border-radius: 12px; border: 1px solid #d1d5db;"
            />
          </a>
        `
      : `
          <a href="${options.videoUrl}" target="_blank" rel="noopener noreferrer" style="color: #008080; text-decoration: underline; font-weight: 600;">
            ${options.fallbackLinkText}
          </a>
        `;

    return `
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 18px; border-radius: 12px; margin: 24px 0;">
        <p style="margin: 0 0 12px 0;">
          ${options.description}
        </p>
        <div style="text-align: center;">
          ${imageMarkup}
        </div>
      </div>
    `;
  }

  private async getParentExplainerVideoBlockHtml(): Promise<string> {
    return this.buildExplainerVideoBlockHtml({
      videoUrl: PARENT_EXPLAINER_VIDEO_URL,
      description: PARENT_EXPLAINER_DESCRIPTION,
      thumbnailSrc: PARENT_EXPLAINER_THUMBNAIL_URL,
      imageAlt: "Watch the Parent Portal explainer video",
      fallbackLinkText: "Watch this short explainer video on how to navigate the Portal:",
    });
  }

  private async getAdminExplainerVideoBlockHtml(): Promise<string> {
    return this.buildExplainerVideoBlockHtml({
      videoUrl: ADMIN_EXPLAINER_VIDEO_URL,
      description: ADMIN_EXPLAINER_DESCRIPTION,
      thumbnailSrc: ADMIN_EXPLAINER_THUMBNAIL_URL,
      imageAlt: "Watch the admin platform explainer video",
      fallbackLinkText: "Watch the admin platform explainer video",
    });
  }

  private adminExplainerPlainTextSuffix(): string {
    return `\n\nWatch the admin platform explainer video: ${ADMIN_EXPLAINER_VIDEO_URL}`;
  }

  /**
   * Helper to load school data
   */
  private async loadSchoolData(schoolName: string): Promise<School | null> {
    try {
      const { AppDataSource } = await import("../../core/config/database");
      const schoolRepository = AppDataSource.getRepository(School);
      return await schoolRepository.findOne({ where: { schoolName } });
    } catch (error) {
      console.warn(`[EmailService] Could not load school data for ${schoolName}:`, error);
      return null;
    }
  }

  private async loadSchoolById(schoolId: number): Promise<School | null> {
    try {
      const { AppDataSource } = await import("../../core/config/database");
      const schoolRepository = AppDataSource.getRepository(School);
      return await schoolRepository.findOne({ where: { id: schoolId } });
    } catch (error) {
      console.warn(`[EmailService] Could not load school data for id ${schoolId}:`, error);
      return null;
    }
  }

  /**
   * Send email using configured email provider
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    console.log(`[EmailService] Attempting to send email to: ${options.to}`);
    const result = await emailProvider.send({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });

    if (result.success) {
      console.log(`[EmailService] ✅ Email sent successfully to ${options.to}. MessageID: ${result.messageId}`);
    } else {
      console.error(`❌ Email Delivery Error: ${result.error || "Unknown error"}`);
      throw new Error(`Failed to send email: ${result.error || "Unknown error"}`);
    }
  }

  /**
   * Generate 6-digit email verification token
   */
  generateVerificationToken(_email: string): EmailVerificationToken {
    // Generate 6-digit random token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    return { token, expiresAt };
  }

  /**
   * Verify email verification token (now handled by database)
   * This method is kept for backward compatibility but should not be used directly
   */
  verifyEmailToken(_token: string): { isValid: boolean; email?: string } {
    console.warn("verifyEmailToken should not be called directly. Use database-based verification instead.");
    return { isValid: false };
  }

  /**
   * Send email verification email with 6-digit token
   */
  async sendEmailVerification(email: string, name: string): Promise<string> {
    const { token } = this.generateVerificationToken(email);
    console.log(`[EmailService] Generated token for ${email}: ${token}`);

    // Store token in database for 24 hours (86400 seconds)
    try {
      const { tokenService } = await import("../../auth/services/token.service");
      await tokenService.storeEmailVerificationToken(email.toLowerCase(), token, 3600);
      console.log(`[EmailService] Token stored in DB for ${email}`);
    } catch (error) {
      console.error("[EmailService] Failed to store verification token in database:", error);
      throw new Error("Failed to store verification token");
    }

    const bodyContent = `
      <p>Thanks for creating your account! We just need to verify your email address to get you started.</p>
      <p>This code will expire in 1 hour for security purposes.</p>
      <p><strong>Why verify?</strong></p>
      <ul style="padding-left: 20px; margin: 16px 0;">
        <li>Secure your account</li>
        <li>Receive important notifications</li>
        <li>Enable password recovery</li>
        <li>Access all platform features</li>
      </ul>
      <p style="font-size: 14px; color: #666; margin-top: 24px;">
        Didn't create an account? If you received this email in error, you can safely ignore it.
      </p>
    `;
    const html = getEmailTemplateHtml({
      recipientName: name,
      welcomeTitle: "Verify Your Email Address",
      bodyContent,
      verificationCode: token,
      schoolName: "WhitePenguin",
    });

    const text = `Verify Your Email Address\n\nHi ${name},\n\nThanks for creating your account! Your verification code is: ${token}\n\nThis link will expire in 1 hour for security purposes.\n\nWhy verify?\n- Secure your account\n- Receive important notifications\n- Enable password recovery\n- Access all platform features\n\nDidn't create an account? If you received this email in error, you can safely ignore it.`;

    console.log(`[EmailService] Triggering email send to ${email}...`);
    await this.sendEmail({
      to: email,
      subject: "Verify Your Email Address",
      html,
      text,
    });

    return token;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, name: string, resetToken: string, role?: string): Promise<void> {
    let baseUrl = getFrontendBaseUrl();
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }

    // Ensure app. subdomain as requested
    let appUrl: string;
    try {
      const baseUrlObj = new URL(baseUrl);
      const host = baseUrlObj.hostname;
      baseUrlObj.hostname = host.startsWith("app.") ? host : `app.${host}`;
      appUrl = baseUrlObj.toString().replace(/\/$/, "");
    } catch {
      appUrl = baseUrl;
    }

    const resetUrl = `${appUrl}/auth/verifyToken?email=${encodeURIComponent(email)}&token=${resetToken}${role ? `&role=${role}` : ""}`;

    const bodyContent = `
      <p>We received a request to reset your password for your account.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #008080; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Reset Your Password</a>
      </div>

      <p>This link will expire in 1 hour for security purposes.</p>
      <p>Didn't request this? If you didn't ask to reset your password, you can safely ignore this email. Your password will remain unchanged.</p>

      <div style="margin-bottom: 32px; text-align: center;">
        ${getOtpBoxesHtml(resetToken)}
      </div>

      <div style="background-color: #fcfcfc; padding: 20px; border-radius: 8px; margin-top: 24px; border-left: 4px solid #008080;">
        <p style="margin-top: 0; font-weight: 600;">For security reasons:</p>
        <ul style="padding-left: 20px; margin-bottom: 0; font-size: 14px;">
          <li>Never share your password with anyone</li>
          <li>Use a strong, unique password</li>
          <li>Change your password immediately if you suspect unauthorized access</li>
        </ul>
      </div>
    `;
    const html = getEmailTemplateHtml({
      recipientName: name,
      welcomeTitle: "Reset Your Password",
      bodyContent,
      schoolName: "WhitePenguin",
    });

    const text = `Reset Your Password\n\nHi ${name},\n\nWe received a request to reset your password for your account.\n\nReset Your Password: ${resetUrl}\n\nThis link will expire in 1 hour for security purposes.\n\nDidn't request this? If you didn't ask to reset your password, you can safely ignore this email.`;

    await this.sendEmail({
      to: email,
      subject: "Reset Your Password",
      html,
      text,
    });
  }

  /**
   * Send password reset confirmation email (after user has successfully changed password)
   */
  async sendPasswordResetConfirmationEmail(email: string, name: string, role?: string): Promise<void> {
    const loginUrl = joinFrontendUrl(`auth/login?role=${role}`);

    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    const bodyContent = `
      <p>This is a confirmation that the password for your account (<strong>${email}</strong>) was successfully changed on ${date} at ${time}.</p>
      <div style="background-color: #fdf2f2; border: 1px solid #f8b4b4; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <p style="margin-top: 0; font-weight: 600; color: #9b1c1c;">Wasn't you?</p>
        <p style="margin-bottom: 0;">If you didn't make this change, please contact us immediately. Your account security is our priority.</p>
      </div>
      <p><strong>Security Tips:</strong></p>
      <ul style="padding-left: 20px;">
        <li>Use a unique password for your account</li>
        <li>Never share your login credentials</li>
        <li>Log out when using shared devices</li>
      </ul>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="background-color: #008080; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Sign In to Your Account</a>
      </div>
    `;
    const html = getEmailTemplateHtml({
      recipientName: name,
      welcomeTitle: "✅ Your Password Has Been Changed",
      bodyContent,
      schoolName: "WhitePenguin",
    });

    const text = `Password Changed Successfully\n\nHi ${name},\n\nThis is a confirmation that your password was successfully changed on ${date} at ${time}. If you didn't make this change, contact support immediately.`;

    await this.sendEmail({
      to: email,
      subject: "✅ Your Password Has Been Changed",
      html,
      text,
    });
  }

  /**
   * Send invitation email
   */
  async sendInvitationEmail(invitation: Invitation, inviter?: User, _schoolName?: string): Promise<void> {
    let baseUrl = getFrontendBaseUrl();
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    let appUrl: string;
    try {
      const baseUrlObj = new URL(baseUrl);
      const host = baseUrlObj.hostname;
      baseUrlObj.hostname = host.startsWith("app.") ? host : `app.${host}`;
      appUrl = baseUrlObj.toString().replace(/\/$/, "");
    } catch {
      appUrl = baseUrl;
    }
    const inviteUrl = `${appUrl}/auth/register?role=admin&token=${encodeURIComponent(invitation.token)}&email=${encodeURIComponent(invitation.email)}&firstName=${encodeURIComponent(invitation.firstName || "")}&lastName=${encodeURIComponent(invitation.lastName || "")}`;
    const inviterName = inviter?.lastName || "Administrator";

    const inviteeFirstName = invitation.firstName?.trim();
    const inviteeLastName = invitation.lastName?.trim();
    const inviteeName = inviteeFirstName || inviteeLastName ? `${inviteeFirstName || ""} ${inviteeLastName || ""}`.trim() : "there";

    const invitationCode = invitation.token;

    const bodyContent = `
      <p>You've been invited to join the administrative team!</p>
      <div style="text-align: center; margin: 24px 0 32px 0;">
        <a href="${inviteUrl}" style="background-color: #008080; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Accept Invitation & Get Started</a>
      </div>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Your Admin Access:</h3>
        <p style="margin: 8px 0;"><strong>Portal URL:</strong> <a href="${appUrl}" style="color: #008080;">${appUrl}</a></p>
        <p style="margin: 8px 0;"><strong>Username:</strong> ${invitation.email}</p>
        <p style="margin: 8px 0;"><strong>Token:</strong> ${invitationCode} (please use this token to register)</p>
      </div>
      <p><strong>Your Permissions:</strong> As an administrator, you'll have access to manage students, staff, communications, admissions, billing, and more.</p>
      <p><strong>Get Started:</strong> Log in and change your password to activate your account.</p>
      <p style="font-size: 14px; color: #666;">If you have any questions, reach out to ${inviterName}.</p>
    `;
    const schoolNameStr = _schoolName || "WhitePenguin";
    const school = await this.loadSchoolData(schoolNameStr);
    const formattedSchoolName = capitalizeFirstLetter(school?.schoolName || schoolNameStr);
    const html = getEmailTemplateHtml({
      recipientName: inviteeName,
      welcomeTitle: `You've Been Invited as an Administrator at ${formattedSchoolName}`,
      bodyContent,
      schoolName: schoolNameStr,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    await this.sendEmail({
      to: invitation.email,
      subject: `You've Been Invited as an Administrator at ${formattedSchoolName}`,
      html,
    });
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(
    email: string,
    name: string,
    schoolName: string = "your school",
    temporaryPassword?: string,
    portalUrl?: string,
  ): Promise<void> {
    // const school = await this.loadSchoolData(schoolName);
    const loginUrl = portalUrl ? portalUrl : joinFrontendUrl("auth/login?role=admin");
    const explainerVideoBlock = await this.getAdminExplainerVideoBlockHtml();
    const bodyContent = `
      <p>Congratulations! Your school management platform is now set up and ready to go.</p>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Your Admin Portal Access:</h3>
        <p style="margin: 8px 0;"><strong>Portal URL:</strong> <a href="${loginUrl}" style="color: #008080;">${loginUrl}</a></p>
        <p style="margin: 8px 0;"><strong>Username:</strong> ${email}</p>
        ${temporaryPassword ? `<p style="margin: 8px 0;"><strong>Temporary Password:</strong> ${temporaryPassword} (please change this on first login)</p>` : ""}
      </div>
      
      <p><strong>As the Main Administrator, you have full access to:</strong></p>
      <ul style="padding-left: 20px; margin: 16px 0; line-height: 1.6;">
        <li>✅ Add and manage students, parents, and teachers</li>
        <li>✅ Create classrooms and assign teachers</li>
        <li>✅ Manage curriculum and academic milestones</li>
        <li>✅ Send announcements and messages</li>
        <li>✅ Handle invoicing and payments</li>
        <li>✅ Manage admissions and tour bookings</li>
        <li>✅ Invite additional administrators</li>
        <li>✅ Configure school settings and preferences</li>
      </ul>

      <p><strong>Getting Started:</strong></p>
      <ol style="padding-left: 20px; margin: 16px 0; line-height: 1.6;">
        <li>Log in and change your password</li>
        <li>Complete your school profile</li>
        <li>Start adding your staff and students</li>
        <li>Explore the platform features</li>
      </ol>

      ${explainerVideoBlock}

      <p style="margin-top: 32px;"><strong>Need Help?</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">Support Centre/FAQs: <a href="https://whitepenguin.co/help" style="color: #008080;">whitepenguin.co/help</a></p>
      <p style="margin: 4px 0; font-size: 14px;">Support Email: <a href="mailto:support@whitepenguin.co" style="color: #008080;">support@whitepenguin.co</a></p>
    `;
    const html = getEmailTemplateHtml({
      recipientName: name,
      welcomeTitle: `Welcome to ${schoolName} - Your Admin Account is Ready! 🎉`,
      bodyContent,
      schoolName,
      // schoolAddress: school?.address,
      // schoolSocials: {
      //   facebook: school?.facebook,
      //   tikTok: school?.tikTok,
      //   instagram: school?.instagram,
      //   x: school?.x,
      // }
    });

    const text = `Welcome to ${schoolName} - Your Admin Account is Ready!\n\nHi ${name},\n\nCongratulations! Your school management platform is now set up and ready to go.\n\nPortal URL: ${loginUrl}\nUsername: ${email}${temporaryPassword ? `\nTemporary Password: ${temporaryPassword}` : ""}\n\nYou have full access to manage students, staff, curriculum, invoices, and more.${this.adminExplainerPlainTextSuffix()}`;

    await this.sendEmail({
      to: email,
      subject: `Welcome to ${schoolName} - Your Admin Account is Ready! 🎉`,
      html,
      text,
    });
  }

  /**
   * Send Kiosk Welcome Email to school admin after registration
   * Instructs them how to use the Digital Kiosk for attendance tracking
   */
  async sendKioskWelcomeEmail(email: string, administratorName: string, centerName: string, subDomain: string): Promise<void> {
    const kioskUrl = getSchoolPortalUrl("/kiosk", subDomain);
    const explainerVideoBlock = await this.getAdminExplainerVideoBlockHtml();

    const bodyContent = `
      <p>Congratulations! Your registration is complete, and your center is now equipped with the tools to streamline your daily operations.</p>
      <p>We want to highlight our <strong>Digital Attendance Tracking</strong> feature, which is designed to replace manual sign-in sheets with a secure, automated system. By utilizing our digital kiosk, your center can achieve:</p>
      <ul style="padding-left: 20px; margin: 16px 0; line-height: 1.6;">
        <li><strong>Improved Efficiency:</strong> Automate many of your administrative tasks, freeing up your staff to focus more on child care and education.</li>
        <li><strong>Real-Time Safety &amp; Compliance:</strong> Maintain a live view of staff-to-child ratios in every room to ensure you are always in compliance with state licensing requirements.</li>
        <li><strong>Secure &amp; Contactless Access:</strong> Parents and staff can use their unique PINs for safe and verified sign-ins.</li>
      </ul>
      <p>To launch your kiosk, simply log in to your Digital Kiosk via this URL on your designated sign-in device.</p>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Kiosk Access:</h3>
        <p style="margin: 8px 0;"><strong>Portal URL:</strong> <a href="${kioskUrl}" style="color: #008080;">${kioskUrl}</a></p>
        <p style="margin: 8px 0;"><strong>Username:</strong> Email Address</p>
      </div>
      <p>Do note that it's best advised to have one sign-in device to avoid interruptions to your parents and teachers signing in.</p>
      ${explainerVideoBlock}
      <p>We are excited to help your center grow!</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: administratorName || "Administrator",
      welcomeTitle: "Your Digital Attendance Tracking is Ready",
      bodyContent,
      schoolName: centerName,
    });

    const text = `Your Digital Attendance Tracking is Ready\n\nDear ${administratorName || "Administrator"},\n\nCongratulations! Your registration is complete, and your center is now equipped with the tools to streamline your daily operations.\n\nKiosk URL: ${kioskUrl}\nUsername: Email Address${this.adminExplainerPlainTextSuffix()}\n\nWe are excited to help your center grow!\n\nBest regards,\nThe WhitePenguin Team`;

    await this.sendEmail({
      to: email,
      subject: "Your Digital Attendance Tracking is Ready",
      html,
      text,
    });
  }

  /**
   * Send Activity Summary Email to parent (daily or weekly)
   * Triggered when a child is checked out for the day.
   * Full report is attached as PDF when pdfBuffer is provided.
   */
  async sendActivitySummaryEmail(options: {
    parentEmail: string;
    parentName: string;
    childFirstName: string;
    centerName: string;
    periodType: "daily" | "weekly";
    dateOrPeriod: string;
    subDomain?: string;
    pdfBuffer?: Buffer;
    pdfFilename?: string;
  }): Promise<void> {
    const { parentEmail, parentName, childFirstName, centerName, periodType, dateOrPeriod, subDomain, pdfBuffer, pdfFilename } = options;

    const galleryLink = subDomain ? getSchoolPortalUrl("/parent/dashboard", subDomain) : joinFrontendUrl("parent/dashboard");

    const reportKind = periodType === "daily" ? "Daily" : "Weekly";

    const attachmentNote = pdfBuffer
      ? `<p>Your <strong>${reportKind.toLowerCase()} activity report</strong> for <strong>${childFirstName}</strong> is attached as a PDF.</p>`
      : `<p>We could not generate the PDF attachment for ${childFirstName}'s ${periodType} report. Please view activity updates in the parent portal.</p>`;

    const bodyContent = `
      <p>Hello ${parentName},</p>
      ${attachmentNote}
      <p><strong>Period:</strong> ${dateOrPeriod}<br /><strong>School:</strong> ${centerName}</p>
      <p>You can also view photos and updates in the <a href="${galleryLink}" style="color: #008080;">parent portal</a>.</p>
      <p>Thank you for being part of our community!</p>
    `;

    const school = await this.loadSchoolData(centerName);
    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `${reportKind} Activity Report — ${childFirstName}`,
      bodyContent,
      schoolName: centerName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
      footerPreferenceText: `You received this message from ${centerName} via WhitePenguin.`,
    });

    const subject =
      periodType === "daily"
        ? `Daily Activity Report for ${childFirstName} — ${dateOrPeriod}`
        : `Weekly Activity Report for ${childFirstName} — ${dateOrPeriod}`;

    const text = `${reportKind} activity report for ${childFirstName}\n\nHello ${parentName},\n\n${pdfBuffer ? `Your ${periodType} activity report is attached (PDF).\n\n` : `PDF was not attached; please use the parent portal.\n\n`}Period: ${dateOrPeriod}\nSchool: ${centerName}\n\nParent portal: ${galleryLink}`;

    const attachments =
      pdfBuffer && pdfFilename
        ? [
            {
              filename: pdfFilename,
              content: pdfBuffer,
              contentType: "application/pdf" as const,
            },
          ]
        : undefined;

    await this.sendEmail({
      to: parentEmail,
      subject,
      html,
      text,
      attachments,
    });
  }

  /**
   * Send a general welcome email for all registrations
   */
  async sendGeneralWelcomeEmail(
    email: string,
    name: string,
    options?: { role?: UserRole },
  ): Promise<void> {
    const schoolName = "WhitePenguin";
    // const school = await this.loadSchoolData(schoolName);
    const loginUrl = joinFrontendUrl("auth/login?role=admin");
    const includeAdminExplainer = this.isAdminRole(options?.role);
    const explainerVideoBlock = includeAdminExplainer ? await this.getAdminExplainerVideoBlockHtml() : "";
    const bodyContent = `
      <p>Welcome to WhitePenguin! We're thrilled to have you join our community.</p>
      <p>Your account has been successfully created and you can now start exploring all the features we offer.</p>
      
      <p><strong>What you can do now:</strong></p>
      <ul style="padding-left: 20px; margin: 16px 0; line-height: 1.6;">
        <li>✅ Complete your personal profile</li>
        <li>✅ Explore schools and curriculum options</li>
        <li>✅ Stay updated with latest announcements</li>
        <li>✅ Access your dashboard and settings</li>
      </ul>

      ${explainerVideoBlock}

      <p>Click the button below to sign in and get started:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="background-color: #008080; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Go to Dashboard</a>
      </div>

    `;
    const html = getEmailTemplateHtml({
      recipientName: name,
      welcomeTitle: "Welcome to WhitePenguin! 👋",
      bodyContent,
      schoolName,
      // schoolAddress: school?.address,
      // schoolSocials: {
      //   facebook: school?.facebook,
      //   tikTok: school?.tikTok,
      //   instagram: school?.instagram,
      //   x: school?.x,
      // }
    });

    const text = `Welcome to WhitePenguin!\n\nHi ${name},\n\nWe're thrilled to have you join our community. Your account is ready.\n\nLogin to get started: ${loginUrl}\n\nWhat you can do:\n- Complete your profile\n- Explore schools\n- Stay updated\n- Access your dashboard${includeAdminExplainer ? this.adminExplainerPlainTextSuffix() : ""}`;

    await this.sendEmail({
      to: email,
      subject: "Welcome to WhitePenguin! 👋",
      html,
      text,
    });
  }

  /**
   * Clean up expired verification tokens
   */
  cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of this.verificationTokens.entries()) {
      if (now > data.expiresAt) {
        this.verificationTokens.delete(token);
      }
    }
  }

  /**
   * Send email change verification email
   */
  async sendEmailChangeVerification(newEmail: string, name: string, verificationToken: string): Promise<boolean> {
    try {
      const schoolName = "WhitePenguin";
      const verificationUrl = joinFrontendUrl(`verify-email-change?token=${verificationToken}&email=${encodeURIComponent(newEmail)}`);

      const bodyContent = `
        <p>You requested to change your email address on WhitePenguin. To complete this change, please verify your new email address by clicking the button below:</p>
        <p style="margin: 20px 0;"><a href="${verificationUrl}" style="background-color: #0d5c5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify New Email Address</a></p>
        <p style="font-size: 14px;">If the button doesn't work, copy and paste this link into your browser: <a href="${verificationUrl}" style="color: #0d5c5c;">${verificationUrl}</a></p>
        <p>This verification link will expire in 1 hour.</p>
        <p>If you didn't request this email change, please ignore this email and contact our support team immediately.</p>
      `;
      const html = getEmailTemplateHtml({
        recipientName: name,
        bodyContent,
        schoolName,
      });

      await this.sendEmail({
        to: newEmail,
        subject: "Verify Your New Email Address - White Penguin Platform",
        html,
      });

      return true;
    } catch (error) {
      console.error("Failed to send email change verification:", error);
      return false;
    }
  }

  /**
   * Send notification when email has been updated by an administrator
   */
  async sendEmailUpdateNotification(newEmail: string, name: string, schoolName: string): Promise<void> {
    const school = await this.loadSchoolData(schoolName);
    const loginUrl = joinFrontendUrl("auth/login?role=parent");

    const bodyContent = `
      <p>This is to confirm that your email address for the ${schoolName} portal has been successfully updated to <strong>${newEmail}</strong>.</p>
      <p>You can now use this email address to sign in to your account.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="background-color: #008080; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Sign In to Your Account</a>
      </div>
      <p>If you did not expect this change, please contact the school administration immediately.</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: name,
      welcomeTitle: "✅ Your Email Address Has Been Updated",
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `Email Updated Successfully\n\nHi ${name},\n\nThis is to confirm that your email address for ${schoolName} has been updated to ${newEmail}.\n\nSign in at: ${loginUrl}\n\nIf you didn't expect this change, please contact school administration.`;

    await this.sendEmail({
      to: newEmail,
      subject: "✅ Your Email Address Has Been Updated",
      html,
      text,
    });
  }

  /**
   * Send account deactivation confirmation email
   */
  async sendAccountDeactivationEmail(email: string, name: string, deactivatedAt: Date): Promise<void> {
    const schoolName = "WhitePenguin";
    // const school = await this.loadSchoolData(schoolName);
    const loginUrl = getFrontendBaseUrl();
    const bodyContent = `
      <p>Your WhitePenguin account has been deactivated on ${deactivatedAt.toLocaleDateString()}.</p>
      <div style="background-color: #fdf0f0; border: 1px solid #e8c4c4; padding: 15px; border-radius: 4px; margin: 15px 0;">
        <strong>Important Information:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
          <li>Your account data will be retained for 30 days</li>
          <li>You can reactivate your account anytime within this period</li>
          <li>After 30 days, your account and all associated data will be permanently deleted</li>
        </ul>
      </div>
      <p>If you want to reactivate your account, simply log in with your existing credentials:</p>
      <p style="margin: 20px 0;"><a href="${loginUrl}/login" style="background-color: #0d5c5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reactivate Account</a></p>
      <p>If you have any questions or this deactivation was done in error, please contact our support team immediately.</p>
    `;
    const html = getEmailTemplateHtml({
      recipientName: name,
      bodyContent,
      schoolName,
      // schoolAddress: school?.address,
      // schoolSocials: {
      //   facebook: school?.facebook,
      //   tikTok: school?.tikTok,
      //   instagram: school?.instagram,
      //   x: school?.x,
      // }
    });

    const text = `Account Deactivated - WhitePenguin\n\nHi ${name},\n\nYour account has been deactivated on ${deactivatedAt.toLocaleDateString()}. You have 30 days to reactivate. Log in at: ${loginUrl}/login`;

    await this.sendEmail({
      to: email,
      subject: "Account Deactivated - White Penguin Platform",
      html,
      text,
    });
  }

  /**
   * Send account reactivation confirmation email
   */
  async sendAccountReactivationEmail(email: string, name: string, reactivatedAt: Date): Promise<void> {
    const schoolName = "WhitePenguin";
    // const school = await this.loadSchoolData(schoolName);
    const baseUrl = getFrontendBaseUrl();
    const bodyContent = `
      <p>Great news! Your WhitePenguin account has been successfully reactivated on ${reactivatedAt.toLocaleDateString()}.</p>
      <p>You now have full access to:</p>
      <ul>
        <li>Browse available schools</li>
        <li>Schedule school tours</li>
        <li>Manage your profile</li>
        <li>Connect with schools</li>
      </ul>
      <p style="margin: 20px 0;"><a href="${baseUrl}/dashboard" style="background-color: #0d5c5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Dashboard</a></p>
      <p>We're glad to have you back! If you have any questions, feel free to contact our support team.</p>
    `;
    const html = getEmailTemplateHtml({
      recipientName: name,
      welcomeTitle: "Welcome Back!",
      bodyContent,
      schoolName,
      // schoolAddress: school?.address,
      // schoolSocials: {
      //   facebook: school?.facebook,
      //   tikTok: school?.tikTok,
      //   instagram: school?.instagram,
      //   x: school?.x,
      // }
    });

    const text = `Welcome Back! - WhitePenguin\n\nHi ${name},\n\nYour account has been reactivated on ${reactivatedAt.toLocaleDateString()}. Visit your dashboard: ${baseUrl}/dashboard`;

    await this.sendEmail({
      to: email,
      subject: "Account Reactivated - Welcome Back!",
      html,
      text,
    });
  }

  /**
   * Send account reactivation reminder email
   */
  async sendAccountReactivationReminder(email: string, name: string, daysRemaining: number): Promise<boolean> {
    try {
      const schoolName = "WhitePenguin";
      const reactivationUrl = joinFrontendUrl("reactivate-account");

      const bodyContent = `
        <p>Your WhitePenguin account was recently deactivated. You have <strong>${daysRemaining} days remaining</strong> to reactivate your account before it's permanently deleted.</p>
        <div style="background-color: #fff8e6; border: 1px solid #e6d9b3; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <strong>Important:</strong> After 30 days, deactivated accounts are permanently deleted and cannot be recovered.
        </div>
        <p>To reactivate your account, simply click the button below and log in with your existing credentials:</p>
        <p style="margin: 20px 0;"><a href="${reactivationUrl}" style="background-color: #0d5c5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reactivate My Account</a></p>
        <p>If you don't want to reactivate your account, no action is needed. Your account will be automatically deleted after the 30-day period.</p>
        <p>If you have any questions or need assistance, please contact our support team.</p>
      `;
      const html = getEmailTemplateHtml({
        recipientName: name,
        bodyContent,
        schoolName,
      });

      await this.sendEmail({
        to: email,
        subject: `Account Reactivation Reminder - ${daysRemaining} Days Remaining`,
        html,
      });

      return true;
    } catch (error) {
      console.error("Failed to send account reactivation reminder:", error);
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    return await emailProvider.testConnection();
  }

  /**
   * Get verification token for testing purposes (only in test environment)
   */
  getVerificationTokenForEmail(email: string): string | null {
    if (process.env["NODE_ENV"] !== "test") {
      throw new Error("This method is only available in test environment");
    }

    for (const [token, data] of this.verificationTokens.entries()) {
      if (data.email === email.toLowerCase()) {
        return token;
      }
    }
    return null;
  }

  /**
   * Clear all verification tokens (only in test environment)
   */
  clearVerificationTokens(): void {
    if (process.env["NODE_ENV"] !== "test") {
      throw new Error("This method is only available in test environment");
    }
    this.verificationTokens.clear();
  }

  /**
   * Send email to parents created by Admin
   */
  async sendParentAccountCreationEmail(
    parentEmail: string,
    parentName: string,
    temporaryPassword: string,
    schoolName: string,
    studentName: string,
    kioskPin?: string,
  ): Promise<void> {
    const school = await this.loadSchoolData(schoolName);
    const loginUrl = joinFrontendUrl("auth/login?role=parent");
    const explainerVideoBlock = await this.getParentExplainerVideoBlockHtml();

    const bodyContent = `
      <p>Great news! Your child, <strong>${studentName}</strong>, has been added to our system, and we've created your Parent Portal account.</p>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Your Portal Access:</h3>
        <p style="margin: 8px 0;"><strong>Portal URL:</strong> <a href="${loginUrl}" style="color: #008080;">${loginUrl}</a></p>
        <p style="margin: 8px 0;"><strong>Username:</strong> ${parentEmail}</p>
        <p style="margin: 8px 0;"><strong>Temporary Password:</strong> ${temporaryPassword} (please change this on first login)</p>
        ${kioskPin ? `<p style="margin: 8px 0;"><strong>Kiosk Login PIN:</strong> ${kioskPin}</p>` : ""}
      </div>
      
      <p><strong>What You Can Do:</strong></p>
      <ul style="padding-left: 20px; margin: 16px 0; line-height: 1.6;">
        <li>Track ${studentName}'s academic progress and milestones</li>
        <li>View report cards and portfolios</li>
        <li>Receive important announcements from teachers and staff</li>
        <li>Manage invoices and payments</li>
        <li>Stay connected with your child's educational journey</li>
      </ul>

      <p style="margin-top: 24px;">We're excited to partner with you in ${studentName}'s education. If you have any questions, don't hesitate to reach out!</p>
      ${explainerVideoBlock}
      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="background-color: #008080; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Login to Your Account</a>
      </div>
    `;
    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `Welcome to ${schoolName}'s Parent Portal! 🎉`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `Welcome to ${schoolName}'s Parent Portal!\n\nHi ${parentName},\n\nGreat news! Your child, ${studentName}, has been added to our system.\n\nPortal URL: ${loginUrl}\nUsername: ${parentEmail}\nTemporary Password: ${temporaryPassword}${kioskPin ? `\nKiosk Login PIN: ${kioskPin}` : ""}\n\nWhat You Can Do:\n- Track academic progress\n- View report cards\n- Receive announcements\n- Manage invoices\n- Stay connected\n\nWatch this short explainer video on how to navigate the Portal: ${PARENT_EXPLAINER_VIDEO_URL}`;

    await this.sendEmail({
      to: parentEmail,
      subject: `Welcome to ${schoolName}'s Parent Portal! 🎉`,
      html,
      text,
    });
  }

  /**
   * Resend parent account email - same content as welcome but asks to reset password
   */
  async sendParentResendAccountEmail(
    parentEmail: string,
    parentName: string,
    resetUrl: string,
    schoolName: string,
    studentName: string,
    kioskPin?: string,
  ): Promise<void> {
    const school = await this.loadSchoolData(schoolName);
    const loginUrl = joinFrontendUrl("auth/login?role=parent");
    const explainerVideoBlock = await this.getParentExplainerVideoBlockHtml();

    const bodyContent = `
      <p>Great news! Your child, <strong>${studentName}</strong>, has been added to our system, and we've created your Parent Portal account.</p>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Your Portal Access:</h3>
        <p style="margin: 8px 0;"><strong>Portal URL:</strong> <a href="${loginUrl}" style="color: #008080;">${loginUrl}</a></p>
        <p style="margin: 8px 0;"><strong>Username:</strong> ${parentEmail}</p>
        <p style="margin: 8px 0;"><strong>Password:</strong> Please reset your password by clicking the button below to access your account.</p>
        ${kioskPin ? `<p style="margin: 8px 0;"><strong>Kiosk Login PIN:</strong> ${kioskPin}</p>` : ""}
      </div>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #008080; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Reset Your Password</a>
      </div>
      <p style="font-size: 14px; color: #666;">This link will expire in 15 minutes for security purposes.</p>
      
      <p><strong>What You Can Do:</strong></p>
      <ul style="padding-left: 20px; margin: 16px 0; line-height: 1.6;">
        <li>Track ${studentName}'s academic progress and milestones</li>
        <li>View report cards and portfolios</li>
        <li>Receive important announcements from teachers and staff</li>
        <li>Manage invoices and payments</li>
        <li>Stay connected with your child's educational journey</li>
      </ul>

      <p style="margin-top: 24px;">We're excited to partner with you in ${studentName}'s education. If you have any questions, don't hesitate to reach out!</p>
      ${explainerVideoBlock}
      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="background-color: #008080; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Login to Your Account</a>
      </div>
    `;
    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `Welcome to ${schoolName}'s Parent Portal! 🎉`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `Welcome to ${schoolName}'s Parent Portal!\n\nHi ${parentName},\n\nGreat news! Your child, ${studentName}, has been added to our system.\n\nPortal URL: ${loginUrl}\nUsername: ${parentEmail}\nPassword: Please reset your password to access your account: ${resetUrl}\n\nThis link will expire in 15 minutes for security purposes.\n${kioskPin ? `Kiosk Login PIN: ${kioskPin}\n` : ""}\nWhat You Can Do:\n- Track academic progress\n- View report cards\n- Receive announcements\n- Manage invoices\n- Stay connected\n\nWatch this short explainer video on how to navigate the Portal: ${PARENT_EXPLAINER_VIDEO_URL}`;

    await this.sendEmail({
      to: parentEmail,
      subject: `Welcome to ${schoolName}'s Parent Portal! 🎉`,
      html,
      text,
    });
  }

  /**
   * Send payment receipt email to parent
   */
  async sendPaymentReceiptEmail(
    parentEmail: string,
    parentName: string,
    studentName: string,
    invoiceNumber: string,
    amountPaid: number,
    paymentDate: Date | string,
    paymentMethod: string,
    items: Array<{ description: string; quantity: number; rate: number }>,
    balance: number,
    schoolName: string,
    invoiceId?: number,
    subDomain?: string,
  ): Promise<void> {
    const school = await this.loadSchoolData(schoolName);
    const formattedDate = (paymentDate instanceof Date ? paymentDate : new Date(paymentDate)).toLocaleDateString();
    const formattedAmount = amountPaid.toLocaleString("en-US", { style: "currency", currency: "NGN" });
    const formattedBalance = balance.toLocaleString("en-US", { style: "currency", currency: "NGN" });

    const formattedPaymentMethod = paymentMethod
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const isPaidInFull = balance <= 0;

    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.description}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.rate.toLocaleString("en-US", { style: "currency", currency: "NGN" })}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${(item.quantity * item.rate).toLocaleString("en-US", { style: "currency", currency: "NGN" })}</td>
        </tr>
      `,
      )
      .join("");

    const bodyContent = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; padding: 8px 16px; background-color: #e6f2f2; border-radius: 20px; color: #008080; font-weight: 600; font-size: 12px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em;">
          Payment Received
        </div>
        <h2 style="margin: 0; color: #333; font-size: 24px;">Payment Receipt</h2>
        <p style="margin: 8px 0 0 0; color: #666;">Thank you for your payment to <strong>${schoolName}</strong></p>
      </div>

      <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-bottom: 16px;">
              <p style="margin: 0; color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Amount Paid</p>
              <p style="margin: 4px 0 0 0; color: #333; font-size: 24px; font-weight: 700;">${formattedAmount}</p>
            </td>
            <td style="padding-bottom: 16px; text-align: right;">
              <p style="margin: 0; color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Date</p>
              <p style="margin: 4px 0 0 0; color: #333; font-size: 16px; font-weight: 600;">${formattedDate}</p>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #eee; padding-top: 16px;">
              <p style="margin: 0; color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Payment Method</p>
              <p style="margin: 4px 0 0 0; color: #333; font-size: 16px; font-weight: 600;">${formattedPaymentMethod}</p>
            </td>
            <td style="border-top: 1px solid #eee; padding-top: 16px; text-align: right;">
              <p style="margin: 0; color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Invoice Number</p>
              <p style="margin: 4px 0 0 0; color: #333; font-size: 16px; font-weight: 600;">#${invoiceNumber}</p>
            </td>
          </tr>
        </table>
      </div>

      <h3 style="color: #333; font-size: 18px; margin-bottom: 16px;">Items Paid For</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">Description</th>
            <th style="padding: 12px; text-align: center; font-size: 12px; color: #666; text-transform: uppercase;">Qty</th>
            <th style="padding: 12px; text-align: right; font-size: 12px; color: #666; text-transform: uppercase;">Rate</th>
            <th style="padding: 12px; text-align: right; font-size: 12px; color: #666; text-transform: uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="padding: 20px; background-color: #f0fdfa; border-radius: 12px; border: 1px solid #ccfbf1; margin-bottom: 16px;">
        <p style="margin: 0; color: #0f766e; font-size: 15px; text-align: center;">
          This payment was made for <strong>${studentName}</strong>. 
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <h3 style="margin: 0; color: ${isPaidInFull ? "#008080" : "#d32f2f"}; font-size: 20px; font-weight: 700;">
          ${isPaidInFull ? "Invoice Paid in Full 🎉" : `Remaining Balance: ${formattedBalance}`}
        </h3>
      </div>
      
      ${invoiceId ? `<div style="text-align: center; margin-bottom: 16px;"><a href="${getSchoolPortalUrl("/parent/invoicing", subDomain)}?modal=parent-invoice-receipt&invoiceId=${invoiceId}" style="background-color: #0d5c5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">View Invoice</a></div>` : ""}

    `;

    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: "Your payment has been received! 🎉",
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
      footerPreferenceText: `You received this receipt from ${schoolName} via WhitePenguin.`,
    });

    const text = `Payment Receipt - ${schoolName}\n\nHi ${parentName},\n\nYour payment of ${formattedAmount} for ${studentName} has been successfully recorded.\n\nDate: ${formattedDate}\nPayment Method: ${formattedPaymentMethod}\nInvoice Number: #${invoiceNumber}\n\n${balance > 0 ? `Remaining Balance: ${formattedBalance}\n` : ""}Thank you for your payment!`;

    await this.sendEmail({
      to: parentEmail,
      subject: `Payment Receipt: #${invoiceNumber} - ${schoolName}`,
      html,
      text,
    });
  }

  /**
   * Send invoice email to parent
   */
  async sendInvoiceEmailToParent(
    parentEmail: string,
    parentName: string,
    studentName: string,
    invoiceNumber: string,
    issueDate: Date | string,
    dueDate: Date | string,
    total: number,
    amountPaid: number,
    balance: number,
    items: Array<{ description: string; quantity: number; rate: number }>,
    schoolName: string,
    notes?: string,
    invoiceId?: number,
    subDomain?: string,
    attachments?: { filename: string; content: Buffer | string; contentType: string }[],
    bankDetails?: { bankName: string; accountNumber: string; accountName: string },
    invoiceEmail?: { subject?: string; body?: string },
  ): Promise<void> {
    const school = await this.loadSchoolData(schoolName);
    const invoiceUrlBase = getSchoolPortalUrl("/parent/invoicing", subDomain);
    const invoiceUrl = invoiceId ? `${invoiceUrlBase}?modal=parent-invoice-receipt&invoiceId=${invoiceId}` : invoiceUrlBase;
    const issueDateObj = issueDate instanceof Date ? issueDate : new Date(issueDate);
    const dueDateObj = dueDate instanceof Date ? dueDate : new Date(dueDate);
    const formattedIssueDate = issueDateObj.toLocaleDateString();
    const formattedDueDate = dueDateObj.toLocaleDateString();
    const formattedTotal = total.toLocaleString("en-US", { style: "currency", currency: "NGN" });
    const formattedAmountPaid = amountPaid.toLocaleString("en-US", { style: "currency", currency: "NGN" });
    const formattedBalance = balance.toLocaleString("en-US", { style: "currency", currency: "NGN" });

    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.rate.toLocaleString("en-US", { style: "currency", currency: "NGN" })}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${(item.quantity * item.rate).toLocaleString("en-US", { style: "currency", currency: "NGN" })}</td>
        </tr>
      `,
      )
      .join("");

    const customBodyRaw = invoiceEmail?.body != null && String(invoiceEmail.body).trim() !== "" ? String(invoiceEmail.body).trim() : "";
    // HTML ignores literal newlines inside <p>; \n from JSON becomes real LF in the string
    const customIntro = customBodyRaw
      ? `<p>${customBodyRaw.replace(/\r\n|\r|\n/g, "<br>")}</p>`
      : `<p>A new invoice has been generated for your child <strong>${studentName}</strong>.</p>`;

    const bodyContent = `
      ${customIntro}
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <table role="presentation" width="100%">
          <tr><td style="font-weight: bold; color: #555;">Invoice Number:</td><td>${invoiceNumber}</td></tr>
          <tr><td style="font-weight: bold; color: #555;">Issue Date:</td><td>${formattedIssueDate}</td></tr>
          <tr><td style="font-weight: bold; color: #555;">Due Date:</td><td>${formattedDueDate}</td></tr>
        </table>
      </div>
      <h3 style="color: #444444;">Invoice Items</h3>
      <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin: 20px 0; background-color: #fff;">
        <thead>
          <tr style="background-color: #0d5c5c; color: white;">
            <th style="padding: 12px; text-align: left;">Description</th>
            <th style="padding: 12px; text-align: center;">Quantity</th>
            <th style="padding: 12px; text-align: right;">Rate</th>
            <th style="padding: 12px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="background-color: #f0f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Amount Paid:</strong> ${formattedAmountPaid}</p>
        <p style="margin: 8px 0; font-size: 18px;"><strong>Total Amount:</strong> ${formattedTotal}</p>
        <p style="margin: 8px 0;"><strong>Balance:</strong> <span style="color: ${balance > 0 ? "#b71c1c" : "#1b5e20"}; font-weight: bold;">${formattedBalance}</span></p>
      </div>
      ${notes ? `<div style="background-color: #fff8e6; padding: 15px; border-left: 4px solid #c9a227; margin: 15px 0;"><strong>Notes:</strong><br>${notes}</div>` : ""}
      ${
        bankDetails
          ? `
      <div style="background-color: #f0f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #b2dfdb;">
        <h3 style="color: #0d5c5c; margin-top: 0;">Payment Details</h3>
        <table role="presentation" width="100%">
          <tr><td style="font-weight: bold; color: #555; padding: 4px 8px;">Bank Name:</td><td style="padding: 4px 8px;">${bankDetails.bankName}</td></tr>
          <tr><td style="font-weight: bold; color: #555; padding: 4px 8px;">Account Number:</td><td style="padding: 4px 8px;">${bankDetails.accountNumber}</td></tr>
          <tr><td style="font-weight: bold; color: #555; padding: 4px 8px;">Account Name:</td><td style="padding: 4px 8px;">${bankDetails.accountName}</td></tr>
        </table>
      </div>
      `
          : ""
      }
      <p>Please review the invoice and make payment by the due date.</p>
      <p style="margin: 20px 0;"><a href="${invoiceUrl}" style="background-color: #0d5c5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Invoice</a></p>
      <p>If you have any questions or concerns about this invoice, please contact the school administration.</p>
    `;
    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `New Invoice - ${schoolName}`,
      bodyContent,
      schoolName,
      showSupportHelpBlurb: false,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
      footerPreferenceText: `You received this invoice from ${schoolName} via WhitePenguin. You can unsubscribe or manage your email preferences.`,
    });

    const itemsText = items
      .map(
        (item) =>
          `  ${item.description} - Quantity: ${item.quantity} x ${item.rate.toLocaleString("en-US", { style: "currency", currency: "USD" })} = ${(item.quantity * item.rate).toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
      )
      .join("\n");

    const emailSubject =
      invoiceEmail?.subject != null && String(invoiceEmail.subject).trim() !== ""
        ? String(invoiceEmail.subject).trim()
        : `New Invoice ${invoiceNumber} - ${schoolName}`;

    const textIntro = customBodyRaw ? `${customBodyRaw}\n\n` : `A new invoice has been generated for your child ${studentName}.\n\n`;

    const text = `${emailSubject}\n\nHi ${parentName},\n\n${textIntro}Invoice Number: ${invoiceNumber}\nIssue Date: ${formattedIssueDate}\nDue Date: ${formattedDueDate}\n\nItems: ${itemsText}\n\nAmount Paid: ${formattedAmountPaid}\nTotal: ${formattedTotal}\nBalance: ${formattedBalance}${notes ? `\n\nNotes: ${notes}` : ""}\n\nView invoices: ${invoiceUrl}`;

    await this.sendEmail({
      to: parentEmail,
      subject: emailSubject,
      html,
      text,
      attachments,
    });
  }

  /**
   * Send teacher account creation email
   */
  async sendTeacherAccountCreationEmail(
    teacherEmail: string,
    teacherName: string,
    plainPassword: string,
    schoolName: string,
    classroomNames?: string[],
    plainPin?: string,
  ): Promise<void> {
    const school = await this.loadSchoolData(schoolName);
    const loginUrl = joinFrontendUrl("auth/login?role=staff");

    const bodyContent = `
      <p>Welcome aboard! We're thrilled to have you join our teaching community.</p>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Your Teacher Portal Access:</h3>
        <p style="margin: 8px 0;"><strong>Portal URL:</strong> <a href="${loginUrl}" style="color: #008080;">${loginUrl}</a></p>
        <p style="margin: 8px 0;"><strong>Username:</strong> ${teacherEmail}</p>
        <p style="margin: 8px 0;"><strong>Temporary Password:</strong> ${plainPassword}</p>
        ${plainPin ? `<p style="margin: 8px 0;"><strong>Login PIN:</strong> ${plainPin}</p>` : ""}
      </div>

      <p><strong>Your Portal Features:</strong></p>
      <ul style="padding-left: 20px; margin: 16px 0; line-height: 1.6;">
        <li>Manage your classroom and student roster</li>
        <li>Create and track curriculum milestones</li>
        <li>Grade assignments and generate portfolios</li>
        <li>Communicate with parents and fellow staff</li>
        <li>Access school announcements and resources</li>
      </ul>

      ${
        classroomNames && classroomNames.length > 0
          ? `<p>Your assigned classroom${classroomNames.length > 1 ? "s" : ""}: <strong>${classroomNames.join(", ")}</strong> ${classroomNames.length > 1 ? "are" : "is"} ready for you. We can't wait to see the amazing impact you'll have on our students!</p>`
          : ""
      }

      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="background-color: #008080; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Go to Your Dashboard</a>
      </div>
    `;
    const html = getEmailTemplateHtml({
      recipientName: teacherName,
      welcomeTitle: `Welcome to the ${schoolName} Teaching Team!`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const classroomText = classroomNames && classroomNames.length > 0 ? `\n\nAssigned Classroom(s): ${classroomNames.join(", ")}` : "";

    const text = `Welcome to the ${schoolName} Teaching Team!\n\nHi ${teacherName},\n\nWelcome aboard! We're thrilled to have you join our teaching community.\n\nPortal URL: ${loginUrl}\nUsername: ${teacherEmail}\nTemporary Password: ${plainPassword}${plainPin ? `\nLogin PIN: ${plainPin}` : ""}${classroomText}\n\nYour Portal Features:\n- Manage classroom\n- Create curriculum milestones\n- Grade assignments\n- Communicate with parents\n- Access resources`;

    await this.sendEmail({
      to: teacherEmail,
      subject: `Welcome to the ${schoolName} Teaching Team!`,
      html,
      text,
    });
  }

  /**
   * Branded email when a classroom activity is logged with notify parent enabled.
   */
  async sendClassroomActivityParentEmail(options: {
    parentEmail: string;
    parentName: string;
    schoolId: number;
    studentName: string;
    activitySummary: string;
  }): Promise<void> {
    const { parentEmail, parentName, schoolId, studentName, activitySummary } = options;
    const school = await this.loadSchoolById(schoolId);
    const schoolName = school?.schoolName || "Your school";
    const portalUrl = getSchoolPortalUrl("/parent/dashboard", school?.subDomain);

    const bodyContent = `
      <p>We would like to inform you that a new classroom activity has been recorded for <strong>${studentName}</strong>.</p>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Activity summary</h3>
        <p style="margin: 8px 0; line-height: 1.6;">${activitySummary}</p>
      </div>
      <p>Please sign in to the parent portal to view further details, including any photos or notes shared by your child's teacher.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${portalUrl}" style="background-color: #008080; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Open parent portal</a>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 24px;">If you have any questions about this update, please contact ${schoolName} directly.</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `Activity update for ${studentName}`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = [
      `Activity update for ${studentName}`,
      "",
      `A new classroom activity has been recorded at ${schoolName}.`,
      "",
      activitySummary,
      "",
      `View details in the parent portal: ${portalUrl}`,
    ].join("\n");

    await this.sendEmail({
      to: parentEmail,
      subject: `Activity update for ${studentName} — ${schoolName}`,
      html,
      text,
    });
  }

  /**
   * Send a generic notification email (school-branded when schoolId is provided).
   */
  async sendNotificationEmail(email: string, subject: string, message: string, recipientName = "there", schoolId?: number): Promise<void> {
    const school = schoolId ? await this.loadSchoolById(schoolId) : null;
    const schoolName = school?.schoolName || "WhitePenguin";

    const bodyContent = `
      <h2 style="color: #444444; margin-top: 0;">${subject}</h2>
      <p style="font-size: 16px; line-height: 1.5;">${message.replace(/\n/g, "<br>")}</p>
    `;
    const html = getEmailTemplateHtml({
      recipientName,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    await this.sendEmail({
      to: email,
      subject,
      html,
      text: message,
    });
  }

  /**
   * Send announcement-published email with role-based view link.
   * roleSegment: 'admin' | 'staff' | 'parents' -> {FRONTEND_URL}/{segment}/communication/announcement
   */
  async sendAnnouncementPublishedEmail(
    to: string,
    recipientName: string,
    announcement: {
      id: number;
      subject: string;
      content: string;
      announcementType?: string;
      senderName?: string;
      date?: string;
      time?: string;
    },
    schoolName: string,
    roleSegment: "admin" | "staff" | "parents",
    subDomain?: string,
  ): Promise<void> {
    const school = await this.loadSchoolData(schoolName);
    const loginUrl = getSchoolPortalUrl(`/auth/login?role=${roleSegment === "parents" ? "parent" : roleSegment}`, subDomain);
    const viewUrl = `${loginUrl}&redirect=${encodeURIComponent(`/${roleSegment}/communication/announcement`)}`;

    const senderName = announcement.senderName || "School Administration";
    const postDate = announcement.date || new Date().toLocaleDateString();
    const postTime = announcement.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const bodyContent = `
      <p style="margin: 0 0 16px 0;">We wanted to make sure you saw this important message from <strong>${senderName}</strong>:</p>
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #111827;">${announcement.subject}</h3>
        <div style="font-size: 15px; line-height: 1.6; color: #374151;">
          ${announcement.content}
        </div>
        <p style="margin: 16px 0 0 0; font-size: 13px; color: #6b7280; font-style: italic;">
          Posted on ${postDate} at ${postTime}
        </p>
      </div>
      <p style="margin: 0 0 16px 0;">You can view this and other announcements anytime in your portal at <a href="${viewUrl}" style="color: #008080; text-decoration: underline;">${viewUrl}</a>.</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: recipientName || "there",
      welcomeTitle: `📢 Important Update from ${schoolName}`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const subject = `📢 Important Update from ${schoolName}`;
    const text = `Important Update from ${schoolName}\n\nDear ${recipientName || "there"},\n\nWe wanted to make sure you saw this important message from ${senderName}:\n\n${announcement.subject}\n\n${announcement.content.replace(/<[^>]*>/g, "")}\n\nPosted on ${postDate} at ${postTime}\n\nYou can view this in your portal: ${viewUrl}`;

    await this.sendEmail({ to, subject, html, text });
  }

  /**
   * Send one announcement-published email to multiple recipients
   */
  async sendAnnouncementPublishedEmailBulk(
    emails: string[],
    announcement: {
      id: number;
      subject: string;
      content: string;
      announcementType?: string;
      senderName?: string;
      date?: string;
      time?: string;
    },
    schoolName: string,
    roleSegment: "admin" | "staff" | "parents",
    subDomain?: string,
  ): Promise<void> {
    if (emails.length === 0) return;
    const school = await this.loadSchoolData(schoolName);
    const loginUrl = getSchoolPortalUrl(`/auth/login?role=${roleSegment === "parents" ? "parent" : roleSegment}`, subDomain);
    const viewUrl = `${loginUrl}&redirect=${encodeURIComponent(`/${roleSegment}/communication/announcement`)}`;

    const senderName = announcement.senderName || "School Administration";
    const postDate = announcement.date || new Date().toLocaleDateString();
    const postTime = announcement.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const bodyContent = `
      <p style="margin: 0 0 16px 0;">We wanted to make sure you saw this important message from <strong>${senderName}</strong>:</p>
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #111827;">${announcement.subject}</h3>
        <div style="font-size: 15px; line-height: 1.6; color: #374151;">
          ${announcement.content}
        </div>
        <p style="margin: 16px 0 0 0; font-size: 13px; color: #6b7280; font-style: italic;">
          Posted on ${postDate} at ${postTime}
        </p>
      </div>
      <p style="margin: 0 0 16px 0;">You can view this and other announcements anytime in your portal at <a href="${viewUrl}" style="color: #008080; text-decoration: underline;">${viewUrl}</a>.</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: "Parent/Staff",
      welcomeTitle: `📢 Important Update from ${schoolName}`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const subject = `📢 Important Update from ${schoolName}`;
    const text = `Important Update from ${schoolName}\n\nDear Parent/Staff,\n\nWe wanted to make sure you saw this important message from ${senderName}:\n\n${announcement.subject}\n\n${announcement.content.replace(/<[^>]*>/g, "")}\n\nPosted on ${postDate} at ${postTime}\n\nYou can view this in your portal: ${viewUrl}`;

    await this.sendEmail({ to: emails, subject, html, text });
  }

  /**
   * Send Tour Booking Confirmation Email
   */
  async sendTourBookingConfirmationEmail(options: {
    email: string;
    parentName: string;
    schoolName: string;
    tourDate: string;
    tourTime: string;
    duration: string;
    location: string;
    guideName: string;
  }): Promise<void> {
    const { email, parentName, schoolName, tourDate, tourTime, duration, location, guideName } = options;
    const school = await this.loadSchoolData(schoolName);

    const bodyContent = `
      <p>Thank you for your interest in ${schoolName}! We're excited to show you around.</p>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Your Tour Details:</h3>
        <p style="margin: 8px 0;"><strong>Date:</strong> ${tourDate}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${tourTime}</p>
        <p style="margin: 8px 0;"><strong>Duration:</strong> Approximately ${duration}</p>
        <p style="margin: 8px 0;"><strong>Location:</strong> ${location}</p>
        <p style="margin: 8px 0;"><strong>Tour Guide:</strong> ${guideName}</p>
      </div>
      
      <p><strong>What to Expect:</strong></p>
      <ul style="padding-left: 20px; margin: 16px 0; line-height: 1.6;">
        <li>Campus walkthrough</li>
        <li>Meet our teachers and staff</li>
        <li>Learn about our curriculum and programs</li>
        <li>Q&A session</li>
      </ul>

      <p>We can't wait to meet you and share what makes ${schoolName} special!</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `Your Tour at ${schoolName} is Confirmed! 🏫`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `Your Tour at ${schoolName} is Confirmed!\n\nHi ${parentName},\n\nThank you for your interest in ${schoolName}! We're excited to show you around.\n\nTour Details:\nDate: ${tourDate}\nTime: ${tourTime}\nDuration: ${duration}\nLocation: ${location}\nTour Guide: ${guideName}`;

    await this.sendEmail({
      to: email,
      subject: `Your Tour at ${schoolName} is Confirmed! 🏫`,
      html,
      text,
    });
  }

  /**
   * Send upcoming tour reminder to the prospect / parent who booked.
   */
  async sendTourUpcomingReminderBookerEmail(options: {
    email: string;
    parentName: string;
    schoolName: string;
    tourDate: string;
    tourTime: string;
    location: string;
    duration: string;
    phoneNumber?: string;
  }): Promise<void> {
    const { email, parentName, schoolName, tourDate, tourTime, location, duration, phoneNumber } =
      options;

    const school = await this.loadSchoolData(schoolName);
    const contactLine = phoneNumber
      ? `<p>If you have questions before your visit, call us at ${phoneNumber}.</p>`
      : "";

    const bodyContent = `
      <p>This is a friendly reminder about your upcoming tour at ${schoolName}.</p>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Your Tour Details:</h3>
        <p style="margin: 8px 0;"><strong>Date:</strong> ${tourDate}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${tourTime}</p>
        <p style="margin: 8px 0;"><strong>Duration:</strong> Approximately ${duration}</p>
        <p style="margin: 8px 0;"><strong>Location:</strong> ${location}</p>
      </div>
      <p>We look forward to meeting you and showing you around!</p>
      ${contactLine}
    `;

    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `Reminder: Your tour at ${schoolName} is coming up`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text =
      `Reminder: Your tour at ${schoolName} is coming up\n\n` +
      `Hi ${parentName},\n\n` +
      `Date: ${tourDate}\nTime: ${tourTime}\nDuration: ${duration}\nLocation: ${location}\n\n` +
      `We look forward to meeting you!`;

    await this.sendEmail({
      to: email,
      subject: `Reminder: Your tour at ${schoolName} is coming up`,
      html,
      text,
    });
  }

  /**
   * Send upcoming tour reminder to school owner / school contact (internal prep).
   */
  async sendTourUpcomingReminderSchoolEmail(options: {
    emails: string[];
    schoolName: string;
    bookerName: string;
    bookerEmail: string;
    tourDate: string;
    tourTime: string;
    location: string;
    duration: string;
    guestCount?: number;
    note?: string;
  }): Promise<void> {
    const {
      emails,
      schoolName,
      bookerName,
      bookerEmail,
      tourDate,
      tourTime,
      location,
      duration,
      guestCount = 0,
      note,
    } = options;

    if (!emails.length) return;

    const school = await this.loadSchoolData(schoolName);
    const safeNote = note?.trim() || "No note provided.";

    const bodyContent = `
      <p>You have an upcoming campus tour scheduled. Please ensure your team is prepared before the visit.</p>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Tour Details:</h3>
        <p style="margin: 8px 0;"><strong>Prospect:</strong> ${bookerName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${bookerEmail}</p>
        <p style="margin: 8px 0;"><strong>Date:</strong> ${tourDate}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${tourTime}</p>
        <p style="margin: 8px 0;"><strong>Duration:</strong> Approximately ${duration}</p>
        <p style="margin: 8px 0;"><strong>Location:</strong> ${location}</p>
        <p style="margin: 8px 0;"><strong>Guests:</strong> ${guestCount}</p>
        <p style="margin: 8px 0;"><strong>Prospect note:</strong> ${safeNote}</p>
      </div>
      <p><strong>Preparation checklist:</strong></p>
      <ul style="padding-left: 20px; margin: 16px 0; line-height: 1.6;">
        <li>Confirm admissions staff and tour guide availability</li>
        <li>Prepare welcome materials and tour route</li>
        <li>Review the prospect's note and any special requests</li>
        <li>Ensure the tour location is accessible and ready</li>
        <li>Have enrollment or follow-up information available if needed</li>
      </ul>
      <p>Please complete these preparations before the scheduled tour time.</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: "Team",
      welcomeTitle: `Upcoming tour at ${schoolName} — preparation reminder`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text =
      `Upcoming tour at ${schoolName} — preparation reminder\n\n` +
      `Prospect: ${bookerName}\nEmail: ${bookerEmail}\n` +
      `Date: ${tourDate}\nTime: ${tourTime}\nDuration: ${duration}\nLocation: ${location}\n` +
      `Guests: ${guestCount}\nNote: ${safeNote}\n\n` +
      `Please ensure admissions staff, materials, and the tour location are ready before the visit.`;

    await this.sendEmail({
      to: emails,
      subject: `Upcoming tour at ${schoolName} — please prepare`,
      html,
      text,
    });
  }

  /**
   * Send "new tour booked" email to school admins
   */
  async sendTourBookedAdminNotificationEmail(options: {
    schoolId: number;
    schoolName: string;
    bookerName: string;
    bookerEmail: string;
    tourDate: string;
    tourTime: string;
    location: string;
    guestCount?: number;
    note?: string;
  }): Promise<void> {
    const { schoolId, schoolName, bookerName, bookerEmail, tourDate, tourTime, location, guestCount = 0, note } = options;

    const { AppDataSource } = await import("../../core/config/database");
    const userRepository = AppDataSource.getRepository(User);
    const adminUsers = await userRepository.find({
      where: [
        { schoolId, role: UserRole.ADMIN, isActive: true },
        { schoolId, role: UserRole.SUPER_ADMIN, isActive: true },
      ],
      select: ["email"],
    });

    const emails = Array.from(new Set(adminUsers.map((u) => (u.email || "").trim()).filter((e): e is string => e.length > 0)));

    if (emails.length === 0) return;

    const school = await this.loadSchoolData(schoolName);
    const safeNote = note?.trim() || "No note provided.";
    const bodyContent = `
      <p>A new tour has just been booked for <strong>${schoolName}</strong>.</p>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Booking Details:</h3>
        <p style="margin: 8px 0;"><strong>Prospect:</strong> ${bookerName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${bookerEmail}</p>
        <p style="margin: 8px 0;"><strong>Date:</strong> ${tourDate}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${tourTime}</p>
        <p style="margin: 8px 0;"><strong>Location:</strong> ${location}</p>
        <p style="margin: 8px 0;"><strong>Guests:</strong> ${guestCount}</p>
      </div>
      <p><strong>Prospect Note:</strong> ${safeNote}</p>
      <p>Please follow up in the admissions workflow as needed.</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: "Administrator",
      welcomeTitle: `New Tour Booking at ${schoolName}`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text =
      `New Tour Booking at ${schoolName}\n\n` +
      `Prospect: ${bookerName}\n` +
      `Email: ${bookerEmail}\n` +
      `Date: ${tourDate}\n` +
      `Time: ${tourTime}\n` +
      `Location: ${location}\n` +
      `Guests: ${guestCount}\n` +
      `Note: ${safeNote}`;

    await this.sendEmail({
      to: emails,
      subject: `New Tour Booking at ${schoolName}`,
      html,
      text,
    });
  }

  /**
   * Send "new form submitted" email to school admins
   */
  async sendFormSubmittedAdminNotificationEmail(options: {
    schoolId: number;
    formId: number;
    formTitle: string;
    submitterName: string;
    submitterEmail: string;
    responseId: number;
  }): Promise<void> {
    const { schoolId, formId, formTitle, submitterName, submitterEmail, responseId } = options;

    const { AppDataSource } = await import("../../core/config/database");
    const userRepository = AppDataSource.getRepository(User);
    const schoolRepository = AppDataSource.getRepository(School);

    const [adminUsers, school] = await Promise.all([
      userRepository.find({
        where: [
          { schoolId, role: UserRole.ADMIN, isActive: true },
          { schoolId, role: UserRole.SUPER_ADMIN, isActive: true },
        ],
        select: ["email"],
      }),
      schoolRepository.findOne({ where: { id: schoolId } }),
    ]);

    const emails = Array.from(new Set(adminUsers.map((u) => (u.email || "").trim()).filter((e): e is string => e.length > 0)));
    if (emails.length === 0) return;

    const schoolName = school?.schoolName || "your school";
    const safeFormTitle = formTitle?.trim() || "Untitled form";
    const safeSubmitterName = submitterName?.trim() || "A prospect";
    const safeSubmitterEmail = submitterEmail?.trim() || "No email provided";

    const bodyContent = `
      <p>A new form response has been submitted for <strong>${schoolName}</strong>.</p>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Submission Details:</h3>
        <p style="margin: 8px 0;"><strong>Form:</strong> ${safeFormTitle}</p>
        <p style="margin: 8px 0;"><strong>Submitted By:</strong> ${safeSubmitterName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${safeSubmitterEmail}</p>
        <p style="margin: 8px 0;"><strong>Form ID:</strong> ${formId}</p>
        <p style="margin: 8px 0;"><strong>Response ID:</strong> ${responseId}</p>
      </div>
      <p>Please review this response in the admissions workflow.</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: "Administrator",
      welcomeTitle: `New Form Submission at ${schoolName}`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text =
      `New Form Submission at ${schoolName}\n\n` +
      `Form: ${safeFormTitle}\n` +
      `Submitted By: ${safeSubmitterName}\n` +
      `Email: ${safeSubmitterEmail}\n` +
      `Form ID: ${formId}\n` +
      `Response ID: ${responseId}`;

    await this.sendEmail({
      to: emails,
      subject: `New Form Submission at ${schoolName}`,
      html,
      text,
    });
  }

  /**
   * Send Tour Invitation Email
   */
  async sendTourInvitationEmail(options: {
    email: string;
    parentName: string;
    schoolName: string;
    tourDate: string;
    tourTime: string;
    duration: string;
  }): Promise<void> {
    const { email, parentName, schoolName, tourDate, tourTime, duration } = options;
    const school = await this.loadSchoolData(schoolName);

    const bodyContent = `
      <p>We're delighted to invite you to tour ${schoolName} and discover how we can be the perfect educational home for your child!</p>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Proposed Tour Details:</h3>
        <p style="margin: 8px 0;"><strong>Date:</strong> ${tourDate}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${tourTime}</p>
        <p style="margin: 8px 0;"><strong>Duration:</strong> Approximately ${duration}</p>
      </div>

      <p>Can't make this time? No problem! Reply to this email to suggest an alternative time that works better for you.</p>
      
      <p>We look forward to showing you our vibrant learning community!</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `You're Invited to Tour ${schoolName}!`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `You're Invited to Tour ${schoolName}!\n\nHi ${parentName},\n\nWe're delighted to invite you to tour ${schoolName} and discover how we can be the perfect educational home for your child!\n\nProposed Tour Details:\nDate: ${tourDate}\nTime: ${tourTime}\nDuration: ${duration}`;

    await this.sendEmail({
      to: email,
      subject: `You're Invited to Tour ${schoolName}!`,
      html,
      text,
    });
  }

  /**
   * Send Tour Rescheduled Email
   */
  async sendTourRescheduledEmail(options: {
    email: string;
    parentName: string;
    schoolName: string;
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    location: string;
  }): Promise<void> {
    const { email, parentName, schoolName, oldDate, oldTime, newDate, newTime, location } = options;
    const school = await this.loadSchoolData(schoolName);

    const bodyContent = `
      <p>We wanted to let you know that your scheduled tour has been rescheduled.</p>
      
      <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #666;">Previous Tour:</h4>
        <p style="margin: 4px 0;">Date: ${oldDate}</p>
        <p style="margin: 4px 0;">Time: ${oldTime}</p>
      </div>

      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #008080;">New Tour Details:</h3>
        <p style="margin: 8px 0;"><strong>Date:</strong> ${newDate}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${newTime}</p>
        <p style="margin: 8px 0;"><strong>Location:</strong> ${location}</p>
      </div>
      
      <p>We apologize for any inconvenience. If this new time doesn't work for you, please let us know and we'll find another option.</p>

      <p>Looking forward to seeing you!</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `Your ${schoolName} Tour Has Been Rescheduled`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `Your ${schoolName} Tour Has Been Rescheduled\n\nHi ${parentName},\n\nWe wanted to let you know that your scheduled tour has been rescheduled.\n\nPrevious Tour: ${oldDate} at ${oldTime}\nNew Tour: ${newDate} at ${newTime}\nLocation: ${location}`;

    await this.sendEmail({
      to: email,
      subject: `Your ${schoolName} Tour Has Been Rescheduled`,
      html,
      text,
    });
  }

  /**
   * Send Tour Cancelled Email
   */
  async sendTourCancelledEmail(options: {
    email: string;
    parentName: string;
    schoolName: string;
    tourDate: string;
    tourTime: string;
    cancellationReason?: string;
  }): Promise<void> {
    const { email, parentName, schoolName, tourDate, tourTime, cancellationReason } = options;
    const school = await this.loadSchoolData(schoolName);

    const bodyContent = `
      <p>Your scheduled tour on <strong>${tourDate}</strong> at <strong>${tourTime}</strong> has been cancelled.</p>
      
      ${cancellationReason ? `<div style="background-color: #fdf2f2; border-left: 4px solid #f8b4b4; padding: 15px; margin: 20px 0;"><strong>Reason:</strong> ${cancellationReason}</div>` : ""}
      
      <p>If you have any questions or concerns, please don't hesitate to reach out.</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `Tour Cancellation - ${schoolName}`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `Tour Cancellation - ${schoolName}\n\nHi ${parentName},\n\nYour scheduled tour on ${tourDate} at ${tourTime} has been cancelled.\n${cancellationReason ? `Reason: ${cancellationReason}\n` : ""}`;

    await this.sendEmail({
      to: email,
      subject: `Tour Cancellation - ${schoolName}`,
      html,
      text,
    });
  }

  /**
   * Send Tour Completed Follow Up Email
   */
  async sendTourCompletedFollowUpEmail(options: {
    email: string;
    parentName: string;
    schoolName: string;
    phoneNumber: string;
  }): Promise<void> {
    const { email, parentName, schoolName, phoneNumber } = options;
    const school = await this.loadSchoolData(schoolName);

    const bodyContent = `
      <p>It was wonderful meeting you during your tour today! We hope you enjoyed learning about ${schoolName} and our educational approach.</p>
      
      <p><strong>Next Steps:</strong> We're here to answer any additional questions you might have. Feel free to reply to this email or call us at <strong>${phoneNumber}</strong>.</p>
      
      <p>Ready to join our community? Keep an eye out for admission information coming your way soon.</p>

      <p>Thank you for considering ${schoolName} for your child's education!</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `Thank You for Visiting ${schoolName}!`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `Thank You for Visiting ${schoolName}!\n\nHi ${parentName},\n\nIt was wonderful meeting you during your tour today! We hope you enjoyed learning about ${schoolName} and our educational approach.\n\nQuestions? Call us at ${phoneNumber}`;

    await this.sendEmail({
      to: email,
      subject: `Thank You for Visiting ${schoolName}!`,
      html,
      text,
    });
  }

  /**
   * Send offer email with invoice details
   */
  async sendOfferEmail(
    recipient: string,
    subject: string,
    body: string,
    invoiceNumber: string,
    studentNames: string,
    issueDate: Date | string,
    dueDate: Date | string,
    items: Array<{ description: string; quantity: number; rate: number; tax?: number }>,
    subtotal: number,
    tax: number,
    total: number,
    schoolName: string,
    notes?: string,
    attachments?: {
      filename: string;
      content: Buffer | string;
      contentType: string;
    }[],
  ): Promise<void> {
    // Convert to Date objects if they are strings
    const issueDateObj = issueDate instanceof Date ? issueDate : new Date(issueDate);
    const dueDateObj = dueDate instanceof Date ? dueDate : new Date(dueDate);
    const formattedIssueDate = issueDateObj.toLocaleDateString();
    const formattedDueDate = dueDateObj.toLocaleDateString();

    const itemsHtml = items
      .map((item) => {
        const itemTotal = item.quantity * item.rate;
        const itemTax = itemTotal * ((item.tax || 0) / 100);
        return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.rate.toLocaleString("en-NG", { style: "currency", currency: "NGN" })}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${itemTax > 0 ? `${item.tax}%` : "0%"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${(itemTotal + itemTax).toLocaleString("en-NG", { style: "currency", currency: "NGN" })}</td>
        </tr>
      `;
      })
      .join("");

    const school = await this.loadSchoolData(schoolName);

    const bodyContent = `
      <p>${body}</p>
      
      <h3 style="color: #333; font-size: 18px; margin: 24px 0 16px 0;">Invoice Details</h3>
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 20px; border-radius: 8px; margin: 16px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-weight: 600; color: #555; padding: 4px 0;">Invoice Number:</td><td style="padding: 4px 0;">${invoiceNumber}</td></tr>
          <tr><td style="font-weight: 600; color: #555; padding: 4px 0;">Students:</td><td style="padding: 4px 0;">${studentNames}</td></tr>
          <tr><td style="font-weight: 600; color: #555; padding: 4px 0;">Issue Date:</td><td style="padding: 4px 0;">${formattedIssueDate}</td></tr>
          <tr><td style="font-weight: 600; color: #555; padding: 4px 0;">Due Date:</td><td style="padding: 4px 0;">${formattedDueDate}</td></tr>
        </table>
      </div>

      <h3 style="color: #333; font-size: 18px; margin: 24px 0 16px 0;">Invoice Items</h3>
      <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin: 16px 0; background-color: #fff; border: 1px solid #E5E7EB;">
        <thead>
          <tr style="background-color: #008080; color: white;">
            <th style="padding: 12px; text-align: left;">Description</th>
            <th style="padding: 12px; text-align: center;">Quantity</th>
            <th style="padding: 12px; text-align: right;">Rate</th>
            <th style="padding: 12px; text-align: right;">Tax</th>
            <th style="padding: 12px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Subtotal:</strong> ${subtotal.toLocaleString("en-NG", { style: "currency", currency: "NGN" })}</p>
        <p style="margin: 8px 0;"><strong>Tax:</strong> ${tax.toLocaleString("en-NG", { style: "currency", currency: "NGN" })}</p>
        <p style="margin: 8px 0; font-size: 18px; font-weight: 700; color: #008080;"><strong>Total Amount:</strong> ${total.toLocaleString("en-NG", { style: "currency", currency: "NGN" })}</p>
      </div>

      ${notes ? `<div style="background-color: #fff8e6; padding: 15px; border-left: 4px solid #c9a227; margin: 20px 0;"><strong>Notes:</strong><br>${notes}</div>` : ""}
      
      ${
        attachments && attachments.length > 0
          ? `
        <div style="margin: 20px 0;">
          <strong>Attachments:</strong>
          <ul style="margin: 8px 0; padding-left: 20px;">
            ${attachments.map((att) => `<li>${att.filename}</li>`).join("")}
          </ul>
        </div>
      `
          : ""
      }

      <p>If you have any questions, please contact ${schoolName}.</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: "there",
      welcomeTitle: subject,
      bodyContent,
      schoolName,
      showSupportHelpBlurb: false,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
      footerPreferenceText: `You received this offer from ${schoolName} via WhitePenguin.`,
    });

    const text = `${body}\n\nInvoice Number: ${invoiceNumber}\nStudents: ${studentNames}\nTotal: ${total.toLocaleString("en-NG", { style: "currency", currency: "NGN" })}`;

    await this.sendEmail({
      to: recipient,
      subject,
      html,
      text,
      attachments,
    });
  }

  /**
   * Send Tour 24h Follow Up Email
   */
  async sendTour24hFollowUpEmail(options: {
    email: string;
    parentName: string;
    schoolName: string;
    childName: string;
    phoneNumber: string;
    schoolEmail: string;
    nextStepsText?: string;
  }): Promise<void> {
    const { email, parentName, schoolName, childName, phoneNumber, schoolEmail, nextStepsText } = options;
    const school = await this.loadSchoolData(schoolName);

    const bodyContent = `
      <p>It was wonderful meeting you and your family during yesterday's tour! We hope you enjoyed learning about ${schoolName} and could envision ${childName} thriving here.</p>
      
      <div style="margin: 24px 0;">
        <h4 style="color: #008080;">Have Questions?</h4>
        <p>We know choosing the right school is a big decision. If anything came up after your tour, we're here to help!</p>
        <ul style="line-height: 1.6;">
          <li>Call us: ${phoneNumber}</li>
          <li>Email us: <a href="mailto:${schoolEmail}" style="color: #008080;">${schoolEmail}</a></li>
        </ul>
      </div>

      ${nextStepsText ? `<p><strong>Next Steps:</strong> ${nextStepsText}</p>` : ""}

      <p>We'd be honored to have ${childName} join our school family!</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `Thank You for Visiting ${schoolName}! We'd Love Your Feedback`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `Thank You for Visiting ${schoolName}!\n\nHi ${parentName},\n\nIt was wonderful meeting you and your family during yesterday's tour! We hope you enjoyed learning about ${schoolName} and could envision ${childName} thriving here.\n\nQuestions? Call ${phoneNumber} or email ${schoolEmail}`;

    await this.sendEmail({
      to: email,
      subject: `Thank You for Visiting ${schoolName}! We'd Love Your Feedback`,
      html,
      text,
    });
  }

  /**
   * Send Admission Offer 72h Reminder Email
   */
  async sendAdmissionOffer72hReminderEmail(options: {
    email: string;
    parentName: string;
    schoolName: string;
    childName: string;
    programName: string;
    startDate: string;
    deadlineDate: string;
    daysRemaining: number;
    phoneNumber: string;
  }): Promise<void> {
    const { email, parentName, schoolName, childName, programName, startDate, deadlineDate, daysRemaining, phoneNumber } = options;
    const school = await this.loadSchoolData(schoolName);
    const bodyContent = `
      <p>We noticed you viewed ${childName}'s admission offer a few days ago, and wanted to check in!</p>
      
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Your Offer Details:</h3>
        <p style="margin: 8px 0;"><strong>Program:</strong> ${programName}</p>
        <p style="margin: 8px 0;"><strong>Start Date:</strong> ${startDate}</p>
        <p style="margin: 20px 0 8px 0; color: #b71c1c; font-weight: 600;">Acceptance Deadline: ${deadlineDate} (${daysRemaining} days remaining)</p>
      </div>

      <p><strong>Have Questions or Concerns?</strong> We're here to help! Common questions we can address:</p>
      <ul style="line-height: 1.6;">
        <li>Financial aid or payment plans</li>
        <li>Program details and curriculum</li>
        <li>Schedule flexibility</li>
        <li>Specific needs or accommodations</li>
      </ul>

      <p><strong>Let's Talk:</strong></p>
      <ul style="line-height: 1.6;">
        <li>Reply to this email</li>
        <li>Call us: ${phoneNumber}</li>
      </ul>

      <p>We're excited about the possibility of ${childName} joining us and want to make sure you have everything you need to make the best decision for your family.</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `Questions About Your Admission Offer?`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `Questions About Your Admission Offer?\n\nHi ${parentName},\n\nWe noticed you viewed ${childName}'s admission offer a few days ago.\n\nDeadline: ${deadlineDate} (${daysRemaining} days left)`;

    await this.sendEmail({
      to: email,
      subject: `Questions About Your Admission Offer? – ${schoolName}`,
      html,
      text,
    });
  }

  /**
   * Send Application Started Reminder Email
   */
  async sendApplicationStartedReminderEmail(options: {
    email: string;
    parentName: string;
    schoolName: string;
    childName: string;
    startedDate: string;
    completionPercentage: number;
    estimatedMinutesRemaining: number;
    supportEmail: string;
    admissionsEmail: string;
    phoneNumber: string;
    deadline?: string;
  }): Promise<void> {
    const {
      email,
      parentName,
      schoolName,
      childName,
      startedDate,
      completionPercentage,
      estimatedMinutesRemaining,
      supportEmail,
      admissionsEmail,
      phoneNumber,
      deadline,
    } = options;

    const bodyContent = `
      <p>We noticed you started an application for ${childName} on ${startedDate}, and we saved your progress!</p>
      
      <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #444;">Your Application Status:</h3>
        <p style="margin: 8px 0;"><strong>Started:</strong> ${startedDate}</p>
        <p style="margin: 8px 0;"><strong>Completed:</strong> ${completionPercentage}%</p>
        <p style="margin: 8px 0;"><strong>Estimated Time to Complete:</strong> ${estimatedMinutesRemaining} minutes</p>
        ${deadline ? `<p style="margin: 20px 0 8px 0; color: #b71c1c; font-weight: 600;">Application Deadline: ${deadline}</p>` : ""}
      </div>

      <p><strong>Need Help?</strong> If you ran into any issues or have questions, we're here to assist:</p>
      <ul style="line-height: 1.6;">
        <li>Technical support: <a href="mailto:${supportEmail}" style="color: #008080;">${supportEmail}</a></li>
        <li>Admissions questions: <a href="mailto:${admissionsEmail}" style="color: #008080;">${admissionsEmail}</a></li>
        <li>Call us: ${phoneNumber}</li>
      </ul>

      <p>We'd love to welcome ${childName} to ${schoolName}! Let us know how we can help.</p>
    `;

    const school = await this.loadSchoolData(schoolName);
    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `We Saved Your Application! Ready to Finish?`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `We Saved Your Application! Ready to Finish?\n\nHi ${parentName},\n\nWe noticed you started an application for ${childName} on ${startedDate}.`;

    await this.sendEmail({
      to: email,
      subject: `We Saved Your Application! Ready to Finish? – ${schoolName}`,
      html,
      text,
    });
  }

  /**
   * Send Admission Offer & Invoice email
   */
  async sendAdmissionOfferEmail(options: AdmissionOfferEmailOptions): Promise<void> {
    const { to, subject, recipientName, schoolName, body, attachments, bankDetails, logoUrl } = options;

    const bankBlock =
      bankDetails && bankDetails.bankName && bankDetails.accountNumber && bankDetails.accountName
        ? `
      <div style="background-color: #f0f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #b2dfdb;">
        <h3 style="color: #008080; margin-top: 0;">Payment details</h3>
        <table role="presentation" width="100%">
          <tr><td style="font-weight: bold; color: #555; padding: 4px 8px;">Bank name:</td><td style="padding: 4px 8px;">${bankDetails.bankName}</td></tr>
          <tr><td style="font-weight: bold; color: #555; padding: 4px 8px;">Account number:</td><td style="padding: 4px 8px;">${bankDetails.accountNumber}</td></tr>
          <tr><td style="font-weight: bold; color: #555; padding: 4px 8px;">Account name:</td><td style="padding: 4px 8px;">${bankDetails.accountName}</td></tr>
        </table>
      </div>
    `
        : "";

    const bodyContent = `
      <p>${body}</p>
      <div style="background-color: #f0f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ccfbf1; margin: 24px 0;">
        <p style="margin: 0; color: #0f766e; font-size: 15px; text-align: center;">
          Please find the formal <strong>Admission Acceptance Letter</strong> and the initial <strong>Invoice</strong> attached to this email as PDFs for your review and records.
        </p>
      </div>
      ${bankBlock}
      <p>If you have any questions, please contact ${schoolName}.</p>
    `;

    const school = await this.loadSchoolData(schoolName);
    const emailHtml = getEmailTemplateHtml({
      recipientName,
      welcomeTitle: subject,
      bodyContent,
      schoolName,
      showSupportHelpBlurb: false,
      logoUrl: logoUrl || school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
      footerPreferenceText: `You received this email from ${schoolName}. If you'd rather not receive this kind of email, you can unsubscribe or manage your email preferences.`,
    });

    const bankText =
      bankDetails && bankDetails.bankName && bankDetails.accountNumber && bankDetails.accountName
        ? `\n\nPayment details:\nBank: ${bankDetails.bankName}\nAccount number: ${bankDetails.accountNumber}\nAccount name: ${bankDetails.accountName}`
        : "";

    await this.sendEmail({
      to,
      subject,
      html: emailHtml,
      text: `${body}\n\nPlease find the formal Admission Acceptance Letter and Invoice attached as PDFs.${bankText}`,
      attachments,
    });
  }

  /**
   * Send Milestone Graded Email to Parent
   */
  async sendMilestoneGradedEmail(options: {
    parentEmail: string;
    parentName: string;
    studentName: string;
    milestoneTitle: string;
    subjectName: string;
    gradeValue?: string;
    score?: number;
    comment?: string;
    teacherName: string;
    schoolName: string;
    subdomain?: string;
  }): Promise<void> {
    const {
      parentEmail,
      parentName,
      studentName,
      milestoneTitle,
      subjectName,
      gradeValue,
      score,
      comment,
      teacherName,
      schoolName,
      subdomain,
    } = options;
    const school = await this.loadSchoolData(schoolName);
    const portalUrl = getSchoolPortalUrl("/parent/children/:id", subdomain);

    // Format the grade display
    let gradeDisplay = "";
    if (score !== undefined && score !== null) {
      gradeDisplay = `<p style="margin: 8px 0;"><strong>Score:</strong> ${score}</p>`;
    }
    if (gradeValue) {
      gradeDisplay += `<p style="margin: 8px 0;"><strong>Grade:</strong> ${gradeValue}</p>`;
    }

    const bodyContent = `
      <p>Great news! ${teacherName} has graded ${studentName}'s milestone in ${subjectName}.</p>
      
      <div style="background-color: #f0f9f9; border: 1px solid #008080; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #008080;">Milestone Details:</h3>
        <p style="margin: 8px 0;"><strong>Milestone:</strong> ${milestoneTitle}</p>
        <p style="margin: 8px 0;"><strong>Subject:</strong> ${subjectName}</p>
        ${gradeDisplay}
        <p style="margin: 8px 0;"><strong>Graded By:</strong> ${teacherName}</p>
      </div>
      
      ${
        comment
          ? `
      <div style="background-color: #fff8e6; border-left: 4px solid #c9a227; padding: 15px; margin: 20px 0;">
        <strong>Teacher's Comment:</strong><br>
        ${comment}
      </div>
      `
          : ""
      }
      
      <p>You can view the full details and track ${studentName}'s progress in your parent portal.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${portalUrl}" style="background-color: #008080; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">View Milestone Details</a>
      </div>
      
      <p>Keep up the great work, ${studentName}!</p>
    `;

    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `${studentName}'s Milestone Has Been Graded! 📚`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `${studentName}'s Milestone Has Been Graded!\n\nHi ${parentName},\n\n${teacherName} has graded ${studentName}'s milestone in ${subjectName}.\n\nMilestone: ${milestoneTitle}\nSubject: ${subjectName}\n${score !== undefined ? `Score: ${score}\n` : ""}${gradeValue ? `Grade: ${gradeValue}\n` : ""}Graded By: ${teacherName}\n${comment ? `\nTeacher's Comment: ${comment}\n` : ""}\nView details: ${portalUrl}`;

    await this.sendEmail({
      to: parentEmail,
      subject: `${studentName}'s Milestone Has Been Graded! 📚 - ${schoolName}`,
      html,
      text,
    });
  }

  /**
   * Send Late Pickup Alert Email to Parent
   */
  async sendLatePickupAlertEmail(options: {
    parentEmail: string;
    parentName: string;
    studentName: string;
    schoolClosingTime: string;
    currentTime: string;
    minutesLate: number;
    schoolName: string;
    schoolPhoneNumber?: string;
  }): Promise<void> {
    const { parentEmail, parentName, studentName, schoolClosingTime, currentTime, minutesLate, schoolName, schoolPhoneNumber } = options;

    const bodyContent = `
      <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #dc2626; margin-top: 0;">⚠️ URGENT: Late Pickup Alert</h2>
        <p style="font-size: 16px; font-weight: 600; color: #991b1b;">
          ${studentName} has not been picked up from school.
        </p>
      </div>
      
      <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #9a3412;">Pickup Details:</h3>
        <p style="margin: 8px 0;"><strong>School Closing Time:</strong> ${schoolClosingTime}</p>
        <p style="margin: 8px 0;"><strong>Current Time:</strong> ${currentTime}</p>
        <p style="margin: 8px 0; color: #dc2626; font-weight: 600;"><strong>Time Late:</strong> ${minutesLate} minutes</p>
      </div>
      
      <p style="font-size: 16px;">Please arrange for ${studentName} to be picked up as soon as possible.</p>
      
      ${
        schoolPhoneNumber
          ? `
      <div style="background-color: #f0f9f9; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px 0;"><strong>Need Assistance?</strong></p>
        <p style="margin: 0; font-size: 18px; color: #008080; font-weight: 600;">
          Call us at ${schoolPhoneNumber}
        </p>
      </div>
      `
          : ""
      }
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        This is an automated alert sent when a student has not been picked up 15 minutes after school closing time.
      </p>
    `;

    const school = await this.loadSchoolData(schoolName);
    const html = getEmailTemplateHtml({
      recipientName: parentName,
      welcomeTitle: `⚠️ URGENT: Late Pickup Alert - ${studentName}`,
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `⚠️ URGENT: Late Pickup Alert\n\nHi ${parentName},\n\n${studentName} has not been picked up from school.\n\nSchool Closing Time: ${schoolClosingTime}\nCurrent Time: ${currentTime}\nTime Late: ${minutesLate} minutes\n\nPlease arrange for ${studentName} to be picked up as soon as possible.\n${schoolPhoneNumber ? `\nCall us at ${schoolPhoneNumber} if you need assistance.` : ""}`;

    await this.sendEmail({
      to: parentEmail,
      subject: `⚠️ URGENT: Late Pickup Alert - ${studentName} - ${schoolName}`,
      html,
      text,
    });
  }

  /**
   * Send new subject added email to parent
   */
  async sendNewSubjectAddedEmail(
    to: string,
    recipientName: string,
    subjectName: string,
    curriculumName: string,
    teacherName: string,
    description: string,
    schoolName: string,
  ): Promise<void> {
    const bodyContent = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #1a73e8;">New Subject Added</h2>
        <p>Dear ${recipientName},</p>
        <p>We're excited to inform you that a new subject has been added to your child's curriculum.</p>
        
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Subject:</strong> ${subjectName}</p>
          <p><strong>Curriculum:</strong> ${curriculumName}</p>
          <p><strong>Assigned Teacher:</strong> ${teacherName}</p>
          <p><strong>Description:</strong> ${description || "No description provided"}</p>
        </div>
        
        <p>Your child will now be able to learn and develop skills in this new area.</p>
        
        <p>If you have any questions, please feel free to contact the school administration.</p>
        
        <p>Best regards,</p>
        <p><strong>${schoolName}</strong></p>
      </div>
    `;

    const school = await this.loadSchoolData(schoolName);
    const html = getEmailTemplateHtml({
      recipientName: recipientName,
      welcomeTitle: "New Subject Added",
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `New Subject Added\n\nDear ${recipientName},\n\nA new subject has been added to your child's curriculum.\n\nSubject: ${subjectName}\nCurriculum: ${curriculumName}\nAssigned Teacher: ${teacherName}\nDescription: ${description || "No description provided"}\n\nBest regards,\n${schoolName}`;

    await this.sendEmail({
      to,
      subject: "New Subject Added to Your Child's Curriculum",
      html,
      text,
    });
  }

  /**
   * Send new subject assigned email to teacher
   */
  async sendNewSubjectAssignedEmail(
    to: string,
    teacherName: string,
    subjectName: string,
    curriculumName: string,
    description: string,
    schoolName: string,
  ): Promise<void> {
    const bodyContent = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #1a73e8;">New Subject Assignment</h2>
        <p>Dear ${teacherName},</p>
        <p>You have been assigned as the teacher for a new subject.</p>
        
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Subject:</strong> ${subjectName}</p>
          <p><strong>Curriculum:</strong> ${curriculumName}</p>
          <p><strong>Description:</strong> ${description || "No description provided"}</p>
        </div>
        
        <p>You can now access this subject in your dashboard to manage classroom activities and student progress.</p>
        
        <p>Best regards,</p>
        <p><strong>${schoolName}</strong></p>
      </div>
    `;

    const school = await this.loadSchoolData(schoolName);
    const html = getEmailTemplateHtml({
      recipientName: teacherName,
      welcomeTitle: "New Subject Assignment",
      bodyContent,
      schoolName,
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const text = `New Subject Assignment\n\nDear ${teacherName},\n\nYou have been assigned as the teacher for a new subject.\n\nSubject: ${subjectName}\nCurriculum: ${curriculumName}\nDescription: ${description || "No description provided"}\n\nBest regards,\n${schoolName}`;

    await this.sendEmail({
      to,
      subject: "New Subject Assignment - " + subjectName,
      html,
      text,
    });
  }

  /**
   * Send notification for a new message in a conversation.
   */
  async sendNewMessageEmail(
    to: string,
    recipientName: string,
    senderName: string,
    messageContent: string,
    conversationUrl: string,
  ): Promise<void> {
    const bodyContent = `
      <p>You have received a new message from <strong>${senderName}</strong>:</p>
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">
          ${messageContent.length > 200 ? messageContent.substring(0, 200) + "..." : messageContent}
        </p>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${conversationUrl}" style="background-color: #008080; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">View Message</a>
      </div>
      <p style="font-size: 14px; color: #666;">
        If you'd like to mute these notifications, you can update your preferences in your account settings.
      </p>
    `;

    const schoolName = "WhitePenguin";
    const school = await this.loadSchoolData(schoolName);
    const html = getEmailTemplateHtml({
      recipientName: recipientName || "there",
      welcomeTitle: `📩 New Message from ${senderName}`,
      bodyContent,
      schoolName: "WhitePenguin",
      logoUrl: school?.schoolLogoUrl,
      brandColor: school?.brandColor,
      schoolAddress: school?.address,
      schoolSocials: {
        facebook: school?.facebook,
        tikTok: school?.tikTok,
        instagram: school?.instagram,
        x: school?.x,
      },
    });

    const subject = `📩 New Message from ${senderName}`;
    const text = `New Message from ${senderName}\n\nHi ${recipientName || "there"},\n\nYou received a new message:\n\n"${messageContent}"\n\nView it here: ${conversationUrl}`;

    await this.sendEmail({ to, subject, html, text });
  }
}

export const emailService = new EmailService();
