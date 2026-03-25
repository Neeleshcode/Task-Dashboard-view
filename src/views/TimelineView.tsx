import { useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { applyFilters } from "../utils/filters";
import { getMonthDays, dateToISOString, getToday } from "../utils/dates";
import { Priority } from "../types";

// ─────────────────────────────────────────────
//  Layout constants
// ─────────────────────────────────────────────

/** Pixel width allocated to each calendar day column. */
const DAY_WIDTH    = 36;
/** Pixel height of each task row. */
const ROW_HEIGHT   = 40;
/** Pixel width of the fixed task label column on the left. */
const LABEL_WIDTH  = 200;
/** Pixel height of the sticky day-header row. */
const HEADER_HEIGHT = 40;

// ─────────────────────────────────────────────
//  Priority colour mapping
// ─────────────────────────────────────────────

const PRIORITY_BAR_COLOR: Record<Priority, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-400",
  medium:   "bg-yellow-400",
  low:      "bg-green-400",
};

// ─────────────────────────────────────────────
//  Bar geometry helper
// ─────────────────────────────────────────────

interface BarGeometry {
  /** Left offset in pixels from the start of the grid. */
  left: number;
  /** Width in pixels. */
  width: number;
  /** When true, renders a small square marker instead of a full bar. */
  isMarker: boolean;
}

/**
 * Calculates where to draw a task's bar/marker on the timeline grid.
 *
 * Rules:
 *  - Both dates in this month → full bar from start to due.
 *  - No startDate             → single-day marker at the due date.
 *  - Dates outside this month → clamped to visible range, or null if fully hidden.
 */
function computeBarGeometry(
  startDate: string | null,
  dueDate: string,
  days: Date[]
): BarGeometry | null {
  const startDateStr = startDate ?? dueDate;

  const startIdx = days.findIndex((d) => dateToISOString(d) === startDateStr);
  const endIdx   = days.findIndex((d) => dateToISOString(d) === dueDate);

  // Both dates are outside the visible month → hide the bar.
  if (startIdx < 0 && endIdx < 0) return null;

  // If no explicit start date, show a single-day marker at the due date.
  if (!startDate) {
    const markerIdx = endIdx >= 0 ? endIdx : days.length - 1;
    return { left: markerIdx * DAY_WIDTH, width: DAY_WIDTH, isMarker: true };
  }

  // Clamp both ends to the visible month.
  const clampedStart = Math.max(0, startIdx >= 0 ? startIdx : 0);
  const clampedEnd   = Math.min(days.length - 1, endIdx >= 0 ? endIdx : days.length - 1);

  const left  = clampedStart * DAY_WIDTH;
  const width = (clampedEnd - clampedStart + 1) * DAY_WIDTH;

  if (width <= 0) return null;
  return { left, width, isMarker: false };
}

// ─────────────────────────────────────────────
//  Timeline view
// ─────────────────────────────────────────────

/**
 * Horizontal Gantt-style timeline showing the current month.
 *
 * Layout:
 *  ┌──────────────┬──────────────────────────────┐
 *  │  Task labels │  Scrollable day grid          │
 *  │  (fixed)     │  ─ day header (sticky)        │
 *  │              │  ─ rows (one per task)         │
 *  └──────────────┴──────────────────────────────┘
 *
 * The label panel syncs its vertical scroll with the grid panel.
 * Today's column is highlighted; a vertical line marks it in the grid.
 */
export function TimelineView() {
  const { state } = useApp();

  // ── Date setup ──────────────────────────────
  const now   = new Date();
  const days  = getMonthDays(now.getFullYear(), now.getMonth());
  const today = getToday();

  const todayColumnIndex = days.findIndex((d) => dateToISOString(d) === today);

  const filteredTasks = applyFilters(state.tasks, state.filters);

  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // ── Scroll the grid to centre today on mount ─
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!gridRef.current || todayColumnIndex < 0) return;
    const centreOffset = todayColumnIndex * DAY_WIDTH - gridRef.current.clientWidth / 2;
    gridRef.current.scrollLeft = Math.max(0, centreOffset);
  }, [todayColumnIndex]);

  // ── Sync vertical scroll: grid → labels ─────
  const handleGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const labels = document.getElementById("timeline-label-panel");
    if (labels) labels.scrollTop = e.currentTarget.scrollTop;
  };

  // ── Render ───────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">

      {/* ── Panel header ── */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">{monthLabel}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {filteredTasks.length} tasks · Scroll horizontally to navigate
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Fixed label column ── */}
        <div
          id="timeline-label-panel"
          className="flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto"
          style={{ width: LABEL_WIDTH }}
        >
          {/* Spacer to align with the day header */}
          <div style={{ height: HEADER_HEIGHT }} className="border-b border-gray-200" />

          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 px-4">
              <p className="text-sm font-medium text-center">No tasks to show</p>
              <p className="text-xs mt-1 text-center">Try adjusting your filters</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const assignee = state.users.find((u) => u.id === task.assigneeId);
              return (
                <div
                  key={task.id}
                  className="flex items-center px-3 gap-2 border-b border-gray-100 hover:bg-gray-50"
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Mini avatar */}
                  {assignee && (
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: assignee.color, fontSize: 9 }}
                    >
                      {assignee.initials}
                    </div>
                  )}
                  <span className="text-xs text-gray-700 truncate">{task.title}</span>
                </div>
              );
            })
          )}
        </div>

        {/* ── Scrollable grid ── */}
        <div ref={gridRef} className="flex-1 overflow-auto" onScroll={handleGridScroll}>
          <div style={{ minWidth: days.length * DAY_WIDTH }}>

            {/* Day header (sticky within this scroll container) */}
            <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10" style={{ height: HEADER_HEIGHT }}>
              {days.map((day, i) => {
                const isToday   = dateToISOString(day) === today;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={i}
                    className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-100 text-xs ${
                      isToday   ? "bg-indigo-600 text-white font-bold"
                      : isWeekend ? "bg-gray-100 text-gray-400"
                      : "text-gray-500"
                    }`}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span style={{ fontSize: 10 }}>
                      {day.toLocaleDateString("en-US", { weekday: "narrow" })}
                    </span>
                    <span className="font-semibold">{day.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {/* Task rows */}
            <div style={{ position: "relative" }}>

              {/* Vertical "today" line */}
              {todayColumnIndex >= 0 && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-indigo-500 z-10 pointer-events-none"
                  style={{ left: todayColumnIndex * DAY_WIDTH + DAY_WIDTH / 2 }}
                />
              )}

              {filteredTasks.map((task) => {
                const bar          = computeBarGeometry(task.startDate, task.dueDate, days);
                const barColorClass = PRIORITY_BAR_COLOR[task.priority];

                return (
                  <div
                    key={task.id}
                    className="relative border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Weekend background shading */}
                    {days.map((day, i) => {
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      return isWeekend ? (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 bg-gray-50"
                          style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
                        />
                      ) : null;
                    })}

                    {/* Task bar or single-day marker */}
                    {bar && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 ${
                          bar.isMarker
                            ? `w-3 h-3 rounded-sm ${barColorClass} shadow-sm`
                            : `h-5 rounded-full ${barColorClass} opacity-90 shadow-sm flex items-center px-2`
                        }`}
                        style={{
                          left:  bar.left + 2,
                          width: bar.isMarker ? 12 : bar.width - 4,
                        }}
                        title={`${task.title} — ${task.priority}`}
                      >
                        {/* Inline title label on bars that are wide enough */}
                        {!bar.isMarker && bar.width > 50 && (
                          <span className="text-white font-medium truncate" style={{ fontSize: 10 }}>
                            {task.title}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
