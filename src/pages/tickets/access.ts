import type { UserLevel } from "../../interfaces";

// "Top two user levels" (ticket tech / programmer) computed dynamically
// against whatever levels actually exist — never a hardcoded id, since the
// real level names/scale are backend data not visible from the frontend.
// Mirrors the existing devMode-toggle precedent in TitleBar.tsx
// ("programmer/admin only": user.role === 9 || user.userLevel >= 2), just
// derived instead of a fixed number.
export const getElevatedLevelIds = (userLevels: UserLevel[]): number[] =>
  [...userLevels]
    .sort((a, b) => b.id - a.id)
    .slice(0, 2)
    .map((l) => l.id);

export const isElevatedTicketUser = (
  userLevel: number,
  userLevels: UserLevel[],
): boolean => getElevatedLevelIds(userLevels).includes(userLevel);
