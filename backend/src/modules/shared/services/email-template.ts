import { joinFrontendUrl } from "./utils";

const SUPPORT_URL = `${process.env['SUPPORT_URL']}/help` || "https://whitepenguin.co/help";

const PREFERENCES_URL = process.env["FRONTEND_URL"] ? joinFrontendUrl("preferences") : "#";

const DEFAULT_LOGO_URL = process.env["LOGO_URL"] || "https://storage.googleapis.com/zippypay-test.appspot.com/uploads/1771240177762_6d99a329d2907c52.png"
const DEFAULT_LOGO_WHITE_URL = process.env["LOGO_WHITE_URL"] || "https://storage.googleapis.com/zippypay-test.appspot.com/uploads/1771240083360_edf5e051f1383602.png"

// TODO: Use environment variables to set the logo URLs
const EMAIL_LOGO_URL = DEFAULT_LOGO_URL;
// process.env["LOGO_URL"] || DEFAULT_LOGO_URL; 
// (API_BASE_URL ? `${API_BASE_URL}/images/whitepenguin-logo.png` : "") ||
// DEFAULT_LOGO_URL;

const EMAIL_LOGO_FOOTER_URL = DEFAULT_LOGO_WHITE_URL;
// process.env["LOGO_WHITE_URL"] ||;
// (API_BASE_URL ? `${API_BASE_URL}/images/logo-white.svg` : "") ||
// DEFAULT_LOGO_WHITE_URL ||
// EMAIL_LOGO_URL;

export const BRAND_TEAL = "#008080";
export const BRAND_WHITE = "#ffffff";
export const TEXT_DARK = "#333333";
export const BODY_LINK_COLOR = BRAND_TEAL;
export const FOOTER_BG = BRAND_TEAL;
export const FOOTER_TEXT_COLOR = BRAND_WHITE;
export const OFF_WHITE = "#f8f9fa";

const LOGO_HTML = (logoUrl?: string, schoolName: string = "the School", accentColor: string = BRAND_TEAL) => logoUrl
  ? `<img src="${logoUrl}" alt="${schoolName}" height="40" style="display:block;height:40px;width:auto;" />`
  : `<span style="font-size:24px; font-weight:700; color:${accentColor};">${schoolName}</span>`;

/** White filled icons for colored footer (email-safe PNG, Icons8 ios-filled). */
const FOOTER_SOCIAL_ICON = (slug: string, alt: string) =>
  `<img src="https://img.icons8.com/ios-filled/28/ffffff/${slug}.png" width="28" height="28" alt="${alt}" style="display:block;border:0;outline:none;text-decoration:none;" />`;

const FOOTER_SOCIAL_LINK = (href: string, slug: string, alt: string) =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:0 10px;text-decoration:none;line-height:0;">${FOOTER_SOCIAL_ICON(slug, alt)}</a>`;

/**
 * Returns HTML for a 6-digit code with boxes (matches Figma email template).
 */
export function getOtpBoxesHtml(code: string): string {
  const digits = (code || "").replace(/\D/g, "").slice(0, 6).split("");
  if (digits.length === 0) return "";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
      <tr>
        ${digits
      .map(
        (d) =>
          `<td style="padding-right:8px;"><div style="border: 1px solid #E0E0E0; border-radius: 8px; width: 48px; height: 56px; line-height: 56px; text-align:center; font-weight: 600; font-size: 24px; color: ${TEXT_DARK};">${d}</div></td>`
      )
      .join("")}
      </tr>
    </table>`;
}

export interface EmailTemplateOptions {
  recipientName: string;
  welcomeTitle?: string;
  bodyContent: string;
  /** When false, hides the WhitePenguin support paragraph (reply / support@ / Help link). Default true. */
  showSupportHelpBlurb?: boolean;
  showNumberedSteps?: boolean;
  verificationCode?: string;
  footerPreferenceText?: string;
  schoolName?: string;
  logoUrl?: string;
  brandColor?: string;
  schoolAddress?: string;
  schoolSocials?: {
    facebook?: string;
    tikTok?: string;
    instagram?: string;
    x?: string;
  };
}

function buildFooterSocialRow(schoolSocials?: EmailTemplateOptions["schoolSocials"]): string {
  if (schoolSocials) {
    const parts: string[] = [];
    if (schoolSocials.instagram) {
      parts.push(FOOTER_SOCIAL_LINK(schoolSocials.instagram, "instagram-new", "Instagram"));
    }
    if (schoolSocials.tikTok) {
      parts.push(FOOTER_SOCIAL_LINK(schoolSocials.tikTok, "tiktok", "TikTok"));
    }
    if (schoolSocials.facebook) {
      parts.push(FOOTER_SOCIAL_LINK(schoolSocials.facebook, "facebook-new", "Facebook"));
    }
    if (schoolSocials.x) {
      parts.push(FOOTER_SOCIAL_LINK(schoolSocials.x, "twitterx", "X"));
    }
    return parts.join("");
  }
  return [
    FOOTER_SOCIAL_LINK("https://www.instagram.com/whitepenguinofficial?igsh=YjBycHZwZ3plMzN4", "instagram-new", "Instagram"),
    FOOTER_SOCIAL_LINK("https://www.linkedin.com/company/107738029", "linkedin", "LinkedIn"),
    FOOTER_SOCIAL_LINK("https://www.tiktok.com/@therealwhitepenguin", "tiktok", "TikTok"),
    FOOTER_SOCIAL_LINK("https://www.facebook.com/profile.php?id=61579076353491", "facebook-new", "Facebook"),
  ].join("");
}

export function getEmailTemplateHtml(options: EmailTemplateOptions): string {
  const {
    recipientName,
    welcomeTitle = "Welcome! 👋",
    bodyContent,
    showNumberedSteps = false,
    verificationCode,
    footerPreferenceText,
    logoUrl,
  } = options;

  const showSupportHelpBlurb = options.showSupportHelpBlurb !== false;

  const schoolName = options.schoolName ?? "WhitePenguin";
  const finalLogoUrl = logoUrl || EMAIL_LOGO_URL;
  const footerLogoUrl = logoUrl || EMAIL_LOGO_FOOTER_URL;

  // Use school brand color when provided; fallback to default teal for platform emails
  const isValidColor = (c?: string) => c && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c.trim());
  const accentColor = isValidColor(options.brandColor) ? options.brandColor!.trim() : BRAND_TEAL;

  // Replace hardcoded teal in bodyContent with brand color (boxes, buttons, links, borders)
  const brandedBodyContent = bodyContent
    .replace(/#008080/g, accentColor)
    .replace(/#0d5c5c/g, accentColor);

  const preferenceText = footerPreferenceText ??
    `You received this email from ${schoolName}. If you'd rather not receive this kind of email, you can <a href="#" style="color: ${FOOTER_TEXT_COLOR}; text-decoration:underline;">unsubscribe</a> or <a href="${PREFERENCES_URL}" style="color: ${FOOTER_TEXT_COLOR}; text-decoration:underline;">manage your email preferences</a>.`;

  const numberedStepsHtml = showNumberedSteps
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        ${[1, 2, 3, 4, 5, 6]
      .map(
        (n) =>
          `<td style="padding-right:8px;"><div style="border: 1px solid #E0E0E0; border-radius: 4px; width: 40px; height: 40px; line-height: 40px; text-align:center; font-weight: 400; font-size: 18px; color: ${TEXT_DARK};">${n}</div></td>`
      )
      .join("")}
      </tr>
    </table>`
    : "";

  const verificationCodeHtml = verificationCode ? getOtpBoxesHtml(verificationCode) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhitePenguin</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; font-family: 'Inter', Arial, Helvetica, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    @media only screen and (max-width: 600px) {
      .wrapper { width: 100% !important; }
      .content-cell { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#F9FAFB; color: ${TEXT_DARK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB; padding: 40px 0;">
    <tr>
      <td align="center">
        <div class="wrapper" style="border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <!-- Header -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="content-cell" style="padding: 32px 32px 24px 32px;">
                ${LOGO_HTML(finalLogoUrl, schoolName, accentColor)}
              </td>
            </tr>
          </table>
          <!-- Main Content -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="content-cell" style="padding: 0 32px 32px 32px; font-size: 16px; line-height: 1.6;">
                <p style="margin: 0 0 24px 0;">Hi ${recipientName},</p>
                <p style="margin: 0 0 24px 0; font-weight: 600;">${welcomeTitle}</p>
                <div style="margin-bottom: 24px;">
                  ${brandedBodyContent}
                </div>
                ${verificationCodeHtml}
                ${numberedStepsHtml}
                
                ${
                  showSupportHelpBlurb
                    ? `<p style="margin: 24px 0 24px 0; font-size: 14px;">
                  Need help? Our team is always here for you. Just reply to this email, contact <a href="mailto:support@whitepenguin.co" style="color: ${accentColor}; font-weight: 600; text-decoration: none;">support@whitepenguin.co</a>, or visit our 
                  <a href="${SUPPORT_URL}" style="color: ${accentColor}; font-weight: 600; text-decoration: none;">Support Center/FAQs</a>.
                </p>
                `
                    : ""
                }
                <p style="margin: 24px 0 0 0;">
                  Warm regards,<br>
                  <span style="font-weight: 600;">— The ${schoolName} Team</span>
                </p>
              </td>
            </tr>
          </table>
          
          <!-- Footer -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${accentColor}; color: ${BRAND_WHITE};">
            <tr>
              <td class="content-cell" style="padding: 32px;">
                <p style="margin: 0 auto 24px auto; font-size: 12px; line-height: 1.6; color: ${BRAND_WHITE}; text-align: center; max-width: 520px;">
                  ${preferenceText}
                </p>
                <p style="margin: 0 auto 24px auto; font-size: 12px; font-weight: 600; color: ${OFF_WHITE}; text-shadow: 1px 1px 2px rgba(0,0,0,0.2); text-align: center; line-height: 1.5; max-width: 520px;">
                  ${options.schoolAddress || "WhitePenguin EridanSpace, The Philippi Centre, Oluwalogbon House, Plot A Obafemi Awolowo Wy, Alausa, Ikeja, Nigeria"}
                </p>
                
                <!-- Divider (Figma matching white bar) -->
                <div style="height: 12px; background-color: #ffffff; margin-bottom: 24px; width: 100%;"></div>
                
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: middle;">
                      ${footerLogoUrl ? `<img src="${footerLogoUrl}" alt="${schoolName}" height="32" style="display:block;height:32px;width:auto;" />` : `<span style="color:white; font-weight:700;">${schoolName}</span>`}
                    </td>
                    <td align="right" style="vertical-align: middle;">
                      ${buildFooterSocialRow(options.schoolSocials)}
                    </td>
                  </tr>
                </table>
                
                <p style="margin: 24px 0 0 0; font-size: 12px; color: ${BRAND_WHITE}; opacity: 0.8; text-align: center;">
                  ©Powered by WhitePenguin. 2026
                </p>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
