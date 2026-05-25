import axios from "axios";
import { AppDataSource } from "../../core/config/database";
import { City } from "../entities/City";
import { State } from "../entities/State";
import { logger } from "../utils/logger";

export class CitySeederService {
  private cityRepository = AppDataSource.getRepository(City);
  private stateRepository = AppDataSource.getRepository(State);
  private readonly BASE_URL = "https://api.countrystatecity.in/v1/countries";
  private readonly API_KEY = process.env["CSC_API_KEY"];
  private readonly BATCH_SIZE = 10; // number of parallel requests per batch

  async seedCities(): Promise<void> {
    try {
      if (!this.API_KEY) {
        logger.error("❌ Missing CSC_API_KEY in environment variables.");
        return;
      }

      const headers = { "X-CSCAPI-KEY": this.API_KEY };

      // Fetch all states
      const states = await this.stateRepository.find();
      if (states.length === 0) {
        logger.warn("⚠️ Cannot seed cities — no states found in database.");
        return;
      }

      // Fetch state IDs that already have cities
      const existingCities = await this.cityRepository
        .createQueryBuilder("city")
        .select("DISTINCT city.stateId", "stateId")
        .getRawMany();

      const statesWithCities = existingCities.map((row) => row.stateId);
      const statesToSeed = states.filter((s) => !statesWithCities.includes(s.id));
      const skippedStates = states.filter((s) => statesWithCities.includes(s.id));

      if (statesToSeed.length === 0) {
        logger.info("✅ All states already have cities in the database.");
        return;
      }

      logger.info(
        `🌍 Starting city seeding for ${statesToSeed.length} states (skipping ${skippedStates.length}) in batches of ${this.BATCH_SIZE}...`
      );

      const allCities: City[] = [];
      const seededStates: string[] = [];
      const failedStates: string[] = [];

      // Helper function to fetch cities for a single state
      const fetchCitiesForState = async (state: State) => {
        try {
          if (!state.countryCode || !state.code) {
            logger.warn(`⚠️ Skipping state with missing codes: ${state.name}`);
            return [];
          }

          const url = `${this.BASE_URL}/${state.countryCode}/states/${state.code}/cities`;
          const response = await axios.get(url, { headers, timeout: 20000 });
          const citiesData = response.data;

          if (!Array.isArray(citiesData) || citiesData.length === 0) {
            logger.warn(`⚠️ No cities found for ${state.name}.`);
            return [];
          }

          const stateCities = citiesData.map(
            (c: any) =>
              new City({
                name: c.name,
                stateId: state.id,
              })
          );

          logger.info(`✅ Retrieved ${stateCities.length} cities for ${state.name}.`);
          seededStates.push(state.name);
          return stateCities;
        } catch (err: any) {
          logger.error(
            `❌ Failed to fetch cities for ${state.name} (${state.countryCode}-${state.code}): ${err.message}`
          );
          failedStates.push(state.name);
          return [];
        }
      };

      // Batch processing
      for (let i = 0; i < statesToSeed.length; i += this.BATCH_SIZE) {
        const batch = statesToSeed.slice(i, i + this.BATCH_SIZE);
        logger.info(
          `📦 Processing batch ${Math.ceil(i / this.BATCH_SIZE) + 1}/${Math.ceil(
            statesToSeed.length / this.BATCH_SIZE
          )}...`
        );

        const results = await Promise.allSettled(batch.map((state) => fetchCitiesForState(state)));

        for (const result of results) {
          if (result.status === "fulfilled" && result.value.length > 0) {
            allCities.push(...result.value);
          }
        }
      }

      if (allCities.length === 0) {
        logger.warn("⚠️ No new cities fetched for any state.");
        return;
      }

      logger.info(`💾 Saving ${allCities.length} new cities to database...`);
      await this.cityRepository.save(allCities, { chunk: 100 });
      logger.info(`✅ Successfully seeded ${allCities.length} cities into database.`);

      // Summary log
      logger.info("📊 --- City Seeding Summary ---");
      if (seededStates.length > 0) logger.info(`✅ Seeded: ${seededStates.join(", ")}`);
      if (skippedStates.length > 0)
        logger.info(`⏭️ Skipped (already have cities): ${skippedStates.map((s) => s.name).join(", ")}`);
      if (failedStates.length > 0) logger.warn(`❌ Failed: ${failedStates.join(", ")}`);
      logger.info("-------------------------------");
    } catch (error: any) {
      logger.error("Failed to seed cities:", error.message || error);
    }
  }

  async reseedCities(
    forceUpdate: boolean = false
  ): Promise<{ success: boolean; message: string; count: number }> {
    try {
      if (forceUpdate) {
        await this.cityRepository.delete({});
        logger.info("🗑️ Cleared existing cities for reseeding");
      }

      await this.seedCities();
      const count = await this.cityRepository.count();

      return {
        success: true,
        message: forceUpdate ? "Cities reseeded successfully" : "Cities seeded successfully",
        count,
      };
    } catch (error: any) {
      logger.error("Manual city reseeding failed:", error);
      return {
        success: false,
        message: error.message || "Failed to reseed cities",
        count: 0,
      };
    }
  }
}

export const citySeederService = new CitySeederService();
