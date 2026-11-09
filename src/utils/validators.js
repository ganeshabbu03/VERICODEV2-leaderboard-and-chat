// Form validation helpers -------------------------------------------------
// Pure functions that return either an empty string (valid) or a human-readable
// error message. They're shaped so you can call them like:
//   const error = validateEmail(value);
//   if (error) setErrors((p) => ({ ...p, email: error }));
// Reusable across Login / Signup / future forms.

export const REQUIRED_FIELD = 'This field is required';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function required(value, label = 'This field') {
  if (value === null || value === undefined) return REQUIRED_FIELD;
  const trimmed = String(value).trim();
  if (trimmed.length === 0) return REQUIRED_FIELD;
  return '';
}

export function validateEmail(value) {
  const empty = required(value, 'Email');
  if (empty) return empty;
  if (!EMAIL_PATTERN.test(String(value).trim())) {
    return 'Please enter a valid email address';
  }
  return '';
}

export function validatePassword(value, { minLength = 8 } = {}) {
  const empty = required(value, 'Password');
  if (empty) return empty;
  const v = String(value);
  if (v.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  if (!/[A-Za-z]/.test(v)) {
    return 'Password must contain at least one letter';
  }
  if (!/[0-9]/.test(v)) {
    return 'Password must contain at least one number';
  }
  return '';
}

export function validateName(value) {
  const empty = required(value, 'Name');
  if (empty) return empty;
  if (String(value).trim().length < 2) {
    return 'Name should be at least 2 characters';
  }
  return '';
}

export function validateConfirmPassword(password, confirm) {
  const empty = required(confirm, 'Confirm password');
  if (empty) return empty;
  if (String(password) !== String(confirm)) {
    return 'Passwords do not match';
  }
  return '';
}

// Tiny password strength meter. Returns a label and score (0-4).
export function passwordStrength(value) {
  const v = String(value || '');
  if (!v) return { score: 0, label: '' };

  let score = 0;
  if (v.length >= 8) score += 1;
  if (/[A-Z]/.test(v)) score += 1;
  if (/[0-9]/.test(v)) score += 1;
  if (/[^A-Za-z0-9]/.test(v)) score += 1;

  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[Math.max(1, Math.min(score, 4))] };
}

// Helper that runs an object of validators and returns the first error per field.
export function runValidators(values, schema) {
  const errors = {};
  Object.keys(schema).forEach((key) => {
    const validator = schema[key];
    if (typeof validator === 'function') {
      const result = validator(values[key], values);
      if (result) errors[key] = result;
    }
  });
  return errors;
}
