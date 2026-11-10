// Hooks
import { useLocation } from "react-router";
import { useAppSelector } from "../../../hooks";

// Utils
import { categoriesFor } from "../utils";
import { COMING_SOON_CATEGORY } from "../../../utils/comingSoon";

/** The nav's shared reads: the session, the route, and which categories and
 *  pages this user can see. Every part of the title bar reads it here. */
export const useNavCtx = () => {
  const location = useLocation();
  const app = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const lastRoute = useAppSelector((state) => state.nav.lastRoute);

  /** On the dev API the bar turns navy, so which environment (and so which UI
   *  tree) you are in is never a question. Prod keeps the white bar. */
  const onNavy = app.apiEnv === "dev";

  const currentPath = location.pathname.replace(/^\//, "");
  const categories = categoriesFor(app.apiEnv);
  const activeCategory = categories.find((c) =>
    c.pages.some((p) => p.href === currentPath),
  );
  const currentPage = activeCategory?.pages.find((p) => p.href === currentPath);

  /**
   * Whether a page shows in the nav: by level, with one exception. Tickets
   * gates on being on the desk (the ticket_techs row), so a support person at
   * any level can reach the queue. This grants nothing: the server still checks
   * every call against that row.
   */
  const canSee = (userLevels: string[], href?: string) =>
    userLevels.includes(user.userLevel.toString()) ||
    userLevels.includes("*") ||
    (href === "tickets" && Boolean(user.ticketTech?.is_active));

  // Coming Soon pages only exist on the dev API; on prod (what clients see)
  // the category is not offered at all.
  const visibleCategories = categories.filter(
    (cat) =>
      (cat.name !== COMING_SOON_CATEGORY || app.apiEnv === "dev") &&
      cat.pages.some((p) => canSee(p.userLevels, p.href)),
  );

  return {
    app,
    user,
    lastRoute,
    onNavy,
    pathname: location.pathname,
    currentPath,
    activeCategory,
    currentPage,
    canSee,
    visibleCategories,
  };
};
