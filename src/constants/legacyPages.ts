/**
 * The routes that have a page in `src/legacy`.
 *
 * Legacy is not a smaller app, it is an older one: the pages it has are the
 * pages that existed then. This is the one list — the legacy sidebar builds
 * its menu from it, `DevPages` switches on it, and the live title bar asks it
 * whether the route you are standing on exists over there before switching you
 * into Legacy.
 *
 * It lives here rather than in either tree's nav because both read it and
 * neither may import the other's components.
 */
export const LEGACY_ROUTES: ReadonlySet<string> = new Set([
  "/",
  "sales",
  "loss-prevention",
  "sub-dept-margins",
  "cashiers",
  "item-lookup",
  "upc-upload",
  "forecasting",
  "orders",
  "receivers",
  "coupons",
  "groups",
  "user-management",
  "admin",
]);

/** Whether a route — a nav `href`, or a pathname — has a legacy page. */
export const hasLegacyPage = (path: string) =>
  LEGACY_ROUTES.has(path === "/" ? path : path.replace(/^\//, ""));

/**
 * Where switching into Legacy should leave you.
 *
 * `null` means stay put: the route you are on exists over there. Otherwise it
 * is the path to go to — where you last were in Legacy, or Sales, which is a
 * real legacy page with data in it rather than a landing screen.
 */
export const legacyEntryPath = (
  currentPath: string,
  legacyLastRoute: string,
): string | null => {
  if (hasLegacyPage(currentPath)) return null;
  const back = hasLegacyPage(legacyLastRoute) ? legacyLastRoute : "sales";
  return back === "/" ? "/" : `/${back.replace(/^\//, "")}`;
};
