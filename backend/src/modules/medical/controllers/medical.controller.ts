import { validationResult } from "express-validator";
import { medicalService } from "../services/medical.service";


export class MedicalController {
    // POST students medical info
    async createMedicalRecord(req: any, res: any) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
            const medicalData = req.body;
            const medicalRecord = await medicalService.createMedicalRecord(medicalData);
            res.status(201).json(medicalRecord);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}