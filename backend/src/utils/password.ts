export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_RULE_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, a number and a special character";

export function isStrongPassword(value: unknown): value is string {
  return typeof value === "string" && PASSWORD_REGEX.test(value);
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;