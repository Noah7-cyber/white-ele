import { body, param, ValidationChain } from 'express-validator';

/**
 * Validation chain for creating a new conversation .
 * Requires two unique user IDs (integers).
 */
export const validateCreateConversation: ValidationChain[] = [
    // userA Validation (User ID)
    body("userA")
        .notEmpty()
        .withMessage("User A ID is required")
        .isInt({ min: 1 })
        .withMessage("User A must be a valid positive integer")
        .toInt(),

    // userB Validation (User ID)
    body("userB")
        .notEmpty()
        .withMessage("User B ID is required")
        .isInt({ min: 1 })
        .withMessage("User B must be a valid positive integer")
        .toInt(),

    // Custom check: Ensure userA and userB are not the same
    body("userA").custom((value, { req }) => {
        if (value === req.body.userB) {
            throw new Error('User A and User B must be different.');
        }
        return true;
    }),
];

/**
 * Validation chain for sending a new message 
 */
export const validateSendMessage: ValidationChain[] = [
    body("conversationId")
        .optional({ values: "falsy" })
        .isInt({ min: 1 })
        .withMessage("Conversation ID must be a valid positive integer")
        .toInt(),

    // receiverId is required when creating a new conversation (conversationId omitted)
    body("receiverId")
        .optional({ values: "falsy" })
        .isInt({ min: 1 })
        .withMessage("Receiver ID must be a valid positive integer")
        .toInt(),

    // content can be empty only if mediaUrl is provided
    body("content")
        .optional({ nullable: true })
        .customSanitizer((value) => (typeof value === "string" ? value.trim() : value))
        .custom((value) => {
            if (value == null || value === "") return true;
            if (typeof value !== "string") throw new Error("Message content must be a string");
            if (value.length > 2000) throw new Error("Message content must be between 1 and 2000 characters");
            return true;
        }),

    body("messageSubject")
        .optional({ nullable: true })
        .isString()
        .withMessage("Message subject must be a string")
        .isLength({ max: 255 })
        .withMessage("Message subject must not exceed 255 characters"),

    body("mediaUrl")
        .optional({ nullable: true })
        .customSanitizer((value) => {
            if (typeof value === "string") return value.trim();
            if (Array.isArray(value)) {
                return value
                    .map((v) => (typeof v === "string" ? v.trim() : v))
                    .filter((v) => typeof v === "string" && v.length > 0);
            }
            return value;
        })
        .custom((value) => {
            if (value == null || value === "") return true;
            const values = Array.isArray(value) ? value : [value];
            if (!values.every((v) => typeof v === "string")) {
                throw new Error("mediaUrl must be a string or an array of strings");
            }
            if (!values.every((v) => v.length <= 500)) {
                throw new Error("Each mediaUrl must not exceed 500 characters");
            }
            return true;
        }),

    // Require: (conversationId OR receiverId) AND (content OR mediaUrl)
    body().custom((_, { req }) => {
        const hasConversationId = req.body.conversationId != null && String(req.body.conversationId).trim().length > 0;
        const hasReceiverId = req.body.receiverId != null && String(req.body.receiverId).trim().length > 0;
        if (!hasConversationId && !hasReceiverId) {
            throw new Error("conversationId or receiverId is required");
        }

        const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
        const mediaUrl = req.body.mediaUrl;
        const hasMedia =
            (typeof mediaUrl === "string" && mediaUrl.trim().length > 0) ||
            (Array.isArray(mediaUrl) && mediaUrl.some((v) => typeof v === "string" && v.trim().length > 0));

        if (!content && !hasMedia) {
            throw new Error("Message content or mediaUrl is required");
        }
        return true;
    }),
];

/**
 * Validation chain for retrieving user conversations   
 */
export const validateUserGetConversations: ValidationChain[] = [
    param("conversationId")
        .notEmpty()
        .withMessage("Conversation ID parameter is required")
        .isInt({ min: 1 })
        .withMessage("Conversation ID must be a valid positive integer")
        .toInt(),
];

/**
 * Validation for delete message (params: conversationId, messageId).
 */
export const validateDeleteMessage: ValidationChain[] = [
    param("conversationId")
        .notEmpty()
        .withMessage("Conversation ID is required")
        .isInt({ min: 1 })
        .withMessage("Conversation ID must be a valid positive integer")
        .toInt(),
    param("messageId")
        .notEmpty()
        .withMessage("Message ID is required")
        .isInt({ min: 1 })
        .withMessage("Message ID must be a valid positive integer")
        .toInt(),
];

/**
 * Validation for delete single conversation (param: conversationId).
 */
export const validateDeleteConversation: ValidationChain[] = [
    param("conversationId")
        .notEmpty()
        .withMessage("Conversation ID is required")
        .isInt({ min: 1 })
        .withMessage("Conversation ID must be a valid positive integer")
        .toInt(),
];

/**
 * Validation for bulk delete conversations (body: conversationIds array).
 */
export const validateBulkDeleteConversations: ValidationChain[] = [
    body("conversationIds")
        .isArray()
        .withMessage("conversationIds must be an array")
        .notEmpty()
        .withMessage("conversationIds must not be empty")
        .isLength({ max: 100 })
        .withMessage("conversationIds must not exceed 100 items"),
    body("conversationIds.*")
        .isInt({ min: 1 })
        .withMessage("Each conversation ID must be a valid positive integer")
        .toInt(),
];


/**
 * Validation for bulk delete messages (body: messageIds array).
 */
export const validateBulkDeleteMessages: ValidationChain[] = [
    param("conversationId")
        .notEmpty()
        .withMessage("Conversation ID is required")
        .isInt({ min: 1 })
        .withMessage("Conversation ID must be a valid positive integer")
        .toInt(),
    body("messageIds")
        .isArray()
        .withMessage("messageIds must be an array")
        .notEmpty()
        .withMessage("messageIds must not be empty")
        .isLength({ max: 100 })
        .withMessage("messageIds must not exceed 100 items"),
    body("messageIds.*")
        .isInt({ min: 1 })
        .withMessage("Each message ID must be a valid positive integer")
        .toInt(),
];