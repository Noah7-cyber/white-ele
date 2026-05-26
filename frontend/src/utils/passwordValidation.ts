/**
 * Shared password rules: minimum 8 characters, at least one uppercase letter,
 * one number, and one special character.
 * Used for register, change password, and reset password flows.
 */

export const PASSWORD_RULES = {
  minLength: 8,
  description:
    "Password must be at least 8 characters and contain an uppercase letter, a number, and a special character.",
} as const;

const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

/**
 * Validates password against shared rules.
 * @returns Error message or null if valid
 */
export function validatePassword(value: string): string | null {
  if (!value || value.length < PASSWORD_RULES.minLength) {
    return "Password must be at least 8 characters";
  }
  if (!HAS_UPPERCASE.test(value)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!HAS_NUMBER.test(value)) {
    return "Password must contain at least one number";
  }
  if (!HAS_SPECIAL.test(value)) {
    return "Password must contain at least one special character";
  }
  return null;
}

/**
 * Yup test function for use in schema:
 * .test("password-requirements", PASSWORD_RULES.description, (value) => !validatePassword(value))
 */
export function yupPasswordTest(value: string | undefined): boolean {
  if (value == null || value === "") return true; // let .required() handle empty
  return validatePassword(value) === null;
}
