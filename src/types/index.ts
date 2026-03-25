// ─────────────────────────────────────────────
//  Core domain types for the Project Tracker
// ─────────────────────────────────────────────

/** The four stages a task can be in. */
export type Status = "todo" | "inprogress" | "inreview" | "done";

/** Urgency level of a task (highest → lowest). */
export type Priority = "critical" | "high" | "medium" | "low";

// ── Data models ──────────────────────────────

export interface User {
  id: string;
  name: string;
  /** Hex color used for the user's avatar background. */
  color: string;
  /** Two-letter abbreviation shown inside the avatar, e.g. "AM". */
  initials: string;
}

export interface Task {
  id: string;
  title: string;
  /** References a User by id. */
  assigneeId: string;
  status: Status;
  priority: Priority;
  /** ISO date string (YYYY-MM-DD), or null when no start date is set. */
  startDate: string | null;
  /** ISO date string (YYYY-MM-DD). Always present. */
  dueDate: string;
}

// ── View ─────────────────────────────────────

/** Which board layout is currently displayed. */
export type ViewType = "kanban" | "list" | "timeline";

// ── Sorting (List View) ───────────────────────

export type SortField = "title" | "priority" | "dueDate";
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// ── Filtering ────────────────────────────────

export interface FilterState {
  /** Show only tasks whose status is in this list (empty = show all). */
  statuses: Status[];
  /** Show only tasks whose priority is in this list (empty = show all). */
  priorities: Priority[];
  /** Show only tasks assigned to one of these user ids (empty = show all). */
  assigneeIds: string[];
  /** ISO date string — hide tasks due before this date. */
  dateFrom: string;
  /** ISO date string — hide tasks due after this date. */
  dateTo: string;
}

// ── Global app state ─────────────────────────

export interface AppState {
  tasks: Task[];
  users: User[];
  view: ViewType;
  filters: FilterState;
  sort: SortConfig;
  /** Maps taskId → array of userIds currently "viewing" that task. */
  activeCollaborators: Record<string, string[]>;
}

// ── Reducer actions ──────────────────────────

export type AppAction =
  | { type: "SET_VIEW"; view: ViewType }
  | { type: "SET_FILTERS"; filters: FilterState }
  | { type: "SET_SORT"; sort: SortConfig }
  | { type: "UPDATE_TASK_STATUS"; taskId: string; status: Status }
  | { type: "UPDATE_COLLABORATORS"; collaborators: Record<string, string[]> };
