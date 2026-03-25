import { User } from "../types";

// ─────────────────────────────────────────────
//  Size variants
// ─────────────────────────────────────────────

const SIZE_CLASSES = {
  sm: "w-6 h-6 text-xs",
  md: "w-7 h-7 text-xs",
  lg: "w-8 h-8 text-sm",
};

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────

interface Props {
  user: User;
  size?: "sm" | "md" | "lg";
  /** Tooltip text (defaults to the user's full name). */
  title?: string;
}

/**
 * A circular avatar that shows a user's initials on their
 * personalised background colour. Outlined with a white ring
 * so stacked avatars stay visually separated.
 */
export function UserAvatar({ user, size = "sm", title }: Props) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ring-2 ring-white`}
      style={{ backgroundColor: user.color }}
      title={title ?? user.name}
    >
      {user.initials}
    </div>
  );
}
