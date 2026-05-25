import { Request, Response } from "express";
import { countryService } from "../services/country.service";
import { logger } from "../utils/logger";

class StateController {
  /**
   * Get all states
   * GET /api/v1/states
   */
  async getAllStates(req: Request, res: Response): Promise<void> {
    try {
      const { countryCode, region, search, pos: posQuery, delta: deltaQuery } = req.query;

      const filters = {
        countryCode: countryCode ? (countryCode as string).toUpperCase() : undefined,
        region: region as string | undefined,
        search: search as string | undefined,
        ...(posQuery !== undefined && { pos: parseInt(posQuery as string, 10) }),
        ...(deltaQuery !== undefined && { delta: parseInt(deltaQuery as string, 10) }),
      };

      const result = await countryService.getAllStates(filters);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error("Error in getAllStates controller:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch states",
      });
    }
  }

  /**
   * Get state by ID
   * GET /api/v1/states/:id
   */
  async getStateById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await countryService.getStateById(id || "");

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      logger.error("Error in getStateById controller:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch state",
      });
    }
  }
}

export const stateController = new StateController();
