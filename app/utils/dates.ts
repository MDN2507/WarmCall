/**
 * Returns a YYYY-MM-DD key for a date, based on the LOCAL calendar day
 * (device timezone), not UTC.
 *
 * `date.toISOString().slice(0, 10)` looks similar but is wrong for this
 * purpose: it returns the UTC calendar day. For users ahead of UTC (e.g.
 * Russia, UTC+2..+12), a call made shortly after local midnight can still
 * fall on the *previous* UTC day, causing "today" to incorrectly show as
 * "yesterday" and the daily-streak counter to miscount around midnight.
 */
export function localDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
