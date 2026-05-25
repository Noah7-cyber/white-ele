import { body, param, query } from "express-validator";
import { FormItemType, FormResponseStatus, FormStatus, GUEST_REFERRAL_SOURCE } from "../../shared/entities/EntityEnums";

export interface ValidateSyncFormItemsOptions {
    forbidIds?: boolean;
}

function validateSyncFormItemsArray(
    items: unknown,
    fieldLabel: string,
    opts?: ValidateSyncFormItemsOptions
): void {
    if (!Array.isArray(items)) {
        throw new Error(`${fieldLabel} must be an array`);
    }
    for (const item of items as Record<string, unknown>[]) {
        const hasId = item["id"] !== undefined && item["id"] !== null;
        if (opts?.forbidIds && hasId) {
            throw new Error(`${fieldLabel} must not include id when creating a form`);
        }
        const treatAsUpdate = !opts?.forbidIds && hasId;
        if (treatAsUpdate) {
            const id = item["id"];
            if (typeof id !== "number" || !Number.isInteger(id) || id < 1) {
                throw new Error("Each item with id must have a positive integer id");
            }
        } else {
            if (!item["title"] || typeof item["title"] !== "string") {
                throw new Error("Item title is required for new items (no id)");
            }
            if (!item["type"]) {
                throw new Error("Item type is required for new items (no id)");
            }
            if (item["isRequired"] !== undefined && typeof item["isRequired"] !== "boolean") {
                throw new Error("isRequired must be a boolean for new items");
            }
            if (item["isRequired"] === undefined) {
                throw new Error("isRequired is required for new items (no id)");
            }
        }
        if (item["title"] !== undefined && item["title"] !== null && typeof item["title"] !== "string") {
            throw new Error("Item title must be a string");
        }
        if (item["type"] !== undefined && item["type"] !== null) {
            const t = item["type"] as string;
            if (!Object.values(FormItemType).includes(t as FormItemType)) {
                throw new Error("Item type must be a valid FormItemType");
            }
        }
        if (item["isRequired"] !== undefined && typeof item["isRequired"] !== "boolean") {
            throw new Error("isRequired must be a boolean");
        }
        const imageUrls = item["imageUrls"];
        if (imageUrls !== undefined && imageUrls !== null) {
            if (!Array.isArray(imageUrls)) {
                throw new Error("imageUrls must be an array");
            }
            for (const u of imageUrls) {
                if (typeof u !== "string" || u.trim() === "") {
                    throw new Error("Each imageUrls entry must be a non-empty string");
                }
            }
        }
        if (item["order"] !== undefined && item["order"] !== null) {
            if (typeof item["order"] !== "number" || !Number.isInteger(item["order"])) {
                throw new Error("order must be an integer");
            }
        }
        const itemOptions = item["options"];
        if (itemOptions !== undefined && itemOptions !== null) {
            if (!Array.isArray(itemOptions)) {
                throw new Error("options must be an array");
            }
            for (const opt of itemOptions as Record<string, unknown>[]) {
                if (!opt["label"] || typeof opt["label"] !== "string") {
                    throw new Error("Each option must have a non-empty string label");
                }
                if (opt["order"] !== undefined && opt["order"] !== null) {
                    if (typeof opt["order"] !== "number" || !Number.isInteger(opt["order"])) {
                        throw new Error("option order must be an integer");
                    }
                }
            }
        }
    }
}

export const createFormValidation = [
    body("title").isString().notEmpty().withMessage("Title is required"),
    body("description").optional().isString(),
    body("status").optional().isIn(Object.values(FormStatus)).withMessage("Status must be a valid FormStatus"),
    body("questions").optional().custom((val) => {
        validateSyncFormItemsArray(val, "questions", { forbidIds: true });
        return true;
    }),
];

export const updateFormValidation = [
    param("id").isInt().withMessage("Form ID must be an integer"),
    body("title").optional().isString().notEmpty(),
    body("description").optional().isString(),
    body("status").optional().isIn(Object.values(FormStatus)).withMessage("Status must be a valid FormStatus"),
    body("slug").optional().isString().notEmpty().withMessage("slug must be a non-empty string when provided"),
    body("items").optional().custom((val) => {
        validateSyncFormItemsArray(val, "items");
        return true;
    }),
    body("questions").optional().custom((val) => {
        validateSyncFormItemsArray(val, "questions");
        return true;
    }),
];

export const getFormsValidation = [
    query("formId").optional().isInt(),
    query("userId").optional().isInt(),
];

export const submitResponseValidation = [
    param("id").isInt().withMessage("Form ID must be an integer"),
    body("names")
        .optional()
        .isArray().withMessage("names must be an array")
        .custom((value) => {
            if (!Array.isArray(value) || !value.every((name: unknown) => typeof name === "string")) {
                throw new Error("All names must be strings");
            }
            if (value.some((name: string) => name.length > 50)) {
                throw new Error("Each name can have a maximum length of 50 characters");
            }
            return true;
        }),
    body("email")
        .optional()
        .isEmail().withMessage("Invalid email format")
        .isLength({ max: 50 }).withMessage("email can have a maximum length of 50 characters")
        .normalizeEmail(),
    body("referralSource")
        .optional()
        .isIn(Object.values(GUEST_REFERRAL_SOURCE))
        .withMessage(`Invalid referralSource. Must be one of: ${Object.values(GUEST_REFERRAL_SOURCE).join(", ")}`),
    body("additionalContacts")
        .optional()
        .isArray().withMessage("additionalContacts must be an array")
        .custom((value) => {
            if (!Array.isArray(value) || !value.every((contact: unknown) => typeof contact === "string")) {
                throw new Error("All additionalContacts must be strings");
            }
            return true;
        }),
    body("answers").isArray().notEmpty().withMessage("Answers are required"),
    body("answers.*.formItemId").isInt().withMessage("Form Item ID must be an integer"),
    body("answers.*.value").optional().isString(),
    body("answers.*.selectedOptionId").optional().isInt(),
];

const staffFormResponseStatuses = [
    FormResponseStatus.COMPLETED,
    FormResponseStatus.ACCEPTED,
    FormResponseStatus.REJECTED,
    FormResponseStatus.WITHDRAW,
    "withdrawn",
];

export const updateFormResponseStatusValidation = [
    param("responseId").isInt({ min: 1 }).withMessage("Response ID must be a positive integer"),
    body("status")
        .isIn(staffFormResponseStatuses)
        .withMessage(`status must be one of: ${staffFormResponseStatuses.join(", ")}`),
];

export const getFormResponseByIdValidation = [
    param("responseId").isInt({ min: 1 }).withMessage("Response ID must be a positive integer"),
];
