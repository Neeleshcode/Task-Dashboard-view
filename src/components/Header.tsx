import { useApp } from "../context/AppContext";
import { ViewType } from "../types";
import { UserAvatar } from "./UserAvatar";

// ─────────────────────────────────────────────
//  View switcher tab definitions
// ─────────────────────────────────────────────

const VIEW_TABS: { id: ViewType; label: string; icon: string }[] = [
  { id: "kanban",   label: "Kanban",   icon: "⊞" },
  { id: "list",     label: "List",     icon: "≡" },
  { id: "timeline", label: "Timeline", icon: "▬" },
];

// Maximum avatars shown in the "active users" cluster before "+N".
const MAX_AVATAR_CLUSTER = 4;

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────

/**
 * Top navigation bar.
 *
 * Left:   App logo + total task count.
 * Centre: View switcher (Kanban / List / Timeline).
 * Right:  Live collaborator presence indicator.
 */
export function Header() {
  const { state, dispatch } = useApp();
  const { view, users, activeCollaborators } = state;

  // Collect all unique user ids that appear in any task's collaborator list.
  const activeUserIds = new Set(Object.values(activeCollaborators).flat());
  const activeUsers   = users.filter((u) => activeUserIds.has(u.id));

  return (
    <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4">

      {/* ── Logo + title ── */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">Project Tracker</h1>
          <p className="text-xs text-gray-400 leading-tight">{state.tasks.length} tasks total</p>
        </div>
      </div>

      {/* ── View switcher ── */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: "SET_VIEW", view: tab.id })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === tab.id
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Active collaborators ── */}
      {activeUsers.length > 0 && (
        <div className="flex items-center gap-2">
          {/* Animated green dot + count */}
          <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {activeUsers.length} active
            </span>
          </div>

          {/* Stacked avatar cluster */}
          <div className="flex items-center -space-x-1.5">
            {activeUsers.slice(0, MAX_AVATAR_CLUSTER).map((user) => (
              <UserAvatar key={user.id} user={user} size="md" />
            ))}
            {activeUsers.length > MAX_AVATAR_CLUSTER && (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 ring-2 ring-white">
                +{activeUsers.length - MAX_AVATAR_CLUSTER}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
