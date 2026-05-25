import { Router } from "express";
import { announcementController } from "../controller/announcement.controller";
import { authenticate } from "../../auth";
import {
    validateCreateAnnouncement,
    validateAnnouncementId,
    validateUpdateAnnouncement,
    validateListAnnouncements,
    validateDeleteAnnouncement,
} from "../validation/announcement.validation";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { Resources, Action } from "../../auth/constants/role-permissions";

const router = Router();

/**
 * @route GET /announcements
 * @desc List announcements with optional filters
 * @access Authenticated
 */
router.get(
    "/",
    authenticate,
    validateListAnnouncements,
    handleValidationErrors,
    (req: any, res: any) => announcementController.listAnnouncements(req, res)
);

/**
 * @route POST /announcements
 * @desc Create a new announcement
 * @access Admin/Super Admin only
 */
router.post(
    "/",
    authenticate,
    requirePermission({ resource: Resources.ANNOUNCEMENT, action: Action.CREATE }),
    validateCreateAnnouncement,
    handleValidationErrors,
    (req: any, res: any) => announcementController.createAnnouncement(req, res)
);

/**
 * @route GET /announcements/:id
 * @desc Get announcement by ID
 * @access Authenticated
 */
router.get(
    "/:id",
    authenticate,
    validateAnnouncementId,
    handleValidationErrors,
    (req: any, res: any) => announcementController.getAnnouncementById(req, res)
);

/**
 * @route PATCH /announcements/:id
 * @desc Update an announcement
 * @access Admin/Super Admin only
 */
router.put(
    "/:id",
    authenticate,
    requirePermission({ resource: Resources.ANNOUNCEMENT, action: Action.UPDATE }),
    validateUpdateAnnouncement,
    handleValidationErrors,
    (req: any, res: any) => announcementController.updateAnnouncement(req, res)
);

/**
 * @route DELETE /announcements/:id
 * @desc Delete an announcement
 * @access Admin/Super Admin only
 */
router.delete(
    "/:id",
    authenticate,
    requirePermission({ resource: Resources.ANNOUNCEMENT, action: Action.DELETE }),
    validateDeleteAnnouncement,
    handleValidationErrors,
    (req: any, res: any) => announcementController.deleteAnnouncement(req, res)
);

export { router as announcementRoutes };
export default router;
