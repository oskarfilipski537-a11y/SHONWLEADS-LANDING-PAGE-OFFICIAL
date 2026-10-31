/**
 * Formats a raw string into standard US Phone format: (XXX) XXX-XXXX
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return '';

  // Strip all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Limit to 10 digits (or 11 if leading with 1)
  const cleaned = digits.startsWith('1') && digits.length > 10 ? digits.slice(1, 11) : digits.slice(0, 10);

  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

/**
 * Validates US phone number (must contain 10 valid digits)
 */
export function isValidUSPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    // Basic check: area code shouldn't start with 0 or 1 in NANP
    return digits[0] !== '0' && digits[0] !== '1';
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits[1] !== '0' && digits[1] !== '1';
  }
  return false;
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Splits full name into first and last name
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}
