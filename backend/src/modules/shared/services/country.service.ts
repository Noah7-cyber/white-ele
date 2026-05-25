import { AppDataSource } from "../../core/config/database";
import { City } from "../entities/City";
import { Country } from "../entities/Country";
import { State } from "../entities/State";
import { logger } from "../utils/logger";


export interface StateFilters {
  countryCode?: string;
  region?: string;
  search?: string;
  pos?: number; // starting index
  delta?: number; // items per page
}

export interface CityFilters {
  stateId?: number;
  search?: string;
  countryCode?: string;
  stateCode?: string;
  stateName?: string;
  pos?: number; // starting index
  delta?: number; // items per page
}


class CountryService {
  private countryRepository = AppDataSource.getRepository(Country);
  private stateRepository = AppDataSource.getRepository(State);
  private cityRepository = AppDataSource.getRepository(City);

  /**
   * Get all countries
   */
  async getAllCountries(filters?: { region?: string; isActive?: boolean; search?: string }): Promise<{
    success: boolean;
    message: string;
    countries: Country[];
    total: number;
  }> {
    try {
      const queryBuilder = this.countryRepository.createQueryBuilder("country");

      // Apply filters
      if (filters?.region) {
        queryBuilder.andWhere("country.region = :region", { region: filters.region });
      }

      if (filters?.isActive !== undefined) {
        queryBuilder.andWhere("country.isActive = :isActive", { isActive: filters.isActive });
      }

      if (filters?.search) {
        queryBuilder.andWhere("(country.name LIKE :search OR country.countryCode LIKE :search)", {
          search: `%${filters.search}%`,
        });
      }

      // Order by name
      queryBuilder.orderBy("country.name", "ASC");

      const countries = await queryBuilder.getMany();

      return {
        success: true,
        message: "Countries retrieved successfully",
        countries,
        total: countries.length,
      };
    } catch (error: any) {
      logger.error("Error fetching countries:", error);
      throw new Error("Failed to fetch countries");
    }
  }

  /**
   * Get country by code
   */
  async getCountryByCode(countryCode: string): Promise<{
    success: boolean;
    message: string;
    country: Country | null;
  }> {
    try {
      const country = await this.countryRepository.findOne({
        where: { countryCode: countryCode.toUpperCase() },
        relations: ["states"],
      });

      if (!country) {
        return {
          success: false,
          message: "Country not found",
          country: null,
        };
      }

      return {
        success: true,
        message: "Country retrieved successfully",
        country,
      };
    } catch (error: any) {
      logger.error("Error fetching country by code:", error);
      throw new Error("Failed to fetch country");
    }
  }

  /**
   * Get all unique regions
   */
  async getRegions(): Promise<{
    success: boolean;
    message: string;
    regions: string[];
  }> {
    try {
      const countries = await this.countryRepository.find({
        select: ["region"],
        where: { isActive: true },
      });

      const regions = [...new Set(countries.map((c) => c.region).filter(Boolean))].sort();

      return {
        success: true,
        message: "Regions retrieved successfully",
        regions: regions as string[],
      };
    } catch (error: any) {
      logger.error("Error fetching regions:", error);
      throw new Error("Failed to fetch regions");
    }
  }

  
  /**
   * Get all states
   */
  async getAllStates(filters?: StateFilters): Promise<{
    success: boolean;
    message: string;
    states: State[];
    pagination?: { pos: number; delta: number; count: number };
  }> {
    try {
      const queryBuilder = this.stateRepository
        .createQueryBuilder("state")
        .leftJoin("state.country", "country");

      if (filters?.countryCode) {
        queryBuilder.andWhere("state.countryCode = :countryCode", {
          countryCode: filters.countryCode.toUpperCase(),
        });
      }

      if (filters?.region) {
        queryBuilder.andWhere("country.region = :region", { region: filters.region });
      }

      if (filters?.search) {
        queryBuilder.andWhere("(state.name LIKE :search OR state.code LIKE :search)", {
          search: `%${filters.search}%`,
        });
      }

      queryBuilder.orderBy("state.name", "ASC");

      const usePagination = filters?.pos !== undefined || filters?.delta !== undefined;
      const pos = filters?.pos ?? 0;
      const delta = filters?.delta ?? 10;

      if (usePagination) {
        const count = await queryBuilder.getCount();
        const states = await queryBuilder.skip(pos).take(delta).getMany();
        return {
          success: true,
          message: "States retrieved successfully",
          states,
          pagination: { pos, delta, count },
        };
      }

      const states = await queryBuilder.getMany();
      return {
        success: true,
        message: "States retrieved successfully",
        states,
      };
    } catch (error: any) {
      logger.error("Error fetching states:", error);
      throw new Error("Failed to fetch states");
    }
  }

  /**
   * Get state by ID
   */
  async getStateById(id: string): Promise<{
    success: boolean;
    message: string;
    state: State | null;
  }> {
    try {
      const state = await this.stateRepository.findOne({
        where: { id: Number(id) },
      });

      if (!state) {
        return {
          success: false,
          message: "State not found",
          state: null,
        };
      }

      return {
        success: true,
        message: "State retrieved successfully",
        state,
      };
    } catch (error: any) {
      logger.error("Error fetching state by ID:", error);
      throw new Error("Failed to fetch state");
    }
  }

  /**
   * Get all cities
   */
  async getAllCities(filters?: CityFilters): Promise<{
    success: boolean;
    message: string;
    cities: City[];
    pagination?: { pos: number; delta: number; count: number };
  }> {
    try {
      const queryBuilder = this.cityRepository
        .createQueryBuilder("city")
        .leftJoin("city.state", "state")
        .leftJoin("state.country", "country");

      // Filter by stateId
      if (filters?.stateId) {
        queryBuilder.andWhere("city.stateId = :stateId", { stateId: filters.stateId });
      }

      // Search by city name
      if (filters?.search) {
        queryBuilder.andWhere("city.name LIKE :search", { search: `%${filters.search}%` });
      }

      if (filters?.countryCode) {
        queryBuilder.andWhere("state.countryCode = :countryCode", {
          countryCode: filters.countryCode.toUpperCase(),
        });
      }

      // Filter by stateCode
      if (filters?.stateCode) {
        queryBuilder.andWhere("state.code = :stateCode", {
          stateCode: filters.stateCode.toUpperCase(),
        });
      }

      if (filters?.stateName) {
        queryBuilder.andWhere("LOWER(state.name) LIKE LOWER(:stateName)", {
          stateName: `%${filters.stateName}%`,
        });
      }

      // Order alphabetically
      queryBuilder.orderBy("city.name", "ASC");

      const usePagination = filters?.pos !== undefined || filters?.delta !== undefined;
      const pos = filters?.pos ?? 0;
      const delta = filters?.delta ?? 10;

      if (usePagination) {
        const count = await queryBuilder.getCount();
        const cities = await queryBuilder.skip(pos).take(delta).getMany();
        return {
          success: true,
          message: "Cities retrieved successfully",
          cities,
          pagination: { pos, delta, count },
        };
      }

      const cities = await queryBuilder.getMany();
      return {
        success: true,
        message: "Cities retrieved successfully",
        cities,
      };
    } catch (error: any) {
      logger.error("Error fetching cities:", error);
      throw new Error("Failed to fetch cities");
    }
  }

  /**
   * Get city by ID
   */
  async getCityById(id: number): Promise<{
    success: boolean;
    message: string;
    city: City | null;
  }> {
    try {
      const city = await this.cityRepository.findOne({
        where: { id },
      });

      if (!city) {
        return {
          success: false,
          message: "City not found",
          city: null,
        };
      }

      return {
        success: true,
        message: "City retrieved successfully",
        city,
      };
    } catch (error: any) {
      logger.error("Error fetching city by ID:", error);
      throw new Error("Failed to fetch city");
    }
  }

}

export const countryService = new CountryService();
