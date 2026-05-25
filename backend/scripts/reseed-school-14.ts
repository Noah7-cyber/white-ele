import { AppDataSource } from "../src/modules/core/config/database";
import { Student } from "../src/modules/shared/entities/StudentEntity";
import { Staff } from "../src/modules/shared/entities/Staff";
import { Classroom } from "../src/modules/shared/entities/Classroom";
import { User } from "../src/modules/shared/entities/User";
import { School } from "../src/modules/shared/entities/School";
import { 
  StudentStatus, 
  StaffStatus, 
  ClassroomStatus, 
  UserRole,
  StaffRole,
  Gender 
} from "../src/modules/shared/entities/EntityEnums";
import * as bcrypt from "bcryptjs";

/**
 * Clear and reseed School ID 14 with data from 2022-2026
 * 
 * - Clears all students, staff, and classrooms for school 14
 * - Creates new records with createdAt spanning 2022-2026
 * - Realistic data distribution across the years
 * 
 * Usage: ts-node scripts/reseed-school-14.ts
 */

const SCHOOL_ID = 14;
const START_DATE = new Date('2022-01-01');
const END_DATE = new Date('2026-12-31');

// Configuration
const NUM_CLASSROOMS = 10;
const NUM_STUDENTS = 100;
const NUM_STAFF = 20;

/**
 * Get random date between start and end
 */
function getRandomDate(start: Date, end: Date): Date {
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
}

/**
 * Get random element from array
 */
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

/**
 * Generate random student data
 */
function generateStudentData(index: number): any {
  const genders = [Gender.MALE, Gender.FEMALE];
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  const gender = getRandomElement(genders);
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  
  return {
    firstName,
    lastName,
    email: `student${index}@school14.com`,
    gender,
    dateOfBirth: new Date(2010 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    admissionNumber: `ADM-14-${String(index).padStart(4, '0')}`,
  };
}

/**
 * Generate random staff data
 */
function generateStaffData(index: number): any {
  const genders = [Gender.MALE, Gender.FEMALE];
  const firstNames = ['David', 'Sarah', 'Daniel', 'Jessica', 'Matthew', 'Ashley', 'Christopher', 'Amanda', 'Andrew', 'Melissa'];
  const lastNames = ['Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'];
  const roles = [StaffRole.LEAD_TEACHER, StaffRole.ASSISTANT_TEACHER, StaffRole.PRINCIPAL, StaffRole.ASSISTANT_PRINCIPAL];
  
  const gender = getRandomElement(genders);
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const role = getRandomElement(roles);
  
  return {
    firstName,
    lastName,
    email: `staff${index}@school14.com`,
    gender,
    role,
    dateOfBirth: new Date(1970 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
  };
}

/**
 * Main function
 */
async function reseedSchool14() {
  try {
    console.log("🔄 Initializing database connection...");
    await AppDataSource.initialize();
    console.log("✅ Database connected\n");

    const userRepository = AppDataSource.getRepository(User);
    const studentRepository = AppDataSource.getRepository(Student);
    const staffRepository = AppDataSource.getRepository(Staff);
    const classroomRepository = AppDataSource.getRepository(Classroom);
    const schoolRepository = AppDataSource.getRepository(School);

    // Verify school exists
    const school = await schoolRepository.findOne({ where: { id: SCHOOL_ID } });
    if (!school) {
      console.log(`❌ School with ID ${SCHOOL_ID} not found!`);
      await AppDataSource.destroy();
      return;
    }

    console.log(`🏫 Found school: ${school.schoolName || 'School 14'}\n`);

    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`⚠️  This will DELETE ALL data for School ID ${SCHOOL_ID} and create new records.`);
    const answer = await new Promise<string>((resolve) => {
      readline.question('Are you sure you want to continue? (yes/no): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log("\n❌ Operation cancelled");
      await AppDataSource.destroy();
      return;
    }

    console.log("\n" + "=".repeat(60));
    console.log("🗑️  STEP 1: Clearing existing data for School ID 14");
    console.log("=".repeat(60) + "\n");

    // Get counts before deletion
    const existingStudents = await studentRepository.count({ where: { schoolId: SCHOOL_ID } });
    const existingStaff = await staffRepository.count({ where: { schoolId: SCHOOL_ID } });
    const existingClassrooms = await classroomRepository.count({ where: { schoolId: SCHOOL_ID } });

    console.log(`📊 Found existing records:`);
    console.log(`   - Students: ${existingStudents}`);
    console.log(`   - Staff: ${existingStaff}`);
    console.log(`   - Classrooms: ${existingClassrooms}\n`);

    // Delete in correct order (due to foreign keys)
    console.log("🗑️  Deleting students...");
    const students = await studentRepository.find({ 
      where: { schoolId: SCHOOL_ID },
      relations: ['user']
    });
    for (const student of students) {
      if (student.user) {
        await userRepository.remove(student.user); // This will cascade delete student
      }
    }
    console.log(`✅ Deleted ${students.length} students\n`);

    console.log("🗑️  Deleting staff...");
    const staffMembers = await staffRepository.find({ 
      where: { schoolId: SCHOOL_ID },
      relations: ['user']
    });
    for (const staffMember of staffMembers) {
      if (staffMember.user) {
        await userRepository.remove(staffMember.user); // This will cascade delete staff
      }
    }
    console.log(`✅ Deleted ${staffMembers.length} staff members\n`);

    console.log("🗑️  Deleting classrooms...");
    await classroomRepository.delete({ schoolId: SCHOOL_ID });
    console.log(`✅ Deleted ${existingClassrooms} classrooms\n`);

    console.log("\n" + "=".repeat(60));
    console.log("📝 STEP 2: Creating new data with dates from 2022-2026");
    console.log("=".repeat(60) + "\n");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create Classrooms
    console.log(`📚 Creating ${NUM_CLASSROOMS} classrooms...`);
    const classrooms: Classroom[] = [];
    for (let i = 1; i <= NUM_CLASSROOMS; i++) {
      const createdAt = getRandomDate(START_DATE, END_DATE);
      const classroom = classroomRepository.create({
        classroomName: `Class ${i}`,
        classroomStatus: ClassroomStatus.ACTIVE,
        schoolId: SCHOOL_ID,
        maximumCapacity: 20 + Math.floor(Math.random() * 10),
        createdAt,
        updatedAt: createdAt,
      });
      classrooms.push(classroom);
      
      if (i % 5 === 0 || i === NUM_CLASSROOMS) {
        console.log(`   ✅ Created ${i}/${NUM_CLASSROOMS} classrooms`);
      }
    }
    await classroomRepository.save(classrooms);
    console.log(`✅ Saved ${classrooms.length} classrooms\n`);

    // Create Students
    console.log(`👥 Creating ${NUM_STUDENTS} students...`);
    const studentUsers: User[] = [];
    for (let i = 1; i <= NUM_STUDENTS; i++) {
      const studentData = generateStudentData(i);
      const createdAt = getRandomDate(START_DATE, END_DATE);
      
      const user = userRepository.create({
        email: studentData.email,
        password: hashedPassword,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        dateOfBirth: studentData.dateOfBirth,
        gender: studentData.gender,
        role: UserRole.STUDENT,
        emailVerified: true,
        createdAt,
        updatedAt: createdAt,
      });
      
      studentUsers.push(user);
      
      if (i % 20 === 0 || i === NUM_STUDENTS) {
        console.log(`   ✅ Created ${i}/${NUM_STUDENTS} student users`);
      }
    }
    await userRepository.save(studentUsers);
    console.log(`✅ Saved ${studentUsers.length} student users\n`);

    console.log(`📝 Creating student records...`);
    const students2: Student[] = [];
    for (let i = 0; i < studentUsers.length; i++) {
      const user = studentUsers[i]!;
      const classroom = classrooms[Math.floor(Math.random() * classrooms.length)]!;
      
      const student = studentRepository.create({
        userId: user.id,
        schoolId: SCHOOL_ID,
        classroomId: classroom.id,
        admissionNumber: `ADM-14-${String(i + 1).padStart(4, '0')}`,
        status: StudentStatus.ACTIVE,
        enrolmentDate: user.createdAt,
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
      });
      
      students2.push(student);
      
      if ((i + 1) % 20 === 0 || i + 1 === NUM_STUDENTS) {
        console.log(`   ✅ Created ${i + 1}/${NUM_STUDENTS} student records`);
      }
    }
    await studentRepository.save(students2);
    console.log(`✅ Saved ${students2.length} student records\n`);

    // Create Staff
    console.log(`👔 Creating ${NUM_STAFF} staff members...`);
    const staffUsers: User[] = [];
    for (let i = 1; i <= NUM_STAFF; i++) {
      const staffData = generateStaffData(i);
      const createdAt = getRandomDate(START_DATE, END_DATE);
      
      const user = userRepository.create({
        email: staffData.email,
        password: hashedPassword,
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        dateOfBirth: staffData.dateOfBirth,
        gender: staffData.gender,
        role: UserRole.STAFF,
        emailVerified: true,
        createdAt,
        updatedAt: createdAt,
      });
      
      staffUsers.push(user);
      
      if (i % 5 === 0 || i === NUM_STAFF) {
        console.log(`   ✅ Created ${i}/${NUM_STAFF} staff users`);
      }
    }
    await userRepository.save(staffUsers);
    console.log(`✅ Saved ${staffUsers.length} staff users\n`);

    console.log(`📝 Creating staff records...`);
    const staffRecords: Staff[] = [];
    for (let i = 0; i < staffUsers.length; i++) {
      const user = staffUsers[i]!;
      const staffData = generateStaffData(i + 1);
      
      // Set startDate to be same day or slightly before createdAt
      const startDate = new Date(user.createdAt);
      startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6)); // 0-6 months before
      
      const staff = staffRepository.create({
        userId: user.id,
        schoolId: SCHOOL_ID,
        staffRole: staffData.role,
        startDate,
        status: StaffStatus.ACTIVE,
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
      });
      
      staffRecords.push(staff);
      
      if ((i + 1) % 5 === 0 || i + 1 === NUM_STAFF) {
        console.log(`   ✅ Created ${i + 1}/${NUM_STAFF} staff records`);
      }
    }
    await staffRepository.save(staffRecords);
    console.log(`✅ Saved ${staffRecords.length} staff records\n`);

    // Final summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ School ID 14 reseeded successfully!");
    console.log("=".repeat(60));
    console.log(`📊 New Records Created:`);
    console.log(`   - Classrooms: ${classrooms.length}`);
    console.log(`   - Students: ${students2.length}`);
    console.log(`   - Staff: ${staffRecords.length}`);
    console.log(`   - Total Users: ${studentUsers.length + staffUsers.length}`);
    console.log(`\n📅 Date Range: ${START_DATE.toISOString().split('T')[0]} to ${END_DATE.toISOString().split('T')[0]}`);
    console.log(`\n🔐 Default Password: password123`);
    console.log("=".repeat(60) + "\n");

    // Show some sample records
    const sampleStudent = students2[0];
    const sampleStaff = staffRecords[0];
    const sampleClassroom = classrooms[0];

    console.log("📋 Sample Records Created:\n");
    console.log(`Student: ${studentUsers[0]?.email}`);
    console.log(`  - Created: ${sampleStudent?.createdAt.toISOString().split('T')[0]}`);
    console.log(`  - Classroom: ${sampleClassroom?.classroomName}`);
    console.log(`\nStaff: ${staffUsers[0]?.email}`);
    console.log(`  - Created: ${sampleStaff?.createdAt.toISOString().split('T')[0]}`);
    console.log(`  - Role: ${sampleStaff?.staffRole}\n`);

    await AppDataSource.destroy();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error reseeding school:", error);
    process.exit(1);
  }
}

// Run the script
reseedSchool14();

