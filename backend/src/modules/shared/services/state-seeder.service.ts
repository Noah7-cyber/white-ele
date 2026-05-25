import axios from "axios";
import { AppDataSource } from "../../core/config/database";
import { State } from "../entities/State";
import { Country } from "../entities/Country";
import { logger } from "../utils/logger";

export class StateSeederService {
  private stateRepository = AppDataSource.getRepository(State);
  private countryRepository = AppDataSource.getRepository(Country);
  private readonly BASE_URL = "https://api.countrystatecity.in/v1/countries";
  private readonly API_KEY = process.env["CSC_API_KEY"];

  // List of country codes to seed
  private readonly COUNTRY_CODES = [
    "NG", // Nigeria
    "GH", // Ghana 
  ];

  async seedStates(): Promise<void> {
    try {
      if (!this.API_KEY) {
        logger.error("❌ Missing CSC_API_KEY in environment variables.");
        return;
      }

      const headers = { "X-CSCAPI-KEY": this.API_KEY };
      const allStates: State[] = [];

      // Get distinct country codes already in DB
      const existingCountries = await this.stateRepository
        .createQueryBuilder("state")
        .select("DISTINCT state.countryCode", "countryCode")
        .getRawMany();

      const existingCodes = existingCountries.map((row) => row.countryCode);
      let countriesToSeed = this.COUNTRY_CODES.filter(
        (code) => !existingCodes.includes(code)
      );

      // Verify countries exist in the database before seeding states
      if (countriesToSeed.length > 0) {
        const dbCountries = await this.countryRepository.find({
          where: countriesToSeed.map(code => ({ countryCode: code }))
        });
        const dbCodes = dbCountries.map(c => c.countryCode);

        const missingCountries = countriesToSeed.filter(code => !dbCodes.includes(code));
        if (missingCountries.length > 0) {
          logger.warn(`⚠️ Cannot seed states for ${missingCountries.join(", ")} - countries not found in database.`);
          countriesToSeed = countriesToSeed.filter(code => dbCodes.includes(code));
        }
      }
      const skippedCountries = this.COUNTRY_CODES.filter((code) =>
        existingCodes.includes(code)
      );

      if (countriesToSeed.length === 0) {
        logger.info("✅ All listed countries already have states in the database.");
        return;
      }

      logger.info(
        `🌍 Seeding states for ${countriesToSeed.length} unseeded countries...`
      );

      const seededCountries: string[] = [];

      for (const code of countriesToSeed) {
        try {
          const url = `${this.BASE_URL}/${code}/states`;
          logger.info(`📡 Fetching states for ${code}...`);
          const response = await axios.get(url, { headers, timeout: 20000 });

          const statesData = response.data;

          if (!Array.isArray(statesData) || statesData.length === 0) {
            logger.warn(`⚠️ No states found for ${code}.`);
            continue;
          }

          const countryStates = statesData.map(
            (s: any) =>
              new State({
                name: s.name,
                code: s.iso2,
                countryCode: code,
              })
          );

          allStates.push(...countryStates);
          seededCountries.push(code);
          logger.info(`✅ Retrieved ${countryStates.length} states for ${code}.`);
        } catch (err: any) {
          logger.error(`❌ Failed to fetch states for ${code}: ${err.message}`);
        }
      }

      if (allStates.length === 0) {
        logger.warn("⚠️ No new states fetched for any country.");
        return;
      }

      logger.info(`💾 Saving ${allStates.length} new states to database...`);
      await this.stateRepository.save(allStates, { chunk: 100 });
      logger.info(`✅ Successfully seeded ${allStates.length} states into database.`);

      // ✅ Log Summary
      logger.info("📊 --- Seeding Summary ---");
      if (seededCountries.length > 0)
        logger.info(`✅ Seeded: ${seededCountries.join(", ")}`);
      if (skippedCountries.length > 0)
        logger.info(`⏭️ Skipped (already in DB): ${skippedCountries.join(", ")}`);
      const failed = this.COUNTRY_CODES.filter(
        (code) =>
          !seededCountries.includes(code) &&
          !skippedCountries.includes(code)
      );
      if (failed.length > 0)
        logger.warn(`❌ Failed: ${failed.join(", ")}`);
      logger.info("--------------------------");
    } catch (error: any) {
      logger.error("Failed to seed states:", error.message || error);
    }
  }

  async reseedStates(
    forceUpdate: boolean = false
  ): Promise<{ success: boolean; message: string; count: number }> {
    try {
      if (forceUpdate) {
        await this.stateRepository.delete({});
        logger.info("🗑️ Cleared existing states for reseeding");
      }

      await this.seedStates();
      const count = await this.stateRepository.count();

      return {
        success: true,
        message: forceUpdate ? "States reseeded successfully" : "States seeded successfully",
        count,
      };
    } catch (error: any) {
      logger.error("Manual state reseeding failed:", error);
      return {
        success: false,
        message: error.message || "Failed to reseed states",
        count: 0,
      };
    }
  }
}

export const stateSeederService = new StateSeederService();
