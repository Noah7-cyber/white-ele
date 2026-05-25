import { Router } from "express";
import {MedicalController} from "../controllers/medical.controller";
import { createMedicalValidation } from "../validation/medical.validation";
import { authenticate } from "../../auth/middleware/middleware";

const router = Router();
const medicalController = new MedicalController();

router.use(authenticate)

router.post(
    "/",  ...createMedicalValidation, medicalController.createMedicalRecord.bind(medicalController)
);


export default router;