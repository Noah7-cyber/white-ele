import { validationResult } from "express-validator";
import { emergencyContactService } from "../services/emergencyContact.service";


export class EmergencyContactController {
    // POST emergency contact
    async createEmergencyContact(req: any, res: any) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
            const emergencyContactData = {
                ...req.body,
                relationship: typeof req.body.relationship === "string"
                    ? req.body.relationship.toLowerCase().trim()
                    : req.body.relationship,
            };
            const emergencyContactRecord = await emergencyContactService.createEmergencyContact(emergencyContactData);
            res.status(201).json(emergencyContactRecord);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}