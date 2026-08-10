import { UserDocument } from '@/types/firestore';

/**
 * Extracts a clean uppercase alphabetic name prefix from a user's name or email.
 * Prefers the first word of displayName (e.g. "Priya Sharma" -> "PRIYA").
 *
 * Examples:
 * - "Priya Sharma" -> "PRIYA"
 * - "Anshu Kumar" -> "ANSHU"
 * - "Rahul Kumar" -> "RAHUL"
 * - "Neha Singh" -> "NEHA"
 */
export function extractNamePrefix(user?: UserDocument | null): string {
  if (!user) return 'LEADER';

  // 1. Primary source: first word of displayName or firstName
  const rawDisplayName = (user.displayName || (user as any).firstName || '').trim();
  let candidate = '';

  if (rawDisplayName.length > 0) {
    const firstWord = rawDisplayName.split(/\s+/)[0];
    candidate = firstWord.toUpperCase().replace(/[^A-Z]/g, '');
  }

  // 2. Fallback: email username if name not available
  if (!candidate && user.email) {
    const emailPrefix = user.email.split('@')[0];
    candidate = emailPrefix.toUpperCase().replace(/[^A-Z]/g, '');
  }

  // 3. Absolute fallback: LEADER
  if (!candidate || candidate.length === 0) {
    candidate = 'LEADER';
  }

  // Enforce min length 2, max length 6 for name prefix
  if (candidate.length < 2) {
    candidate = (candidate + 'LEADER').slice(0, 5);
  } else if (candidate.length > 6) {
    candidate = candidate.slice(0, 6);
  }

  return candidate;
}

/**
 * Generates a unique Leader Referral Code in the canonical format:
 * [NAME_PREFIX][3 DIGITS] (e.g., PRIYA482, ANSHU195, RAHUL731, NEHA426).
 *
 * Rules:
 * 1. Name prefix from Team Leader's actual first name/display name.
 * 2. Uppercase, alphabetic A-Z only, no spaces or special characters.
 * 3. Exactly 3 numeric digits (000–999).
 * 4. Checked against existing leader codes for uniqueness.
 */
export function generateLeaderCode(
  existingUsers: UserDocument[],
  user?: UserDocument | null
): string {
  const prefix = extractNamePrefix(user);

  // Collect all existing leader codes (normalized uppercase)
  const existingCodes = new Set<string>();
  existingUsers.forEach((u) => {
    if (u.leaderCode && u.leaderCode.trim()) {
      existingCodes.add(u.leaderCode.trim().toUpperCase());
    }
  });

  let candidate = '';
  let attempts = 0;

  do {
    // Generate exactly 3 numeric digits (000 - 999)
    const randomDigits = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');

    candidate = `${prefix}${randomDigits}`;
    attempts++;
  } while (existingCodes.has(candidate) && attempts < 500);

  return candidate;
}
