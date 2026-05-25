import { getFrontendBaseUrl, getSchoolPortalUrl, joinFrontendUrl } from "../utils";

describe("getFrontendBaseUrl / joinFrontendUrl", () => {
  const orig = process.env["FRONTEND_URL"];

  afterEach(() => {
    if (orig === undefined) {
      delete process.env["FRONTEND_URL"];
    } else {
      process.env["FRONTEND_URL"] = orig;
    }
  });

  it("strips trailing slashes from FRONTEND_URL", () => {
    process.env["FRONTEND_URL"] = "https://app.example.com/";
    expect(getFrontendBaseUrl()).toBe("https://app.example.com");
    process.env["FRONTEND_URL"] = "https://app.example.com///";
    expect(getFrontendBaseUrl()).toBe("https://app.example.com");
  });

  it("joinFrontendUrl avoids double slash when env has trailing slash", () => {
    process.env["FRONTEND_URL"] = "https://app.example.com/";
    expect(joinFrontendUrl("auth/login?role=admin")).toBe("https://app.example.com/auth/login?role=admin");
    expect(joinFrontendUrl("/preferences")).toBe("https://app.example.com/preferences");
  });

  it("getSchoolPortalUrl strips app. before school subdomain (no // before path)", () => {
    process.env["FRONTEND_URL"] = "https://app.whitepenguin.heimdallprodev.com/";
    const portalUrl = getSchoolPortalUrl("/admin/dashboard", "jazschool");
    expect(portalUrl).toBe("https://jazschool.whitepenguin.heimdallprodev.com/admin/dashboard");
    expect(portalUrl).not.toContain("jazschool.app.");
    expect(portalUrl).not.toMatch(/\.com\/\/admin/);
  });

  it("getSchoolPortalUrl does not duplicate slash before path", () => {
    process.env["FRONTEND_URL"] = "https://app.example.com/";
    expect(getSchoolPortalUrl("/parent/dashboard")).toBe("https://app.example.com/parent/dashboard");
  });
});
