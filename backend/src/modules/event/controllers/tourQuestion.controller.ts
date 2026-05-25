import { Request, Response } from "express";
import { tourQuestionService } from "../services/tourQuestion.service";
import { validationResult } from "express-validator";

export class TourQuestionController {
    // GET /tour-questions
    async getAllQuestions(req: Request, res: Response) {
        // Validate query params
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { tourEventId, inputType } = req.query;

            const filters = {
                tourEventId: tourEventId ? parseInt(tourEventId as string, 10) : undefined,
                inputType: inputType as string | undefined
            };

            const questions = await tourQuestionService.getAll(filters);
            return res.json({ success: true, questions });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    // GET /tour-questions/:id
    async getQuestionById(req: Request, res: Response) {
        try {
            const idParam = req.params['id'];
            if (!idParam) {
                return res.status(400).json({ success: false, message: "Question ID is required" });
            }

            const id = parseInt(idParam, 10);
            const question = await tourQuestionService.getQuestionById(id);

            if (!question) {
                return res.status(404).json({ success: false, message: "Question not found" });
            }

            return res.json({ success: true, question });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}
