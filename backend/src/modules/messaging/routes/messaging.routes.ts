import { Router } from 'express';
import { messagingController } from '../controllers/messaging.controller';
import {
    validateUserGetConversations,
    validateSendMessage,
    validateDeleteMessage,
    validateDeleteConversation,
    validateBulkDeleteConversations,
    validateBulkDeleteMessages,
} from '../validations/messaging.validation';
import { handleValidationErrors } from '../../shared';
import { authenticate } from '../../auth';

const router = Router();

/**
 * Route: GET /
 * Purpose: Retrieve all conversations for a user.
 */
router.get(
    '/',
    authenticate,
    handleValidationErrors,
    (req: any, res: any) => messagingController.getUserConversations(req, res)
);

/**
 * Route: POST /
 * Purpose: Send a message (create 1:1 chat or send in existing).
 */
router.post(
    '/',
    authenticate,
    validateSendMessage,
    handleValidationErrors,
    (req: any, res: any) => messagingController.sendMessageHttp(req, res)
);

/**
 * Route: POST /bulk-delete
 * Purpose: Delete multiple conversations for the current user only.
 */
router.post(
    '/bulk-delete',
    authenticate,
    validateBulkDeleteConversations,
    handleValidationErrors,
    (req: any, res: any) => messagingController.deleteConversations(req, res)
);

/**
 * Route: POST /:conversationId/messages/bulk-delete
 * Purpose: Delete multiple messages for the current user only.
 */
router.post(
    '/:conversationId/messages/bulk-delete',
    authenticate,
    validateBulkDeleteMessages,
    handleValidationErrors,
    (req: any, res: any) => messagingController.deleteMessages(req, res)
);

/**
 * Route: DELETE /:conversationId/messages/:messageId
 * Purpose: Delete a message for the current user only.
 */
router.delete(
    '/:conversationId/messages/:messageId',
    authenticate,
    validateDeleteMessage,
    handleValidationErrors,
    (req: any, res: any) => messagingController.deleteMessages(req, res)
);

/**
 * Route: DELETE /:conversationId
 * Purpose: Delete a conversation for the current user only (hide from list).
 */
router.delete(
    '/:conversationId',
    authenticate,
    validateDeleteConversation,
    handleValidationErrors,
    (req: any, res: any) => messagingController.deleteConversations(req, res)
);

/**
 * Route: GET /:conversationId
 * Purpose: Retrieve all messages for a conversation.
 */
router.get(
    '/:conversationId',
    authenticate,
    validateUserGetConversations,
    handleValidationErrors,
    (req: any, res: any) => messagingController.getConversationMessages(req, res)
);

export { router as messagingRoutes };
export default router;