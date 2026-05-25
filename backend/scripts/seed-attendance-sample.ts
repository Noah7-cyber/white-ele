import { AppDataSource } from "../src/modules/core/config/database";
import { Attendance } from "../src/modules/shared/entities/Attendance";
import { Student } from "../src/modules/shared/entities/StudentEntity";
import { Staff } from "../src/modules/shared/entities/Staff";
import { Classroom } from "../src/modules/shared/entities/Classroom";
import { AttendanceStatus } from "../src/modules/shared/entities/EntityEnums";

/**
 * Seed exactly 1000 attendance records:
 * - 700 for students
 * - 300 for teachers
 * Date range: 2022-2026 (for both date and createdAt)
 * 
 * Usage: ts-node scripts/seed-attendance-sample.ts
 */

const TOTAL_STUDENT_RECORDS = 700;
const TOTAL_TEACHER_RECORDS = 300;
const START_DATE = new Date('2022-01-01');
const END_DATE = new Date('2026-12-31');

interface AttendancePattern {
  present: number;
  absent: number;
  late: number;
  excused: number;
  leave: number;
}

// Realistic attendance distribution
const STUDENT_PATTERN: AttendancePattern = {
  present: 85,
  absent: 5,
  late: 7,
  excused: 2,
  leave: 1
};

const STAFF_PATTERN: AttendancePattern = {
  present: 92,
  absent: 2,
  late: 3,
  excused: 2,
  leave: 1
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
 * Get random date between start and end (only weekdays)
 */
function getRandomWeekdayDate(start: Date, end: Date): Date {
  let randomDate: Date;
  do {
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    randomDate = new Date(randomTime);
  } while (randomDate.getDay() === 0 || randomDate.getDay() === 6); // Skip weekends

  randomDate.setHours(0, 0, 0, 0);
  return randomDate;
}

/**
 * Get createdAt timestamp (slightly after the attendance date)
 */
function getCreatedAtDate(attendanceDate: Date): Date {
  const createdAt = new Date(attendanceDate);
  // Created between 8 AM - 2 PM on the same day
  createdAt.setHours(8 + Math.floor(Math.random() * 6));
  createdAt.setMinutes(Math.floor(Math.random() * 60));
  createdAt.setSeconds(Math.floor(Math.random() * 60));
  return createdAt;
}

/**
 * Get random time for attendance (between 7 AM and 9 AM)
 */
function getRandomTimeIn(): string {
  const hour = 7 + Math.floor(Math.random() * 2);
  const minute = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
}

/**
 * Get random time for time-out (between 3 PM and 5 PM)
 */
function getRandomTimeOut(): string {
  const hour = 15 + Math.floor(Math.random() * 2);
  const minute = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
}

/**
 * Main seeding function
 */
async function seedAttendanceSample() {
  try {
    console.log("🔄 Initializing database connection...");
    await AppDataSource.initialize();
    console.log("✅ Database connected\n");

    const attendanceRepository = AppDataSource.getRepository(Attendance);
    const studentRepository = AppDataSource.getRepository(Student);
    const staffRepository = AppDataSource.getRepository(Staff);
    const classroomRepository = AppDataSource.getRepository(Classroom);

    console.log(`📅 Date Range: ${START_DATE.toISOString().split('T')[0]} to ${END_DATE.toISOString().split('T')[0]}`);
    console.log(`📊 Target Records: ${TOTAL_STUDENT_RECORDS + TOTAL_TEACHER_RECORDS} (${TOTAL_STUDENT_RECORDS} students + ${TOTAL_TEACHER_RECORDS} teachers)\n`);

    // Fetch all students, staff, and classrooms (from all schools for random selection)
    const students = await studentRepository.find({ 
      relations: ['school'],
      where: { status: 'active' }
    });
    const staff = await staffRepository.find({ 
      relations: ['school'],
      where: { status: 'active' }
    });
    const classrooms = await classroomRepository.find();

    console.log(`👥 Found ${students.length} students in database`);
    console.log(`👔 Found ${staff.length} staff members in database`);
    console.log(`🏫 Found ${classrooms.length} classrooms in database\n`);

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

    // Generate student attendance (700 records)
    console.log(`📝 Generating ${TOTAL_STUDENT_RECORDS} student attendance records...`);
    if (students.length > 0) {
      for (let i = 0; i < TOTAL_STUDENT_RECORDS; i++) {
        // Pick random student
        const student = students[Math.floor(Math.random() * students.length)]!;
        
        // Generate random weekday date
        const attendanceDate = getRandomWeekdayDate(START_DATE, END_DATE);
        const createdAt = getCreatedAtDate(attendanceDate);
        const status = getRandomStatus(STUDENT_PATTERN);
        
        // Always use the student's assigned classroom
        const classroomId = student.classroomId;

        const attendance = new Attendance({
          date: attendanceDate,
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

        // Progress indicator
        if ((i + 1) % 100 === 0 || i + 1 === TOTAL_STUDENT_RECORDS) {
          console.log(`   ✅ Generated ${i + 1}/${TOTAL_STUDENT_RECORDS} student records (${Math.round(((i + 1) / TOTAL_STUDENT_RECORDS) * 100)}%)`);
        }
      }
    } else {
      console.log("   ⚠️  No students found, skipping student attendance");
    }

    // Generate staff attendance (300 records)
    console.log(`\n📝 Generating ${TOTAL_TEACHER_RECORDS} teacher/staff attendance records...`);
    if (staff.length > 0) {
      for (let i = 0; i < TOTAL_TEACHER_RECORDS; i++) {
        // Pick random staff member
        const staffMember = staff[Math.floor(Math.random() * staff.length)]!;
        
        // Generate random weekday date
        const attendanceDate = getRandomWeekdayDate(START_DATE, END_DATE);
        const createdAt = getCreatedAtDate(attendanceDate);
        const status = getRandomStatus(STAFF_PATTERN);

        const attendance = new Attendance({
          date: attendanceDate,
          status,
          timeIn: status !== AttendanceStatus.ABSENT ? getRandomTimeIn() : undefined,
          timeOut: status === AttendanceStatus.PRESENT ? getRandomTimeOut() : undefined,
          teacherId: staffMember.id,
          schoolId: staffMember.schoolId,
          createdAt,
          updatedAt: createdAt,
        });

        attendanceRecords.push(attendance);

        // Progress indicator
        if ((i + 1) % 100 === 0 || i + 1 === TOTAL_TEACHER_RECORDS) {
          console.log(`   ✅ Generated ${i + 1}/${TOTAL_TEACHER_RECORDS} teacher records (${Math.round(((i + 1) / TOTAL_TEACHER_RECORDS) * 100)}%)`);
        }
      }
    } else {
      console.log("   ⚠️  No staff found, skipping staff attendance");
    }

    // Save all records
    console.log("\n💾 Saving all records to database...");
    await attendanceRepository.save(attendanceRecords);

    const totalRecords = attendanceRecords.length;

    console.log("\n" + "=".repeat(60));
    console.log("✅ Attendance seeding completed successfully!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   - Student attendance records: ${TOTAL_STUDENT_RECORDS.toLocaleString()}`);
    console.log(`   - Staff attendance records: ${TOTAL_TEACHER_RECORDS.toLocaleString()}`);
    console.log(`   - Total records created: ${totalRecords.toLocaleString()}`);
    console.log(`   - Date range: ${START_DATE.toISOString().split('T')[0]} to ${END_DATE.toISOString().split('T')[0]}`);
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

    // Display date range verification
    const dateRange = await attendanceRepository
      .createQueryBuilder('attendance')
      .select('MIN(attendance.date)', 'minDate')
      .addSelect('MAX(attendance.date)', 'maxDate')
      .addSelect('MIN(attendance.createdAt)', 'minCreatedAt')
      .addSelect('MAX(attendance.createdAt)', 'maxCreatedAt')
      .getRawOne();

    console.log("\n📅 Date Verification:");
    console.log(`   - Attendance dates: ${new Date(dateRange.minDate).toISOString().split('T')[0]} to ${new Date(dateRange.maxDate).toISOString().split('T')[0]}`);
    console.log(`   - Created dates: ${new Date(dateRange.minCreatedAt).toISOString().split('T')[0]} to ${new Date(dateRange.maxCreatedAt).toISOString().split('T')[0]}`);

    await AppDataSource.destroy();
    console.log("\n✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding attendance data:", error);
    process.exit(1);
  }
}

// Run the script
seedAttendanceSample();

