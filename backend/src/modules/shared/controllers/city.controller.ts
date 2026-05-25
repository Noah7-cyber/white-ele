import { Request, Response } from "express";
import { countryService } from "../services/country.service";
import { logger } from "../utils/logger";

class CityController {
  /**
   * Get all cities
   * GET /api/v1/cities
   */
  async getAllCities(req: Request, res: Response): Promise<void> {
    try {
      const { stateId: stateIdQuery, search, pos: posQuery, delta: deltaQuery, countryCode, stateCode, stateName } = req.query;

      const stateId = stateIdQuery ? parseInt(stateIdQuery as string, 10) : undefined;

      const filters = {
        stateId,
        search: search as string | undefined,
        countryCode: countryCode ? (countryCode as string).toUpperCase() : undefined,
        stateCode: stateCode ? (stateCode as string).toUpperCase() : undefined,
        stateName: stateName as string | undefined,
        ...(posQuery !== undefined && { pos: parseInt(posQuery as string, 10) }),
        ...(deltaQuery !== undefined && { delta: parseInt(deltaQuery as string, 10) }),
      };

      const result = await countryService.getAllCities(filters);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error("Error in getAllCities controller:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch cities",
      });
    }
  }

  /**
   * Get city by ID
   * GET /api/v1/cities/:id
   */
  async getCityById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await countryService.getCityById(Number(id));

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      logger.error("Error in getCityById controller:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch city",
      });
    }
  }
}

export const cityController = new CityController();
