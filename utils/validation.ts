/**
 * Validates an email address.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password strength (minimum 6 characters).
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
}

/**
 * Validates WhatsApp phone number format.
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  return /^\d{10,15}$/.test(cleaned);
}

/**
 * Validates a web URL string.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes text input to prevent basic script injection.
 */
export function sanitizeInput(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.trim().replace(/<[^>]*>?/gm, '');
}
