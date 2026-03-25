import { Priority } from "../types";

// ─────────────────────────────────────────────
//  Colour + label config for each priority tier
// ─────────────────────────────────────────────

interface BadgeConfig {
  label: string;
  className: string;
}

const PRIORITY_CONFIG: Record<Priority, BadgeConfig> = {
  critical: { label: "Critical", className: "bg-red-100    text-red-700    border-red-200"    },
  high:     { label: "High",     className: "bg-orange-100 text-orange-700 border-orange-200" },
  medium:   { label: "Medium",   className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  low:      { label: "Low",      className: "bg-green-100  text-green-700  border-green-200"  },
};

const SIZE_CLASSES = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2   py-1   text-xs",
};

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────

interface Props {
  priority: Priority;
  size?: "sm" | "md";
}

/** A small coloured badge that displays a task's priority level. */
export function PriorityBadge({ priority, size = "sm" }: Props) {
  const { label, className } = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center border rounded font-medium ${SIZE_CLASSES[size]} ${className}`}>
      {label}
    </span>
  );
}
