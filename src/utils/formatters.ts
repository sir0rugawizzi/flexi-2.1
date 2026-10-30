/**
 * Utility formatters for Ugandan currency (UGX) and Africa/Kampala time
 */

export function formatUGX(amount: number): string {
  const rounded = Math.round(amount);
  return 'UGX ' + rounded.toLocaleString('en-US');
}

export function formatKampalaDate(dateInput?: string | Date | number | null): string {
  if (!dateInput) return 'Never';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Never';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatKampalaDateTime(dateInput?: string | Date | number | null): string {
  if (!dateInput) return 'Never';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Never';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDayOfWeek(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    weekday: 'short',
  }).format(date);
}
