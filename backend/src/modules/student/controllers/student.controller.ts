import { Request, Response } from "express";
import { studentService } from "../services/student.service";
import { validationResult } from "express-validator";
import { authService } from "../../auth";
import { medicalService } from "../../medical";
import { emergencyContactService } from "../../emergencyContact";
import { profileService } from "../../user/services/profile.service";
import { AppDataSource } from "../../core";
import { Parent } from "../../shared/entities/Parent";
import { School } from "../../shared/entities/School";
import { Classroom } from "../../shared/entities/Classroom";
import { Student } from "../../shared/entities/StudentEntity";
import { parentService } from "../../parent";
import { studentDocumentService } from "../../studentDocument/services/studentDocument.service";
import { Medical } from "../../shared/entities/Medical";
import { Emergency } from "../../shared/entities/Emergency";
import { StudentDocument } from "../../shared/entities/StudentDocument";
import { logger, userAssociationService, UserRole, User, Gender } from "../../shared";
import { requireSchoolId, validateSchoolAccess } from "../../shared/utils/tenant-context";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { notificationService } from "../../notification";
import { NotificationType, NotificationPriority } from "../../shared/entities/Notification";
import { activityLogger } from "../../shared/services/activity-logger.service";
import { classroomService } from "../../classroom/services/classroom.service";

interface ParentInput {
  id?: number; // Optional: parent ID to identify existing parent for updates
  firstName: string;
  lastName: string;
  email: string;
  address?: string; // Profile field
  city?: string; // Profile field
  state?: string; // Profile field
  postalCode?: string; // Profile field
  countryCode?: string; // Profile field
  relationship: Parent["relationship"];
  notes?: string;
  photoUrl?: string; // Parent entity field
  photo?: string; // Profile field
  phone?: string;
  suffix?: Parent["suffix"]; // Profile field
  username?: string; // Parent entity field
  pin?: string; // Parent entity field
}

export class StudentController {
  // POST /students
  async createStudent(req: AuthenticatedRequest, res: Response) {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const schoolId = req?.user?.schoolId;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required" });
    }

    const { generalInfo, medicalInfo, emergencyContact, parents, classroomId, schedule, documents } = req.body;

    // Validate that schoolId from body matches user's schoolId
    try {
      validateSchoolAccess(req, schoolId);
    } catch (error: any) {
      return res.status(403).json({ success: false, message: error.message });
    }

    try {
      const result = await AppDataSource.transaction(async (manager) => {
        // Create student user
        const studentResult = await profileService.createUser(
          {
            firstName: generalInfo.firstName,
            lastName: generalInfo.lastName,
            middleName: generalInfo.middleName,
            gender: generalInfo.gender,
            dateOfBirth: generalInfo.dateOfBirth,
            address: generalInfo.address,
            role: UserRole.STUDENT,
            schoolId: schoolId,
          },
          { manager },
        );

        if (!studentResult.id || !studentResult) {
          throw new Error(studentResult.message || "Failed to create student user");
        }

        const studentUser = studentResult;

        //check if school exists:
        const school = await manager.getRepository(School).findOne({
          where: { id: schoolId },
        });

        if (!school) {
          throw new Error("School not found");
        }

        //check if classroom exists
        let classroom: Classroom | null = null;
        if (classroomId) {
          classroom = await manager.getRepository(Classroom).findOne({
            where: {
              id: classroomId,
              schoolId: schoolId,
            },
          });

          if (!classroom) {
            throw new Error("Invalid classroom: classroom does not exist or does not belong to this school");
          }

          const capacityCheck = await classroomService.ensureClassroomHasCapacityForAssignment(classroom.id, {
            manager,
          });
          if (!capacityCheck.success) {
            throw new Error(capacityCheck.message);
          }
        }

        // Create student entity
        const studentEntity = await studentService.createStudent(
          {
            userId: studentUser.id,
            schoolId,
            classroomId: classroom ? classroomId : null,
            schedule,
            photoUrl: generalInfo.photoUrl,
            enrolmentDate: generalInfo.enrolmentDate,
          },
          { manager },
        );

        //create medical entity
        const medicalEntity = await medicalService.createMedicalRecord(
          {
            studentId: studentEntity.id,
            allergies: medicalInfo.allergies,
            medications: medicalInfo.medications,
            foodPreferences: medicalInfo.foodPreferences,
            dietRestriction: medicalInfo.dietRestriction,
            notes: medicalInfo.notes,
          },
          { manager },
        );

        //create Emergency contact

        const emergencyContactEntity = await emergencyContactService.createEmergencyContact(
          {
            studentId: studentEntity.id,
            suffix: emergencyContact.suffix,
            contactName: emergencyContact.contactName,
            relationship: emergencyContact.relationship,
            phone: emergencyContact.phone,
            email: emergencyContact.email,
            address: emergencyContact.address,
          },
          { manager },
        );

        // Create/Link parent users
        const parentUsers = await Promise.all(
          parents.map(async (parent: ParentInput) => {
            const normalizedEmail = parent.email?.toLowerCase().trim();
            let generatedPassword: string | null = null;

            // Existing parent should be selected via id only
            if (parent.id) {
              const existingParent = await manager.findOne(Parent, {
                where: { id: parent.id, schoolId },
              });

              if (!existingParent) {
                throw new Error(`Parent ${parent.id} does not belong to this school`);
              }

              (existingParent as any).generatedPassword = null;
              (existingParent as any).email = normalizedEmail;
              return existingParent;
            }

            // New parent flow: do not auto-link by email if user already exists
            if (normalizedEmail) {
              const existingUser = await manager.getRepository(User).findOne({
                where: { email: normalizedEmail },
              });

              if (existingUser) {
                const existingParentInSchool = await manager.findOne(Parent, {
                  where: { userId: existingUser.id, schoolId },
                });

                if (existingParentInSchool) {
                  throw new Error(`Add parent from existing parents for "${normalizedEmail}"`);
                }

                throw new Error("A user with this email already exists. Please use a unique email for each account.");
              }
            }

            const parentResult = await authService.registerParentViaAdmin(
              {
                firstName: parent.firstName,
                lastName: parent.lastName,
                email: parent.email,
                phone: parent.phone,
                address: parent.address,
                suffix: parent.suffix,
                tempPassword: true,
                role: UserRole.PARENT,
                schoolId,
              },
              { manager },
            );

            if (!parentResult.user) throw new Error("Could not create parent as a user");
            generatedPassword = parentResult.password;
            logger.info(`New parent user created: ${parentResult.user.id} `);

            // Ensure Parent record exists for this school (idempotent)
            const parentEntity = await userAssociationService.ensureAssociation(
              { id: parentResult.user.id } as User,
              UserRole.PARENT,
              schoolId,
              {
                relationship: parent.relationship,
                notes: parent.notes,
                photoUrl: parent.photoUrl,
                username: parent.username,
                pin: parent.pin,
                address: parent.address,
                city: parent.city,
                state: parent.state,
                postalCode: parent.postalCode,
                photo: parent.photo,
                suffix: parent.suffix,
              },
              { manager },
            );

            (parentEntity as any).generatedPassword = generatedPassword;
            (parentEntity as any).email = parent.email;
            return parentEntity;
          }),
        );

        // 3️⃣ Link parents to student
        const parentIds = parentUsers.map((p) => p.id);
        await parentService.attachParentsToStudent(studentEntity.id, parentIds, { manager });

        // 4️⃣ Create documents (if any)
        const { user } = req as AuthenticatedRequest;
        const documentEntities = [];
        if (documents && Array.isArray(documents)) {
          for (const doc of documents) {
            const documentEntity = await studentDocumentService.createStudentDocument(
              {
                studentId: studentEntity.id,
                docName: doc.docName,
                documentUrl: doc.documentUrl,
                uploadedBy: user.id,
              },
              { manager },
            );
            documentEntities.push(documentEntity);
          }
        }

        return {
          student: studentEntity,
          parents: parentUsers,
          medical: medicalEntity,
          emergencyContact: emergencyContactEntity,
          school: school,
          studentDocuments: documentEntities,
        };
      });

      const schoolName = result.school?.schoolName || "Your School";

      res.status(201).json({
        success: true,
        message: "Student created successfully",
        data: result,
      });

      // SEND EMAIL WITH PASSWORD TO NEW PARENTS
      try {
        for (let i = 0; i < result.parents.length; i++) {
          const parent = result.parents[i];
          if ((parent as any).generatedPassword) {
            const { emailService } = await import("../../shared/services/email.service");
            const inputParent = parents[i];
            const parentName = inputParent
              ? `${inputParent.firstName || ""} ${inputParent.lastName || ""}`.trim() || "Parent"
              : (parent as any).user
                ? `${(parent as any).user.firstName || ""} ${(parent as any).user.lastName || ""}`.trim() || "Parent"
                : "Parent";

            await emailService.sendParentAccountCreationEmail(
              (parent as any).email,
              parentName,
              (parent as any).generatedPassword,
              schoolName,
              `${generalInfo.firstName} ${generalInfo.lastName}`,
              (parent as any).generatedPin,
            );
          }
        }
      } catch (err) {
        logger.error("Failed to send parent account creation emails:", err instanceof Error ? err : err);
      }

      // SEND NOTIFICATION TO ADMINS WHEN STUDENT IS ENROLLED
      try {
        await notificationService.notifyAdmins({
          schoolId,
          type: NotificationType.INFO,
          priority: NotificationPriority.MEDIUM,
          title: "New Student Enrolled",
          message: `${generalInfo.firstName} ${generalInfo.lastName} has been enrolled in ${schoolName}`,
          actionUrl: `/students/${result.student.id}`,
          actionLabel: "View Student",
          data: {
            studentId: result.student.id,
            studentName: `${generalInfo.firstName} ${generalInfo.lastName}`,
            schoolName: schoolName,
            enrolledBy: (req as AuthenticatedRequest).user?.id,
          },
        });
      } catch (err) {
        logger.error("Failed to send student enrollment notification to admins:", err);
      }

      return;
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /students/:id
  async getStudentById(req: Request, res: Response) {
    try {
      const idParam = req.params["id"];
      if (!idParam) {
        return res.status(400).json({ success: false, message: "Student ID is required" });
      }

      const id = parseInt(idParam, 10);

      const student = await studentService.getStudentById(id);
      if (!student) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }

      // Validate school access
      try {
        validateSchoolAccess(req, (student as any).schoolId);
      } catch (error: any) {
        return res.status(403).json({ success: false, message: error.message });
      }

      return res.json({ success: true, data: student });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /students
  async getAllStudents(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Extract query parameters
      const { pos: posQuery, delta: deltaQuery, classroomId, staffId, search, admissionNumber, status, sortBy, sortOrder } = req.query;
      const pos = posQuery ? parseInt(posQuery as string, 10) : 0;
      const delta = deltaQuery ? parseInt(deltaQuery as string, 10) : 10;

      // Always use user's schoolId to ensure data isolation (no need to pass schoolId in query)
      const userSchoolId = requireSchoolId(req);

      // When staffId is passed and user is STAFF, they can only filter by their own staffId
      let resolvedStaffId: number | undefined;
      if (staffId) {
        const parsedStaffId = parseInt(staffId as string, 10);
        if (isNaN(parsedStaffId)) {
          return res.status(400).json({ success: false, message: "Invalid staffId" });
        }
        const authReq = req as AuthenticatedRequest;
        if (authReq.user?.role === UserRole.STAFF) {
          const staffRelation = (authReq.user as any).teacher ?? authReq.user.staff;
          const staffRecord = Array.isArray(staffRelation) ? staffRelation[0] : staffRelation;
          const myStaffId = staffRecord?.id;
          if (myStaffId !== parsedStaffId) {
            return res.status(403).json({ success: false, message: "Staff can only filter students by their own assigned classes" });
          }
        }
        resolvedStaffId = parsedStaffId;
      }

      // Build filters object with all query params
      const filters = {
        schoolId: userSchoolId, // Always use authenticated user's schoolId
        pos,
        delta,
        ...(classroomId && { classroomId: parseInt(classroomId as string, 10) }),
        ...(resolvedStaffId && { staffId: resolvedStaffId }),
        ...(search && { search: search as string }),
        ...(admissionNumber && { admissionNumber: admissionNumber as string }),
        ...(status && { status: status as any }),
        ...(sortBy && { sortBy: sortBy as string }),
        ...(sortOrder && { sortOrder: sortOrder as "ASC" | "DESC" }),
      };

      const result = await studentService.getAllStudents(filters);

      // If no students found, return 404
      if (!result.success || !result.students || result.students.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No students found matching the search criteria",
        });
      }

      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  //Update student
  async updateStudent(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const studentId = Number(req.params["id"]);
      const { generalInfo, medicalInfo, emergencyContact, parents, classroomId, schedule, documents } = req.body;

      // Validate school access - ensure student belongs to user's school
      const existingStudent = await studentService.getStudentById(studentId);
      if (!existingStudent || (existingStudent as any).success === false) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }

      const student = existingStudent as any;
      try {
        validateSchoolAccess(req, student.schoolId);
      } catch (error: any) {
        return res.status(403).json({ success: false, message: error.message });
      }

      const result = await AppDataSource.transaction(async (manager) => {
        // Fetch school name for email context
        const school = await manager.getRepository(School).findOne({
          where: { id: student.schoolId },
        });

        // 1. Update student user profile (generalInfo)
        if (generalInfo) {
          const studentUser = await manager.findOne(User, { where: { id: student.userId } });
          if (studentUser) {
            if (generalInfo.firstName) studentUser.firstName = generalInfo.firstName;
            if (generalInfo.lastName) studentUser.lastName = generalInfo.lastName;
            if (generalInfo.gender) studentUser.gender = generalInfo.gender as Gender;
            if (generalInfo.middleName !== undefined) studentUser.middleName = generalInfo.middleName;
            if (generalInfo.dateOfBirth) studentUser.dateOfBirth = generalInfo.dateOfBirth;
            if (generalInfo.address) studentUser.address = generalInfo.address;
            await manager.save(User, studentUser);
          }
        }

        // 2. Update student entity
        const studentUpdatePayload: Partial<Student> = {};
        if (schedule !== undefined) studentUpdatePayload.schedule = schedule;
        if (generalInfo?.photoUrl !== undefined) studentUpdatePayload.photoUrl = generalInfo.photoUrl;
        if (generalInfo?.enrolmentDate !== undefined) studentUpdatePayload.enrolmentDate = generalInfo.enrolmentDate;
        if (classroomId !== undefined) {
          // Validate classroom if provided
          if (classroomId) {
            const classroom = await manager.findOne(Classroom, {
              where: {
                id: classroomId,
                schoolId: student.schoolId,
              },
            });
            if (!classroom) {
              throw new Error("Invalid classroom: classroom does not exist or does not belong to this school");
            }
            const previousClassroomId =
              student.classroomId !== undefined && student.classroomId !== null
                ? Number(student.classroomId)
                : (student as any).currentClassroom?.id !== undefined
                  ? Number((student as any).currentClassroom.id)
                  : null;
            if (Number(classroomId) !== previousClassroomId) {
              const capacityCheck = await classroomService.ensureClassroomHasCapacityForAssignment(classroom.id, {
                manager,
              });
              if (!capacityCheck.success) {
                throw new Error(capacityCheck.message);
              }
            }
            studentUpdatePayload.classroomId = classroomId;
          } else {
            studentUpdatePayload.classroomId = undefined;
          }
        }

        if (Object.keys(studentUpdatePayload).length > 0) {
          await studentService.updateStudent(studentId, studentUpdatePayload);
        }

        // 3. Update or create medical record
        let medicalEntity = null;
        if (medicalInfo) {
          const existingMedical = await manager.findOne(Medical, {
            where: { studentId: studentId },
          });

          if (existingMedical) {
            // Update existing medical record
            existingMedical.allergies = medicalInfo.allergies !== undefined ? medicalInfo.allergies : existingMedical.allergies;
            existingMedical.medications = medicalInfo.medications !== undefined ? medicalInfo.medications : existingMedical.medications;
            existingMedical.foodPreferences =
              medicalInfo.foodPreferences !== undefined ? medicalInfo.foodPreferences : existingMedical.foodPreferences;
            existingMedical.dietRestriction =
              medicalInfo.dietRestriction !== undefined ? medicalInfo.dietRestriction : existingMedical.dietRestriction;
            existingMedical.notes = medicalInfo.notes !== undefined ? medicalInfo.notes : existingMedical.notes;
            medicalEntity = await manager.save(Medical, existingMedical);
          } else {
            // Create new medical record
            medicalEntity = await medicalService.createMedicalRecord(
              {
                studentId: studentId,
                allergies: medicalInfo.allergies,
                medications: medicalInfo.medications,
                foodPreferences: medicalInfo.foodPreferences,
                dietRestriction: medicalInfo.dietRestriction,
                notes: medicalInfo.notes,
              },
              { manager },
            );
          }
        }

        // 4. Update or create emergency contact
        let emergencyContactEntity = null;
        if (emergencyContact) {
          const existingEmergency = await manager.findOne(Emergency, {
            where: { studentId: studentId },
          });

          if (existingEmergency) {
            // Update existing emergency contact
            if (emergencyContact.suffix !== undefined) existingEmergency.suffix = emergencyContact.suffix;
            if (emergencyContact.contactName !== undefined) existingEmergency.contactName = emergencyContact.contactName;
            if (emergencyContact.relationship !== undefined) existingEmergency.relationship = emergencyContact.relationship;
            if (emergencyContact.phone !== undefined) existingEmergency.phone = emergencyContact.phone;
            if (emergencyContact.email !== undefined) existingEmergency.email = emergencyContact.email;
            if (emergencyContact.address !== undefined) existingEmergency.address = emergencyContact.address;
            emergencyContactEntity = await manager.save(Emergency, existingEmergency);
          } else {
            // Create new emergency contact
            emergencyContactEntity = await emergencyContactService.createEmergencyContact(
              {
                studentId: studentId,
                suffix: emergencyContact.suffix,
                contactName: emergencyContact.contactName,
                relationship: emergencyContact.relationship,
                phone: emergencyContact.phone,
                email: emergencyContact.email,
                address: emergencyContact.address,
              },
              { manager },
            );
          }
        }

        // 5. Update/create parents
        let parentUsers: Parent[] = [];
        if (parents && Array.isArray(parents)) {
          const userSchoolId = requireSchoolId(req);

          parentUsers = await Promise.all(
            parents.map(async (parent: ParentInput) => {
              let parentEntity: Parent;
              let generatedPassword: string | null = null;
              const normalizedEmail = parent.email?.toLowerCase().trim();

              let existingParent: Parent | null = null;

              // 1. Try to find by ID if provided
              if (parent.id) {
                existingParent = await manager.findOne(Parent, {
                  where: { id: parent.id },
                  relations: ["user"],
                });
                if (existingParent) {
                  // Found parent by ID
                }
              }

              // 2. If not found by ID (or no ID), try to find by email in this school context
              if (!existingParent && normalizedEmail) {
                const userByEmail = await manager.findOne(User, { where: { email: normalizedEmail } });
                if (userByEmail) {
                  existingParent = await manager.findOne(Parent, {
                    where: { userId: userByEmail.id, schoolId: userSchoolId },
                    relations: ["user"],
                  });
                  if (existingParent) {
                    // Matched existing parent via email
                  }
                }
              }

              if (existingParent) {
                // UPDATE EXISTING PARENT AND USER
                if (existingParent.schoolId !== userSchoolId) {
                  throw new Error(`Parent ${existingParent.id} does not belong to school ${userSchoolId}`);
                }

                // Use ParentService to update both Parent and User fields
                parentEntity = await parentService.updateParent(existingParent.id, { ...parent, email: normalizedEmail }, userSchoolId, {
                  manager,
                });
              } else {
                // CREATE or RE-LINK: We didn't find an existing parent record in this school

                let existingUser = await manager.getRepository(User).findOne({
                  where: { email: normalizedEmail },
                });

                if (existingUser) {
                  // ensureAssociation is idempotent and will create the Parent record if missing
                  parentEntity = await userAssociationService.ensureParentRecord(existingUser, userSchoolId, parent, manager);
                } else {
                  const parentResult = await authService.registerParentViaAdmin(
                    {
                      firstName: parent.firstName,
                      lastName: parent.lastName,
                      email: parent.email,
                      phone: parent.phone,
                      address: parent.address,
                      suffix: parent.suffix,
                      tempPassword: true,
                      role: UserRole.PARENT,
                      schoolId: userSchoolId,
                    },
                    { manager },
                  );

                  if (!parentResult.user) {
                    throw new Error("Could not create parent as a user");
                  }

                  generatedPassword = parentResult.password;

                  parentEntity = await userAssociationService.ensureParentRecord(parentResult.user, userSchoolId, parent, manager);
                }

                (parentEntity as any).generatedPassword = generatedPassword;
                (parentEntity as any).email = normalizedEmail || parentEntity.user?.email;
              }

              return parentEntity;
            }),
          );

          // Replace student's parent associations with exact list (supports add/remove)
          const parentIds = parentUsers.map((p) => p.id);
          await parentService.replaceStudentParents(studentId, parentIds, { manager });
        }

        // 6. Update/create documents
        const { user } = req as AuthenticatedRequest;
        const documentEntities = [];
        if (documents && Array.isArray(documents)) {
          for (const doc of documents) {
            // CASE 1: UPDATE EXISTING DOCUMENT (doc.id is provided)
            if (doc.id) {
              // Find document by ID
              const existingDocument = await manager.findOne(StudentDocument, {
                where: { id: doc.id },
              });

              if (!existingDocument) {
                throw new Error(`Document with ID ${doc.id} not found`);
              }

              // Verify document belongs to this student
              if (existingDocument.studentId !== studentId) {
                throw new Error(`Document with ID ${doc.id} does not belong to this student`);
              }

              // Update only docName and documentUrl
              if (doc.docName !== undefined) existingDocument.docName = doc.docName;
              if (doc.documentUrl !== undefined) existingDocument.documentUrl = doc.documentUrl;

              const updatedDocument = await manager.save(StudentDocument, existingDocument);
              documentEntities.push(updatedDocument);
            }
            // CASE 2: CREATE NEW DOCUMENT (no doc.id provided)
            else {
              const documentEntity = await studentDocumentService.createStudentDocument(
                {
                  studentId: studentId,
                  docName: doc.docName,
                  documentUrl: doc.documentUrl,
                  uploadedBy: user.id,
                },
                { manager },
              );
              documentEntities.push(documentEntity);
            }
          }
        }

        return {
          parents: parentUsers,
          medical: medicalEntity,
          emergencyContact: emergencyContactEntity,
          studentDocuments: documentEntities,
          school: school,
        };
      });

      // Fetch fresh student after transaction commits (avoids stale data from uncommitted changes)
      const updatedStudent = await studentService.getStudentById(studentId);

      res.status(200).json({
        success: true,
        message: "Student updated successfully",
        data: {
          student: updatedStudent,
          ...result,
        },
      });

      // Send emails to newly created parents
      try {
        const schoolName = result.school?.schoolName || "Your School";
        const studentName =
          `${(updatedStudent as any).user?.firstName || ""} ${(updatedStudent as any).user?.lastName || ""}`.trim() || "Your Child";
        const { emailService } = await import("../../shared/services/email.service");

        if (result.parents && Array.isArray(result.parents)) {
          for (const parent of result.parents) {
            if ((parent as any).generatedPassword) {
              await emailService.sendParentAccountCreationEmail(
                (parent as any).email,
                `${(parent as any).user?.firstName || ""} ${(parent as any).user?.lastName || ""}`.trim() || "Parent",
                (parent as any).generatedPassword,
                schoolName,
                studentName,
                (parent as any).pin,
              );
            }
          }
        }
      } catch (emailErr) {
        logger.error("Failed to send welcome emails in updateStudent:", emailErr);
      }

      return;
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update student",
      });
    }
  }

  async deleteStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params["id"];
      if (!id) {
        return res.status(400).json({ success: false, message: "Student ID is required" });
      }

      const studentId = Number(id);

      const result = await studentService.deleteStudent(studentId);

      if (result.success) {
        if (req.user) {
          await activityLogger.log({
            userId: req.user.id,
            resource: "student",
            action: "delete",
            title: "Student deleted",
            description: `Student #${studentId} deleted by ${req.user.name} `,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
          });
        }
        return res.status(200).json({ success: true, message: result.message });
      } else {
        return res.status(404).json({ success: false, message: result.message });
      }
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateStudentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const id = req.params["id"];
      const disciplinarianId = req.user?.id;

      if (!disciplinarianId) {
        return res.status(400).json({ success: false, message: "user not autheniticated" });
      }

      if (!id) {
        return res.status(400).json({ success: false, message: "Student ID is required" });
      }

      const studentId = Number(id);
      // Accept both 'type' and 'status' for flexibility (frontend may send either)
      const statusType = req.body.type ?? req.body.status;

      const result = await studentService.updateStudentStatus({
        studentId,
        disciplinarianId,
        type: statusType,
        reason: req.body.reason,
        endAt: req.body.endAt,
      });

      if (result.success) {
        if (req.user) {
          await activityLogger.log({
            userId: req.user.id,
            resource: "student",
            action: "update",
            title: "Student status updated",
            description: `Student #${studentId} status updated to ${statusType} by ${req.user.name} `,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
          });
        }
        return res.status(200).json({ success: true, message: result.message });
      } else {
        return res.status(404).json({ success: false, message: result.message });
      }
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
