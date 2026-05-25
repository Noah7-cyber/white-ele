import dotenv from "dotenv";
import http from "http";
import { createApp } from "./app";
import { AppDataSource } from "./modules/core";
import { countrySeederService } from "./modules/shared/seed/country-seeder.service";
import { qualificationSeederService } from "./modules/shared/seed/qualification-seeder.service";
import { websocketService } from "./modules/notification";
import { CitySeederService } from "./modules/shared/services/city-seeder.service";
import { StateSeederService } from "./modules/shared/services/state-seeder.service";
import { cronService } from "./modules/cron/services/cron.service";
import { curriculumTemplateSeederService } from "./modules/shared/seed/curriculum-template-seeder.service";
import { subscriptionCatalogSeederService } from "./modules/shared/seed/subscription-catalog-seeder.service";
import { rolesService } from "./modules/roles";

dotenv.config();

const PORT = process.env["PORT"] || 3001;

const startServer = async () =>
  AppDataSource.initialize()
    .then(async () => {
      // Seed countries if database is empty
      try {
        await countrySeederService.seedCountries();
      } catch (error: any) {
        console.error("⚠️ Country seeding failed (server will continue):", error.message);
      }

      // Seed qualification
      await qualificationSeederService.seedQualifications();

      // Seed states if database is empty
      const stateSeeder = new StateSeederService();
      await stateSeeder.seedStates();

      // Seed cities after states are seeded
      const citySeeder = new CitySeederService();
      await citySeeder.reseedCities();

      // Seed system curriculum templates (idempotent)
      await curriculumTemplateSeederService.seedSystemCurriculumTemplates();

      try {
        await subscriptionCatalogSeederService.syncCatalog();
      } catch (error: any) {
        console.error("Subscription catalog sync failed (server will continue):", error?.message || error);
      }

      try {
        await rolesService.bootstrapSystemSchoolSuperAdminRoles();
      } catch (error: any) {
        console.error("System Super Admin school roles bootstrap failed (server will continue):", error?.message || error);
      }

      const app = createApp();

      // Create HTTP server
      const httpServer = http.createServer(app);

      websocketService.initialize(httpServer);

      // Initialize Cron Service
      cronService.initialize();

      httpServer.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
      });
    })
    .catch((error) => {
      console.error("Failed to initialize database:", error);
      console.error("Failed to start server:", error);
      process.exit(1);
    });

startServer();

export { createApp };
