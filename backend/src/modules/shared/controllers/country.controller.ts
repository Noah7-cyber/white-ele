import { Request, Response } from "express";
import { countryService } from "../services/country.service";
import { logger } from "../utils/logger";

class CountryController {
  /**
   * Get all countries
   * GET /api/v1/countries
   */
  async getAllCountries(req: Request, res: Response): Promise<void> {
    try {
      const { region, isActive, search } = req.query;

      const filters = {
        region: region as string | undefined,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
        search: search as string | undefined,
      };

      const result = await countryService.getAllCountries(filters);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error("Error in getAllCountries controller:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch countries",
      });
    }
  }

  /**
   * Get country by code
   * GET /api/v1/countries/:code
   */
  async getCountryByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const result = await countryService.getCountryByCode(code || "");

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      logger.error("Error in getCountryByCode controller:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch country",
      });
    }
  }

  /**
   * Get all regions
   * GET /api/v1/countries/regions
   */
  async getRegions(_req: Request, res: Response): Promise<void> {
    try {
      const result = await countryService.getRegions();

      res.status(200).json(result);
    } catch (error: any) {
      logger.error("Error in getRegions controller:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch regions",
      });
    }
  }
}

export const countryController = new CountryController();
