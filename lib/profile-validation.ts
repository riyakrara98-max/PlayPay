/**
 * Utility functions for form validation, formatting, and security checks for Profile Management
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Formats phone input to strictly 10 numeric digits
 */
export function formatPhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, '');
  return digits.slice(0, 10);
}

/**
 * Validates Indian Phone Number (10 digits starting with 6-9)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const cleanPhone = phone.trim();
  if (!cleanPhone) {
    return { isValid: false, message: 'Phone number is required.' };
  }
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      message: 'Enter a valid 10-digit phone number starting with 6, 7, 8, or 9.',
    };
  }
  return { isValid: true };
}

/**
 * Validates UPI ID format (e.g., username@bank)
 */
export function validateUpiId(upi: string): ValidationResult {
  const cleanUpi = upi.trim();
  if (!cleanUpi) {
    return { isValid: false, message: 'UPI ID is required.' };
  }
  if (cleanUpi.length > 100) {
    return { isValid: false, message: 'UPI ID cannot exceed 100 characters.' };
  }
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (!upiRegex.test(cleanUpi)) {
    return {
      isValid: false,
      message: 'Enter a valid UPI ID (e.g. 9876543210@paytm or name@okicici).',
    };
  }
  return { isValid: true };
}

/**
 * Validates Indian Financial System Code (IFSC)
 * Structure: 4 alphabets + 0 + 6 alphanumeric
 */
export function validateIfsc(ifsc: string): ValidationResult {
  const cleanIfsc = ifsc.trim().toUpperCase();
  if (!cleanIfsc) {
    return { isValid: false, message: 'IFSC code is required.' };
  }
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(cleanIfsc)) {
    return {
      isValid: false,
      message: 'Enter a valid 11-character IFSC code (e.g. SBIN0001234).',
    };
  }
  return { isValid: true };
}

/**
 * Validates Indian Bank Account Number (9 to 18 numeric digits)
 */
export function validateAccountNumber(accountNo: string): ValidationResult {
  const cleanNo = accountNo.trim();
  if (!cleanNo) {
    return { isValid: false, message: 'Account number is required.' };
  }
  const accRegex = /^\d{9,18}$/;
  if (!accRegex.test(cleanNo)) {
    return {
      isValid: false,
      message: 'Bank account number must be between 9 and 18 digits.',
    };
  }
  return { isValid: true };
}

/**
 * Validates Bank Name
 */
export function validateBankName(bankName: string): ValidationResult {
  const cleanBank = bankName.trim();
  if (!cleanBank) {
    return { isValid: false, message: 'Bank name is required.' };
  }
  if (cleanBank.length < 2) {
    return { isValid: false, message: 'Bank name must be at least 2 characters.' };
  }
  if (cleanBank.length > 100) {
    return { isValid: false, message: 'Bank name cannot exceed 100 characters.' };
  }
  return { isValid: true };
}

/**
 * Validates Account Holder Name
 */
export function validateAccountHolder(accountHolder: string): ValidationResult {
  const cleanHolder = accountHolder.trim();
  if (!cleanHolder) {
    return { isValid: false, message: 'Account holder name is required.' };
  }
  if (cleanHolder.length < 2) {
    return { isValid: false, message: 'Account holder name must be at least 2 characters.' };
  }
  if (cleanHolder.length > 100) {
    return { isValid: false, message: 'Account holder name cannot exceed 100 characters.' };
  }
  return { isValid: true };
}

/**
 * Validates Strong Password Requirements
 */
export function validateStrongPassword(password: string): ValidationResult {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*).' };
  }
  return { isValid: true };
}

export interface ProfileFormValues {
  phoneNumber: string;
  upiId: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
}

export interface ProfileFormErrors {
  phoneNumber?: string;
  upiId?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifscCode?: string;
}

export function validateFullProfileForm(values: ProfileFormValues): {
  isValid: boolean;
  errors: ProfileFormErrors;
} {
  const errors: ProfileFormErrors = {};

  const phoneRes = validatePhoneNumber(values.phoneNumber);
  if (!phoneRes.isValid) errors.phoneNumber = phoneRes.message;

  const upiRes = validateUpiId(values.upiId);
  if (!upiRes.isValid) errors.upiId = upiRes.message;

  const bankRes = validateBankName(values.bankName);
  if (!bankRes.isValid) errors.bankName = bankRes.message;

  const holderRes = validateAccountHolder(values.accountHolder);
  if (!holderRes.isValid) errors.accountHolder = holderRes.message;

  const accRes = validateAccountNumber(values.accountNumber);
  if (!accRes.isValid) errors.accountNumber = accRes.message;

  const ifscRes = validateIfsc(values.ifscCode);
  if (!ifscRes.isValid) errors.ifscCode = ifscRes.message;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
