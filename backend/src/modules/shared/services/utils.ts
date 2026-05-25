// src/utils/student.utils.ts

import { StudentRepository } from "../../core/StudentRepository";

/**
 * Generate a unique admission number for a student in a specific school.
 * Format: SCHOOLID-XXXX (e.g., 001-0001)
 * 
 * @param schoolId - The ID of the school
 * @param studentRepository - instance of StudentRepository
 * @param baseNumber - Optional base number to use instead of calculating from existing students
 * @returns admission number as a string
 */
export async function generateAdmissionNumber(
  schoolId: number,
  studentRepository: StudentRepository,
  baseNumber?: number
): Promise<string> {
  let nextNumber: number;

  if (baseNumber !== undefined) {
    // Use provided base number
    nextNumber = baseNumber;
  } else {
    // Fetch all students in the school and calculate next number
    const studentsInSchool = await studentRepository.findAllBySchoolId(schoolId);
    nextNumber = studentsInSchool.length + 1;
  }

  // Format: SCHOOLID-XXXX
  const admissionNumber = `${schoolId.toString().padStart(3, "0")}-${nextNumber
    .toString()
    .padStart(4, "0")}`;

  return admissionNumber;
}

/**
 * Generate a strong 12-character password containing:
 * - Uppercase letters
 * - Lowercase letters
 * - Numbers
 * - Special characters
 */
export function generateStrongPassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*()-_=+<>?";

  const allChars = uppercase + lowercase + numbers + special;

  let password = "";

  // Ensure password contains at least 1 of each required category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the remaining characters randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password (to avoid predictable order)
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Generate a random PIN with specified number of digits
 * @param length - Number of digits (default: 4)
 * @returns Random PIN as string
 */
export function generateRandomPIN(length: number = 4): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}


/**
 * Convert a string into a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); 
}

/**
 * Normalized frontend origin (no trailing slashes). `FRONTEND_URL` may end with `/`.
 */
export function getFrontendBaseUrl(): string {
  return (process.env["FRONTEND_URL"] || "http://localhost:3000").trim().replace(/\/+$/, "");
}

/**
 * Join the frontend base URL with a path or path+query without duplicating slashes.
 */
export function joinFrontendUrl(path: string): string {
  const base = getFrontendBaseUrl();
  const normalizedPath = path.replace(/^\/+/, "");
  return `${base}/${normalizedPath}`;
}

/**
 * Construct a portal URL and optionally prepend a tenant subdomain.
 * When a subdomain is provided, `www.` and `app.` are stripped from the
 * configured frontend host before prepending the tenant subdomain.
 */
export function getSchoolPortalUrl(path: string, subDomain?: string): string {
  let baseUrl = getFrontendBaseUrl();
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (subDomain) {
    try {
      const baseUrlObj = new URL(baseUrl);
      const normalizedHost = baseUrlObj.hostname.replace(/^www\./, "").replace(/^app\./, "");
      if (!normalizedHost.startsWith(`${subDomain}.`)) {
        baseUrlObj.hostname = `${subDomain}.${normalizedHost}`;
      }
      baseUrl = baseUrlObj.toString().replace(/\/+$/, "");
    } catch (_e) {
      // Fallback to the configured frontend URL if parsing fails.
    }
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Capitalize only the first letter of a string.
 */
export function capitalizeFirstLetter(value?: string | null): string {
  if (!value) {
    return "";
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  return trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1);
}
