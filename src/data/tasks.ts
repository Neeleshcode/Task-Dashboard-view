import { Task, Status, Priority } from "../types";

// ─────────────────────────────────────────────────────────
//  Constants used when generating mock tasks
// ─────────────────────────────────────────────────────────

const ALL_STATUSES: Status[]   = ["todo", "inprogress", "inreview", "done"];
const ALL_PRIORITIES: Priority[] = ["critical", "high", "medium", "low"];
const ALL_USER_IDS             = ["u1", "u2", "u3", "u4", "u5", "u6"];

/** 50 realistic task titles — cycled to produce 520 unique tasks. */
const TASK_TITLES = [
  "Implement authentication flow",
  "Design landing page hero",
  "Fix responsive layout issues",
  "Write unit tests for API",
  "Optimize database queries",
  "Add dark mode support",
  "Refactor state management",
  "Update dependency versions",
  "Create onboarding flow",
  "Build notification system",
  "Integrate payment gateway",
  "Set up CI/CD pipeline",
  "Improve error handling",
  "Add analytics tracking",
  "Implement search functionality",
  "Migrate to TypeScript",
  "Build admin dashboard",
  "Add export to CSV feature",
  "Implement infinite scroll",
  "Fix memory leak in hooks",
  "Create API documentation",
  "Add multi-language support",
  "Build email templates",
  "Optimize image loading",
  "Implement WebSocket support",
  "Add role-based access control",
  "Build mobile navigation",
  "Create data visualization charts",
  "Fix cross-browser compatibility",
  "Add keyboard shortcuts",
  "Implement drag and drop",
  "Build file upload feature",
  "Create user profile page",
  "Add two-factor authentication",
  "Implement activity log",
  "Build comment system",
  "Add date range picker",
  "Fix performance bottlenecks",
  "Implement lazy loading",
  "Create audit trail",
  "Build reporting module",
  "Add custom theming",
  "Implement content editor",
  "Fix accessibility issues",
  "Add pagination support",
  "Build collaboration tools",
  "Create backup system",
  "Implement rate limiting",
  "Add data validation",
  "Build dashboard widgets",
];

// ─────────────────────────────────────────────────────────
//  Date range: tasks span 3 months ago → 3 months from now
// ─────────────────────────────────────────────────────────

const today          = new Date();
const threeMonthsAgo = new Date(today);
threeMonthsAgo.setMonth(today.getMonth() - 3);

const threeMonthsLater = new Date(today);
threeMonthsLater.setMonth(today.getMonth() + 3);

// ─────────────────────────────────────────────────────────
//  Seeded (deterministic) random helpers
//
//  We use a linear-congruential generator instead of
//  Math.random() so the dataset is identical on every
//  page load — no flickering re-renders on hot reload.
// ─────────────────────────────────────────────────────────

function createSeededRng(initialSeed: number) {
  let seed = initialSeed;

  /** Returns a deterministic float in [0, 1). */
  function next(): number {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  /** Picks a random element from an array. */
  function pick<T>(arr: T[]): T {
    return arr[Math.floor(next() * arr.length)];
  }

  /** Returns an ISO date string (YYYY-MM-DD) between two Date objects. */
  function dateInRange(start: Date, end: Date): string {
    const ms = start.getTime() + next() * (end.getTime() - start.getTime());
    return new Date(ms).toISOString().split("T")[0];
  }

  return { pick, dateInRange };
}

// ─────────────────────────────────────────────────────────
//  Task generator
// ─────────────────────────────────────────────────────────

/**
 * Generates 520 mock tasks with deterministic random data.
 * Titles are cycled from the list above and given a version
 * suffix ("v2", "v3", …) on subsequent cycles.
 */
export function generateTasks(): Task[] {
  const rng = createSeededRng(42);
  const tasks: Task[] = [];

  for (let i = 0; i < 520; i++) {
    // Cycle through the title list; append "v2", "v3", etc. after the first pass.
    const baseTitle  = TASK_TITLES[i % TASK_TITLES.length];
    const cycleIndex = Math.floor(i / TASK_TITLES.length) + 1;
    const title      = cycleIndex > 1 ? `${baseTitle} v${cycleIndex}` : baseTitle;

    const dueDate   = rng.dateInRange(threeMonthsAgo, threeMonthsLater);
    const hasStart  = rng.pick([true, false, false, true, true]); // ~60% chance
    const startDate = hasStart
      ? rng.dateInRange(threeMonthsAgo, new Date(dueDate))
      : null;

    tasks.push({
      id:         `task-${i + 1}`,
      title,
      assigneeId: rng.pick(ALL_USER_IDS),
      status:     rng.pick(ALL_STATUSES),
      priority:   rng.pick(ALL_PRIORITIES),
      startDate,
      dueDate,
    });
  }

  return tasks;
}

/** The single dataset shared across the entire app. */
export const INITIAL_TASKS = generateTasks();
