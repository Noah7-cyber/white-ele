import { studentAdminReportQuerySchema, staffAdminReportQuerySchema } from "../validations/analytics.validation";

describe("admin report validation schemas", () => {
  it("exports non-empty student and staff query schemas", () => {
    expect(studentAdminReportQuerySchema.length).toBeGreaterThan(0);
    expect(staffAdminReportQuerySchema.length).toBeGreaterThan(0);
  });
});
