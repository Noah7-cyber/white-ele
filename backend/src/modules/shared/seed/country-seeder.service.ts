import axios from "axios";
import { AppDataSource } from "../../core/config/database";
import { Country } from "../entities/Country";
import { logger } from "../utils/logger";

interface CountryApiResponse {
  name: string;
  alpha2Code: string;
  callingCodes: string[];
  currencies?: Array<{
    code: string;
    name: string;
    symbol: string;
  }>;
  region: string;
  flags?: {
    svg?: string;
    png?: string;
  };
  timeZone?: string;
}

class CountrySeederService {
  private countryRepository = AppDataSource.getRepository(Country);
  private readonly COUNTRIES_API_URL = "https://www.apicountries.com/countries";

  async seedCountries(): Promise<void> {
    try {
      logger.info("🌍 Fetching countries from API...");

      const response = await axios.get<CountryApiResponse[]>(this.COUNTRIES_API_URL, {
        timeout: 30000,
      });

      const countriesData = response.data;

      if (!Array.isArray(countriesData) || countriesData.length === 0) {
        logger.warn("⚠️ No countries data received from API");
        return;
      }

      logger.info(`📥 Received ${countriesData.length} countries from API`);

      const existingCountries = await this.countryRepository.find();
      const existingMap = new Map(existingCountries.map(c => [c.countryCode, c]));

      const toSave: Country[] = [];

      for (const data of countriesData) {
        const primaryCurrency = data.currencies?.[0];
        const callingCode = data.callingCodes?.[0];
        const primaryTimeZone =
          (Array.isArray((data as any).timezones) ? (data as any).timezones?.[0] : data.timeZone) ||
          null;

        const payload: Partial<Country> = {
          name: data.name,
          countryCode: data.alpha2Code,
          phoneCode: callingCode + "",
          currencyCode: primaryCurrency?.code,
          timeZones: primaryTimeZone,
          currencySymbol: primaryCurrency?.symbol,
          currencyName: primaryCurrency?.name,
          region: data.region,
          flag: data.flags?.svg || data.flags?.png,
          isActive: true,
        };

        const existing = existingMap.get(data.alpha2Code);

        if (!existing) {
          toSave.push(this.countryRepository.create(payload));
          continue;
        }

        let changed = false;

        for (const key of Object.keys(payload) as Array<keyof Country>) {
          const newValue = payload[key];
          const oldValue = existing[key];

          // If previously null OR changed → update
          if (newValue !== oldValue && newValue !== undefined) {
            (existing as Record<string, any>)[key] = newValue;
            changed = true;
          }
        }

        if (changed) {
          toSave.push(existing);
        }
      }

      if (toSave.length > 0) {
        await this.countryRepository.save(toSave, { chunk: 100 });
        logger.info(`✅ Inserted/Updated ${toSave.length} countries (diff-based sync).`);
      } else {
        logger.info("👌 Countries already up to date — no changes needed.");
      }

    } catch (error) {
      logger.error("❌ Failed to seed countries:", error);
    }
  }



  /**
   * Manually trigger country seeding (for admin use)
   */
  async reseedCountries(forceUpdate: boolean = false): Promise<{ success: boolean; message: string; count: number }> {
    try {
      if (forceUpdate) {
        await this.countryRepository.delete({});
        logger.info("🗑️ Cleared existing countries for reseeding");
      }

      await this.seedCountries();

      const count = await this.countryRepository.count();

      return {
        success: true,
        message: forceUpdate ? "Countries reseeded successfully" : "Countries seeded successfully",
        count,
      };
    } catch (error: any) {
      logger.error("Manual country reseeding failed:", error);
      return {
        success: false,
        message: error.message || "Failed to reseed countries",
        count: 0,
      };
    }
  }
}

export const countrySeederService = new CountrySeederService();
