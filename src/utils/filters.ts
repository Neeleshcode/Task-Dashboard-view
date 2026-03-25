import { Task, FilterState, SortConfig, Priority } from "../types";

// ─────────────────────────────────────────────
//  Filtering
// ─────────────────────────────────────────────

/**
 * Returns only the tasks that match every active filter.
 * An empty filter list means "no restriction" for that dimension.
 */
export function applyFilters(tasks: Task[], filters: FilterState): Task[] {
  return tasks.filter((task) => {
    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) {
      return false;
    }

    // Priority filter
    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
      return false;
    }

    // Assignee filter
    if (filters.assigneeIds.length > 0 && !filters.assigneeIds.includes(task.assigneeId)) {
      return false;
    }

    // Date-range filter (compared as ISO strings — lexicographic order works for YYYY-MM-DD)
    if (filters.dateFrom && task.dueDate < filters.dateFrom) return false;
    if (filters.dateTo   && task.dueDate > filters.dateTo)   return false;

    return true;
  });
}

// ─────────────────────────────────────────────
//  Sorting
// ─────────────────────────────────────────────

/**
 * Numeric rank for each priority (lower = higher urgency).
 * Used so "Critical > High > Medium > Low" sorts correctly.
 */
const PRIORITY_RANK: Record<Priority, number> = {
  critical: 0,
  high:     1,
  medium:   2,
  low:      3,
};

/**
 * Returns a sorted copy of `tasks`.
 * Supports sorting by title (A–Z / Z–A), priority (Critical first),
 * or dueDate (earliest first). Direction flips for descending.
 */
export function applySort(tasks: Task[], sort: SortConfig): Task[] {
  return [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "priority":
        comparison = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        break;
      case "dueDate":
        comparison = a.dueDate.localeCompare(b.dueDate);
        break;
    }

    return sort.direction === "asc" ? comparison : -comparison;
  });
}

// ─────────────────────────────────────────────
//  Filter state helpers
// ─────────────────────────────────────────────

/** Returns true when at least one filter dimension is active. */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.statuses.length    > 0 ||
    filters.priorities.length  > 0 ||
    filters.assigneeIds.length > 0 ||
    !!filters.dateFrom ||
    !!filters.dateTo
  );
}
