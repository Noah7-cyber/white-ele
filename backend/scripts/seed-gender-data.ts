import { AppDataSource } from "../src/modules/core/config/database";
import { User } from "../src/modules/shared/entities/User";
import { Gender } from "../src/modules/shared/entities/EntityEnums";

/**
 * Script to populate gender field for existing users
 * This is useful for testing the student dashboard gender statistics
 * 
 * Usage: ts-node scripts/seed-gender-data.ts
 */

async function seedGenderData() {
  try {
    console.log("🔄 Initializing database connection...");
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    const userRepository = AppDataSource.getRepository(User);

    // Get all users without gender
    const usersWithoutGender = await userRepository.find({
      where: { gender: null as any },
    });

    console.log(`📊 Found ${usersWithoutGender.length} users without gender information`);

    if (usersWithoutGender.length === 0) {
      console.log("✅ All users already have gender information");
      await AppDataSource.destroy();
      return;
    }

    // Randomly assign genders for testing purposes
    // In production, you should collect this data from users
    for (const user of usersWithoutGender) {
      // Randomly assign gender (roughly 50/50 split for testing)
      const randomGender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
      
      await userRepository.update(user.id, {
        gender: randomGender,
      });

      console.log(`✅ Updated user ${user.id} (${user.firstName} ${user.lastName}) with gender: ${randomGender}`);
    }

    console.log(`\n✅ Successfully updated ${usersWithoutGender.length} users with gender information`);

    // Display summary
    const maleCount = await userRepository.count({ where: { gender: Gender.MALE } });
    const femaleCount = await userRepository.count({ where: { gender: Gender.FEMALE } });
    const otherCount = await userRepository.count({ where: { gender: Gender.OTHER } });
    const nullCount = await userRepository.count({ where: { gender: null as any } });

    console.log("\n📊 Gender Distribution Summary:");
    console.log(`   Male: ${maleCount}`);
    console.log(`   Female: ${femaleCount}`);
    console.log(`   Other: ${otherCount}`);
    console.log(`   Not Set: ${nullCount}`);

    await AppDataSource.destroy();
    console.log("\n✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding gender data:", error);
    process.exit(1);
  }
}

// Run the script
seedGenderData();

