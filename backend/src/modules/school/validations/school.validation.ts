import { body, param, query, ValidationChain } from "express-validator";
import { SchoolType } from "../../shared/entities";

const timeField = (fieldName: string): ValidationChain =>
  body(fieldName)
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage(`${fieldName} must be in HH:MM or HH:MM:SS format`);

const hostnameMatchesRootOrSubdomain = (host: string, root: string): boolean => {
  const h = host.toLowerCase();
  const r = root.toLowerCase();
  return h === r || h.endsWith(`.${r}`);
};

/** True when the value should be validated as a URL (not a bare handle like "ekene"). */
const looksLikeSocialUrl = (value: string): boolean => {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return true;
  if (v.includes("/")) return true;
  if (/\.(facebook|fb)\.(com|me)\b/i.test(v)) return true;
  if (/(^|[.@])(x|twitter)\.com\b/i.test(v)) return true;
  if (/instagram\.com\b/i.test(v)) return true;
  if (/tiktok\.com\b/i.test(v)) return true;
  return false;
};

const flexibleSocialField = (
  field: string,
  displayLabel: string,
  hostPredicate: (host: string) => boolean,
  handlePattern: RegExp
): ValidationChain =>
  body(field)
    .optional()
    .trim()
    .if((value: unknown) => typeof value === "string" && value.length > 0)
    .isLength({ max: 500 })
    .withMessage(`${displayLabel} must not exceed 500 characters`)
    .custom((value: string) => {
      if (looksLikeSocialUrl(value)) {
        const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
        let host: string;
        try {
          host = new URL(normalized).hostname;
        } catch {
          throw new Error(`${displayLabel} must be a valid URL`);
        }
        if (!hostPredicate(host.toLowerCase())) {
          throw new Error(`${displayLabel} must use an allowed domain for this platform`);
        }
        return true;
      }
      if (!handlePattern.test(value)) {
        throw new Error(
          `${displayLabel} must be a profile handle/username or a full URL for this platform`
        );
      }
      return true;
    });

const socialValidators: ValidationChain[] = [
  flexibleSocialField(
    "x",
    "X (Twitter)",
    (host) =>
      hostnameMatchesRootOrSubdomain(host, "x.com") || hostnameMatchesRootOrSubdomain(host, "twitter.com"),
    /^@?[A-Za-z0-9_]{1,100}$/
  ),
  flexibleSocialField(
    "facebook",
    "Facebook",
    (host) =>
      hostnameMatchesRootOrSubdomain(host, "facebook.com") ||
      hostnameMatchesRootOrSubdomain(host, "fb.com") ||
      hostnameMatchesRootOrSubdomain(host, "fb.me"),
    /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/
  ),
  flexibleSocialField(
    "instagram",
    "Instagram",
    (host) => hostnameMatchesRootOrSubdomain(host, "instagram.com"),
    /^@?[A-Za-z0-9._]{1,100}$/
  ),
  flexibleSocialField(
    "tiktok",
    "TikTok",
    (host) => hostnameMatchesRootOrSubdomain(host, "tiktok.com"),
    /^@?[A-Za-z0-9._]{1,100}$/
  ),
];

export const validateCreateSchool: ValidationChain[] = [
  body("brandColor")
    .optional()
    .trim()
    .isString()
    .isLength({ max: 50 })
    .withMessage("Brand color must not exceed 50 characters"),

  body("schoolName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("School name must be between 2 and 255 characters"),

  body("schoolMotto")
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("School motto must be between 2 and 255 characters"),

  body("schoolType")
    .optional()
    .isIn(Object.values(SchoolType)),

  body("schoolLogoUrl")
    .optional()
    .trim()
    .isURL({ require_protocol: true })
    .withMessage("School logo URL must be a valid URL"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email must be a valid email address"),

  body("phoneNumber")
    .optional()
    .isString()
    .withMessage("Phone number must be a string")
    .isLength({ min: 5, max: 20 })
    .withMessage("Phone number must be between 5 and 20 characters"),

  body("subDomain")
    .optional()
    .trim()
    .if(body("subDomain").not().isEmpty())
    .toLowerCase()
    .matches(/^[a-z0-9](?:[a-z0-9-]{0,148}[a-z0-9])?$/)
    .withMessage("Subdomain must be lowercase, alphanumeric, and may contain hyphens (but not at the start or end)"),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City must not exceed 100 characters"),


  body("state")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("State must not exceed 100 characters"),

  body("country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country must not exceed 100 characters"),


  body("postalCode")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Postal code must not exceed 20 characters"),


  body("maximumNumberOfStudents")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Maximum number of students must be a positive integer"),

  ...socialValidators,

  timeField("studentResumptionTime"),
  timeField("staffResumptionTime"),
  timeField("schoolClosingTime"),
  timeField("staffClosingTime"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
];


export const validateUpdateSchool: ValidationChain[] = [
  body("brandColor")
    .optional()
    .trim()
    .isString()
    .isLength({ max: 50 })
    .withMessage("Brand color must not exceed 50 characters"),

  body("schoolName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("School name must be between 2 and 255 characters"),

  body("schoolMotto")
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("School motto must be between 2 and 255 characters"),

  body("schoolType")
    .optional()
    .isIn(Object.values(SchoolType)),

  body("schoolLogoUrl")
    .optional()
    .trim()
    .isURL({ require_protocol: true })
    .withMessage("School logo URL must be a valid URL"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email must be a valid email address"),

  body("phoneNumber")
    .optional()
    .isString()
    .withMessage("Phone number must be a string")
    .isLength({ min: 5, max: 20 })
    .withMessage("Phone number must be between 5 and 20 characters"),

  body("subDomain")
    .optional()
    .trim()
    .if(body("subDomain").not().isEmpty())
    .toLowerCase()
    .matches(/^[a-z0-9](?:[a-z0-9-]{0,148}[a-z0-9])?$/)
    .withMessage("Subdomain must be lowercase, alphanumeric, and may contain hyphens (but not at the start or end)"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address must not exceed 500 characters"),

  body("country")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Country must not exceed 500 characters"),

  ...socialValidators,

  timeField("studentResumptionTime"),
  timeField("staffResumptionTime"),
  timeField("schoolClosingTime"),
  timeField("staffClosingTime"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 500 characters"),
];


export const validateGetSchool: ValidationChain[] = [
  param("id")
    .notEmpty()
    .withMessage("School ID is required")
    .isInt({ min: 1 })
    .withMessage("School ID must be a valid integer")
    .toInt(),
];

export const validateDeleteSchool: ValidationChain[] = [...validateGetSchool];

export const validateGetSchools: ValidationChain[] = [
  query("schoolName")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("School name filter must not exceed 255 characters"),

  query("pos")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Position must be a non-negative integer")
    .toInt(),

  query("delta")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Delta must be between 1 and 100")
    .toInt(),

  query("sortBy")
    .optional()
    .isIn(["schoolName", "createdAt", "updatedAt"])
    .withMessage("Invalid sort field"),

  query("sortOrder")
    .optional()
    .isIn(["ASC", "DESC", "asc", "desc"])
    .withMessage("Sort order must be ASC or DESC")
    .toUpperCase(),
];
