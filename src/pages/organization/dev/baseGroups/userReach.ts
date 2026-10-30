import type { BaseGroupUserRow, User } from "../../../../interfaces";

/**
 * Whether a base group's user row is the viewer's to see.
 *
 * `groups/base_group_users` carries no levels, so they come from the full
 * user list. **Fails closed**: a userid with no level behind it is hidden,
 * which until that list lands is every row. `assign_base_group_to_user` takes
 * a bare userid and checks no levels, so this is the only thing between a
 * level 7 and a level 9's access -- and the export reads the same rule, so a
 * file can never hold someone the screen would not show.
 */
export const withinReachOf = (users: User[], viewerLevel: number) => {
  const levelOf = new Map(users.map((u) => [u.id, u.user_level]));
  return (row: BaseGroupUserRow) => {
    const level = levelOf.get(row.userid);
    return level !== undefined && level <= viewerLevel;
  };
};
