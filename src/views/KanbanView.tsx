import { useRef, useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { Task, Status } from "../types";
import { applyFilters } from "../utils/filters";
import { PriorityBadge } from "../components/PriorityBadge";
import { UserAvatar } from "../components/UserAvatar";
import { CollaboratorAvatars } from "../components/CollaboratorAvatars";
import { getDueDateLabel } from "../utils/dates";

// ─────────────────────────────────────────────
//  Column definitions
// ─────────────────────────────────────────────

const COLUMNS: { id: Status; label: string; bgClass: string }[] = [
  { id: "todo",       label: "To Do",       bgClass: "bg-gray-100"  },
  { id: "inprogress", label: "In Progress", bgClass: "bg-blue-50"   },
  { id: "inreview",   label: "In Review",   bgClass: "bg-yellow-50" },
  { id: "done",       label: "Done",        bgClass: "bg-green-50"  },
];

// ─────────────────────────────────────────────
//  Drag-and-drop state shape
// ─────────────────────────────────────────────

interface DragState {
  taskId:       string;
  originStatus: Status;
  /** Cursor offset from the card's top-left corner when the drag started. */
  offsetX: number;
  offsetY: number;
}

// ─────────────────────────────────────────────
//  Task card
// ─────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent, task: Task) => void;
}

/**
 * A single card rendered inside a Kanban column.
 * Fades out while being dragged so the placeholder beneath it is visible.
 */
function TaskCard({ task, isDragging, onPointerDown }: TaskCardProps) {
  const { state } = useApp();
  const assignee   = state.users.find((u) => u.id === task.assigneeId);
  const dueDateInfo = getDueDateLabel(task.dueDate);

  const dueDateColor =
    dueDateInfo.isOverdue ? "text-red-600"
    : dueDateInfo.isToday ? "text-amber-600"
    : "text-gray-500";

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-3 shadow-sm cursor-grab select-none transition-opacity ${
        isDragging ? "opacity-30" : "hover:shadow-md hover:border-indigo-200"
      }`}
      onPointerDown={(e) => onPointerDown(e, task)}
    >
      {/* Title + priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 leading-tight flex-1 min-w-0">
          {task.title}
        </p>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Assignee avatars + due date */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          {assignee && <UserAvatar user={assignee} size="sm" />}
          <CollaboratorAvatars taskId={task.id} />
        </div>
        <span className={`text-xs font-medium ${dueDateColor}`}>
          {dueDateInfo.label}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Drag ghost (floating card that follows cursor)
// ─────────────────────────────────────────────

interface DragGhostProps {
  task: Task;
  x: number;
  y: number;
}

/**
 * A slightly rotated card fixed to the cursor while dragging.
 * `pointer-events: none` ensures it doesn't intercept pointer events.
 */
function DragGhost({ task, x, y }: DragGhostProps) {
  const { state } = useApp();
  const assignee = state.users.find((u) => u.id === task.assigneeId);

  return (
    <div
      className="fixed pointer-events-none z-50 bg-white rounded-xl border-2 border-indigo-400 p-3 shadow-2xl w-64 opacity-95"
      style={{ left: x, top: y, transform: "rotate(2deg)" }}
    >
      <p className="text-sm font-medium text-gray-900 mb-2">{task.title}</p>
      <div className="flex items-center justify-between">
        {assignee && <UserAvatar user={assignee} size="sm" />}
        <PriorityBadge priority={task.priority} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Kanban board
// ─────────────────────────────────────────────

/**
 * Four-column Kanban board with custom pointer-event drag-and-drop.
 *
 * How the drag works:
 *  1. onPointerDown  → record offset, set pointer capture on the card element.
 *  2. pointermove    → move the ghost card, detect which column the cursor is over.
 *  3. pointerup      → if over a different column, dispatch UPDATE_TASK_STATUS.
 */
export function KanbanView() {
  const { state, dispatch } = useApp();
  const filteredTasks = applyFilters(state.tasks, state.filters);

  // ── Drag state ──────────────────────────────
  const [dragState, setDragState]   = useState<DragState | null>(null);
  const [ghostPos,  setGhostPos]    = useState({ x: 0, y: 0 });
  const [overColumn, setOverColumn] = useState<Status | null>(null);

  // One ref per column so we can do hit-testing in pointermove.
  const columnRefs = useRef<Record<Status, HTMLDivElement | null>>({
    todo: null, inprogress: null, inreview: null, done: null,
  });

  // ── Start dragging ───────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent, task: Task) => {
    e.currentTarget.setPointerCapture(e.pointerId); // keeps events flowing to this element

    const cardRect = e.currentTarget.getBoundingClientRect();
    const offsetX  = e.clientX - cardRect.left;
    const offsetY  = e.clientY - cardRect.top;

    setDragState({ taskId: task.id, originStatus: task.status, offsetX, offsetY });
    setGhostPos({ x: cardRect.left, y: cardRect.top });
  }, []);

  // ── Move + drop ──────────────────────────────
  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: PointerEvent) => {
      // Move the ghost card to follow the cursor.
      setGhostPos({
        x: e.clientX - dragState.offsetX,
        y: e.clientY - dragState.offsetY,
      });

      // Find which column (if any) the cursor is currently over.
      let hovered: Status | null = null;
      for (const col of COLUMNS) {
        const el = columnRefs.current[col.id];
        if (!el) continue;
        const { left, right, top, bottom } = el.getBoundingClientRect();
        if (e.clientX >= left && e.clientX <= right && e.clientY >= top && e.clientY <= bottom) {
          hovered = col.id;
          break;
        }
      }
      setOverColumn(hovered);
    };

    const handleUp = () => {
      // Only update if the card was dropped on a different column.
      if (overColumn && overColumn !== dragState.originStatus) {
        dispatch({ type: "UPDATE_TASK_STATUS", taskId: dragState.taskId, status: overColumn });
      }
      setDragState(null);
      setOverColumn(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup",   handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup",   handleUp);
    };
  }, [dragState, overColumn, dispatch]);

  // ── Helpers ──────────────────────────────────
  const tasksForColumn  = (status: Status) => filteredTasks.filter((t) => t.status === status);
  const currentDragTask = dragState ? state.tasks.find((t) => t.id === dragState.taskId) : null;

  // ── Render ───────────────────────────────────
  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4 min-h-0">
      {COLUMNS.map((col) => {
        const tasks  = tasksForColumn(col.id);
        const isOver = overColumn === col.id;

        return (
          <div
            key={col.id}
            ref={(el) => { columnRefs.current[col.id] = el; }}
            className={`flex-shrink-0 w-72 flex flex-col rounded-xl border-2 transition-colors ${
              isOver
                ? "border-indigo-400 bg-indigo-50"
                : `border-transparent ${col.bgClass}`
            }`}
          >
            {/* Column header */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">{col.label}</span>
              <span className="text-xs bg-white text-gray-500 rounded-full px-2 py-0.5 border border-gray-200 font-medium">
                {tasks.length}
              </span>
            </div>

            {/* Scrollable task list */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-0">
              {/* Empty state */}
              {tasks.length === 0 && (
                <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-400">No tasks</p>
                </div>
              )}

              {tasks.map((task) => (
                <div key={task.id}>
                  <TaskCard
                    task={task}
                    isDragging={dragState?.taskId === task.id}
                    onPointerDown={handlePointerDown}
                  />
                  {/* Placeholder beneath the card being dragged */}
                  {dragState?.taskId === task.id && (
                    <div className="h-20 rounded-xl bg-indigo-100 border-2 border-dashed border-indigo-300 mt-2" />
                  )}
                </div>
              ))}

              {/* Drop target indicator at the bottom of the hovered column */}
              {isOver && dragState && (
                <div className="h-20 rounded-xl bg-indigo-100 border-2 border-dashed border-indigo-400 animate-pulse" />
              )}
            </div>
          </div>
        );
      })}

      {/* Floating ghost card that follows the cursor */}
      {currentDragTask && dragState && (
        <DragGhost task={currentDragTask} x={ghostPos.x} y={ghostPos.y} />
      )}
    </div>
  );
}
