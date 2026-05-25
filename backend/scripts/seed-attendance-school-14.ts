import { AppDataSource } from "../src/modules/core/config/database";
import { Attendance } from "../src/modules/shared/entities/Attendance";
import { Student } from "../src/modules/shared/entities/StudentEntity";
import { Staff } from "../src/modules/shared/entities/Staff";
import { AttendanceStatus } from "../src/modules/shared/entities/EntityEnums";

/**
 * Seed attendance specifically for School ID 14
 * - 700 student attendance records
 * - 300 staff attendance records
 * - Properly links to actual student classrooms
 * - Date range: 2022-2026
 * 
 * Usage: ts-node scripts/seed-attendance-school-14.ts
 */

const SCHOOL_ID = 14;
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

function getRandomStatus(pattern: AttendancePattern): AttendanceStatus {
  const rand = Math.random() * 100;
  let cumulative = 0;

  if (rand < (cumulative += pattern.present)) return AttendanceStatus.PRESENT;
  if (rand < (cumulative += pattern.absent)) return AttendanceStatus.ABSENT;
  if (rand < (cumulative += pattern.late)) return AttendanceStatus.LATE;
  if (rand < (cumulative += pattern.excused)) return AttendanceStatus.EXCUSED;
  return AttendanceStatus.LEAVE;
}

function getRandomWeekdayDate(start: Date, end: Date): Date {
  let randomDate: Date;
  do {
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    randomDate = new Date(randomTime);
  } while (randomDate.getDay() === 0 || randomDate.getDay() === 6);

  randomDate.setHours(0, 0, 0, 0);
  return randomDate;
}

function getCreatedAtDate(attendanceDate: Date): Date {
  const createdAt = new Date(attendanceDate);
  createdAt.setHours(8 + Math.floor(Math.random() * 6));
  createdAt.setMinutes(Math.floor(Math.random() * 60));
  createdAt.setSeconds(Math.floor(Math.random() * 60));
  return createdAt;
}

function getRandomTimeIn(): string {
  const hour = 7 + Math.floor(Math.random() * 2);
  const minute = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
}

function getRandomTimeOut(): string {
  const hour = 15 + Math.floor(Math.random() * 2);
  const minute = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
}

async function seedAttendanceSchool14() {
  try {
    console.log("🔄 Initializing database connection...");
    await AppDataSource.initialize();
    console.log("✅ Database connected\n");

    const attendanceRepository = AppDataSource.getRepository(Attendance);
    const studentRepository = AppDataSource.getRepository(Student);
    const staffRepository = AppDataSource.getRepository(Staff);

    console.log(`🏫 Seeding attendance for School ID ${SCHOOL_ID}`);
    console.log(`📅 Date Range: ${START_DATE.toISOString().split('T')[0]} to ${END_DATE.toISOString().split('T')[0]}`);
    console.log(`📊 Target: ${TOTAL_STUDENT_RECORDS} student + ${TOTAL_TEACHER_RECORDS} teacher records\n`);

    // Fetch only School 14 data
    const students = await studentRepository.find({ 
      where: { schoolId: SCHOOL_ID },
      relations: ['currentClassroom']
    });
    
    const staff = await staffRepository.find({ 
      where: { schoolId: SCHOOL_ID }
    });

    console.log(`👥 Found ${students.length} students for School 14`);
    console.log(`👔 Found ${staff.length} staff for School 14`);

    // Count students with classrooms
    const studentsWithClassroom = students.filter(s => s.classroomId);
    console.log(`📚 ${studentsWithClassroom.length} students have classroom assignments\n`);

    if (students.length === 0 && staff.length === 0) {
      console.log("⚠️  No students or staff found for School 14. Please run reseed:school14 first.");
      await AppDataSource.destroy();
      return;
    }

    // Check existing attendance for School 14
    const existingCount = await attendanceRepository.count({
      where: { schoolId: SCHOOL_ID }
    });

    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing attendance records for School 14.`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise<string>((resolve) => {
        readline.question('Delete and reseed? (yes/no): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() === 'yes') {
        console.log("🗑️  Deleting existing attendance for School 14...");
        await attendanceRepository.delete({ schoolId: SCHOOL_ID });
        console.log("✅ Deleted\n");
      } else {
        console.log("❌ Cancelled");
        await AppDataSource.destroy();
        return;
      }
    }

    const attendanceRecords: Attendance[] = [];

    // Generate STUDENT attendance
    console.log(`📝 Generating ${TOTAL_STUDENT_RECORDS} student attendance records...`);
    if (students.length > 0) {
      for (let i = 0; i < TOTAL_STUDENT_RECORDS; i++) {
        const student = students[Math.floor(Math.random() * students.length)]!;
        const attendanceDate = getRandomWeekdayDate(START_DATE, END_DATE);
        const createdAt = getCreatedAtDate(attendanceDate);
        const status = getRandomStatus(STUDENT_PATTERN);

        // IMPORTANT: Use the student's actual classroom
        const classroomId = student.classroomId || undefined;

        const attendance = new Attendance({
          date: attendanceDate,
          status,
          timeIn: status !== AttendanceStatus.ABSENT ? getRandomTimeIn() : undefined,
          timeOut: status === AttendanceStatus.PRESENT ? getRandomTimeOut() : undefined,
          studentId: student.id,
          classroomId,  // ← Uses student's actual classroom
          schoolId: SCHOOL_ID,
          createdAt,
          updatedAt: createdAt,
        });

        attendanceRecords.push(attendance);

        if ((i + 1) % 100 === 0 || i + 1 === TOTAL_STUDENT_RECORDS) {
          console.log(`   ✅ ${i + 1}/${TOTAL_STUDENT_RECORDS} student records (${Math.round(((i + 1) / TOTAL_STUDENT_RECORDS) * 100)}%)`);
        }
      }
    }

    // Generate STAFF/TEACHER attendance
    console.log(`\n📝 Generating ${TOTAL_TEACHER_RECORDS} staff attendance records...`);
    if (staff.length > 0) {
      for (let i = 0; i < TOTAL_TEACHER_RECORDS; i++) {
        const staffMember = staff[Math.floor(Math.random() * staff.length)]!;
        const attendanceDate = getRandomWeekdayDate(START_DATE, END_DATE);
        const createdAt = getCreatedAtDate(attendanceDate);
        const status = getRandomStatus(STAFF_PATTERN);

        const attendance = new Attendance({
          date: attendanceDate,
          status,
          timeIn: status !== AttendanceStatus.ABSENT ? getRandomTimeIn() : undefined,
          timeOut: status === AttendanceStatus.PRESENT ? getRandomTimeOut() : undefined,
          teacherId: staffMember.id,  // ← Staff attendance (no classroomId)
          schoolId: SCHOOL_ID,
          createdAt,
          updatedAt: createdAt,
        });

        attendanceRecords.push(attendance);

        if ((i + 1) % 100 === 0 || i + 1 === TOTAL_TEACHER_RECORDS) {
          console.log(`   ✅ ${i + 1}/${TOTAL_TEACHER_RECORDS} staff records (${Math.round(((i + 1) / TOTAL_TEACHER_RECORDS) * 100)}%)`);
        }
      }
    }

    // Save all records
    console.log("\n💾 Saving all attendance records to database...");
    await attendanceRepository.save(attendanceRecords);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Attendance seeding completed!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   - School ID: ${SCHOOL_ID}`);
    console.log(`   - Student attendance: ${TOTAL_STUDENT_RECORDS}`);
    console.log(`   - Staff attendance: ${TOTAL_TEACHER_RECORDS}`);
    console.log(`   - Total records: ${attendanceRecords.length}`);
    console.log(`   - Date range: ${START_DATE.toISOString().split('T')[0]} to ${END_DATE.toISOString().split('T')[0]}`);
    console.log("=".repeat(60) + "\n");

    // Verify classroom distribution
    const classroomDist = await attendanceRepository
      .createQueryBuilder('a')
      .select('a.classroomId', 'classroomId')
      .addSelect('COUNT(*)', 'count')
      .where('a.schoolId = :schoolId', { schoolId: SCHOOL_ID })
      .andWhere('a.studentId IS NOT NULL')
      .groupBy('a.classroomId')
      .getRawMany();

    console.log("📚 Student Attendance by Classroom:");
    for (const row of classroomDist) {
      console.log(`   - Classroom ID ${row.classroomId || 'NULL'}: ${row.count} records`);
    }

    console.log(`\n👥 Student records: ${TOTAL_STUDENT_RECORDS}`);
    console.log(`👔 Staff records: ${TOTAL_TEACHER_RECORDS}\n`);

    await AppDataSource.destroy();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedAttendanceSchool14();

