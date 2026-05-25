import { AppDataSource } from "../src/modules/core/config/database";
import { Attendance } from "../src/modules/shared/entities/Attendance";
import { Student } from "../src/modules/shared/entities/StudentEntity";
import { Staff } from "../src/modules/shared/entities/Staff";
import { Classroom } from "../src/modules/shared/entities/Classroom";
import { AttendanceStatus } from "../src/modules/shared/entities/EntityEnums";

/**
 * Seed attendance data for both students and staff from 2022 to 2026
 * 
 * Usage: ts-node scripts/seed-attendance-data.ts
 * 
 * Features:
 * - Covers 2022-2026 (5 years of data)
 * - Realistic attendance patterns
 * - Weekdays only (Mon-Fri)
 * - Varied statuses with realistic distribution
 * - Sets both 'date' and 'createdAt' fields
 */

interface AttendancePattern {
  present: number;
  absent: number;
  late: number;
  excused: number;
  leave: number;
}

// Realistic attendance distribution (percentages)
const STUDENT_PATTERN: AttendancePattern = {
  present: 85,  // 85% present
  absent: 5,    // 5% absent
  late: 7,      // 7% late
  excused: 2,   // 2% excused
  leave: 1      // 1% on leave
};

const STAFF_PATTERN: AttendancePattern = {
  present: 92,  // 92% present (staff more consistent)
  absent: 2,    // 2% absent
  late: 3,      // 3% late
  excused: 2,   // 2% excused
  leave: 1      // 1% on leave
};

/**
 * Get random attendance status based on probability distribution
 */
function getRandomStatus(pattern: AttendancePattern): AttendanceStatus {
  const rand = Math.random() * 100;
  let cumulative = 0;

  if (rand < (cumulative += pattern.present)) return AttendanceStatus.PRESENT;
  if (rand < (cumulative += pattern.absent)) return AttendanceStatus.ABSENT;
  if (rand < (cumulative += pattern.late)) return AttendanceStatus.LATE;
  if (rand < (cumulative += pattern.excused)) return AttendanceStatus.EXCUSED;
  return AttendanceStatus.LEAVE;
}

/**
 * Check if date is a weekday (Monday-Friday)
 */
function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Generate all weekdays between two dates
 */
function getWeekdaysBetween(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isWeekday(currentDate)) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Get random time for attendance (between 7 AM and 9 AM for time-in)
 */
function getRandomTimeIn(): string {
  const hour = 7 + Math.floor(Math.random() * 2); // 7 or 8
  const minute = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
}

/**
 * Get random time for time-out (between 3 PM and 5 PM)
 */
function getRandomTimeOut(): string {
  const hour = 15 + Math.floor(Math.random() * 2); // 15 or 16 (3 PM or 4 PM)
  const minute = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
}

/**
 * Main seeding function
 */
async function seedAttendanceData() {
  try {
    console.log("🔄 Initializing database connection...");
    await AppDataSource.initialize();
    console.log("✅ Database connected\n");

    const attendanceRepository = AppDataSource.getRepository(Attendance);
    const studentRepository = AppDataSource.getRepository(Student);
    const staffRepository = AppDataSource.getRepository(Staff);
    const classroomRepository = AppDataSource.getRepository(Classroom);

    // Date range: 2022-01-01 to 2026-12-31
    const startDate = new Date('2022-01-01');
    const endDate = new Date('2026-12-31');

    console.log(`📅 Generating attendance for: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

    // Get all weekdays in the range
    const weekdays = getWeekdaysBetween(startDate, endDate);
    console.log(`📊 Total weekdays: ${weekdays.length}\n`);

    // Fetch all students, staff, and classrooms
    const students = await studentRepository.find({ relations: ['school'] });
    const staff = await staffRepository.find({ relations: ['school'] });
    const classrooms = await classroomRepository.find();

    console.log(`👥 Found ${students.length} students`);
    console.log(`👔 Found ${staff.length} staff members`);
    console.log(`🏫 Found ${classrooms.length} classrooms\n`);

    if (students.length === 0 && staff.length === 0) {
      console.log("⚠️  No students or staff found. Please seed students and staff first.");
      await AppDataSource.destroy();
      return;
    }

    // Check if attendance already exists
    const existingCount = await attendanceRepository.count();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing attendance records.`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise<string>((resolve) => {
        readline.question('Do you want to delete existing records and reseed? (yes/no): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() === 'yes') {
        console.log("🗑️  Deleting existing attendance records...");
        await attendanceRepository.clear();
        console.log("✅ Existing records deleted\n");
      } else {
        console.log("❌ Seeding cancelled");
        await AppDataSource.destroy();
        return;
      }
    }

    const attendanceRecords: Attendance[] = [];
    let recordCount = 0;
    const batchSize = 1000;

    console.log("🚀 Starting attendance generation...\n");

    // Generate student attendance
    console.log("📝 Generating student attendance...");
    for (const student of students) {
      // Assign student to a random classroom if not assigned
      const classroomId = student.classroomId || (classrooms.length > 0 ? classrooms[Math.floor(Math.random() * classrooms.length)]!.id : undefined);

      for (const date of weekdays) {
        const status = getRandomStatus(STUDENT_PATTERN);
        
        // Create attendance record with createdAt slightly after the date
        const createdAt = new Date(date);
        createdAt.setHours(Math.floor(Math.random() * 4) + 8); // Created between 8 AM - 12 PM on that day
        createdAt.setMinutes(Math.floor(Math.random() * 60));

        const attendance = new Attendance({
          date,
          status,
          timeIn: status !== AttendanceStatus.ABSENT ? getRandomTimeIn() : undefined,
          timeOut: status === AttendanceStatus.PRESENT ? getRandomTimeOut() : undefined,
          studentId: student.id,
          classroomId: classroomId || undefined,
          schoolId: student.schoolId,
          createdAt,
          updatedAt: createdAt,
        });

        attendanceRecords.push(attendance);
        recordCount++;

        // Save in batches
        if (attendanceRecords.length >= batchSize) {
          await attendanceRepository.save(attendanceRecords);
          console.log(`   ✅ Saved ${recordCount} records (${Math.round((recordCount / (students.length * weekdays.length)) * 100)}% of students)`);
          attendanceRecords.length = 0; // Clear array
        }
      }
    }

    // Save remaining student attendance
    if (attendanceRecords.length > 0) {
      await attendanceRepository.save(attendanceRecords);
      console.log(`   ✅ Saved ${recordCount} student attendance records\n`);
      attendanceRecords.length = 0;
    }

    // Generate staff attendance
    console.log("📝 Generating staff attendance...");
    let staffRecordCount = 0;
    for (const staffMember of staff) {
      for (const date of weekdays) {
        const status = getRandomStatus(STAFF_PATTERN);
        
        // Create attendance record with createdAt slightly after the date
        const createdAt = new Date(date);
        createdAt.setHours(Math.floor(Math.random() * 4) + 8); // Created between 8 AM - 12 PM on that day
        createdAt.setMinutes(Math.floor(Math.random() * 60));

        const attendance = new Attendance({
          date,
          status,
          timeIn: status !== AttendanceStatus.ABSENT ? getRandomTimeIn() : undefined,
          timeOut: status === AttendanceStatus.PRESENT ? getRandomTimeOut() : undefined,
          teacherId: staffMember.id,
          schoolId: staffMember.schoolId,
          createdAt,
          updatedAt: createdAt,
        });

        attendanceRecords.push(attendance);
        staffRecordCount++;

        // Save in batches
        if (attendanceRecords.length >= batchSize) {
          await attendanceRepository.save(attendanceRecords);
          console.log(`   ✅ Saved ${staffRecordCount} records (${Math.round((staffRecordCount / (staff.length * weekdays.length)) * 100)}% of staff)`);
          attendanceRecords.length = 0; // Clear array
        }
      }
    }

    // Save remaining staff attendance
    if (attendanceRecords.length > 0) {
      await attendanceRepository.save(attendanceRecords);
      console.log(`   ✅ Saved ${staffRecordCount} staff attendance records\n`);
    }

    const totalRecords = recordCount + staffRecordCount;

    console.log("\n" + "=".repeat(60));
    console.log("✅ Attendance seeding completed successfully!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   - Student attendance records: ${recordCount.toLocaleString()}`);
    console.log(`   - Staff attendance records: ${staffRecordCount.toLocaleString()}`);
    console.log(`   - Total records created: ${totalRecords.toLocaleString()}`);
    console.log(`   - Date range: 2022-01-01 to 2026-12-31`);
    console.log(`   - Weekdays covered: ${weekdays.length}`);
    console.log("=".repeat(60) + "\n");

    // Display status distribution
    const statusCounts = await attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('attendance.status')
      .getRawMany();

    console.log("📈 Status Distribution:");
    statusCounts.forEach(row => {
      const percentage = ((parseInt(row.count) / totalRecords) * 100).toFixed(2);
      console.log(`   - ${row.status}: ${parseInt(row.count).toLocaleString()} (${percentage}%)`);
    });

    await AppDataSource.destroy();
    console.log("\n✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding attendance data:", error);
    process.exit(1);
  }
}

// Run the script
seedAttendanceData();

