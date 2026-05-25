import { AppDataSource } from "../src/modules/core/config/database";
import { Attendance } from "../src/modules/shared/entities/Attendance";

/**
 * Clear all attendance records
 * 
 * Usage: ts-node scripts/clear-attendance.ts
 */

async function clearAttendance() {
  try {
    console.log("🔄 Initializing database connection...");
    await AppDataSource.initialize();
    console.log("✅ Database connected\n");

    const attendanceRepository = AppDataSource.getRepository(Attendance);

    // Count existing records
    const count = await attendanceRepository.count();
    
    if (count === 0) {
      console.log("ℹ️  No attendance records found. Nothing to delete.\n");
      await AppDataSource.destroy();
      return;
    }

    console.log(`⚠️  Found ${count.toLocaleString()} attendance records.\n`);

    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question('Are you sure you want to DELETE ALL attendance records? (yes/no): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log("\n❌ Operation cancelled. No records were deleted.");
      await AppDataSource.destroy();
      return;
    }

    console.log("\n🗑️  Deleting all attendance records...");
    await attendanceRepository.clear();
    
    console.log("✅ All attendance records deleted successfully!\n");

    await AppDataSource.destroy();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error clearing attendance:", error);
    process.exit(1);
  }
}

// Run the script
clearAttendance();

