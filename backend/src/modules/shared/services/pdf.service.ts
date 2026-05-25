import puppeteer from "puppeteer";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { logger as baseLogger } from "../utils/logger";
import { Invoice } from "../entities/Invoice";
import { BRAND_TEAL, TEXT_DARK, BRAND_WHITE } from "./email-template";

/** Payload for {@link PDFService.generateDailyActivityReportPDF} (parent daily/weekly report). */
export interface LearningPdfRow {
  subjectRowSpan: number;
  subject: string;
  curriculum: string;
  subjectDescription: string;
  subjectSkills: string;
  milestone: string;
  milestonePeriod: string;
  milestoneStatus: string;
  grade: string;
  performance: string;
}

export interface AttendancePdfRow {
  date?: string;
  status: string;
  clockIn: string;
  clockOut: string;
}

export interface DailyActivityPdfModel {
  childFullName: string;
  schoolName: string;
  teacherName: string;
  reportTitle: string;
  dateRangeLabel: string;
  periodLabel: string;
  galleryUrl: string;
  isWeekly: boolean;
  overallDevelopmentPercent: number | null;
  attendanceRows: AttendancePdfRow[];
  learningRows: LearningPdfRow[];
  breakfastTime: string;
  breakfastContents: string;
  amSnackTime: string;
  amSnackContents: string;
  lunchTime: string;
  lunchContents: string;
  pmSnackTime: string;
  pmSnackContents: string;
  dinnerTime: string;
  dinnerContents: string;
  hydrationRows: { time: string; notes: string }[];
  medicationRows: { time: string; name: string; dosage: string; notes: string }[];
  napRows: { start: string; end: string; notes: string }[];
  hygieneRows: { time: string; type: string; notes: string }[];
  photoUrls: string[];
  parentNotesLines: string[];
}

const logger = baseLogger;

export class PDFService {
  private invoiceTemplatePath: string;
  private admissionTemplatePath: string;
  private attendanceReportTemplatePath: string;
  private dailyActivityReportTemplatePath: string;
  private browser: any = null;

  constructor() {
    // Resolve template paths
    this.invoiceTemplatePath = this.resolveTemplatePath("invoice-pdf.template.html");
    this.admissionTemplatePath = this.resolveTemplatePath("admission-acceptance.template.html");
    this.attendanceReportTemplatePath = this.resolveTemplatePath("attendance-report.template.html");
    this.dailyActivityReportTemplatePath = this.resolveTemplatePath("daily-activity-report.template.html");
  }

  private escapeHtml(s: string | undefined | null): string {
    if (s == null) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  private resolveTemplatePath(filename: string): string {
    const distPath = join(__dirname, "../templates", filename);
    if (existsSync(distPath)) return distPath;

    const srcPath = join(process.cwd(), "src/modules/shared/templates", filename);
    if (existsSync(srcPath)) {
      logger.warn(`PDFService: using source template path for ${filename}: ${srcPath}`);
      return srcPath;
    }

    logger.error(`PDFService: template ${filename} not found in dist or src.`);
    return distPath;
  }

  /**
   * Get or create browser instance
   */
  private async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
    return this.browser;
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number, currency: string = "NGN"): string {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
    }).format(amount);
  }

  /**
   * Format date
   */
  private formatDate(date: Date | string): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  private formatPaymentMethod(paymentMethod?: string | null): string {
    if (!paymentMethod) return "";
    return paymentMethod
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  /** Darken a #rgb or #rrggbb hex color for secondary accents (PDF branding). */
  private darkenHexColor(hex: string, factor: number): string {
    const normalized = hex.trim();
    let r: number, g: number, b: number;
    if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
      r = parseInt(normalized[1]! + normalized[1]!, 16);
      g = parseInt(normalized[2]! + normalized[2]!, 16);
      b = parseInt(normalized[3]! + normalized[3]!, 16);
    } else if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
      r = parseInt(normalized.slice(1, 3), 16);
      g = parseInt(normalized.slice(3, 5), 16);
      b = parseInt(normalized.slice(5, 7), 16);
    } else {
      return "#006666";
    }
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    return `#${clamp(r * factor)
      .toString(16)
      .padStart(2, "0")}${clamp(g * factor)
      .toString(16)
      .padStart(2, "0")}${clamp(b * factor)
      .toString(16)
      .padStart(2, "0")}`;
  }

  /** Convert hex to rgba tint with given alpha (0-1). Falls back to BRAND_TEAL tint if invalid. */
  private hexToRgbaTint(hex: string, alpha: number): string {
    const normalized = (hex || "").trim();
    let r: number, g: number, b: number;

    if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
      r = parseInt(normalized[1]! + normalized[1]!, 16);
      g = parseInt(normalized[2]! + normalized[2]!, 16);
      b = parseInt(normalized[3]! + normalized[3]!, 16);
    } else if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
      r = parseInt(normalized.slice(1, 3), 16);
      g = parseInt(normalized.slice(3, 5), 16);
      b = parseInt(normalized.slice(5, 7), 16);
    } else {
      return `rgba(0, 128, 128, ${alpha})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Replace template placeholders with actual data
   */
  private replaceTemplate(template: string, data: Record<string, any>): string {
    let html = template;

    // Replace simple placeholders {{key}} (allowing whitespace)
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (value !== null && value !== undefined) {
        // handles {{ key }} or {{key}}
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
        html = html.replace(regex, String(value));
      }
    });

    // Handle {{#if}} blocks (allowing whitespace)
    const ifRegex = /\{\{#if\s+(\w+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g;
    html = html.replace(ifRegex, (_match, condition, content) => {
      // split by {{else}} with or without whitespace
      const elseRegex = /\{\{\s*else\s*\}\}/;
      const parts = content.split(elseRegex);

      if (parts.length > 1) {
        if (data[condition]) {
          return parts[0];
        }
        return parts[1];
      } else {
        if (data[condition]) {
          return content;
        }
        return "";
      }
    });

    // Handle {{#each}} blocks (allowing whitespace)
    const eachRegex = /\{\{#each\s+(\w+)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g;
    html = html.replace(eachRegex, (_match, arrayKey, content) => {
      const array = data[arrayKey];
      if (Array.isArray(array) && array.length > 0) {
        return array
          .map((item: any) => {
            let itemContent = content;
            Object.keys(item).forEach((key) => {
              const value = item[key];
              if (value !== null && value !== undefined) {
                const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
                itemContent = itemContent.replace(regex, String(value));
              }
            });
            return itemContent;
          })
          .join("");
      }
      return "";
    });

    return html;
  }

  /**
   * Generate PDF from HTML
   */
  async generatePDFFromHTML(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      logger.info(`[PDFService] Generating PDF from HTML (length: ${html.length})`);

      await page.setContent(html, {
        waitUntil: ["load", "networkidle2"],
        timeout: 30000,
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
          top: "12mm",
          right: "12mm",
          bottom: "12mm",
          left: "12mm",
        },
        printBackground: true,
      });

      logger.info("[PDFService] PDF generated successfully.");
      return Buffer.from(pdfBuffer);
    } catch (error) {
      logger.error("Error generating PDF from HTML:", error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate invoice PDF
   * @param bankDetails Optional; same fields as invoice email (selected or school default account).
   */
  async generateInvoicePDF(
    invoice: Invoice,
    school: any,
    bankDetails?: { bankName: string; accountNumber: string; accountName: string } | null,
    payNowUrl?: string,
  ): Promise<Buffer> {
    try {
      const template = readFileSync(this.invoiceTemplatePath, "utf-8");

      const recipient = invoice.parents?.[0]?.user;
      const recipientName = recipient ? `${recipient.firstName} ${recipient.lastName}` : "Valued Client";
      const recipientEmail = recipient?.email || "";
      const recipientPhone = recipient?.phone || "";
      const currency = "NGN";

      const normalizedOverrideNames = ((invoice as any)?.childNamesOverride || [])
        .map((name: string) => (name || "").trim())
        .filter((name: string) => name.length > 0);
      const childNames = normalizedOverrideNames.length > 0
        ? Array.from(new Set(normalizedOverrideNames))
        : (() => {
            const childMap = new Map<number, string>();
            const allInvoiceStudents = [...(invoice.students || []), ...(invoice.student ? [invoice.student] : [])];
            for (const child of allInvoiceStudents) {
              const childId = Number((child as any)?.id);
              if (!childId || childMap.has(childId)) {
                continue;
              }
              const firstName = ((child as any)?.user?.firstName || "").trim();
              const lastName = ((child as any)?.user?.lastName || "").trim();
              const fullName = `${firstName} ${lastName}`.trim();
              childMap.set(childId, fullName || `Student #${childId}`);
            }
            return Array.from(childMap.values());
          })();
      const invoiceKindLabel = String((invoice as any)?.source || "").toLowerCase() === "admission" ? "ADMISSION" : "GENERAL";

      // Determine brand colors from constants
      const primaryColor = BRAND_TEAL;
      const secondaryColor = "#006666";

      const items = (invoice.items || []).map((item) => {
        const rate = Number(item.rate || 0);
        const quantity = Number(item.quantity || 1);
        const total = rate * quantity;
        return {
          description: item.description || "",
          quantity,
          unitPriceFormatted: this.formatCurrency(rate, currency),
          totalAmountFormatted: this.formatCurrency(total, currency),
        };
      });

      const subtotal = Number(invoice.subTotal || 0);
      const discount = Number(invoice.discount || 0);
      const total = Number(invoice.total || 0);

      // Prefer stored invoice tax; if zero/missing, derive from totals to support item-level tax-only mode.
      let taxAmount = Number(invoice.tax || 0);
      if (!taxAmount) {
        taxAmount = total - subtotal + discount;
      }
      if (taxAmount < 0) {
        taxAmount = 0;
      }

      // If all items share the same non-zero tax percentage, show it in label e.g. Tax (5%).
      const itemTaxPercents = (invoice.items || []).map((item) => Number(item.tax || 0));
      const nonZeroPercents = itemTaxPercents.filter((v) => v > 0);
      const uniquePercents = Array.from(new Set(nonZeroPercents));
      const taxLabel = uniquePercents.length === 1 ? `Tax (${uniquePercents[0]}%)` : "Tax";

      const hasBank = bankDetails && bankDetails.bankName && bankDetails.accountNumber && bankDetails.accountName;

      const templateData = {
        schoolName: school.schoolName,
        schoolAddress: school.address || "",
        schoolPhone: school.phoneNumber || "",
        schoolEmail: school.email || "",
        invoiceNumber: invoice.invoiceNumber,
        invoiceStatus: (invoice as any).status || "pending",
        recipientName,
        recipientEmail,
        recipientPhone,
        hasChildNames: childNames.length > 0,
        hasMultipleChildren: childNames.length > 1,
        childNames,
        childNamesLine: childNames.join(", "),
        invoiceDate: this.formatDate(invoice.issueDate),
        dueDate: this.formatDate(invoice.dueDate),
        invoiceKindLabel,
        title: invoice.notes ? `Invoice for ${invoice.invoiceNumber}` : null,
        items,
        subtotalFormatted: this.formatCurrency(subtotal, currency),
        discountAmount: discount > 0 ? discount : null,
        discountAmountFormatted: this.formatCurrency(discount, currency),
        taxAmount: taxAmount > 0 ? taxAmount : null,
        taxLabel,
        taxAmountFormatted: this.formatCurrency(taxAmount, currency),
        totalFormatted: this.formatCurrency(total, currency),
        amountPaid: Number(invoice.amountPaid || 0) > 0 ? invoice.amountPaid : null,
        amountPaidFormatted: this.formatCurrency(Number(invoice.amountPaid || 0), currency),
        amountDueFormatted: this.formatCurrency(Number(invoice.balance || 0), currency),
        notes: invoice.notes || null,
        showBankDetails: !!hasBank,
        paymentMethod: this.formatPaymentMethod((invoice as any).paymentMethod),
        paymentMethodRow: this.formatPaymentMethod((invoice as any).paymentMethod)
          ? `<p><strong>Payment method:</strong> ${this.formatPaymentMethod((invoice as any).paymentMethod)}</p>`
          : `<p><strong>Payment method:</strong> Bank Transfer</p>`,
        paymentBankName: hasBank && bankDetails ? bankDetails.bankName : "",
        paymentAccountNumber: hasBank && bankDetails ? bankDetails.accountNumber : "",
        paymentAccountName: hasBank && bankDetails ? bankDetails.accountName : "",
        showPayNowButton: !!payNowUrl,
        payNowUrl: payNowUrl || "",
        currentYear: new Date().getFullYear(),
        primaryColor,
        secondaryColor,
        brandWhite: BRAND_WHITE,
        textDark: TEXT_DARK,
        schoolLogoUrl: school.schoolLogoUrl || null,
      };

      const html = this.replaceTemplate(template, templateData);
      return await this.generatePDFFromHTML(html);
    } catch (error) {
      logger.error("Error generating invoice PDF:", error);
      throw error;
    }
  }

  /**
   * Generate Admission Acceptance Letter PDF
   */
  async generateAdmissionAcceptanceLetterPDF(data: {
    school: any;
    studentName: string;
    parentName: string;
    className: string;
    dueDate: string | Date;
    gender?: string;
  }): Promise<Buffer> {
    try {
      const template = readFileSync(this.admissionTemplatePath, "utf-8");

      const primaryColor = BRAND_TEAL;
      const secondaryColor = "#006666";

      const templateData = {
        schoolName: data.school.schoolName,
        schoolMotto: data.school.schoolMotto || null,
        schoolAddress: data.school.address || "",
        schoolPhone: data.school.phoneNumber || "",
        schoolEmail: data.school.email || "",
        currentDate: this.formatDate(new Date()),
        parentName: data.parentName,
        studentName: data.studentName,
        className: data.className,
        dueDate: this.formatDate(data.dueDate),
        primaryColor,
        secondaryColor,
        brandWhite: BRAND_WHITE,
        textDark: TEXT_DARK,
        schoolLogoUrl: data.school.schoolLogoUrl || null,
        currentYear: new Date().getFullYear(),
      };

      const html = this.replaceTemplate(template, templateData);
      return await this.generatePDFFromHTML(html);
    } catch (error) {
      logger.error("Error generating admission acceptance letter PDF:", error);
      throw error;
    }
  }

  /**
   * Generate Attendance Report PDF
   */
  async generateAttendanceReportPDF(data: {
    school: {
      schoolName: string;
      address?: string;
      phoneNumber?: string;
      email?: string;
      schoolLogoUrl?: string | null;
      brandColor?: string | null;
    };
    subjectType: "children" | "teachers";
    startDate: string;
    endDate: string;
    overallAttendanceRate: number;
    mostPresentClass?: { className: string; rate: number };
    mostPresentStaff?: { staffName: string; rate: number };
    highestAbsenteeClass?: { className: string; rate: number };
    highestAbsenteeStaff?: { staffName: string; rate: number };
    latenessRate: number;
    attendanceTrend: { xAxis: string[]; present: number[]; absent: number[]; late: number[] };
  }): Promise<Buffer> {
    try {
      const template = readFileSync(this.attendanceReportTemplatePath, "utf-8");

      const rawBrand = data.school.brandColor?.trim();
      const primaryColor = rawBrand && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(rawBrand) ? rawBrand : BRAND_TEAL;
      const secondaryColor = primaryColor.toLowerCase() === BRAND_TEAL.toLowerCase() ? "#006666" : this.darkenHexColor(primaryColor, 0.72);

      // Light brand surface tint for cards and table headers (alpha 0.08)
      const brandSurfaceTint = this.hexToRgbaTint(primaryColor, 0.08);

      const isChildren = data.subjectType === "children";
      const mostPresentLabel = isChildren ? "Most Present Class" : "Most Present Staff";
      const highestAbsenteeLabel = isChildren ? "Highest Absentee Class" : "Highest Absentee Staff";

      const mostPresent = isChildren ? data.mostPresentClass : data.mostPresentStaff;
      const highestAbsentee = isChildren ? data.highestAbsenteeClass : data.highestAbsenteeStaff;

      const mostPresentName = mostPresent
        ? isChildren
          ? (mostPresent as { className: string }).className
          : (mostPresent as { staffName: string }).staffName
        : "N/A";
      const mostPresentRate = mostPresent ? mostPresent.rate.toFixed(2) : "0";
      const highestAbsenteeName = highestAbsentee
        ? isChildren
          ? (highestAbsentee as { className: string }).className
          : (highestAbsentee as { staffName: string }).staffName
        : "N/A";
      const highestAbsenteeRate = highestAbsentee ? highestAbsentee.rate.toFixed(2) : "0";

      const trendRows = (data.attendanceTrend?.xAxis || []).map((period, i) => ({
        period,
        present: (data.attendanceTrend.present?.[i] ?? 0).toString(),
        absent: (data.attendanceTrend.absent?.[i] ?? 0).toString(),
        late: (data.attendanceTrend.late?.[i] ?? 0).toString(),
      }));

      const reportTitle = isChildren ? "Attendance Report - Children" : "Attendance Report - Teachers";
      const dateRange = `${this.formatDate(data.startDate)} to ${this.formatDate(data.endDate)}`;

      const templateData = {
        schoolName: data.school.schoolName || "School",
        schoolAddress: data.school.address || "",
        schoolPhone: data.school.phoneNumber || "",
        schoolEmail: data.school.email || "",
        schoolLogoUrl: data.school.schoolLogoUrl || null,
        reportTitle,
        dateRange,
        generatedDate: this.formatDate(new Date()),
        overallAttendanceRate: data.overallAttendanceRate.toFixed(2),
        mostPresentLabel,
        mostPresentName,
        mostPresentRate,
        highestAbsenteeLabel,
        highestAbsenteeName,
        highestAbsenteeRate,
        latenessRate: data.latenessRate.toFixed(2),
        hasTrendData: trendRows.length > 0,
        trendRows,
        primaryColor,
        secondaryColor,
        brandWhite: BRAND_WHITE,
        textDark: TEXT_DARK,
        currentYear: new Date().getFullYear(),
        brandSurfaceTint,
      };

      const html = this.replaceTemplate(template, templateData);
      return await this.generatePDFFromHTML(html);
    } catch (error) {
      logger.error("Error generating attendance report PDF:", error);
      throw error;
    }
  }

  /**
   * Daily / weekly child activity report for parents (checkout email attachment).
   */
  async generateDailyActivityReportPDF(data: {
    school: {
      schoolName?: string;
      schoolLogoUrl?: string | null;
      brandColor?: string | null;
    };
    model: DailyActivityPdfModel;
  }): Promise<Buffer> {
    try {
      const template = readFileSync(this.dailyActivityReportTemplatePath, "utf-8");
      const m = data.model;
      const schoolName = data.school.schoolName || "School";

      const rawBrand = data.school.brandColor?.trim();
      const primaryColor = rawBrand && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(rawBrand) ? rawBrand : BRAND_TEAL;
      const secondaryColor = "#006666";

      // Light brand surface tint for table headers (alpha 0.08)
      const tableHeaderBg = this.hexToRgbaTint(primaryColor, 0.08);

      const dash = (v: string | undefined) => (v && v.trim() ? v.trim() : "—");

      const nutritionTableBody = (
        [
          ["Breakfast", m.breakfastTime, m.breakfastContents],
          ["AM snack", m.amSnackTime, m.amSnackContents],
          ["Lunch", m.lunchTime, m.lunchContents],
          ["PM snack", m.pmSnackTime, m.pmSnackContents],
          ["Dinner", m.dinnerTime, m.dinnerContents],
        ] as [string, string, string][]
      )
        .map(
          ([label, time, contents]) =>
            `<tr><td>${this.escapeHtml(label)}</td><td>${this.escapeHtml(dash(time))}</td><td>${this.escapeHtml(dash(contents))}</td></tr>`,
        )
        .join("");

      const hydrationTableBody =
        m.hydrationRows.length > 0
          ? m.hydrationRows
              .map((r) => `<tr><td>${this.escapeHtml(dash(r.time))}</td><td>${this.escapeHtml(dash(r.notes))}</td></tr>`)
              .join("")
          : `<tr><td colspan="2" class="muted">None recorded</td></tr>`;

      const medicationTableBody =
        m.medicationRows.length > 0
          ? m.medicationRows
              .map(
                (r) =>
                  `<tr><td>${this.escapeHtml(dash(r.name))}</td><td>${this.escapeHtml(dash(r.time))}</td><td>${this.escapeHtml(dash(r.dosage))}</td><td>${this.escapeHtml(dash(r.notes))}</td></tr>`,
              )
              .join("")
          : `<tr><td colspan="4" class="muted">None recorded</td></tr>`;

      const napTableBody =
        m.napRows.length > 0
          ? m.napRows
              .map(
                (r) =>
                  `<tr><td>${this.escapeHtml(dash(r.start))} — ${this.escapeHtml(dash(r.end))}</td><td>${this.escapeHtml(dash(r.notes))}</td></tr>`,
              )
              .join("")
          : `<tr><td colspan="2" class="muted">None recorded</td></tr>`;

      const hygieneTableBody =
        m.hygieneRows.length > 0
          ? m.hygieneRows
              .map(
                (r) =>
                  `<tr><td>${this.escapeHtml(dash(r.type))}</td><td>${this.escapeHtml(dash(r.time))}</td><td>${this.escapeHtml(dash(r.notes))}</td></tr>`,
              )
              .join("")
          : `<tr><td colspan="3" class="muted">None recorded</td></tr>`;

      const attendanceColCount = m.isWeekly ? 4 : 3;
      const attendanceTableBody =
        m.attendanceRows.length > 0
          ? m.attendanceRows
              .map((r) => {
                const dateCell = m.isWeekly
                  ? `<td>${this.escapeHtml(dash(r.date))}</td>`
                  : "";
                return `<tr>${dateCell}<td>${this.escapeHtml(dash(r.status))}</td><td>${this.escapeHtml(dash(r.clockIn))}</td><td>${this.escapeHtml(dash(r.clockOut))}</td></tr>`;
              })
              .join("")
          : `<tr><td colspan="${attendanceColCount}" class="muted">None recorded</td></tr>`;

      const learningTableBody =
        m.learningRows.length > 0
          ? m.learningRows
              .map((r) => {
                const subjectCells =
                  r.subjectRowSpan > 0
                    ? `<td rowspan="${r.subjectRowSpan}">${this.escapeHtml(dash(r.subject))}</td>` +
                      `<td rowspan="${r.subjectRowSpan}">${this.escapeHtml(dash(r.curriculum))}</td>` +
                      `<td rowspan="${r.subjectRowSpan}">${this.escapeHtml(dash(r.subjectDescription))}</td>` +
                      `<td rowspan="${r.subjectRowSpan}">${this.escapeHtml(dash(r.subjectSkills))}</td>`
                    : "";
                return (
                  `<tr>${subjectCells}` +
                  `<td>${this.escapeHtml(dash(r.milestone))}</td>` +
                  `<td>${this.escapeHtml(dash(r.milestonePeriod))}</td>` +
                  `<td>${this.escapeHtml(dash(r.milestoneStatus))}</td>` +
                  `<td>${this.escapeHtml(dash(r.grade))}</td>` +
                  `<td>${this.escapeHtml(dash(r.performance))}</td></tr>`
                );
              })
              .join("")
          : `<tr><td colspan="9" class="muted">None recorded</td></tr>`;

      const learningSummaryLine =
        m.overallDevelopmentPercent != null
          ? `Overall development: ${m.overallDevelopmentPercent}%`
          : "";

      const photosSection =
        m.photoUrls.length > 0
          ? `<div class="photos-grid">${m.photoUrls.map((u) => `<div class="photo-item"><img src="${this.escapeHtml(u)}" alt="Activity Photo" onerror="this.parentNode.innerHTML='<div class=\\'placeholder\\'>Image: '+this.src.split('/').pop()+'</div>'" /></div>`).join("")}</div>`
          : `<p class="muted">None recorded</p>`;

      const parentNotesSection = m.parentNotesLines.length > 0 ? this.escapeHtml(m.parentNotesLines.join("\n\n")) : "None recorded";

      const galleryHint = m.galleryUrl ? this.escapeHtml(`You can also view photos and updates in the parent portal: ${m.galleryUrl}`) : "";

      const templateData: Record<string, any> = {
        primaryColor,
        secondaryColor,
        brandWhite: BRAND_WHITE,
        textDark: TEXT_DARK,
        schoolName: this.escapeHtml(schoolName),
        schoolLogoUrl: data.school.schoolLogoUrl || null,
        reportTitle: this.escapeHtml(m.reportTitle),
        childFullName: this.escapeHtml(m.childFullName),
        dateRangeLabel: this.escapeHtml(m.dateRangeLabel),
        teacherName: this.escapeHtml(m.teacherName),
        isWeekly: m.isWeekly,
        learningSummaryLine: this.escapeHtml(learningSummaryLine),
        attendanceTableBody,
        learningTableBody,
        nutritionTableBody,
        hydrationTableBody,
        medicationTableBody,
        napTableBody,
        hygieneTableBody,
        photosSection,
        parentNotesSection,
        galleryHint,
        generatedDate: this.formatDate(new Date()),
        currentYear: new Date().getFullYear(),
        tableHeaderBg,
      };

      const html = this.replaceTemplate(template, templateData);
      return await this.generatePDFFromHTML(html);
    } catch (error) {
      logger.error("Error generating daily activity report PDF:", error);
      throw error;
    }
  }
}

export const pdfService = new PDFService();
