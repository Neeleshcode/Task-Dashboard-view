import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from "react";
import { AppState, AppAction, FilterState, ViewType } from "../types";
import { INITIAL_TASKS } from "../data/tasks";
import { USERS } from "../data/users";

// ─────────────────────────────────────────────────────────
//  URL ↔ State synchronisation helpers
//
//  Filters and the active view are stored as query params so
//  the user can share links and use browser back/forward.
// ─────────────────────────────────────────────────────────

/** Reads filter values from the current URL's query string. */
function parseFiltersFromUrl(): FilterState {
  const params = new URLSearchParams(window.location.search);
  return {
    statuses:    params.getAll("status")   as FilterState["statuses"],
    priorities:  params.getAll("priority") as FilterState["priorities"],
    assigneeIds: params.getAll("assignee"),
    dateFrom:    params.get("dateFrom") ?? "",
    dateTo:      params.get("dateTo")   ?? "",
  };
}

/** Reads the active view from the current URL (defaults to "kanban"). */
function parseViewFromUrl(): ViewType {
  const view = new URLSearchParams(window.location.search).get("view");
  if (view === "kanban" || view === "list" || view === "timeline") return view;
  return "kanban";
}

/** Serialises the current filters + view into a query string. */
function buildQueryString(filters: FilterState, view: ViewType): string {
  const params = new URLSearchParams();
  params.set("view", view);

  filters.statuses.forEach((s)    => params.append("status",   s));
  filters.priorities.forEach((p)  => params.append("priority", p));
  filters.assigneeIds.forEach((a) => params.append("assignee", a));

  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo)   params.set("dateTo",   filters.dateTo);

  return params.toString();
}

// ─────────────────────────────────────────────────────────
//  Initial state — hydrated from URL on first load
// ─────────────────────────────────────────────────────────

const initialState: AppState = {
  tasks:               INITIAL_TASKS,
  users:               USERS,
  view:                parseViewFromUrl(),
  filters:             parseFiltersFromUrl(),
  sort:                { field: "dueDate", direction: "asc" },
  activeCollaborators: {},
};

// ─────────────────────────────────────────────────────────
//  Reducer — pure function; handles every state transition
// ─────────────────────────────────────────────────────────

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.view };

    case "SET_FILTERS":
      return { ...state, filters: action.filters };

    case "SET_SORT":
      return { ...state, sort: action.sort };

    case "UPDATE_TASK_STATUS":
      // Immutably update a single task's status
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? { ...task, status: action.status }
            : task
        ),
      };

    case "UPDATE_COLLABORATORS":
      return { ...state, activeCollaborators: action.collaborators };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────
//  React Context
// ─────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─────────────────────────────────────────────────────────
//  Provider
// ─────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Skip the first render so we don't replace the initial URL on mount.
  const isFirstRender = useRef(true);

  // ── Sync state → URL ──────────────────────────────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const queryString = buildQueryString(state.filters, state.view);
    window.history.pushState({}, "", `${window.location.pathname}?${queryString}`);
  }, [state.filters, state.view]);

  // ── Sync URL → state (browser back / forward buttons) ─
  useEffect(() => {
    const syncFromUrl = () => {
      dispatch({ type: "SET_FILTERS", filters: parseFiltersFromUrl() });
      dispatch({ type: "SET_VIEW",    view:    parseViewFromUrl() });
    };
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  // ── Collaboration simulation ───────────────────────────
  //
  //  Every 5 seconds we randomly assign 2–4 "active users"
  //  to a handful of tasks to simulate real-time presence.
  useEffect(() => {
    const simulate = () => {
      const activeUserCount = Math.floor(Math.random() * 3) + 2; // 2–4 users
      const sampledTaskIds  = [...state.tasks]
        .sort(() => Math.random() - 0.5)
        .slice(0, 8)
        .map((t) => t.id);

      const collaborators: Record<string, string[]> = {};

      for (let i = 0; i < activeUserCount; i++) {
        const userId    = `u${(i % 6) + 1}`;
        const taskCount = Math.floor(Math.random() * 2) + 1; // 1–2 tasks per user

        for (let j = 0; j < taskCount; j++) {
          const taskId = sampledTaskIds[(i + j) % sampledTaskIds.length];
          if (!collaborators[taskId]) collaborators[taskId] = [];
          if (!collaborators[taskId].includes(userId)) {
            collaborators[taskId].push(userId);
          }
        }
      }

      dispatch({ type: "UPDATE_COLLABORATORS", collaborators });
    };

    simulate(); // run immediately on mount
    const interval = setInterval(simulate, 5000);
    return () => clearInterval(interval);
  }, [state.tasks]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────
//  Hook — must be used inside <AppProvider>
// ─────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be called inside <AppProvider>");
  return ctx;
}
