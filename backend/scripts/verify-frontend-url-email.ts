/**
 * Sends one welcome-style email to verify portal URLs have no double slashes
 * when FRONTEND_URL ends with a trailing slash.
 *
 * Usage:
 *   npx ts-node scripts/verify-frontend-url-email.ts you@example.com
 * Or set VERIFY_URL_FIX_EMAIL in .env
 */
import "dotenv/config";
import { emailService } from "../src/modules/shared/services/email.service";
import { getFrontendBaseUrl, getSchoolPortalUrl, joinFrontendUrl } from "../src/modules/shared/services/utils";

async function main(): Promise<void> {
  const to = process.argv[2]?.trim() || process.env["VERIFY_URL_FIX_EMAIL"]?.trim();
  if (!to) {
    console.error(
      "Missing recipient. Pass email as first argument or set VERIFY_URL_FIX_EMAIL in .env\n" +
        "Example: npx ts-node scripts/verify-frontend-url-email.ts you@example.com"
    );
    process.exit(1);
  }

  const rawFrontend = (process.env["FRONTEND_URL"] || "").trim();
  const subDomain = "url-fix-verify";
  const portalUrl = getSchoolPortalUrl("/admin/dashboard", subDomain);

  const samples = {
    FRONTEND_URL_raw: rawFrontend || "(unset)",
    getFrontendBaseUrl: getFrontendBaseUrl(),
    joinFrontendUrl_auth: joinFrontendUrl("auth/login?role=admin"),
    portalUrl_via_getSchoolPortalUrl: portalUrl,
  };

  console.log("URL samples (tenant host should not be school.app.... — app. is stripped before school subdomain):");
  console.log(JSON.stringify(samples, null, 2));

  await emailService.sendWelcomeEmail(
    to,
    "URL fix verification",
    "Test School",
    undefined,
    portalUrl
  );

  console.log(`\nSent welcome email (with tenant portal URL) to ${to}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
