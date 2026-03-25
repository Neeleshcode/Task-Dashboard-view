import { useApp } from "../context/AppContext";
import { FilterState, Status, Priority } from "../types";
import { hasActiveFilters } from "../utils/filters";

// ─────────────────────────────────────────────
//  Filter option lists
// ─────────────────────────────────────────────

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "todo",       label: "To Do"       },
  { value: "inprogress", label: "In Progress" },
  { value: "inreview",   label: "In Review"   },
  { value: "done",       label: "Done"        },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high",     label: "High"     },
  { value: "medium",   label: "Medium"   },
  { value: "low",      label: "Low"      },
];

// ─────────────────────────────────────────────
//  Reusable multi-select toggle group
// ─────────────────────────────────────────────

interface MultiSelectProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (newSelected: T[]) => void;
}

/**
 * Renders a labelled row of pill buttons.
 * Clicking a pill toggles it on/off in the selection array.
 */
function MultiSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
}: MultiSelectProps<T>) {
  const toggle = (value: T) => {
    const isSelected = selected.includes(value);
    onChange(isSelected ? selected.filter((s) => s !== value) : [...selected, value]);
  };

  return (
    <div>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Filter panel
// ─────────────────────────────────────────────

const EMPTY_FILTERS: FilterState = {
  statuses:    [],
  priorities:  [],
  assigneeIds: [],
  dateFrom:    "",
  dateTo:      "",
};

/**
 * Sidebar panel containing all filter controls.
 * Changes are dispatched to global state immediately (no "Apply" button needed).
 */
export function FilterPanel() {
  const { state, dispatch } = useApp();
  const { filters, users } = state;

  /** Merges a partial update into the existing filter state. */
  const updateFilters = (partial: Partial<FilterState>) => {
    dispatch({ type: "SET_FILTERS", filters: { ...filters, ...partial } });
  };

  const clearAllFilters = () => {
    dispatch({ type: "SET_FILTERS", filters: EMPTY_FILTERS });
  };

  const filtersAreActive = hasActiveFilters(filters);
  const assigneeOptions  = users.map((u) => ({ value: u.id, label: u.name }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        {filtersAreActive && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Status filter */}
      <MultiSelect
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.statuses}
        onChange={(statuses) => updateFilters({ statuses })}
      />

      {/* Priority filter */}
      <MultiSelect
        label="Priority"
        options={PRIORITY_OPTIONS}
        selected={filters.priorities}
        onChange={(priorities) => updateFilters({ priorities })}
      />

      {/* Assignee filter */}
      <MultiSelect
        label="Assignee"
        options={assigneeOptions}
        selected={filters.assigneeIds}
        onChange={(assigneeIds) => updateFilters({ assigneeIds })}
      />

      {/* Date-range filter */}
      <div>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
          Due Date Range
        </span>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilters({ dateFrom: e.target.value })}
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilters({ dateTo: e.target.value })}
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>
    </div>
  );
}
