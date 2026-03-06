import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';

export function cn(...inputs: Array<ClassValue>): string {
  return twMerge(clsx(inputs));
}

/**
 * Parse a date value into a local Date, avoiding the UTC-midnight shift
 * that occurs when passing a date-only string ('YYYY-MM-DD') to `new Date()`.
 */
/**
 * Filters empty/whitespace-only strings from an array.
 * Returns `['']` if all entries are empty (preserves at least one input slot).
 */
export function filterNonEmpty(arr: Array<string>): Array<string> {
  const filtered = arr.filter((s) => s.trim().length > 0);
  return filtered.length > 0 ? filtered : [''];
}

export function parseLocalDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}
