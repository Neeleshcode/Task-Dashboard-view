import { useApp } from "../context/AppContext";
import { UserAvatar } from "./UserAvatar";

// Maximum number of individual avatars shown before collapsing into "+N".
const MAX_SHOWN = 2;

interface Props {
  taskId: string;
}

/**
 * Shows small avatars for every user currently "viewing" a task.
 * If more than MAX_SHOWN collaborators are present, the overflow
 * is summarised as a "+N" bubble.
 *
 * Returns null when no collaborators are active on this task.
 */
export function CollaboratorAvatars({ taskId }: Props) {
  const { state } = useApp();

  // Resolve user objects from the id list stored in global state.
  const collaboratorIds = state.activeCollaborators[taskId] ?? [];
  const collaborators = collaboratorIds
    .map((id) => state.users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => u !== undefined);

  if (collaborators.length === 0) return null;

  const shownUsers  = collaborators.slice(0, MAX_SHOWN);
  const hiddenCount = collaborators.length - MAX_SHOWN;

  return (
    <div className="flex items-center -space-x-1">
      {shownUsers.map((user) => (
        <UserAvatar key={user.id} user={user} size="sm" />
      ))}

      {hiddenCount > 0 && (
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold bg-gray-200 text-gray-600 ring-2 ring-white z-10">
          +{hiddenCount}
        </div>
      )}
    </div>
  );
}
