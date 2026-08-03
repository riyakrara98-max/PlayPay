/**
 * Formats an ISO string or Date into a human-readable date string.
 */
export function formatDate(dateInput: string | Date | number | undefined | null): string {
  if (!dateInput) return 'N/A';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';
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
 * Formats an ISO string or Date into a full date and time string.
 */
export function formatDateTime(dateInput: string | Date | number | undefined | null): string {
  if (!dateInput) return 'N/A';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';
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
export function formatRelativeTime(dateInput: string | Date | number | undefined | null): string {
  if (!dateInput) return 'N/A';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';
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
