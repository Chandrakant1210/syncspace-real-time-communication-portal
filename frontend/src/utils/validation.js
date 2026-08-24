/**
 * Shared field validators for the auth forms.
 *
 * Every validator returns an error string, or "" when the value is valid —
 * so a form's error map is simply `{ email: validateEmail(email), ... }` and
 * "is this form valid?" is "are all the values empty strings?".
 */

// Deliberately permissive: catches typos ("no @", "no dot") without rejecting
// the many legitimate addresses a stricter regex would.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PASSWORD_MIN = 6;

export function validateName(value) {
  const name = value.trim();
  if (!name) return "Full name is required.";
  if (name.length < 2) return "Please enter at least 2 characters.";
  return "";
}

export function validateEmail(value) {
  const email = value.trim();
  if (!email) return "Email is required.";
  if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
  return "";
}

export function validatePassword(value) {
  if (!value) return "Password is required.";
  if (value.length < PASSWORD_MIN)
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  return "";
}

export function validateConfirmPassword(value, password) {
  if (!value) return "Please confirm your password.";
  if (value !== password) return "Passwords do not match.";
  return "";
}

/** True when no field in the error map holds a message. */
export function isFormValid(errors) {
  return Object.values(errors).every((message) => !message);
}

/**
 * Rough password strength for the live hint on the register form.
 * Returns { score: 0-3, label, tone } — score 0 means "nothing typed yet".
 */
export function passwordStrength(value) {
  if (!value) return { score: 0, label: "", tone: "" };

  let points = 0;
  if (value.length >= PASSWORD_MIN) points += 1;
  if (value.length >= 10) points += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) points += 1;
  if (/\d/.test(value)) points += 1;
  if (/[^A-Za-z0-9]/.test(value)) points += 1;

  if (value.length < PASSWORD_MIN || points <= 2)
    return { score: 1, label: "Weak", tone: "red" };
  if (points === 3 || points === 4)
    return { score: 2, label: "Medium", tone: "amber" };
  return { score: 3, label: "Strong", tone: "emerald" };
}
