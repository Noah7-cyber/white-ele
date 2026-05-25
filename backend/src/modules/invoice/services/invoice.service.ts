import { AppDataSource } from "../../core/config/database";
import { Invoice } from "../../shared/entities/Invoice";
import { Student } from "../../shared/entities/StudentEntity";
import { Classroom } from "../../shared/entities/Classroom";
import { InvoiceNumber } from "../../shared/entities/InvoiceNumber";
import { School } from "../../shared/entities/School";
import { InvoiceActivity } from "../../shared/entities/InvoiceActivity";
import { ActivityLog } from "../../shared/entities/ActivityLog";
import {
  ActivityLogPriority,
  InvoiceActivityType,
  BillingPeriod,
  InvoiceStatus,
  PaymentMethod,
  InvoiceSource,
  BookingStatus,
  FormResponseStatus,
} from "../../shared/entities/EntityEnums";
import { TourBooking } from "../../shared/entities/TourBooking";
import { FormResponse } from "../../shared/entities/FormResponse";
import { Repository } from "typeorm";
import { logger } from "../../shared";
import { emailService } from "../../shared";
import { itemService } from "../../item/services/item.service";
import { notificationService } from "../../notification";
import { NotificationType } from "../../shared/entities/Notification";
import { Item } from "../../shared/entities/Item";
import { InvoicePayment } from "../../shared/entities/InvoicePayment";
import { InvoiceType } from "../../shared/entities/EntityEnums";
import { pdfService } from "../../shared/services/pdf.service";
import { BankAccount } from "../../shared/entities/BankAccount";
import { invoicePaymentGatewayService } from "./invoice-payment-gateway.service";
interface CreateInvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount?: number;
  tax?: number; // Tax percentage (0-100)
  vat?: number; // VAT percentage alias (0-100)
}

interface CreateInvoiceData {
  invoiceNumber?: string;
  classroomId: number;
  invoiceType?: InvoiceType;
  studentId: number;
  notes?: string;
  issueDate: Date | string;
  dueDate: Date | string;
  amountPaid: number;
  billingPeriod?: string;
  paymentMethod?: PaymentMethod;
  items: CreateInvoiceItem[];
  schoolId: number;
  discount?: number;
  additionalEmails?: string[];
  bankAccountId?: number;
  /** Optional email customization (not persisted); mirrors send-offer `email.subject` / `email.body`. */
  email?: { subject?: string; body?: string };
  // subtotal, balance, total, discount, and tax are calculated in the backend (not accepted from payload)
}

interface UpdateInvoiceData {
  notes?: string;
  issueDate?: Date | string;
  dueDate?: Date | string;
  amountPaid?: number;
  invoiceType?: InvoiceType;
  billingPeriod?: string;
  paymentMethod?: PaymentMethod;
  items?: CreateInvoiceItem[];
  classroomId?: number;
  studentId?: number;
}

export interface RecordPaymentData {
  amountPaid?: number;
  paymentMethod: PaymentMethod;
  paymentDate?: Date | string;
}

class InvoiceService {
  private get invoiceRepository(): Repository<Invoice> {
    return AppDataSource.getRepository(Invoice);
  }

  private get invoiceNumberRepository(): Repository<InvoiceNumber> {
    return AppDataSource.getRepository(InvoiceNumber);
  }

  private getItemTaxPercent(item: { tax?: number; vat?: number }): number {
    const percent = item.tax ?? item.vat ?? 0;
    return Number.isFinite(percent) ? Number(percent) : 0;
  }

  /**
   * Generates an invoice summary without saving to database
   * Returns calculated values: subtotal, discount, tax, total, and balance
   */
  async generateInvoiceSummary(data: Omit<CreateInvoiceData, "schoolId">): Promise<{
    invoiceNumber?: string;
    classroomId: number;
    studentId: number;
    notes?: string;
    issueDate: Date | string;
    dueDate: Date | string;
    items: CreateInvoiceItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    amountPaid: number;
    balance: number;
    invoiceType?: InvoiceType;
    billingPeriod?: BillingPeriod;
  }> {
    // Generate invoice number if not provided (for summary, we don't increment the counter)
    let invoiceNumber = data.invoiceNumber;
    if (!invoiceNumber) {
      // For summary, we can use a placeholder or get current number without incrementing
      const currentNumber = await this.getCurrentInvoiceNumber();
      invoiceNumber = currentNumber; // Use current number for preview
    }

    // Calculate subtotal from items (sum of quantity * rate for all items)
    const subtotal = data.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.rate;
      return sum + itemTotal;
    }, 0);

    // Calculate tax from items (sum of tax amount from each item)
    // Tax amount per item = (rate * quantity) * (tax_percentage / 100)
    const tax = data.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.rate;
      const itemTaxPercentage = this.getItemTaxPercent(item);
      const itemTaxAmount = itemTotal * (itemTaxPercentage / 100);
      return sum + itemTaxAmount;
    }, 0);

    // Calculate discount (TODO: Implement calculation formulas in the future)
    // For now, set to 0
    const discount = data.discount || 0;

    // Calculate total: subtotal + tax - discount
    const total = subtotal + tax - discount;

    // Calculate balance: total - amountPaid
    const balance = total - data.amountPaid;

    return {
      invoiceNumber,
      classroomId: data.classroomId,
      studentId: data.studentId,
      notes: data.notes,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      items: data.items,
      subtotal,
      discount,
      tax,
      total,
      amountPaid: data.amountPaid,
      balance,
      invoiceType: data.invoiceType || (data.billingPeriod ? InvoiceType.RECURRING : InvoiceType.ONE_TIME),
      billingPeriod: data.billingPeriod as BillingPeriod,
    };
  }

  /**
   * Creates a new invoice with items
   * Computes subtotal, discount, tax, total, and balance in the backend
   */
  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate student exists and belongs to the school, and load parents with users
      const student = await queryRunner.manager.findOne(Student, {
        where: { id: data.studentId },
        relations: ["parents", "parents.user", "user"],
      });

      if (!student) {
        throw new Error(`Student with ID ${data.studentId} not found`);
      }

      if (student.schoolId !== data.schoolId) {
        throw new Error("Student does not belong to your school");
      }

      // Get school details for email
      const school = await queryRunner.manager.findOne(School, {
        where: { id: data.schoolId },
      });

      // Validate classroom exists and belongs to the school
      const classroom = await queryRunner.manager.findOne(Classroom, {
        where: { id: data.classroomId },
      });

      if (!classroom) {
        throw new Error(`Classroom with ID ${data.classroomId} not found`);
      }

      if (classroom.schoolId !== data.schoolId) {
        throw new Error("Classroom does not belong to your school");
      }

      // Generate invoice number if not provided, or validate uniqueness if provided
      let invoiceNumber = data.invoiceNumber;
      if (!invoiceNumber) {
        // Auto-generate: guaranteed unique
        invoiceNumber = await this.generateInvoiceNumber();
      } else {
        // If manually provided, validate:
        // 1. Check format (must match INV-XXXXXX pattern)
        const providedMatch = invoiceNumber.match(/^INV-(\d+)$/);
        if (!providedMatch || !providedMatch[1]) {
          throw new Error(`Invalid invoice number format. Expected format: INV-XXXXXX (e.g., INV-000001)`);
        }

        // 2. Check that provided number is less than currentNumber in invoice_numbers table
        const invoiceNumberRecord = await queryRunner.manager.findOne(InvoiceNumber, {
          where: {},
        });

        if (invoiceNumberRecord) {
          const currentNumberMatch = invoiceNumberRecord.currentNumber.match(/^INV-(\d+)$/);
          if (currentNumberMatch && currentNumberMatch[1]) {
            const providedNumeric = parseInt(providedMatch[1], 10);
            const currentNumeric = parseInt(currentNumberMatch[1], 10);

            if (providedNumeric >= currentNumeric) {
              throw new Error(
                `Invoice number ${invoiceNumber} must be less than the current invoice number ${invoiceNumberRecord.currentNumber}. The next available number is ${invoiceNumberRecord.currentNumber}`,
              );
            }
          }
        }

        // 3. Check uniqueness within the school
        const existingInvoice = await queryRunner.manager.findOne(Invoice, {
          where: {
            invoiceNumber: invoiceNumber,
            schoolId: data.schoolId,
          },
        });

        if (existingInvoice) {
          throw new Error(`Invoice number ${invoiceNumber} already exists in your school`);
        }
      }

      // Calculate subtotal from items (sum of quantity * rate for all items)
      const subtotal = data.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.rate;
        return sum + itemTotal;
      }, 0);

      // Calculate tax from items (sum of tax amount from each item)
      // Tax amount per item = (rate * quantity) * (tax_percentage / 100)
      const tax = data.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.rate;
        const itemTaxPercentage = this.getItemTaxPercent(item);
        const itemTaxAmount = itemTotal * (itemTaxPercentage / 100);
        return sum + itemTaxAmount;
      }, 0);

      const discount = data.discount || 0;

      // Calculate total: subtotal + tax - discount
      const total = subtotal + tax - discount;

      // Calculate balance: total - amountPaid
      const balance = total - data.amountPaid;

      // Resolve and persist the bank account used for this invoice
      let selectedBankAccountId: number | undefined;
      const selectedBankAccount = await queryRunner.manager.findOne(BankAccount, {
        where: data.bankAccountId
          ? { id: data.bankAccountId, schoolId: data.schoolId }
          : { schoolId: data.schoolId, isDefault: true },
      });
      if (selectedBankAccount) {
        selectedBankAccountId = selectedBankAccount.id;
      } else if (data.bankAccountId) {
        throw new Error("Selected bank account not found or does not belong to your school");
      }

      // Create invoice
      const invoiceData: Partial<Invoice> = {
        invoiceNumber,
        issueDate: typeof data.issueDate === "string" ? new Date(data.issueDate) : data.issueDate,
        dueDate: typeof data.dueDate === "string" ? new Date(data.dueDate) : data.dueDate,
        subTotal: subtotal,
        discount,
        invoiceType: data.invoiceType || (data.billingPeriod ? InvoiceType.RECURRING : InvoiceType.ONE_TIME),
        tax,
        amountPaid: data.amountPaid,
        balance,
        total,
        notes: data.notes,
        billingPeriod: data.billingPeriod as BillingPeriod | undefined,
        paymentMethod: data.paymentMethod,
        studentId: data.studentId,
        classroomId: data.classroomId,
        schoolId: data.schoolId,
        bankAccountId: selectedBankAccountId,
        status:
          balance <= 0
            ? balance < 0
              ? InvoiceStatus.OVERPAID
              : InvoiceStatus.PAID
            : new Date(data.dueDate) < new Date()
              ? InvoiceStatus.OVERDUE
              : InvoiceStatus.SENT,
        lastGeneratedDate: new Date(),
      };

      const invoice = queryRunner.manager.create(Invoice, invoiceData);
      const savedInvoice = await queryRunner.manager.save(invoice);

      logger.info(`Invoice created: ${savedInvoice.id} with invoice number ${invoiceNumber}`);

      // Link invoice to student and all student's parents
      // Reload invoice with relations to set the ManyToMany relationships
      const invoiceWithRelations = await queryRunner.manager.findOne(Invoice, {
        where: { id: savedInvoice.id },
        relations: ["parents", "students"],
      });

      if (invoiceWithRelations) {
        // Link student via many-to-many relation
        invoiceWithRelations.students = [student];

        // Link invoice to all student's parents
        if (student.parents && student.parents.length > 0) {
          invoiceWithRelations.parents = student.parents;
          logger.info(`Invoice ${savedInvoice.id} linked to ${student.parents.length} parent(s)`);
        }

        await queryRunner.manager.save(invoiceWithRelations);
        logger.info(`Invoice ${savedInvoice.id} linked to student ${student.id}`);
      }

      // Create items
      const itemsData = data.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        tax: this.getItemTaxPercent(item),
        schoolId: data.schoolId,
        invoiceId: savedInvoice.id,
      }));

      const items = await itemService.createItems(itemsData, { manager: queryRunner.manager });

      await queryRunner.commitTransaction();

      // Load invoice with relations
      const invoiceWithItems = await this.invoiceRepository.findOne({
        where: { id: savedInvoice.id },
        relations: ["student", "student.user", "classroom", "school", "items", "parents", "students", "students.user", "bankAccount"],
      });

      if (!invoiceWithItems) {
        throw new Error("Failed to retrieve created invoice");
      }

      logger.info(`Invoice ${savedInvoice.id} created successfully with ${items.length} items`);

      // Send email to all parents of the student (and additional emails)
      if (school) {
        try {
          const { emailService } = await import("../../shared/services/email.service");
          const studentName = student.user
            ? `${student.user.firstName || ""} ${student.user.lastName || ""}`.trim() || "your child"
            : "your child";
          const schoolName = school.schoolName || "School";

          // Load bank account details (by ID from frontend, or fall back to school default) — used in email and PDF
          let bankDetails: { bankName: string; accountNumber: string; accountName: string } | undefined;
          try {
            const bankAccountWhere = invoiceWithItems.bankAccountId
              ? { id: invoiceWithItems.bankAccountId, schoolId: data.schoolId }
              : { schoolId: data.schoolId, isDefault: true };
            const bankAccount = await AppDataSource.getRepository(BankAccount).findOne({
              where: bankAccountWhere,
            });
            if (bankAccount && bankAccount.bankName && bankAccount.accountNumber && bankAccount.accountName) {
              bankDetails = {
                bankName: bankAccount.bankName,
                accountNumber: bankAccount.accountNumber,
                accountName: bankAccount.accountName,
              };
            }
          } catch (bankError: any) {
            logger.error(`Failed to load bank account for school ${data.schoolId}:`, bankError);
          }

          // Generate invoice PDF for email attachment (includes bank details when available)
          let invoiceAttachments: { filename: string; content: Buffer | string; contentType: string }[] | undefined;
          try {
            const pdfPayNowUrl = await invoicePaymentGatewayService.buildPayNowUrlIfAvailable(
              invoiceWithItems.id,
              student.parents?.[0]?.user?.email || school.email,
            );
            const pdfBuffer = await pdfService.generateInvoicePDF(invoiceWithItems, school, bankDetails, pdfPayNowUrl);
            invoiceAttachments = [
              {
                filename: `Invoice_${invoiceWithItems.invoiceNumber}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ];
            logger.info(`Invoice PDF generated for ${invoiceWithItems.invoiceNumber}`);
          } catch (pdfError: any) {
            logger.error(
              `Failed to generate invoice PDF for ${invoiceWithItems.invoiceNumber}, sending email without attachment:`,
              pdfError,
            );
          }

          const emailArgs = {
            studentName,
            schoolName,
            invoiceNumber: invoiceWithItems.invoiceNumber,
            issueDate: invoiceWithItems.issueDate,
            dueDate: invoiceWithItems.dueDate,
            total: Number(invoiceWithItems.total),
            amountPaid: Number(invoiceWithItems.amountPaid),
            balance: Number(invoiceWithItems.balance),
            items:
              invoiceWithItems.items?.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                rate: Number(item.rate),
              })) || [],
            notes: invoiceWithItems.notes || undefined,
            invoiceId: invoiceWithItems.id,
            subDomain: school.subDomain,
            attachments: invoiceAttachments,
            bankDetails,
            invoiceEmail: data.email,
          };
          const sentRecipientEmails = new Set<string>();

          // Send to all parents of the student
          if (student.parents && student.parents.length > 0) {
            for (const parent of student.parents) {
              if (parent.user && parent.user.email) {
                const normalizedParentEmail = parent.user.email.trim().toLowerCase();
                if (sentRecipientEmails.has(normalizedParentEmail)) {
                  logger.info(`Skipping duplicate parent invoice email ${parent.user.email} for invoice ${invoiceWithItems.invoiceNumber}`);
                  continue;
                }
                try {
                  const parentName = `${parent.user.firstName || ""} ${parent.user.lastName || ""}`.trim() || "Parent";

                  await emailService.sendInvoiceEmailToParent(
                    parent.user.email,
                    parentName,
                    emailArgs.studentName,
                    emailArgs.invoiceNumber,
                    emailArgs.issueDate,
                    emailArgs.dueDate,
                    emailArgs.total,
                    emailArgs.amountPaid,
                    emailArgs.balance,
                    emailArgs.items,
                    emailArgs.schoolName,
                    emailArgs.notes,
                    emailArgs.invoiceId,
                    emailArgs.subDomain,
                    emailArgs.attachments,
                    emailArgs.bankDetails,
                    emailArgs.invoiceEmail,
                  );
                  sentRecipientEmails.add(normalizedParentEmail);

                  logger.info(`Invoice email sent to parent ${parent.user.email} for invoice ${invoiceWithItems.invoiceNumber}`);
                } catch (emailError: any) {
                  logger.error(`Failed to send invoice email to parent ${parent.user.email}:`, emailError);
                }

                // Send persistent in-app notification to parent
                if (parent.userId) {
                  await notificationService
                    .sendNotification({
                      userId: parent.userId,
                      schoolId: data.schoolId,
                      title: "New Invoice Received",
                      message: `A new invoice ${invoiceWithItems.invoiceNumber} for ${studentName} has been issued.`,
                      type: NotificationType.INVOICE,
                      data: { invoiceId: invoiceWithItems.id },
                    })
                    .catch((err) =>
                      logger.error(`Failed to send in-app notification for invoice ${invoiceWithItems.id} to parent ${parent.userId}`, err),
                    );
                }
              }
            }
          }

          // Send to additional email recipients
          if (data.additionalEmails && data.additionalEmails.length > 0) {
            for (const extraEmail of data.additionalEmails) {
              const normalizedExtraEmail = extraEmail.trim().toLowerCase();
              if (sentRecipientEmails.has(normalizedExtraEmail)) {
                logger.info(`Skipping duplicate additional recipient ${extraEmail} for invoice ${invoiceWithItems.invoiceNumber}`);
                continue;
              }
              try {
                await emailService.sendInvoiceEmailToParent(
                  extraEmail,
                  "Recipient",
                  emailArgs.studentName,
                  emailArgs.invoiceNumber,
                  emailArgs.issueDate,
                  emailArgs.dueDate,
                  emailArgs.total,
                  emailArgs.amountPaid,
                  emailArgs.balance,
                  emailArgs.items,
                  emailArgs.schoolName,
                  emailArgs.notes,
                  emailArgs.invoiceId,
                  emailArgs.subDomain,
                  emailArgs.attachments,
                  emailArgs.bankDetails,
                  emailArgs.invoiceEmail,
                );
                sentRecipientEmails.add(normalizedExtraEmail);
                logger.info(`Invoice email sent to additional recipient ${extraEmail} for invoice ${invoiceWithItems.invoiceNumber}`);
              } catch (emailError: any) {
                logger.error(`Failed to send invoice email to additional recipient ${extraEmail}:`, emailError);
              }
            }
          }
        } catch (emailServiceError: any) {
          logger.error("Error sending invoice emails:", emailServiceError);
        }
      }

      return invoiceWithItems;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      logger.error("Error creating invoice:", error);
      throw new Error(error.message || "Failed to create invoice");
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Helper method to build base query with filters (excluding status)
   */
  private buildBaseQuery(filters: {
    schoolId: number;
    dueDate?: string;
    issueDate?: string;
    studentId?: number;
    parentId?: number;
    search?: string;
  }) {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder("invoice")
      .where("invoice.schoolId = :schoolId", { schoolId: filters.schoolId });

    // Filter by dueDate
    if (filters.dueDate) {
      const dueDate = new Date(filters.dueDate);
      queryBuilder.andWhere("invoice.dueDate = :dueDate", { dueDate });
    }

    // Filter by issueDate
    if (filters.issueDate) {
      const issueDate = new Date(filters.issueDate);
      queryBuilder.andWhere("invoice.issueDate = :issueDate", { issueDate });
    }

    // Filter by studentId
    if (filters.studentId) {
      queryBuilder.andWhere("invoice.studentId = :studentId", { studentId: filters.studentId });
    }

    // Filter by parentId
    if (filters.parentId) {
      queryBuilder.innerJoin("invoice.parents", "filterParent");
      queryBuilder.andWhere("filterParent.id = :parentId", { parentId: filters.parentId });
    }

    // Case-insensitive search across invoice number, status, student, and parent names.
    if (filters.search) {
      const search = `%${filters.search}%`;
      queryBuilder.andWhere(
        `
          (
            invoice."invoiceNumber" ILIKE :search
            OR CAST(invoice.status AS text) ILIKE :search
            OR EXISTS (
              SELECT 1
              FROM student s
              INNER JOIN users su ON su.id = s."userId"
              WHERE s.id = invoice."studentId"
                AND (
                  su."firstName" ILIKE :search
                  OR su."lastName" ILIKE :search
                  OR trim(both ' ' FROM COALESCE(su."firstName", '') || ' ' || COALESCE(su."lastName", '')) ILIKE :search
                )
            )
            OR EXISTS (
              SELECT 1
              FROM invoice_parent ip
              INNER JOIN parents p ON p.id = ip."parentId"
              INNER JOIN users pu ON pu.id = p."userId"
              WHERE ip."invoiceId" = invoice.id
                AND (
                  pu."firstName" ILIKE :search
                  OR pu."lastName" ILIKE :search
                  OR trim(both ' ' FROM COALESCE(pu."firstName", '') || ' ' || COALESCE(pu."lastName", '')) ILIKE :search
                )
            )
          )
        `,
        { search },
      );
    }

    return queryBuilder;
  }

  private applyDynamicOverdueFilter<T extends { andWhere: Function }>(queryBuilder: T, currentDate: Date): T {
    queryBuilder.andWhere("COALESCE(invoice.balance, 0) > 0");
    queryBuilder.andWhere("COALESCE(invoice.amountPaid, 0) <= 0");
    queryBuilder.andWhere("invoice.dueDate < :currentDate", { currentDate });
    return queryBuilder;
  }

  private applyInvoiceListStatusFilter<T extends { andWhere: Function }>(
    queryBuilder: T,
    status: InvoiceStatus,
    currentDate: Date,
  ): T {
    if (status === InvoiceStatus.OVERDUE) {
      return this.applyDynamicOverdueFilter(queryBuilder, currentDate);
    }

    if (status === InvoiceStatus.SENT) {
      queryBuilder.andWhere("invoice.status = :status", { status: InvoiceStatus.SENT });
      queryBuilder.andWhere(
        "NOT (COALESCE(invoice.balance, 0) > 0 AND COALESCE(invoice.amountPaid, 0) <= 0 AND invoice.dueDate < :currentDate)",
        { currentDate },
      );
      return queryBuilder;
    }

    queryBuilder.andWhere("invoice.status = :status", { status });
    return queryBuilder;
  }

  /**
   * Gets all invoices with optional filters
   * Always scoped to the provided schoolId
   */
  async getAllInvoices(filters: {
    schoolId: number;
    dueDate?: string; // ISO date string
    issueDate?: string; // ISO date string
    status?: InvoiceStatus;
    studentId?: number;
    parentId?: number;
    search?: string;
    pos?: number; // pagination start
    delta?: number; // pagination size
  }): Promise<{
    success: boolean;
    message: string;
    invoices?: Invoice[];
    pagination?: { pos: number; delta: number; count: number };
    metadata?: {
      totalInvoices: number;
      totalInvoiceAmount: number;
      paidInvoices: number;
      paidInvoiceAmount: number;
      pendingInvoices: number;
      pendingInvoiceAmount: number;
      overdueInvoices: number;
      overdueInvoiceAmount: number;
    };
  }> {
    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to start of day for comparison

      // Build base query for metadata counts (without status filter)
      const baseFilters = {
        schoolId: filters.schoolId,
        dueDate: filters.dueDate,
        issueDate: filters.issueDate,
        studentId: filters.studentId,
        parentId: filters.parentId,
        search: filters.search,
      };

      // Get total invoices count
      const totalQuery = this.buildBaseQuery(baseFilters);
      const totalInvoices = await totalQuery.getCount();
      const totalAmountQuery = this.buildBaseQuery(baseFilters);
      const totalAmountResult = await totalAmountQuery
        .select("COALESCE(SUM(invoice.total), 0)", "total_invoice_amount")
        .getRawOne();
      const totalInvoiceAmount = parseFloat(totalAmountResult?.total_invoice_amount || "0") || 0;

      // Get paid invoices count
      const paidQuery = this.buildBaseQuery(baseFilters);
      paidQuery.andWhere("invoice.status = :paidStatus", { paidStatus: InvoiceStatus.PAID });
      const paidInvoices = await paidQuery.getCount();
      const paidAmountQuery = this.buildBaseQuery(baseFilters);
      paidAmountQuery.andWhere("invoice.status = :paidStatus", { paidStatus: InvoiceStatus.PAID });
      const paidAmountResult = await paidAmountQuery
        .select("COALESCE(SUM(invoice.total), 0)", "paid_invoice_amount")
        .getRawOne();
      const paidInvoiceAmount = parseFloat(paidAmountResult?.paid_invoice_amount || "0") || 0;

      // Get pending invoices count (SENT + PARTIALLY_PAID)
      const pendingQuery = this.buildBaseQuery(baseFilters);
      pendingQuery.andWhere(
        "((invoice.status = :sentStatus AND NOT (COALESCE(invoice.balance, 0) > 0 AND COALESCE(invoice.amountPaid, 0) <= 0 AND invoice.dueDate < :currentDate)) OR invoice.status = :partiallyPaidStatus)",
        {
          sentStatus: InvoiceStatus.SENT,
          partiallyPaidStatus: InvoiceStatus.PARTIALLY_PAID,
          currentDate,
        },
      );
      const pendingInvoices = await pendingQuery.getCount();
      const pendingAmountQuery = this.buildBaseQuery(baseFilters);
      pendingAmountQuery.andWhere(
        "((invoice.status = :sentStatus AND NOT (COALESCE(invoice.balance, 0) > 0 AND COALESCE(invoice.amountPaid, 0) <= 0 AND invoice.dueDate < :currentDate)) OR invoice.status = :partiallyPaidStatus)",
        {
          sentStatus: InvoiceStatus.SENT,
          partiallyPaidStatus: InvoiceStatus.PARTIALLY_PAID,
          currentDate,
        },
      );
      const pendingAmountResult = await pendingAmountQuery
        .select("COALESCE(SUM(invoice.balance), 0)", "pending_invoice_amount")
        .getRawOne();
      const pendingInvoiceAmount = parseFloat(pendingAmountResult?.pending_invoice_amount || "0") || 0;

      // Get overdue invoices count
      const overdueQuery = this.buildBaseQuery(baseFilters);
      this.applyDynamicOverdueFilter(overdueQuery, currentDate);
      const overdueInvoices = await overdueQuery.getCount();
      const overdueAmountQuery = this.buildBaseQuery(baseFilters);
      this.applyDynamicOverdueFilter(overdueAmountQuery, currentDate);
      const overdueAmountResult = await overdueAmountQuery
        .select("COALESCE(SUM(invoice.balance), 0)", "overdue_invoice_amount")
        .getRawOne();
      const overdueInvoiceAmount = parseFloat(overdueAmountResult?.overdue_invoice_amount || "0") || 0;

      // Build main query for paginated results
      const queryBuilder = this.buildBaseQuery(baseFilters)
        .leftJoinAndSelect("invoice.student", "student")
        .leftJoinAndSelect("student.user", "studentUser")
        .leftJoinAndSelect("invoice.classroom", "classroom")
        .leftJoinAndSelect("invoice.bankAccount", "bankAccount")
        .leftJoinAndSelect("invoice.items", "items")
        .leftJoinAndSelect("invoice.parents", "parents")
        .leftJoinAndSelect("parents.user", "parentUser");

      // Filter by status if provided
      if (filters.status) {
        this.applyInvoiceListStatusFilter(queryBuilder, filters.status, currentDate);
      }

      // Order by most recent first (using id as proxy for creation order)
      queryBuilder.orderBy("invoice.id", "DESC");

      const pos = filters?.pos ?? 0;
      const delta = filters?.delta ?? 10;

      const [invoices, count] = await queryBuilder.skip(pos).take(delta).getManyAndCount();
      const normalizedInvoices = invoices.map((invoice) => {
        invoice.status = this.calculateInvoiceStatus(
          Number(invoice.total || 0),
          Number(invoice.amountPaid || 0),
          invoice.dueDate,
        );
        return invoice;
      });

      return {
        success: true,
        message: `Found ${count} invoice(s)`,
        invoices: normalizedInvoices,
        pagination: { pos, delta, count },
        metadata: {
          totalInvoices,
          totalInvoiceAmount,
          paidInvoices,
          paidInvoiceAmount,
          pendingInvoices,
          pendingInvoiceAmount,
          overdueInvoices,
          overdueInvoiceAmount,
        },
      };
    } catch (error: any) {
      logger.error("Error getting all invoices:", error);
      return {
        success: false,
        message: error.message || "Failed to get invoices",
      };
    }
  }

  /**
   * Gets an invoice by ID
   * Always scoped to the provided schoolId
   */
  async getInvoiceById(
    invoiceId: number,
    schoolId: number,
  ): Promise<{
    success: boolean;
    message: string;
    invoice?: Invoice;
  }> {
    try {
      const invoice = await this.invoiceRepository
        .createQueryBuilder("invoice")
        .leftJoinAndSelect("invoice.student", "student")
        .leftJoinAndSelect("student.user", "studentUser")
        .leftJoinAndSelect("student.school", "studentSchool")
        .leftJoinAndSelect("student.parents", "studentParents")
        .leftJoinAndSelect("studentParents.user", "parentUser")
        .leftJoinAndSelect("invoice.classroom", "classroom")
        .leftJoinAndSelect("invoice.bankAccount", "bankAccount")
        .leftJoinAndSelect("invoice.items", "items")
        .where("invoice.id = :invoiceId", { invoiceId })
        .andWhere("invoice.schoolId = :schoolId", { schoolId })
        .getOne();

      if (!invoice) {
        return {
          success: false,
          message: `Invoice with ID ${invoiceId} not found or does not belong to your school`,
        };
      }

      return {
        success: true,
        message: "Invoice retrieved successfully",
        invoice,
      };
    } catch (error: any) {
      logger.error("Error getting invoice by ID:", error);
      return {
        success: false,
        message: error.message || "Failed to get invoice",
      };
    }
  }

  /**
   * Generates a PDF buffer for a specific invoice
   */
  async downloadInvoicePdf(
    invoiceId: number,
    schoolId: number,
  ): Promise<{
    success: boolean;
    message: string;
    pdfBuffer?: Buffer;
    filename?: string;
  }> {
    try {
      const invoice = await this.invoiceRepository
        .createQueryBuilder("invoice")
        .leftJoinAndSelect("invoice.student", "student")
        .leftJoinAndSelect("student.user", "studentUser")
        .leftJoinAndSelect("student.school", "studentSchool")
        .leftJoinAndSelect("invoice.parents", "parents")
        .leftJoinAndSelect("parents.user", "parentUser")
        .leftJoinAndSelect("invoice.classroom", "classroom")
        .leftJoinAndSelect("invoice.items", "items")
        .where("invoice.id = :invoiceId", { invoiceId })
        .andWhere("invoice.schoolId = :schoolId", { schoolId })
        .getOne();

      if (!invoice) {
        return {
          success: false,
          message: `Invoice with ID ${invoiceId} not found or does not belong to your school`,
        };
      }

      // Get school details
      const school = await AppDataSource.getRepository(School).findOne({
        where: { id: schoolId },
      });

      if (!school) {
        return {
          success: false,
          message: "School not found",
        };
      }

      // Get store default bank account if available
      let bankDetails: { bankName: string; accountNumber: string; accountName: string } | undefined;
      try {
        const bankAccount = await AppDataSource.getRepository(BankAccount).findOne({
          where: { schoolId, isDefault: true },
        });
        if (bankAccount && bankAccount.bankName && bankAccount.accountNumber && bankAccount.accountName) {
          bankDetails = {
            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            accountName: bankAccount.accountName,
          };
        }
      } catch (bankError: any) {
        logger.error(`Failed to load bank account for school ${schoolId}:`, bankError);
      }

      const pdfBuffer = await pdfService.generateInvoicePDF(invoice, school, bankDetails);

      return {
        success: true,
        message: "Invoice PDF generated successfully",
        pdfBuffer,
        filename: `Invoice_${invoice.invoiceNumber}.pdf`,
      };
    } catch (error: any) {
      logger.error("Error generating invoice PDF view:", error);
      return {
        success: false,
        message: error.message || "Failed to generate invoice PDF",
      };
    }
  }

  /**
   * Updates an invoice by ID with activity tracking
   * Always scoped to the provided schoolId
   */
  async updateInvoice(
    invoiceId: number,
    schoolId: number,
    updateData: UpdateInvoiceData,
    userId?: number,
  ): Promise<{
    success: boolean;
    message: string;
    invoice?: Invoice;
  }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get existing invoice with relations
      const existingInvoice = await queryRunner.manager.findOne(Invoice, {
        where: { id: invoiceId, schoolId },
        relations: ["items", "student", "classroom"],
      });

      if (!existingInvoice) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: `Invoice with ID ${invoiceId} not found or does not belong to your school`,
        };
      }

      // Check if invoice status allows updates
      if (existingInvoice.status === InvoiceStatus.PAID || existingInvoice.status === InvoiceStatus.PARTIALLY_PAID) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: `Invoice with ID ${invoiceId} is already ${existingInvoice.status} and cannot be updated`,
        };
      }

      const activities: InvoiceActivity[] = [];
      const updateFields: Partial<Invoice> = {};

      // Track changes for each field
      if (updateData.notes !== undefined && updateData.notes !== existingInvoice.notes) {
        activities.push(
          queryRunner.manager.create(InvoiceActivity, {
            invoiceId: existingInvoice.id,
            userId,
            activityType: InvoiceActivityType.NOTES_UPDATED,
            title: "Invoice notes updated",
            description: `Notes changed from "${existingInvoice.notes || "none"}" to "${updateData.notes || "none"}"`,
            oldValues: { notes: existingInvoice.notes },
            newValues: { notes: updateData.notes },
            changedField: "notes",
          }),
        );
        updateFields.notes = updateData.notes;
      }

      if (updateData.issueDate !== undefined) {
        const newIssueDate = typeof updateData.issueDate === "string" ? new Date(updateData.issueDate) : updateData.issueDate;
        const existingIssueDate =
          existingInvoice.issueDate instanceof Date ? existingInvoice.issueDate : new Date(existingInvoice.issueDate);

        if (newIssueDate.getTime() !== existingIssueDate.getTime()) {
          activities.push(
            queryRunner.manager.create(InvoiceActivity, {
              invoiceId: existingInvoice.id,
              userId,
              activityType: InvoiceActivityType.ISSUE_DATE_CHANGED,
              title: "Invoice issue date updated",
              description: `Issue date changed from ${existingIssueDate.toISOString().split("T")[0]} to ${newIssueDate.toISOString().split("T")[0]}`,
              oldValues: { issueDate: existingIssueDate },
              newValues: { issueDate: newIssueDate },
              changedField: "issueDate",
            }),
          );
          updateFields.issueDate = newIssueDate;
        }
      }

      if (updateData.dueDate !== undefined) {
        const newDueDate = typeof updateData.dueDate === "string" ? new Date(updateData.dueDate) : updateData.dueDate;
        const existingDueDate = existingInvoice.dueDate instanceof Date ? existingInvoice.dueDate : new Date(existingInvoice.dueDate);

        if (newDueDate.getTime() !== existingDueDate.getTime()) {
          activities.push(
            queryRunner.manager.create(InvoiceActivity, {
              invoiceId: existingInvoice.id,
              userId,
              activityType: InvoiceActivityType.DUE_DATE_CHANGED,
              title: "Invoice due date updated",
              description: `Due date changed from ${existingDueDate.toISOString().split("T")[0]} to ${newDueDate.toISOString().split("T")[0]}`,
              oldValues: { dueDate: existingDueDate },
              newValues: { dueDate: newDueDate },
              changedField: "dueDate",
            }),
          );
          updateFields.dueDate = newDueDate;
        }
      }

      // Handle amountPaid update (payment)
      if (updateData.amountPaid !== undefined && updateData.amountPaid !== Number(existingInvoice.amountPaid)) {
        const oldAmountPaid = Number(existingInvoice.amountPaid);
        const newAmountPaid = updateData.amountPaid;

        activities.push(
          queryRunner.manager.create(InvoiceActivity, {
            invoiceId: existingInvoice.id,
            userId,
            activityType: oldAmountPaid === 0 ? InvoiceActivityType.PAYMENT_MADE : InvoiceActivityType.PAYMENT_UPDATED,
            title: oldAmountPaid === 0 ? "Payment made" : "Payment updated",
            description: `Amount paid changed from ${oldAmountPaid} to ${newAmountPaid}`,
            oldValues: { amountPaid: oldAmountPaid },
            newValues: { amountPaid: newAmountPaid },
            changedField: "amountPaid",
          }),
        );
        updateFields.amountPaid = newAmountPaid;
      }

      // Handle billingPeriod update
      if (updateData.billingPeriod !== undefined && updateData.billingPeriod !== existingInvoice.billingPeriod) {
        activities.push(
          queryRunner.manager.create(InvoiceActivity, {
            invoiceId: existingInvoice.id,
            userId,
            activityType: InvoiceActivityType.UPDATED,
            title: "Invoice billing period updated",
            description: `Billing period changed from "${existingInvoice.billingPeriod || "none"}" to "${updateData.billingPeriod || "none"}"`,
            oldValues: { billingPeriod: existingInvoice.billingPeriod },
            newValues: { billingPeriod: updateData.billingPeriod },
            changedField: "billingPeriod",
          }),
        );
        updateFields.billingPeriod = updateData.billingPeriod as BillingPeriod;

        // Auto-update invoiceType based on presence of billingPeriod
        // If billing period is removed (empty string or null), it's one-time
        // If billing period is set, it's recurring
        const newInvoiceType = updateData.billingPeriod ? InvoiceType.RECURRING : InvoiceType.ONE_TIME;

        if (newInvoiceType !== existingInvoice.invoiceType) {
          activities.push(
            queryRunner.manager.create(InvoiceActivity, {
              invoiceId: existingInvoice.id,
              userId,
              activityType: InvoiceActivityType.UPDATED,
              title: "Invoice type updated",
              description: `Invoice type changed from ${existingInvoice.invoiceType} to ${newInvoiceType} because billing period was ${updateData.billingPeriod ? "set" : "removed"}`,
              oldValues: { invoiceType: existingInvoice.invoiceType },
              newValues: { invoiceType: newInvoiceType },
              changedField: "invoiceType",
            }),
          );
          updateFields.invoiceType = newInvoiceType;
        }
      }

      // Handle paymentMethod update
      if (updateData.paymentMethod !== undefined && updateData.paymentMethod !== existingInvoice.paymentMethod) {
        activities.push(
          queryRunner.manager.create(InvoiceActivity, {
            invoiceId: existingInvoice.id,
            userId,
            activityType: InvoiceActivityType.UPDATED,
            title: "Invoice payment method updated",
            description: `Payment method changed from "${existingInvoice.paymentMethod || "none"}" to "${updateData.paymentMethod || "none"}"`,
            oldValues: { paymentMethod: existingInvoice.paymentMethod },
            newValues: { paymentMethod: updateData.paymentMethod },
            changedField: "paymentMethod",
          }),
        );
        updateFields.paymentMethod = updateData.paymentMethod;
      }

      // Handle classroomId update
      if (updateData.classroomId !== undefined && updateData.classroomId !== existingInvoice.classroomId) {
        const classroom = await queryRunner.manager.findOne(Classroom, {
          where: { id: updateData.classroomId, schoolId },
        });

        if (!classroom) {
          await queryRunner.rollbackTransaction();
          return {
            success: false,
            message: `Classroom with ID ${updateData.classroomId} not found or does not belong to your school`,
          };
        }

        activities.push(
          queryRunner.manager.create(InvoiceActivity, {
            invoiceId: existingInvoice.id,
            userId,
            activityType: InvoiceActivityType.UPDATED,
            title: "Invoice classroom updated",
            description: `Classroom changed from ID ${existingInvoice.classroomId} to ${updateData.classroomId}`,
            oldValues: { classroomId: existingInvoice.classroomId },
            newValues: { classroomId: updateData.classroomId },
            changedField: "classroomId",
          }),
        );
        updateFields.classroomId = updateData.classroomId;
      }

      // Handle studentId update
      if (updateData.studentId !== undefined && updateData.studentId !== existingInvoice.studentId) {
        const student = await queryRunner.manager.findOne(Student, {
          where: { id: updateData.studentId, schoolId },
        });

        if (!student) {
          await queryRunner.rollbackTransaction();
          return {
            success: false,
            message: `Student with ID ${updateData.studentId} not found or does not belong to your school`,
          };
        }

        activities.push(
          queryRunner.manager.create(InvoiceActivity, {
            invoiceId: existingInvoice.id,
            userId,
            activityType: InvoiceActivityType.UPDATED,
            title: "Invoice student updated",
            description: `Student changed from ID ${existingInvoice.studentId} to ${updateData.studentId}`,
            oldValues: { studentId: existingInvoice.studentId },
            newValues: { studentId: updateData.studentId },
            changedField: "studentId",
          }),
        );
        updateFields.studentId = updateData.studentId;
      }

      // Handle items update
      let recalculateTotals = false;
      if (updateData.items !== undefined) {
        const existingItems = existingInvoice.items || [];
        const newItems = updateData.items;

        // Remove all existing items
        if (existingItems.length > 0) {
          for (const item of existingItems) {
            activities.push(
              queryRunner.manager.create(InvoiceActivity, {
                invoiceId: existingInvoice.id,
                userId,
                activityType: InvoiceActivityType.ITEM_REMOVED,
                title: "Invoice item removed",
                description: `Item "${item.description}" removed`,
                oldValues: {
                  itemId: item.id,
                  description: item.description,
                  quantity: item.quantity,
                  rate: Number(item.rate),
                },
                changedField: "items",
              }),
            );
          }
          await queryRunner.manager.remove(Item, existingItems);
        }

        // Add new items
        for (const itemData of newItems) {
          const item = queryRunner.manager.create(Item, {
            description: itemData.description,
            quantity: itemData.quantity,
            rate: itemData.rate,
            tax: this.getItemTaxPercent(itemData),
            total:
              itemData.quantity * itemData.rate +
              itemData.quantity * itemData.rate * (this.getItemTaxPercent(itemData) / 100),
            schoolId,
            invoiceId: existingInvoice.id,
          });
          const savedItem = await queryRunner.manager.save(item);

          activities.push(
            queryRunner.manager.create(InvoiceActivity, {
              invoiceId: existingInvoice.id,
              userId,
              activityType: InvoiceActivityType.ITEM_ADDED,
              title: "Invoice item added",
              description: `Item "${itemData.description}" added`,
              newValues: {
                itemId: savedItem.id,
                description: itemData.description,
                quantity: itemData.quantity,
                rate: itemData.rate,
              },
              changedField: "items",
            }),
          );
        }

        recalculateTotals = true;
      }

      // Recalculate totals if needed
      if (recalculateTotals || updateData.amountPaid !== undefined) {
        // Get updated items to recalculate subtotal
        const updatedItems = await queryRunner.manager.find(Item, {
          where: { invoiceId: existingInvoice.id },
        });

        const subtotal = updatedItems.reduce((sum, item) => {
          return sum + item.quantity * Number(item.rate);
        }, 0);

        // Calculate tax from items (sum of tax amount from each item)
        // Tax amount per item = (rate * quantity) * (tax_percentage / 100)
        const tax = updatedItems.reduce((sum, item) => {
          const itemTotal = item.quantity * Number(item.rate);
          const itemTaxPercentage = this.getItemTaxPercent(item);
          const itemTaxAmount = itemTotal * (itemTaxPercentage / 100);
          return sum + itemTaxAmount;
        }, 0);

        const discount = existingInvoice.discount || 0;
        const total = subtotal + tax - discount;
        const amountPaid = updateFields.amountPaid !== undefined ? updateFields.amountPaid : Number(existingInvoice.amountPaid);
        const balance = total - amountPaid;
        const status = this.calculateInvoiceStatus(total, amountPaid, existingInvoice.dueDate);

        updateFields.subTotal = subtotal;
        updateFields.total = total;
        updateFields.balance = balance;
        updateFields.status = status;
      } else if (updateData.amountPaid !== undefined) {
        // Only amountPaid changed, recalculate balance
        const total = Number(existingInvoice.total);
        const amountPaid = updateData.amountPaid;
        const balance = total - amountPaid;
        const status = this.calculateInvoiceStatus(total, amountPaid, existingInvoice.dueDate);

        updateFields.balance = balance;
        updateFields.status = status;
      }

      // Update invoice if there are any changes
      if (Object.keys(updateFields).length > 0) {
        await queryRunner.manager.update(Invoice, { id: invoiceId }, updateFields);

        // Create a general update activity if no specific activities were created
        if (activities.length === 0) {
          activities.push(
            queryRunner.manager.create(InvoiceActivity, {
              invoiceId: existingInvoice.id,
              userId,
              activityType: InvoiceActivityType.UPDATED,
              title: "Invoice updated",
              description: "Invoice was updated",
              oldValues: {},
              newValues: updateFields,
            }),
          );
        }

        // Save all activities
        if (activities.length > 0) {
          await queryRunner.manager.save(InvoiceActivity, activities);
        }
      }

      await queryRunner.commitTransaction();

      // Reload invoice with all relations
      const updatedInvoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId },
        relations: ["student", "student.user", "student.school", "student.parents", "student.parents.user", "classroom", "items", "school"],
      });

      if (!updatedInvoice) {
        return {
          success: false,
          message: "Failed to retrieve updated invoice",
        };
      }

      logger.info(`Invoice ${invoiceId} updated successfully with ${activities.length} activity record(s)`);

      return {
        success: true,
        message: "Invoice updated successfully",
        invoice: updatedInvoice,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      logger.error("Error updating invoice:", error);
      return {
        success: false,
        message: error.message || "Failed to update invoice",
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Deletes an invoice by ID
   * Always scoped to the provided schoolId
   */
  async deleteInvoice(
    invoiceId: number,
    schoolId: number,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId, schoolId },
      });

      if (!invoice) {
        return {
          success: false,
          message: `Invoice with ID ${invoiceId} not found or does not belong to your school`,
        };
      }

      await this.invoiceRepository.remove(invoice);

      logger.info(`Invoice ${invoiceId} deleted successfully`);

      return {
        success: true,
        message: "Invoice deleted successfully",
      };
    } catch (error: any) {
      logger.error("Error deleting invoice:", error);
      return {
        success: false,
        message: error.message || "Failed to delete invoice",
      };
    }
  }

  /**
   * Generates the next invoice number and increments the counter
   * Returns the current number and updates it to the next number
   * Format: INV-000001, INV-000002, etc.
   */
  async generateInvoiceNumber(): Promise<string> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get or create the invoice number record (there should only be one)
      let invoiceNumberRecord = await queryRunner.manager.findOne(InvoiceNumber, {
        where: {},
        lock: { mode: "pessimistic_write" }, // Lock the row to prevent concurrent access
      });

      if (!invoiceNumberRecord) {
        // Create the initial record if it doesn't exist
        invoiceNumberRecord = queryRunner.manager.create(InvoiceNumber, {
          currentNumber: "INV-000001",
        });
        invoiceNumberRecord = await queryRunner.manager.save(invoiceNumberRecord);
      }

      // Get the current number to return
      const currentNumber = invoiceNumberRecord.currentNumber;

      // Extract the numeric part and increment it
      const match = currentNumber.match(/^INV-(\d+)$/);
      if (!match || !match[1]) {
        throw new Error(`Invalid invoice number format: ${currentNumber}`);
      }

      const numericPart = parseInt(match[1], 10);
      const nextNumericPart = numericPart + 1;

      // Format the next number with leading zeros (6 digits)
      const nextNumber = `INV-${nextNumericPart.toString().padStart(6, "0")}`;

      // Update the current number to the next number
      invoiceNumberRecord.currentNumber = nextNumber;
      await queryRunner.manager.save(invoiceNumberRecord);

      await queryRunner.commitTransaction();

      logger.info(`Generated invoice number: ${currentNumber}, next number: ${nextNumber}`);

      return currentNumber;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      logger.error("Error generating invoice number:", error);
      throw new Error(error.message || "Failed to generate invoice number");
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Gets the current invoice number without incrementing it
   */
  async getCurrentInvoiceNumber(): Promise<string> {
    try {
      let invoiceNumberRecord = await this.invoiceNumberRepository.findOne({
        where: {},
      });

      if (!invoiceNumberRecord) {
        // Create the initial record if it doesn't exist
        invoiceNumberRecord = this.invoiceNumberRepository.create({
          currentNumber: "INV-000001",
        });
        invoiceNumberRecord = await this.invoiceNumberRepository.save(invoiceNumberRecord);
      }

      return invoiceNumberRecord.currentNumber;
    } catch (error: any) {
      logger.error("Error getting current invoice number:", error);
      throw new Error(error.message || "Failed to get current invoice number");
    }
  }

  /**
   * Calculates the status of an invoice based on total, amountPaid, and dueDate
   */
  private calculateInvoiceStatus(total: number, amountPaid: number, dueDate: Date | string): InvoiceStatus {
    const balance = total - amountPaid;
    const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (balance <= 0) {
      return balance < 0 ? InvoiceStatus.OVERPAID : InvoiceStatus.PAID;
    }

    if (amountPaid > 0) {
      return InvoiceStatus.PARTIALLY_PAID;
    }

    if (due < today) {
      return InvoiceStatus.OVERDUE;
    }

    return InvoiceStatus.SENT;
  }

  /**
   * Records a payment for an invoice
   */
  async recordInvoicePayment(
    invoiceId: number,
    schoolId: number,
    paymentData: RecordPaymentData,
    userId?: number,
  ): Promise<{
    success: boolean;
    message: string;
    invoice?: Invoice;
    payment?: InvoicePayment;
  }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get invoice with current payments and relations
      const invoice = await queryRunner.manager.findOne(Invoice, {
        where: { id: invoiceId, schoolId },
        relations: ["payments", "student", "parents", "items"],
      });

      if (!invoice) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: `Invoice with ID ${invoiceId} not found or does not belong to your school`,
        };
      }

      const paymentDate = paymentData.paymentDate;
      const amountPaid = paymentData.amountPaid;

      // Create payment record
      const payment = queryRunner.manager.create(InvoicePayment, {
        invoiceId: invoice.id,
        amountPaid: amountPaid,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentDate,
        recordedById: userId,
      });

      const savedPayment = await queryRunner.manager.save(payment);

      // Update invoice totals
      const oldAmountPaidTotal = Number(invoice.amountPaid);
      const newAmountPaidTotal = oldAmountPaidTotal + Number(amountPaid);
      const total = Number(invoice.total);
      const newBalance = total - newAmountPaidTotal;
      const newStatus = this.calculateInvoiceStatus(total, newAmountPaidTotal, invoice.dueDate);

      await queryRunner.manager.update(
        Invoice,
        { id: invoice.id },
        {
          amountPaid: newAmountPaidTotal,
          balance: newBalance,
          status: newStatus,
        },
      );

      // Update associated TourBooking if this is an admission invoice
      if (invoice.source === InvoiceSource.ADMISSION && invoice.tourBookingId) {
        await queryRunner.manager.update(
          TourBooking,
          { id: invoice.tourBookingId },
          {
            status: BookingStatus.ACCEPTED,
          },
        );
        logger.info(`Updated TourBooking ${invoice.tourBookingId} status to ACCEPTED for admission invoice ${invoice.id} payment`);
      }

      if (invoice.source === InvoiceSource.ADMISSION && invoice.formResponseId) {
        await queryRunner.manager.update(
          FormResponse,
          { id: invoice.formResponseId },
          {
            status: FormResponseStatus.ACCEPTED,
          },
        );
        logger.info(`Updated FormResponse ${invoice.formResponseId} status to ACCEPTED for admission invoice ${invoice.id} payment`);
      }

      // Track activity

      const activity = queryRunner.manager.create(InvoiceActivity, {
        invoiceId: invoice.id,
        userId,
        activityType: InvoiceActivityType.PAYMENT_MADE,
        title: "Payment recorded",
        description: `Payment of ${amountPaid} recorded. New balance: ${newBalance}`,
        oldValues: { amountPaid: oldAmountPaidTotal, status: invoice.status },
        newValues: { amountPaid: newAmountPaidTotal, status: newStatus },
      });
      await queryRunner.manager.save(activity);

      const isAdmission = invoice.source === InvoiceSource.ADMISSION;
      const paymentActivityLog = queryRunner.manager.create(ActivityLog, {
        userId,
        resource: isAdmission ? "admission" : "invoice",
        action: "payment_made",
        title: isAdmission ? "Admission invoice payment recorded" : "Invoice payment recorded",
        priority: ActivityLogPriority.HIGH,
        description: JSON.stringify({
          invoiceId: invoice.id,
          invoiceSource: invoice.source,
          paymentId: savedPayment.id,
          amountPaid,
          paymentMethod: paymentData.paymentMethod,
          schoolId: invoice.schoolId,
          tourBookingId: invoice.tourBookingId,
        }),
      });
      await queryRunner.manager.save(paymentActivityLog);

      await queryRunner.commitTransaction();

      // Reload invoice with for response
      const updatedInvoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId },
        relations: ["student", "student.user", "payments"],
      });

      logger.info(`Payment ${savedPayment.id} recorded for invoice ${invoiceId}. Total paid: ${newAmountPaidTotal}, Status: ${newStatus}`);

      // Send receipt email to all parents of the student
      if (invoice.parents && invoice.parents.length > 0) {
        try {
          // Load student and school details for the receipt
          const student = await queryRunner.manager.findOne(Student, {
            where: { id: invoice.studentId },
            relations: ["user"],
          });
          const school = await queryRunner.manager.findOne(School, {
            where: { id: invoice.schoolId },
          });

          const studentName = student?.user
            ? `${student.user.firstName || ""} ${student.user.lastName || ""}`.trim() || "your child"
            : "your child";
          const schoolName = school?.schoolName || "School";

          for (const parent of invoice.parents) {
            // Need to ensure parent user info is loaded
            const parentWithUser = (await queryRunner.manager.findOne("Parent", {
              where: { id: parent.id },
              relations: ["user"],
            })) as any;

            if (parentWithUser?.user?.email) {
              const parentName = `${parentWithUser.user.firstName || ""} ${parentWithUser.user.lastName || ""}`.trim() || "Parent";

              await emailService.sendPaymentReceiptEmail(
                parentWithUser.user.email,
                parentName,
                studentName,
                invoice.invoiceNumber,
                amountPaid as number,
                paymentDate as Date,
                paymentData.paymentMethod,
                invoice.items?.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  rate: Number(item.rate),
                })) || [],
                newBalance,
                schoolName,
                invoice.id,
                school?.subDomain,
              );
              logger.info(`Receipt email sent to parent ${parentWithUser.user.email} for invoice ${invoice.invoiceNumber}`);
            }
          }

          // Notify parents in-app
          for (const parent of invoice.parents) {
            if (parent.userId) {
              await notificationService
                .sendNotification({
                  userId: parent.userId,
                  schoolId: invoice.schoolId,
                  title: "Payment Received",
                  message: `Your payment of ${amountPaid} for invoice ${invoice.invoiceNumber} (${studentName}) has been received.`,
                  type: NotificationType.PAYMENT,
                  data: { invoiceId: invoice.id },
                })
                .catch((err) => logger.error("Failed to send payment notification to parent", err));
            }
          }

          // Notify admins in-app
          await notificationService.notifyAdmins({
            schoolId: invoice.schoolId,
            title: "Payment Recorded",
            message: `A payment of ${amountPaid} has been recorded for invoice ${invoice.invoiceNumber} (${studentName}).`,
            type: NotificationType.PAYMENT,
            data: { invoiceId: invoice.id },
          });
        } catch (emailError: any) {
          logger.error(`Failed to send receipt email for invoice ${invoice.invoiceNumber}: ${emailError.message}`);
        }
      }

      return {
        success: true,
        message: "Payment recorded successfully",
        invoice: updatedInvoice!,
        payment: savedPayment,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      logger.error("Error recording invoice payment:", error);
      return {
        success: false,
        message: error.message || "Failed to record payment",
      };
    } finally {
      await queryRunner.release();
    }
  }

  async removeInvoicePayment(
    invoiceId: number,
    invoicePaymentId: number,
    schoolId: number,
  ): Promise<{
    success: boolean;
    message: string;
    invoice?: Invoice;
  }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get invoice with current payments and relations
      const invoice = await queryRunner.manager.findOne(Invoice, {
        where: { id: invoiceId, schoolId },
        relations: ["payments", "student", "parents", "items"],
      });

      if (!invoice) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: `Invoice with ID ${invoiceId} not found or does not belong to your school`,
        };
      }

      const payment = await queryRunner.manager.findOne(InvoicePayment, {
        where: { id: invoicePaymentId, invoiceId },
      });

      if (!payment) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: `Payment with ID ${invoicePaymentId} not found or does not belong to invoice ${invoiceId}`,
        };
      }

      // Update invoice totals
      const oldAmountPaidTotal = Number(invoice.amountPaid);
      const newAmountPaidTotal = oldAmountPaidTotal - Number(payment.amountPaid);
      const total = Number(invoice.total);
      const newBalance = total - newAmountPaidTotal;
      const newStatus = this.calculateInvoiceStatus(total, newAmountPaidTotal, invoice.dueDate);

      await queryRunner.manager.update(
        Invoice,
        { id: invoice.id },
        {
          amountPaid: newAmountPaidTotal,
          balance: newBalance,
          status: newStatus,
        },
      );

      // Remove payment
      await queryRunner.manager.remove(payment);

      // Track activity
      const activity = queryRunner.manager.create(InvoiceActivity, {
        invoiceId: invoice.id,
        userId: payment.recordedById,
        activityType: InvoiceActivityType.DELETED,
        title: "Payment deleted",
        description: `Payment of ${payment.amountPaid} deleted. New balance: ${newBalance}`,
        oldValues: { amountPaid: oldAmountPaidTotal, status: invoice.status },
        newValues: { amountPaid: newAmountPaidTotal, status: newStatus },
      });
      await queryRunner.manager.save(activity);

      await queryRunner.commitTransaction();

      // Reload invoice with for response
      const updatedInvoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId },
        relations: ["student", "student.user", "payments"],
      });

      logger.info(`Payment ${invoicePaymentId} deleted for invoice ${invoiceId}. Total paid: ${newAmountPaidTotal}, Status: ${newStatus}`);

      return {
        success: true,
        message: "Payment deleted successfully",
        invoice: updatedInvoice!,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      logger.error("Error removing invoice payment:", error);
      return {
        success: false,
        message: error.message || "Failed to remove payment",
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Resolve bank account for display on invoice PDF / emails (matches create-invoice logic).
   */
  async resolveBankDetailsForSchool(
    schoolId: number,
    bankAccountId?: number | null,
  ): Promise<{ bankName: string; accountNumber: string; accountName: string } | undefined> {
    try {
      const bankAccountWhere = bankAccountId != null ? { id: bankAccountId, schoolId } : { schoolId, isDefault: true };
      const bankAccount = await AppDataSource.getRepository(BankAccount).findOne({
        where: bankAccountWhere,
      });
      if (bankAccount?.bankName && bankAccount.accountNumber && bankAccount.accountName) {
        return {
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          accountName: bankAccount.accountName,
        };
      }
    } catch (e) {
      logger.error(`Failed to load bank account for school ${schoolId}:`, e);
    }
    return undefined;
  }

  /**
   * Generate PDF for an invoice
   * @param bankAccountId Optional; when set, uses that account (must belong to school). Otherwise school default.
   */
  async generateInvoicePDF(
    invoiceId: number,
    schoolId: number,
    bankAccountId?: number | null,
    payerEmail?: string,
    childNamesOverride?: string[],
  ): Promise<{
    success: boolean;
    pdf?: Buffer;
    message?: string;
    bankDetails?: { bankName: string; accountNumber: string; accountName: string };
  }> {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId, schoolId },
        relations: ["items", "students", "students.user", "student", "student.user", "parents", "parents.user"],
      });

      if (!invoice) {
        return { success: false, message: "Invoice not found" };
      }

      const school = await AppDataSource.getRepository(School).findOne({ where: { id: schoolId } });
      if (!school) {
        return { success: false, message: "School not found" };
      }

      const bankDetails = await this.resolveBankDetailsForSchool(schoolId, bankAccountId);

      try {
        if (childNamesOverride?.length) {
          (invoice as any).childNamesOverride = childNamesOverride;
        }
        const payNowUrl = await invoicePaymentGatewayService.buildPayNowUrlIfAvailable(invoice.id, payerEmail || school.email);
        const pdf = await pdfService.generateInvoicePDF(invoice, school, bankDetails, payNowUrl);
        return { success: true, pdf, bankDetails };
      } catch (error) {
        logger.error(`Error generating PDF for invoice ${invoiceId}:`, error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
          bankDetails,
        };
      }
    } catch (error) {
      logger.error(`Error generating PDF for invoice ${invoiceId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const invoiceService = new InvoiceService();
