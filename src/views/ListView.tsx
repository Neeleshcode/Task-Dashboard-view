import { useRef, useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { Task, SortField, SortDirection, Status } from "../types";
import { applyFilters, applySort } from "../utils/filters";
import { PriorityBadge } from "../components/PriorityBadge";
import { UserAvatar } from "../components/UserAvatar";
import { CollaboratorAvatars } from "../components/CollaboratorAvatars";
import { getDueDateLabel } from "../utils/dates";

// ─────────────────────────────────────────────
//  Virtual scrolling constants
//
//  Only visible rows + a small buffer are rendered in the DOM.
//  The full height is maintained with an inner div so the
//  scrollbar represents all tasks.
// ─────────────────────────────────────────────

/** Fixed row height in pixels (must match the CSS height set on each row). */
const ROW_HEIGHT    = 56;
/** Extra rows to render above and below the visible area (reduces blank flicker). */
const SCROLL_BUFFER = 5;
/** Height of the sticky table header row. */
const HEADER_HEIGHT = 48;

// ─────────────────────────────────────────────
//  Status options
// ─────────────────────────────────────────────

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "todo",       label: "To Do"       },
  { value: "inprogress", label: "In Progress" },
  { value: "inreview",   label: "In Review"   },
  { value: "done",       label: "Done"        },
];

const STATUS_PILL_COLORS: Record<Status, string> = {
  todo:       "bg-gray-100   text-gray-700",
  inprogress: "bg-blue-100   text-blue-700",
  inreview:   "bg-yellow-100 text-yellow-700",
  done:       "bg-green-100  text-green-700",
};

// ─────────────────────────────────────────────
//  Column header sort icon
// ─────────────────────────────────────────────

interface SortIconProps {
  active: boolean;
  direction: SortDirection;
}

/** Shows an up/down arrow when the column is the active sort key. */
function SortIcon({ active, direction }: SortIconProps) {
  if (!active) {
    return (
      <span className="text-gray-300 ml-1">
        {/* Double-headed arrow to hint the column is sortable */}
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <path d="M5 0L9 5H1L5 0Z M5 14L1 9H9L5 14Z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="text-indigo-600 ml-1">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

// ─────────────────────────────────────────────
//  Inline status dropdown
// ─────────────────────────────────────────────

interface StatusDropdownProps {
  task: Task;
  onUpdate: (taskId: string, status: Status) => void;
}

/**
 * A pill button that opens a small dropdown when clicked,
 * letting the user change a task's status in-line.
 */
function StatusDropdown({ task, onUpdate }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when the user clicks outside.
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const currentLabel = STATUS_OPTIONS.find((s) => s.value === task.status)?.label ?? task.status;

  return (
    <div ref={wrapperRef} className="relative">
      {/* Current status pill */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${STATUS_PILL_COLORS[task.status]}`}
      >
        {currentLabel}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[130px]">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                opt.value === task.status ? "font-semibold text-indigo-600" : "text-gray-700"
              }`}
              onClick={() => { onUpdate(task.id, opt.value); setIsOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Table column definitions
// ─────────────────────────────────────────────

const TABLE_COLUMNS = [
  { field: "title"    as SortField | null, label: "Title",    widthClass: "flex-1" },
  { field: null,                           label: "Assignee", widthClass: "w-32"   },
  { field: "priority" as SortField,        label: "Priority", widthClass: "w-28"   },
  { field: null,                           label: "Status",   widthClass: "w-32"   },
  { field: "dueDate"  as SortField,        label: "Due Date", widthClass: "w-32"   },
];

// ─────────────────────────────────────────────
//  List view
// ─────────────────────────────────────────────

/**
 * Sortable, virtually-scrolled table of all filtered tasks.
 *
 * Virtual scrolling works by:
 *  1. Setting the inner container height = totalRows × ROW_HEIGHT.
 *  2. Absolutely positioning only the visible slice of rows.
 *  3. Updating the slice on every scroll event.
 *
 * This keeps the DOM lean even when there are 500+ rows.
 */
export function ListView() {
  const { state, dispatch } = useApp();
  const tasks = applySort(applyFilters(state.tasks, state.filters), state.sort);

  // ── Virtual scroll state ─────────────────────
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop,        setScrollTop]        = useState(0);
  const [containerHeight,  setContainerHeight]  = useState(600);

  // Track the container's height so we know how many rows fit.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerHeight(entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate which rows are in the viewport (+ buffer).
  const bodyHeight   = containerHeight - HEADER_HEIGHT;
  const startIndex   = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - SCROLL_BUFFER);
  const visibleCount = Math.ceil(bodyHeight / ROW_HEIGHT) + SCROLL_BUFFER * 2;
  const endIndex     = Math.min(tasks.length, startIndex + visibleCount);
  const visibleTasks = tasks.slice(startIndex, endIndex);

  // ── Sort toggling ────────────────────────────
  const toggleSort = (field: SortField) => {
    const isSameField = state.sort.field === field;
    dispatch({
      type: "SET_SORT",
      sort: {
        field,
        direction: isSameField && state.sort.direction === "asc" ? "desc" : "asc",
      },
    });
  };

  const updateTaskStatus = (taskId: string, status: Status) => {
    dispatch({ type: "UPDATE_TASK_STATUS", taskId, status });
  };

  // ── Sort label for the footer ────────────────
  const sortLabels: Record<SortField, string> = {
    title:    "title",
    priority: "priority",
    dueDate:  "due date",
  };

  // ── Render ───────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">

      {/* ── Sticky table header ── */}
      <div
        className="flex items-center border-b border-gray-200 bg-gray-50"
        style={{ height: HEADER_HEIGHT }}
      >
        {TABLE_COLUMNS.map((col) => {
          const isSorted = col.field !== null && state.sort.field === col.field;
          return (
            <div
              key={col.label}
              className={`${col.widthClass} px-4 py-3 text-xs font-semibold uppercase tracking-wide flex items-center ${
                col.field ? "cursor-pointer select-none hover:text-indigo-600" : ""
              } ${isSorted ? "text-indigo-600 bg-indigo-50" : "text-gray-500"}`}
              onClick={col.field ? () => toggleSort(col.field as SortField) : undefined}
            >
              {col.label}
              {col.field && (
                <SortIcon active={isSorted} direction={state.sort.direction} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Scrollable body ── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" onScroll={onScroll}>
        {tasks.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">No tasks found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          /* Virtual scroll wrapper — full height to keep scrollbar accurate */
          <div style={{ height: tasks.length * ROW_HEIGHT, position: "relative" }}>
            {/* Only the visible slice, positioned at the correct offset */}
            <div style={{ position: "absolute", top: startIndex * ROW_HEIGHT, width: "100%" }}>
              {visibleTasks.map((task) => {
                const assignee = state.users.find((u) => u.id === task.assigneeId);
                const due      = getDueDateLabel(task.dueDate);

                const dueDateColor =
                  due.isOverdue ? "text-red-600"
                  : due.isToday ? "text-amber-600"
                  : "text-gray-500";

                return (
                  <div
                    key={task.id}
                    className="flex items-center border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Title */}
                    <div className="flex-1 px-4 py-2 truncate">
                      <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {task.title}
                      </span>
                    </div>

                    {/* Assignee */}
                    <div className="w-32 px-4 py-2">
                      {assignee && (
                        <div className="flex items-center gap-1.5">
                          <UserAvatar user={assignee} size="sm" />
                          <CollaboratorAvatars taskId={task.id} />
                        </div>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="w-28 px-4 py-2">
                      <PriorityBadge priority={task.priority} />
                    </div>

                    {/* Status (inline dropdown) */}
                    <div className="w-32 px-4 py-2">
                      <StatusDropdown task={task} onUpdate={updateTaskStatus} />
                    </div>

                    {/* Due date */}
                    <div className="w-32 px-4 py-2">
                      <span className={`text-xs font-medium ${dueDateColor}`}>
                        {due.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer status bar ── */}
      <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400 bg-gray-50 flex items-center justify-between">
        <span>{tasks.length} tasks</span>
        <span>
          Sorted by {sortLabels[state.sort.field]} ({state.sort.direction === "asc" ? "ascending" : "descending"})
        </span>
      </div>
    </div>
  );
}
