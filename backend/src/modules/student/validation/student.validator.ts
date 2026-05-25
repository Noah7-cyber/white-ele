import { CustomValidator } from "express-validator";
import { StudentRepository } from "../../core/StudentRepository";

/**
 * Custom validator to check if a student with given schoolId exists
 */
export const schoolIdExist: CustomValidator = async (value: number) => {
  if (!value) return true; // allow empty; use .optional() in chain
    const studentRepository = new StudentRepository();
    const students = await studentRepository.findAllBySchoolId(value);

    if (students.length === 0) {
      throw new Error(`No students found for school ID '${value}'.`);
    }

  return true;
};

/**
 * Custom validator to check if a student with given admission number exists
 */
export const admissionNumberExist: CustomValidator = async (value: string) => {
  if (!value) return true; // allow empty; use .optional() in chain
    const studentRepository = new StudentRepository();
    const students = await studentRepository.findAllByAdmissionNumber(value);

    if (students.length === 0) {
      throw new Error(`No students found for Admission Number '${value}'.`);
    }

  return true;
};

/**
 * Custom validator to check if a student with given classroomId exists
 */
export const classroomIdExist: CustomValidator = async (value: number) => {
  if (!value) return true; // allow empty; use .optional() in chain
    const studentRepository = new StudentRepository();
    const students = await studentRepository.findAllByClassroomId(value);

    if (students.length === 0) {
      throw new Error(`No students found for classroom ID '${value}'.`);
    }

  return true;
};

/**
 * Custom validator to check if a student with given name exists
 */
export const studentNameExist: CustomValidator = async (value: string) => {
  if (!value) return true; // allow empty; use .optional() in chain
    const studentRepository = new StudentRepository();
    const students = await studentRepository.findAllByStudentName(value);

    if (students.length === 0) {
      throw new Error(`No students found with name: '${value}'.`);
    }

  return true;
};
