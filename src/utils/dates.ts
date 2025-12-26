/* ---------- Day helpers ---------- */

export function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Converts a UTC-midnight date (from database DATE columns) to a local date object
 * that represents the same calendar date in local time.
 *
 * Example: 2024-12-25T00:00:00Z -> 2024-12-25T00:00:00 local
 */
export function utcDateToLocal(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/* ---------- Week helpers (Monday-based) ---------- */

export function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay() || 7; // Sunday -> 7
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function endOfWeek(date: Date): Date {
    const d = startOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
}

/* ---------- Date utilities ---------- */

export function addDays(date: Date, amount: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + amount);
    return d;
}

export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

