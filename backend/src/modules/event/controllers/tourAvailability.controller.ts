import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { tourAvailabilityService } from "../services/tourAvailability.service";
import { WeekDay } from "../../shared/entities";

class TourAvailabilityController {
    async getAll(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res
                    .status(400)
                    .json({ success: false, errors: errors.array() });
            }

            const { day, startTime, endTime, tourEventId } = req.query;

            const filters = {
                day: day as WeekDay | undefined,
                startTime: startTime as string | undefined,
                endTime: endTime as string | undefined,
                tourEventId: tourEventId ? Number(tourEventId) : undefined,
            };

            const results = await tourAvailabilityService.getAll(filters);

            return res.status(200).json({
                success: true,
                message: "Availabilities retrieved successfully",
                availabilities: results,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async getAvailabilityById(req: Request, res: Response) {
        try {
            const idParam = req.params['id'];
            if (!idParam) {
                return res.status(400).json({ success: false, message: "Availability ID is required" });
            }

            const id = parseInt(idParam, 10);
            const result = await tourAvailabilityService.getAvailabilityById(id);

            if (!result) {
                return res.status(404).json({ success: false, message: "Availability not found" });
            }

            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}

export const tourAvailabilityController = new TourAvailabilityController();
