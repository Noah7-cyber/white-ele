import { body, param, query } from "express-validator";
import { schoolIdExist, admissionNumberExist, classroomIdExist, studentNameExist } from "./student.validator";
import { Suffix } from "../../shared";
import { Gender, StudentStatus } from "../../shared/entities";

const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const createStudentValidation = [

  // // schoolId
  // body("schoolId")
  //   .notEmpty().withMessage("School ID is required")
  //   .isInt().withMessage("School ID must be a number"),

  // classroomId
  body("classroomId")
    .optional()
    .isInt().withMessage("Classroom ID must be a number"),

  // schedule
  body("schedule")
    .optional()
    .isArray().withMessage("Schedule must be an array")
    .custom((arr: string[]) => arr.every(day => validDays.includes(day)))
    .withMessage(`Schedule can only contain valid days: ${validDays.join(", ")}`),

  // -------------------------
  // GENERAL INFO
  // -------------------------
  body("generalInfo")
    .notEmpty().withMessage("General info is required")
    .isObject().withMessage("General info must be an object"),

  body("generalInfo.firstName")
    .notEmpty().withMessage("First name is required")
    .isString().withMessage("First name be a string")
    .isLength({ max: 50 }).withMessage("First name is too long"),

  body("generalInfo.lastName")
    .notEmpty().withMessage("Last name is required")
    .isString().withMessage("Last name must be a string")
    .isLength({ max: 50 }).withMessage("Last name is too long"),

  body("generalInfo.middleName")
    .optional()
    .isString().withMessage("Middle name must be a string")
    .isLength({ max: 50 }).withMessage("Middle name is too long"),

  body("generalInfo.gender")
    .optional()
    .isIn(Object.values(Gender)).withMessage("Invalid gender"),

  body("generalInfo.address")
    .notEmpty().withMessage("Address is required")
    .isString().withMessage("Address must be a string"),

  body("generalInfo.dateOfBirth")
    .notEmpty().withMessage("Date of birth is required")
    .isISO8601().withMessage("Date of birth must be a valid date"),

  body("generalInfo.enrolmentDate")
    .notEmpty().withMessage("Enrollment date is required")
    .isISO8601().withMessage("Enrollment date must be a valid date"),

  body("generalInfo.photoUrl")
    .optional()
    .isString().withMessage("Photo URL must be a string"),

  // -------------------------
  // MEDICAL INFO
  // -------------------------
  body("medicalInfo")
    .optional()
    .isObject().withMessage("Medical info must be an object"),

  body("medicalInfo.allergies").optional().isString(),
  body("medicalInfo.medications").optional().isString(),
  body("medicalInfo.foodPreferences").optional().isString(),
  body("medicalInfo.dietRestriction").optional().isString(),
  body("medicalInfo.notes").optional().isString(),

  // -------------------------
  // EMERGENCY CONTACT
  // -------------------------
  body("emergencyContact")
    .notEmpty().withMessage("Emergency contact is required")
    .isObject().withMessage("Emergency contact must be an object"),

  body("emergencyContact.suffix")
    .optional()
    .isIn(Object.values(Suffix)).withMessage("Invalid suffix"),


  body("emergencyContact.contactName")
    .notEmpty().withMessage("Contact name is required")
    .isString().withMessage("Contact name must be a string"),

  body("emergencyContact.phone")
    .notEmpty().withMessage("Phone number is required")
    .isString().withMessage("Phone must be a valid string"),

  body("emergencyContact.relationship")
    .notEmpty().withMessage("Relationship is required")
    .isString().withMessage("Relationship must be a string"),

  body("emergencyContact.email")
    .optional()
    .isEmail().withMessage("Email must be valid"),

  body("emergencyContact.address")
    .optional()
    .isString(),

  // -------------------------
  // PARENTS ARRAY
  // -------------------------
  body("parents")
    .exists()
    .isArray().withMessage("Parents must be an array"),

  body("parents.*.suffix")
    .isIn(Object.values(Suffix)).withMessage("Invalid suffix"),


  body("parents.*.firstName")
    .notEmpty().withMessage("Parent first name is required")
    .isString(),

  body("parents.*.lastName")
    .notEmpty().withMessage("Parent last name is required")
    .isString(),

  body("parents.*.email")
    .optional()
    .isEmail().withMessage("Parent email must be valid"),

  body("parents.*.phone")
    .notEmpty().withMessage("Parent phone is required")
    .isString(),

  body("parents.*.address")
    .optional()
    .isString(),

  body("parents.*.relationship")
    .notEmpty().withMessage("Parent relationship is required")
    .isString(),

  body("parents.*.photoUrl")
    .optional()
    .isString(),

  body("parents.*.notes")
    .optional()
    .isString(),

  // -------------------------
  // DOCUMENTS ARRAY
  // -------------------------
  body("documents")
    .optional()
    .isArray().withMessage("Documents must be an array"),

  body("documents.*.docName")
    .notEmpty().withMessage("Document name is required")
    .isString(),

  body("documents.*.documentUrl")
    .notEmpty().withMessage("Document URL is required")
    .isString(),

];

export const studentIdValidation = [
  param("id")
    .notEmpty().withMessage("Student ID is required")
    .isInt().withMessage("Student ID must be a number"),
];

export const getAllStudentsValidation = [
  // optional query params can be validated here if needed
  query("schoolId")
    .optional()
    .isInt().withMessage("School ID must be a number")
    .custom(schoolIdExist),

  query("classroomId")
    .optional()
    .isInt().withMessage("Classroom ID must be a number")
    .custom(classroomIdExist),

  query("staffId")
    .optional()
    .isInt().withMessage("Staff ID must be a number"),

  query("admissionNumber")
    .optional()
    .isString().withMessage("Admission number must be a string")
    .custom(admissionNumberExist),

  query("search")
    .optional()
    .isString().withMessage("Search must be a string")
    .custom(studentNameExist),

  query("status")
    .optional()
    .isIn(Object.values(StudentStatus)).withMessage("Invalid student status"),

  query("sortBy")
    .optional()
    .isIn(["firstName", "firstname", "lastName", "lastname", "createdAt", "createdat", "admissionNumber", "admissionnumber", "id"])
    .withMessage("Invalid sort field"),

  query("sortOrder")
    .optional()
    .isIn(["ASC", "DESC", "asc", "desc"])
    .withMessage("Sort order must be ASC or DESC")
    .toUpperCase(),
];

export const updateStudentStatusValidation = [
  param("id")
    .notEmpty().withMessage("Student ID is required")
    .isInt().withMessage("Student ID must be a number"),

  body("type")
    .optional()
    .isString().withMessage("Type must be a string")
    .isIn(Object.values(StudentStatus)).withMessage("Invalid student status"),
  body("status")
    .optional()
    .isString().withMessage("Status must be a string")
    .isIn(Object.values(StudentStatus)).withMessage("Invalid student status"),
  body()
    .custom((value) => {
      if (!value.type && !value.status) {
        throw new Error("Either type or status is required");
      }
      return true;
    }),

  body("reason")
    .optional()
    .isString().withMessage("Reason must be a string"),

  body("endAt")
    .optional()
    .isISO8601().withMessage("End at must be a valid date"),
];