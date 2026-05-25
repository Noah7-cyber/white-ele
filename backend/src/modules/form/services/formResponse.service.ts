import { FormRepository } from "../../core/FormRepository";
import { Form } from "../../shared/entities/Form";
import { FormItem } from "../../shared/entities/FormItem";
import { FormResponse } from "../../shared/entities/FormResponse";
import { FormResponseItem } from "../../shared/entities/FormResponseItem";
import { logger } from "../../shared";
import { AppDataSource } from "../../core/config/database";
import { BookingStatus, FormResponseStatus, GUEST_REFERRAL_SOURCE, InvoiceSource, ParentStatus, StudentStatus } from "../../shared/entities/EntityEnums";
import { FormResponseServiceResponse } from "../services/form.service";
import { Invoice } from "../../shared/entities/Invoice";
import { Student } from "../../shared/entities/StudentEntity";
import { Parent } from "../../shared/entities/Parent";
import { User } from "../../shared/entities/User";
import { TourBooking } from "../../shared/entities/TourBooking";
import { emailService } from "../../shared/services/email.service";
import { notificationService } from "../../notification/services/notification.service";
import { NotificationType } from "../../shared/entities/Notification";

export interface SubmitResponseDTO {
  userId?: number;
  names?: string[];
  email?: string;
  referralSource?: GUEST_REFERRAL_SOURCE;
  additionalContacts?: string[];
  answers: {
    formItemId: number;
    value?: string;
    selectedOptionId?: number;
  }[];
}

class FormResponseService {
  private formRepository: FormRepository;

  constructor() {
    this.formRepository = new FormRepository();
  }

  async submitResponse(formId: number, data: SubmitResponseDTO): Promise<FormResponseServiceResponse> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const form = await queryRunner.manager.findOne(Form, { where: { id: formId } });
      if (!form) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: "Form not found" };
      }

      const formItems = await queryRunner.manager.find(FormItem, {
        where: { formId },
        relations: ["options"],
      });
      const validItemIds = new Set(formItems.map((fi) => fi.id));
      const optionIdsByItemId = new Map<number, Set<number>>();
      for (const fi of formItems) {
        optionIdsByItemId.set(fi.id, new Set((fi.options ?? []).map((o) => o.id)));
      }

      if (data.answers && data.answers.length > 0) {
        for (const ans of data.answers) {
          if (!validItemIds.has(ans.formItemId)) {
            await queryRunner.rollbackTransaction();
            return {
              success: false,
              message: "One or more answers reference fields that do not belong to this form",
            };
          }
          if (ans.selectedOptionId != null) {
            const allowed = optionIdsByItemId.get(ans.formItemId);
            if (!allowed?.has(ans.selectedOptionId)) {
              await queryRunner.rollbackTransaction();
              return {
                success: false,
                message:
                  "One or more answers use a selectedOptionId that does not exist for that question (option ids change when the form is edited — refetch the form and use current option ids)",
              };
            }
          }
        }
      }

      const newResponse = queryRunner.manager.create(FormResponse, {
        formId,
        schoolId: form.schoolId,
        userId: data.userId ?? undefined,
        names: data.names,
        email: data.email,
        referralSource: data.referralSource,
        additionalContacts: data.additionalContacts,
        status: FormResponseStatus.SUBMITTED,
        submittedAt: new Date(),
      });
      const savedResponse = await queryRunner.manager.save(newResponse);

      if (data.answers && data.answers.length > 0) {
        const responseItems = data.answers.map((ans) =>
          queryRunner.manager.create(FormResponseItem, {
            formResponseId: savedResponse.id,
            formItemId: ans.formItemId,
            value: ans.value,
            selectedOptionId: ans.selectedOptionId,
          }),
        );
        await queryRunner.manager.save(responseItems);
      }

      await queryRunner.commitTransaction();

      if (form.schoolId) {
        const submitterName = data.names?.filter(Boolean).join(" ").trim() || "A prospect";
        const submitterEmail = data.email || "No email provided";

        try {
          await emailService.sendFormSubmittedAdminNotificationEmail({
            schoolId: form.schoolId,
            formId: form.id,
            formTitle: form.title,
            submitterName,
            submitterEmail,
            responseId: savedResponse.id,
          });
        } catch (adminEmailError) {
          logger?.error?.(`Failed to send admin form-submitted email: ${adminEmailError}`);
        }

        await notificationService.notifyAdmins({
          schoolId: form.schoolId,
          title: "New Form Submission",
          message: `${submitterName} submitted ${form.title}.`,
          type: NotificationType.INFO,
          data: {
            formId: form.id,
            formResponseId: savedResponse.id,
          },
        });
      }

      const response = await this.getResponseById(savedResponse.id);
      return {
        success: true,
        message: "Form response submitted successfully",
        response,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      logger.error(`Error submitting response to form ${formId}:`, error);
      return {
        success: false,
        message: error.message || "Failed to submit form response",
      };
    } finally {
      await queryRunner.release();
    }
  }

  /** Staff workflow statuses only; draft/completed are set by other flows. */
  private static readonly STAFF_SETTABLE_STATUSES: FormResponseStatus[] = [
    FormResponseStatus.COMPLETED,
    FormResponseStatus.ACCEPTED,
    FormResponseStatus.REJECTED,
  ];

  private normalizeWithdrawStatus(status: FormResponseStatus | "withdrawn"): FormResponseStatus | null {
    if (status === "withdrawn" || status === FormResponseStatus.WITHDRAW) {
      return FormResponseStatus.WITHDRAW;
    }
    if (Object.values(FormResponseStatus).includes(status as FormResponseStatus)) {
      return status as FormResponseStatus;
    }
    return null;
  }

  async updateResponseStatus(
    schoolId: number,
    responseId: number,
    status: FormResponseStatus | "withdrawn"
  ): Promise<FormResponseServiceResponse> {
    const normalizedStatus = this.normalizeWithdrawStatus(status);
    if (!normalizedStatus) {
      return {
        success: false,
        message: `Status must be one of: ${[
          ...FormResponseService.STAFF_SETTABLE_STATUSES,
          FormResponseStatus.WITHDRAW,
          "withdrawn",
        ].join(", ")}`,
      };
    }

    if (normalizedStatus === FormResponseStatus.WITHDRAW) {
      return this.handleWithdrawStatusUpdate(schoolId, responseId);
    }

    if (!FormResponseService.STAFF_SETTABLE_STATUSES.includes(normalizedStatus)) {
      return {
        success: false,
        message: `Status must be one of: ${FormResponseService.STAFF_SETTABLE_STATUSES.join(", ")}`,
      };
    }

    const response = await this.formRepository.getFormResponseRepo().findOne({
      where: { id: responseId },
      relations: ["form"],
    });

    if (!response?.form) {
      return { success: false, message: "Form response not found" };
    }

    if (response.form.schoolId !== schoolId) {
      return { success: false, message: "Form response not found" };
    }

    if (response.status === FormResponseStatus.DRAFT) {
      return {
        success: false,
        message: "Cannot change status of a draft response; submit the form first",
      };
    }

    response.status = normalizedStatus;
    await this.formRepository.getFormResponseRepo().save(response);

    const updated = await this.getResponseById(responseId);
    return {
      success: true,
      message: "Form response status updated",
      response: updated,
    };
  }

  private async handleWithdrawStatusUpdate(
    schoolId: number,
    responseId: number
  ): Promise<FormResponseServiceResponse> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const responseRepo = queryRunner.manager.getRepository(FormResponse);
      const invoiceRepo = queryRunner.manager.getRepository(Invoice);
      const studentRepo = queryRunner.manager.getRepository(Student);
      const parentRepo = queryRunner.manager.getRepository(Parent);
      const userRepo = queryRunner.manager.getRepository(User);

      const response = await responseRepo.findOne({
        where: { id: responseId },
        relations: ["form"],
      });

      if (!response?.form) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: "Form response not found" };
      }

      if (response.form.schoolId !== schoolId) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: "Form response not found" };
      }

      if (response.status === FormResponseStatus.DRAFT) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: "Cannot change status of a draft response; submit the form first",
        };
      }

      const invoice = await invoiceRepo.findOne({
        where: {
          formResponseId: response.id,
          schoolId,
          source: InvoiceSource.ADMISSION,
        },
        relations: ["students", "parents"],
        order: { id: "DESC" },
      });

      if (invoice && Number(invoice.amountPaid || 0) > 0) {
        response.status = FormResponseStatus.ACCEPTED;
        await responseRepo.save(response);
        await queryRunner.commitTransaction();
        return {
          success: true,
          message: "offer has already been accepted",
          response,
        };
      }

      const candidateStudentIds = new Set<number>();
      const candidateParentIds = new Set<number>();
      let relatedBookingId: number | null = invoice?.tourBookingId ?? null;

      if (invoice?.students?.length) {
        for (const student of invoice.students) candidateStudentIds.add(student.id);
      }
      if (invoice?.parents?.length) {
        for (const parent of invoice.parents) candidateParentIds.add(parent.id);
      }

      const responseStudents = await studentRepo.find({
        where: { formResponseId: response.id },
        relations: ["parents"],
      });

      for (const student of responseStudents) {
        candidateStudentIds.add(student.id);
        if (!relatedBookingId && student.tourBookingId) {
          relatedBookingId = student.tourBookingId;
        }
        for (const parent of student.parents || []) {
          candidateParentIds.add(parent.id);
        }
      }

      if (invoice) {
        await invoiceRepo.remove(invoice);
      }

      const studentsForCleanup = candidateStudentIds.size
        ? await studentRepo
            .createQueryBuilder("student")
            .leftJoinAndSelect("student.parents", "parents")
            .where("student.id IN (:...ids)", { ids: Array.from(candidateStudentIds) })
            .getMany()
        : [];

      for (const student of studentsForCleanup) {
        const otherInvoiceLinks = await queryRunner.manager
          .createQueryBuilder()
          .from("invoice_student", "is")
          .where("is.studentId = :studentId", { studentId: student.id })
          .getCount();

        const otherPrimaryInvoices = await invoiceRepo
          .createQueryBuilder("invoice")
          .where("invoice.studentId = :studentId", { studentId: student.id })
          .getCount();

        const hasOtherAssociations =
          otherInvoiceLinks > 0 ||
          otherPrimaryInvoices > 0 ||
          (student.tourBookingId != null) ||
          (student.formResponseId != null && student.formResponseId !== response.id);

        if (hasOtherAssociations || student.status !== StudentStatus.INACTIVE) {
          if (student.formResponseId === response.id) {
            student.formResponseId = null as any;
          }
          await studentRepo.save(student);
          continue;
        }

        await userRepo.delete(student.userId);
      }

      const parentsForCleanup = candidateParentIds.size
        ? await parentRepo
            .createQueryBuilder("parent")
            .where("parent.id IN (:...ids)", { ids: Array.from(candidateParentIds) })
            .getMany()
        : [];

      for (const parent of parentsForCleanup) {
        const parentStudentLinks = await queryRunner.manager
          .createQueryBuilder()
          .from("parent_student", "ps")
          .where("ps.parentId = :parentId", { parentId: parent.id })
          .getCount();

        const parentInvoiceLinks = await queryRunner.manager
          .createQueryBuilder()
          .from("invoice_parent", "ip")
          .where("ip.parentId = :parentId", { parentId: parent.id })
          .getCount();

        if (parentStudentLinks > 0 || parentInvoiceLinks > 0 || parent.status !== ParentStatus.INACTIVE) {
          continue;
        }

        await userRepo.delete(parent.userId);
      }

      response.status = FormResponseStatus.WITHDRAW;
      await responseRepo.save(response);

      if (relatedBookingId) {
        const bookingRepo = queryRunner.manager.getRepository(TourBooking);
        const relatedBooking = await bookingRepo.findOne({ where: { id: relatedBookingId } });
        if (relatedBooking) {
          relatedBooking.status = BookingStatus.WITHDRAW;
          await bookingRepo.save(relatedBooking);
        }
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: "Form response status updated",
        response,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      logger.error(`Error withdrawing form response ${responseId}:`, error);
      return {
        success: false,
        message: error.message || "Failed to update form response status",
      };
    } finally {
      await queryRunner.release();
    }
  }

  async getResponseByIdForSchool(schoolId: number, responseId: number): Promise<FormResponseServiceResponse> {
    const response = await this.formRepository.getFormResponseRepo().findOne({
      where: { id: responseId },
      relations: [
        "form",
        "formResponseItems",
        "formResponseItems.formItem",
        "formResponseItems.formItem.options",
        "formResponseItems.selectedOption",
      ],
    });

    if (!response?.form) {
      return { success: false, message: "Form response not found" };
    }

    if (response.form.schoolId !== schoolId) {
      return { success: false, message: "Form response not found" };
    }

    return {
      success: true,
      message: "Form response retrieved successfully",
      response,
    };
  }

  private async getResponseById(id: number): Promise<any> {
    return await this.formRepository.getFormResponseRepo().findOne({
      where: { id },
      relations: [
        "formResponseItems",
        "formResponseItems.formItem",
        "formResponseItems.formItem.options",
        "formResponseItems.selectedOption",
      ],
    });
  }
}

export const formResponseService = new FormResponseService();
