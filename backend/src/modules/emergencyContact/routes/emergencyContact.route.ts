import { Router } from "express";
import { EmergencyContactController } from "../controllers/emergencyContact.controller";
import { createEmergencyContactValidation } from "../validation/emergencyContact.validation";
import { authenticate } from "../../auth/middleware/middleware";

const router = Router();
const emergencyContactController = new EmergencyContactController();

router.use(authenticate)

router.post(
    "/",  ...createEmergencyContactValidation, emergencyContactController.createEmergencyContact.bind(emergencyContactController)
);


export default router;