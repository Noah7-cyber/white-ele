import { In } from "typeorm";
import { FormRepository } from "../../core/FormRepository";
import { logger } from "../../shared";
import { Form } from "../../shared/entities/Form";
import { FormItem } from "../../shared/entities/FormItem";
import { FormItemOption } from "../../shared/entities/FormItemOption";
import { FormResponse } from "../../shared/entities/FormResponse";
import { AppDataSource } from "../../core/config/database";
import { slugify } from "../../shared/services/utils";
import {
    CreateFormDTO,
    FormFilters,
    UpdateFormDTO,
} from "../form.dto";
import { formItemService, normalizeItemImageUrlsForCreate } from "./formItem.service";

export type {
    CreateFormDTO,
    CreateItemDTO,
    UpdateFormDTO,
    UpdateItemDTO,
    BulkUpdateItemDTO,
    SyncFormItemDTO,
    FormFilters,
} from "../form.dto";

export interface FormServiceResponse {
    success: boolean;
    message: string;
    form?: Form;
    forms?: Form[];
}

export interface FormResponseServiceResponse {
    success: boolean;
    message: string;
    response?: FormResponse;
}

class FormService {
    private formRepository: FormRepository;

    constructor() {
        this.formRepository = new FormRepository();
    }

    /** Stable JSON for clients: `imageUrls` only (no legacy `imageUrl`). */
    private shapeFormItemForResponse(item: FormItem) {
        return {
            id: item.id,
            formId: item.formId,
            title: item.title,
            type: item.type,
            imageUrls: item.imageUrls ?? null,
            isRequired: item.isRequired,
            order: item.order,
            updatedAt: item.updatedAt,
            options: (item.options ?? []).map((o: FormItemOption) => ({
                id: o.id,
                formItemId: o.formItemId,
                label: o.label,
                order: o.order,
                createdAt: o.createdAt,
                updatedAt: o.updatedAt,
            })),
        };
    }

    private shapeFormForResponse(form: Form): Form {
        return {
            id: form.id,
            title: form.title,
            slug: form.slug,
            description: form.description,
            schoolId: form.schoolId,
            school: form.school,
            status: form.status,
            createdAt: form.createdAt,
            updatedAt: form.updatedAt,
            formItems: (form.formItems ?? []).map((i) => this.shapeFormItemForResponse(i) as FormItem),
            formResponses: form.formResponses,
        } as Form;
    }

    private async generateUniqueSlug(title: string, schoolId: number): Promise<string> {
        const base = slugify(title);
        let slug = base;
        let suffix = 1;

        while (
            await this.formRepository.getFormRepo().findOne({ where: { slug, schoolId } })
        ) {
            slug = `${base}-${suffix}`;
            suffix++;
        }

        return slug;
    }

    async createForm(data: CreateFormDTO): Promise<FormServiceResponse> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { questions, ...formData } = data;
            const slug = await this.generateUniqueSlug(formData.title, formData.schoolId);

            const formObj = queryRunner.manager.create(Form, {
                ...formData,
                slug,
                formItems: (questions || []).map((q, qIndex) => {
                    const { options, imageUrls, title, type, isRequired, order } = q;
                    return {
                        title,
                        type,
                        isRequired,
                        order: order ?? qIndex,
                        imageUrls: normalizeItemImageUrlsForCreate({ imageUrls }),
                        options: (options || []).map((o, oIndex) => ({
                            label: o.label,
                            order: o.order ?? oIndex,
                        })),
                    };
                }),
            });

            const savedForm = await queryRunner.manager.save(formObj);

            await queryRunner.commitTransaction();

            return {
                success: true,
                message: "Form created successfully",
                form: this.shapeFormForResponse(savedForm),
            };
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            logger.error("Error creating form with transaction:", error);
            return {
                success: false,
                message: error.message || "Failed to create form",
            };
        } finally {
            await queryRunner.release();
        }
    }

    async getForms(filters: FormFilters = {}): Promise<FormServiceResponse> {
        try {
            const qb = this.formRepository.createFormQueryBuilder("form")
                .leftJoinAndSelect("form.formItems", "formItems")
                .leftJoinAndSelect("formItems.options", "options");

            if (filters.userId) {
                qb.leftJoinAndSelect(
                    "form.formResponses",
                    "formResponses",
                    "formResponses.userId = :userId",
                    { userId: filters.userId }
                );
            } else {
                qb.leftJoinAndSelect("form.formResponses", "formResponses");
            }

            qb.leftJoinAndSelect("formResponses.formResponseItems", "formResponseItems");

            if (filters.schoolId) {
                qb.andWhere("form.schoolId = :schoolId", { schoolId: filters.schoolId });
            }

            if (filters.formId) {
                qb.andWhere("form.id = :formId", { formId: filters.formId });
            }

            const forms = await qb.getMany();
            return {
                success: true,
                message: "Forms fetched successfully",
                forms: forms.map((f) => this.shapeFormForResponse(f)),
            };
        } catch (error: any) {
            logger.error("Error fetching forms:", error);
            return {
                success: false,
                message: error.message || "Failed to fetch forms",
            };
        }
    }

    async getFormById(
        id: number,
        filters: { userId?: number; schoolId?: number } = {}
    ): Promise<FormServiceResponse> {
        try {
            const qb = this.formRepository.createFormQueryBuilder("form")
                .leftJoinAndSelect("form.school", "school")
                .leftJoinAndSelect("form.formItems", "formItems")
                .leftJoinAndSelect("formItems.options", "options");

            if (filters.userId) {
                qb.leftJoinAndSelect(
                    "form.formResponses",
                    "formResponses",
                    "formResponses.userId = :userId",
                    { userId: filters.userId }
                );
            } else {
                qb.leftJoinAndSelect("form.formResponses", "formResponses");
            }

            qb.leftJoinAndSelect("formResponses.formResponseItems", "formResponseItems").where(
                "form.id = :id",
                { id }
            );

            if (filters.schoolId !== undefined) {
                qb.andWhere("form.schoolId = :schoolId", { schoolId: filters.schoolId });
            }

            const form = await qb.getOne();

            if (!form) {
                return {
                    success: false,
                    message: "Form not found",
                };
            }

            return {
                success: true,
                message: "Form fetched successfully",
                form: this.shapeFormForResponse(form),
            };
        } catch (error: any) {
            logger.error(`Error fetching form by ID ${id}:`, error);
            return {
                success: false,
                message: error.message || "Failed to fetch form by ID",
            };
        }
    }

    async getFormBySlug(
        slug: string,
        filters: { schoolId?: number; userId?: number } = {}
    ): Promise<FormServiceResponse> {
        try {
            const qb = this.formRepository.createFormQueryBuilder("form")
                .leftJoinAndSelect("form.school", "school")
                .leftJoinAndSelect("form.formItems", "formItems")
                .leftJoinAndSelect("formItems.options", "options");

            if (filters.userId) {
                qb.leftJoinAndSelect(
                    "form.formResponses",
                    "formResponses",
                    "formResponses.userId = :userId",
                    { userId: filters.userId }
                );
            } else {
                qb.leftJoinAndSelect("form.formResponses", "formResponses");
            }

            qb.leftJoinAndSelect("formResponses.formResponseItems", "formResponseItems").where(
                "form.slug = :slug",
                { slug }
            );

            if (filters.schoolId) {
                qb.andWhere("form.schoolId = :schoolId", { schoolId: filters.schoolId });
            }

            const form = await qb.getOne();

            if (!form) {
                return {
                    success: false,
                    message: "Form not found",
                };
            }

            return {
                success: true,
                message: "Form fetched successfully",
                form: this.shapeFormForResponse(form),
            };
        } catch (error: any) {
            logger.error(`Error fetching form by slug "${slug}":`, error);
            return {
                success: false,
                message: error.message || "Failed to fetch form by slug",
            };
        }
    }

    async updateForm(
        id: number,
        schoolId: number,
        data: UpdateFormDTO
    ): Promise<FormServiceResponse> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const form = await queryRunner.manager.findOne(Form, { where: { id, schoolId } });
            if (!form) {
                await queryRunner.rollbackTransaction();
                return { success: false, message: "Form not found" };
            }

            const { items, ...formPatch } = data;
            const updatePayload: Partial<Pick<Form, "title" | "description" | "status" | "slug">> =
                {};

            if (formPatch.title !== undefined) {
                updatePayload.title = formPatch.title;
            }
            if (formPatch.description !== undefined) {
                updatePayload.description = formPatch.description;
            }
            if (formPatch.status !== undefined) {
                updatePayload.status = formPatch.status;
            }
            if (formPatch.slug !== undefined) {
                const normalized = slugify(formPatch.slug);
                const conflicting = await queryRunner.manager.findOne(Form, {
                    where: { slug: normalized, schoolId },
                });
                if (conflicting && conflicting.id !== id) {
                    await queryRunner.rollbackTransaction();
                    return {
                        success: false,
                        message: "A form with this slug already exists for this school",
                    };
                }
                updatePayload.slug = normalized;
            }

            if (Object.keys(updatePayload).length > 0) {
                await queryRunner.manager.update(Form, id, updatePayload);
            }

            if (items !== undefined) {
                const existingItems = await queryRunner.manager.find(FormItem, {
                    where: { formId: id },
                    select: ["id"],
                });
                const dbIds = existingItems.map((i) => i.id);
                const payloadIds = items
                    .filter((i) => i.id !== undefined && i.id !== null)
                    .map((i) => i.id as number);
                if (payloadIds.length !== new Set(payloadIds).size) {
                    await queryRunner.rollbackTransaction();
                    return { success: false, message: "Duplicate item ids in payload" };
                }
                const idsToDelete = dbIds.filter((dbid) => !payloadIds.includes(dbid));
                if (idsToDelete.length > 0) {
                    await queryRunner.manager.delete(FormItem, {
                        id: In(idsToDelete),
                        formId: id,
                    });
                }

                for (let index = 0; index < items.length; index++) {
                    const entry = items[index]!;
                    if (entry.id != null) {
                        const { id: itemId, ...rest } = entry;
                        const bulkResult = await formItemService.bulkUpdateItems(
                            id,
                            [{ id: itemId, ...rest }],
                            queryRunner
                        );
                        if (!bulkResult.success) {
                            throw new Error(bulkResult.message);
                        }
                    } else {
                        const { id: _omit, ...createFields } = entry;
                        const title = createFields.title;
                        const type = createFields.type;
                        const isRequired = createFields.isRequired;
                        if (title === undefined || type === undefined || isRequired === undefined) {
                            throw new Error("New form items require title, type, and isRequired");
                        }
                        await formItemService.createFormItemWithManager(
                            queryRunner.manager,
                            id,
                            {
                                title,
                                type,
                                isRequired,
                                imageUrls: createFields.imageUrls,
                                order: createFields.order ?? index,
                                options: createFields.options,
                            }
                        );
                    }
                }
            }

            await queryRunner.commitTransaction();
            return this.getFormById(id, { schoolId });
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            logger.error(`Error updating form ${id}:`, error);
            return {
                success: false,
                message: error.message || "Failed to update form",
            };
        } finally {
            await queryRunner.release();
        }
    }

    async deleteForm(id: number, schoolId: number): Promise<FormServiceResponse> {
        try {
            const existing = await this.getFormById(id, { schoolId });
            if (!existing.success) return existing;

            await this.formRepository.getFormRepo().delete(id);
            return {
                success: true,
                message: "Form deleted successfully",
            };
        } catch (error: any) {
            logger.error(`Error deleting form ${id}:`, error);
            return {
                success: false,
                message: error.message || "Failed to delete form",
            };
        }
    }
}

export const formService = new FormService();
