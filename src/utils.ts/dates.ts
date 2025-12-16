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

/**
 * Minimal formatter (covers common cases)
 * Supported tokens:
 * yyyy MM dd HH mm ss
 */
export function format(date: Date, pattern: string): string {
    const pad = (n: number) => String(n).padStart(2, '0');

    const replacements: Record<string, string> = {
        yyyy: String(date.getFullYear()),
        MM: pad(date.getMonth() + 1),
        dd: pad(date.getDate()),
        HH: pad(date.getHours()),
        mm: pad(date.getMinutes()),
        ss: pad(date.getSeconds()),
    };

    return pattern.replace(
        /yyyy|MM|dd|HH|mm|ss/g,
        (token) => replacements[token]
    );
}
