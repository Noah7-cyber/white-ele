import { FormItem } from "../../shared/entities/FormItem";
import { FormItemOption } from "../../shared/entities/FormItemOption";
import { CreateItemDTO, BulkUpdateItemDTO } from "../form.dto";
import { EntityManager, QueryRunner } from "typeorm";

export function normalizeItemImageUrlsForCreate(q: {
    imageUrls?: string[] | null;
}): string[] | null {
    if (q.imageUrls !== undefined && q.imageUrls !== null) {
        return q.imageUrls.length > 0 ? q.imageUrls : null;
    }
    return null;
}

/** `undefined` = do not change stored imageUrls */
export function normalizeItemImageUrlsForPatch(q: {
    imageUrls?: string[] | null;
}): string[] | null | undefined {
    if (q.imageUrls !== undefined) {
        return q.imageUrls === null || q.imageUrls.length === 0 ? null : q.imageUrls;
    }
    return undefined;
}

class FormItemService {
    async createFormItemWithManager(manager: EntityManager, formId: number, itemData: CreateItemDTO): Promise<FormItem> {
        const { options, imageUrls, title, type, isRequired, order } = itemData;
        const newItem = manager.create(FormItem, {
            title,
            type,
            isRequired,
            order: order ?? 0,
            formId,
            imageUrls: normalizeItemImageUrlsForCreate({ imageUrls }),
        });
        const savedItem = await manager.save(newItem);

        if (options && options.length > 0) {
            const optionEntities = options.map((opt, index) =>
                manager.create(FormItemOption, {
                    label: opt.label,
                    formItemId: savedItem.id,
                    order: opt.order ?? index,
                })
            );
            await manager.save(optionEntities);
        }
        return savedItem;
    }

    async bulkUpdateItems(
        formId: number,
        items: BulkUpdateItemDTO[],
        queryRunner: QueryRunner
    ): Promise<{ success: boolean; message?: string }> {
        for (const itemData of items) {
            const { id, options, imageUrls, title, type, isRequired, order } = itemData;
            const item = await queryRunner.manager.findOne(FormItem, { where: { id, formId } });
            if (!item) {
                return {
                    success: false,
                    message: `Form item ${id} not found or does not belong to form ${formId}`,
                };
            }
            const resolvedImages = normalizeItemImageUrlsForPatch({ imageUrls });
            const patch: Partial<FormItem> = {};
            if (title !== undefined) patch.title = title;
            if (type !== undefined) patch.type = type;
            if (isRequired !== undefined) patch.isRequired = isRequired;
            if (order !== undefined) patch.order = order;
            if (resolvedImages !== undefined) patch.imageUrls = resolvedImages;
            if (Object.keys(patch).length > 0) {
                await queryRunner.manager.update(FormItem, id, patch);
            }
            if (options !== undefined) {
                await queryRunner.manager.delete(FormItemOption, { formItemId: id });
                if (options.length > 0) {
                    const optionEntities = options.map((opt, index) =>
                        queryRunner.manager.create(FormItemOption, {
                            label: opt.label,
                            formItemId: id,
                            order: opt.order ?? index,
                        })
                    );
                    await queryRunner.manager.save(optionEntities);
                }
            }
        }
        return { success: true };
    }
}

export const formItemService = new FormItemService();
