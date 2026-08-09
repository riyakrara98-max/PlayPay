/**
 * Helper to convert various date inputs (ISO string, Date, Timestamp) to Date object.
 */
export function parseDateInput(dateInput: unknown): Date | null {
  if (dateInput === null || dateInput === undefined) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'number') {
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof dateInput === 'object') {
    const obj = dateInput as Record<string, unknown>;
    if (typeof obj.toDate === 'function') {
      try {
        const d = (obj.toDate as () => Date)();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {
        // fallback
      }
    }
    if (typeof obj.seconds === 'number') {
      return new Date(obj.seconds * 1000);
    }
    if (typeof obj._seconds === 'number') {
      return new Date((obj._seconds as number) * 1000);
    }
  }
  if (typeof dateInput === 'string') {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

/**
 * Formats an ISO string, Date, or Firestore Timestamp into a human-readable date string.
 */
export function formatDate(dateInput: unknown): string {
  const date = parseDateInput(dateInput);
  if (!date) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return 'N/A';
  }
}

/**
 * Formats an ISO string, Date, or Firestore Timestamp into a full date and time string.
 */
export function formatDateTime(dateInput: unknown): string {
  const date = parseDateInput(dateInput);
  if (!date) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return 'N/A';
  }
}

/**
 * Returns a relative time string (e.g. "5 minutes ago", "2 days ago").
 */
export function formatRelativeTime(dateInput: unknown): string {
  const date = parseDateInput(dateInput);
  if (!date) return 'N/A';
  try {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(date);
  } catch {
    return 'N/A';
  }
}

/**
 * Formats an amount to INR currency format.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Returns safe timestamp (ms) or 0 if invalid.
 */
export function getSafeTime(dateInput: unknown): number {
  const date = parseDateInput(dateInput);
  return date ? date.getTime() : 0;
}

/**
 * Returns remaining time string (e.g., "Ends in 2h 18m", "5h Left", "23m Left", "Expired").
 * Uses expiresAt input or defaults to a 24h task window if unspecified.
 */
export function formatRemainingTime(expiresAtInput: unknown): string {
  const expiryDate = parseDateInput(expiresAtInput);
  if (!expiryDate) return '24h Left';
  const now = new Date();
  const diffInMs = expiryDate.getTime() - now.getTime();
  if (diffInMs <= 0) return 'Expired';
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  if (diffInMinutes < 60) return `${diffInMinutes}m Left`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  const remainingMins = diffInMinutes % 60;
  if (diffInHours < 24) {
    return remainingMins > 0 ? `Ends in ${diffInHours}h ${remainingMins}m` : `${diffInHours}h Left`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d Left`;
}
