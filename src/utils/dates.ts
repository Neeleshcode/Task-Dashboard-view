// ─────────────────────────────────────────────
//  Date helpers
// ─────────────────────────────────────────────

/** Returns today's date as an ISO string (YYYY-MM-DD). */
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Returns the number of calendar days between today and `dateStr`.
 * Negative = in the past (overdue), 0 = today, positive = future.
 */
export function daysDiff(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}

/** Formats a date string as a short human-readable label, e.g. "Jun 5". */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Returns true when `dateStr` is today. */
export function isToday(dateStr: string): boolean {
  return daysDiff(dateStr) === 0;
}

/** Returns true when `dateStr` is in the past. */
export function isOverdue(dateStr: string): boolean {
  return daysDiff(dateStr) < 0;
}

// ── Due-date label (used on cards and in the list view) ──

interface DueDateInfo {
  /** Human-readable string to display. */
  label: string;
  isToday: boolean;
  isOverdue: boolean;
  /** 0 unless the task is overdue. */
  daysOverdue: number;
}

/**
 * Derives a display label and urgency flags from a due date string.
 *
 * Rules:
 *  - Due today          → "Due Today"
 *  - 1–7 days overdue   → "3d overdue"
 *  - 8+ days overdue    → "10 days overdue"
 *  - Future             → "Jun 5"
 */
export function getDueDateLabel(dateStr: string): DueDateInfo {
  const diff = daysDiff(dateStr);

  if (diff === 0) {
    return { label: "Due Today", isToday: true, isOverdue: false, daysOverdue: 0 };
  }

  if (diff < 0) {
    const daysOverdue = Math.abs(diff);
    const label = daysOverdue > 7
      ? `${daysOverdue} days overdue`
      : `${daysOverdue}d overdue`;

    return { label, isToday: false, isOverdue: true, daysOverdue };
  }

  // Future date — show a plain readable date
  return { label: formatDate(dateStr), isToday: false, isOverdue: false, daysOverdue: 0 };
}

// ── Calendar helpers (used by the Timeline view) ─────────

/**
 * Returns an array of Date objects for every day in the given month.
 * Month is 0-indexed (January = 0).
 */
export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date(year, month, 1);

  while (cursor.getMonth() === month) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

/** Converts a Date object to an ISO date string (YYYY-MM-DD). */
export function dateToISOString(date: Date): string {
  return date.toISOString().split("T")[0];
}
