// Interfaces
import type { BaseGroupUserRow, User } from "../../../../../interfaces";

/**
 * Whether a base group's user row is the viewer's to see. **Fails closed**: a
 * userid with no level (from the full user list) is hidden. The server checks
 * no levels, so this is the only guard; the export uses the same rule.
 */
export const withinReachOf = (users: User[], viewerLevel: number) => {
  const levelOf = new Map(users.map((u) => [u.id, u.user_level]));
  return (row: BaseGroupUserRow) => {
    const level = levelOf.get(row.userid);
    return level !== undefined && level <= viewerLevel;
  };
};
