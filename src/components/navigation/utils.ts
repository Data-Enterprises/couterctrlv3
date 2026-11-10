// Utils
import { COMING_SOON_CATEGORY } from "../../utils/comingSoon";
import { performancePages } from "./categoryPages/performance";
import { analyticsPages } from "./categoryPages/analytics";
import { dataPages } from "./categoryPages/data";
import { configPages } from "./categoryPages/config";
import { comingSoonPages } from "./categoryPages/comingSoon";

// Interfaces
import type { NavCategory } from "./interfaces";

// Components
import {
  ArrowTrendingUpIcon,
  ChartBarSquareIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  ClockIcon,
} from "@heroicons/react/16/solid";

/**
 * User Levels: current
 * 1 => Basic User
 * 2 => User
 * 5 => Manager
 * 7 => Owner
 * 9 => Programmer
 */
export const categories: NavCategory[] = [
  {
    name: "Performance",
    icon: ArrowTrendingUpIcon,
    pages: performancePages,
  },
  {
    name: "Analytics",
    icon: ChartBarSquareIcon,
    pages: analyticsPages,
  },
  {
    name: "Data",
    icon: CircleStackIcon,
    pages: dataPages,
  },
  {
    name: "Config",
    icon: Cog6ToothIcon,
    pages: configPages,
  },
  /**
   * Pages that are built and routed but not released.
   *
   * Gated by level rather than hidden behind a flag, so the people who decide
   * whether a page ships can use it in production against real data without a
   * build of their own. Everyone below the gate sees no category at all —
   * `visibleCategories` in TitleBar drops a category whose every page is out of
   * reach, so there is no empty heading to explain.
   *
   * Two gates, not one, because the category holds two kinds of page:
   *   COMING_SOON_LEVELS (7, 8, 9) — not prod ready but testable
   *   PROGRAMMER_ONLY_LEVELS (9) — for programmers only
   *
   * Levels are matched exactly, not as a floor (see `canSee`), so "and up" has
   * to be spelled out. 8 is undocumented in the list above but is used by the
   * existing Admin and User Management gates, so it is included in the wider
   * gate too.
   *
   * Promoting a page from 9 to owner-visible is a one-word change to its
   * `userLevels`. Moving a page out of here entirely is the release: cut its
   * entry back to its category's file and restore `userLevels: ["*"]`.
   */
  {
    name: COMING_SOON_CATEGORY,
    icon: ClockIcon,
    pages: comingSoonPages,
  },
];

/**
 * The menu for the current mode.
 */
export const categoriesFor = (_apiEnv: "dev" | "prod"): NavCategory[] =>
  categories;

/**
 * Is this route one of the unreleased pages?
 *
 * Read off the Coming Soon category rather than listed again, so a page
 * joining or leaving it needs nothing here. Routes are stored as bare hrefs
 * ("sales", "item-report"), but a leading slash is tolerated because the
 * value has also been a pathname in places.
 */
export const isComingSoonRoute = (route: string): boolean => {
  const href = route.replace(/^\//, "");
  return (
    categories
      .find((c) => c.name === COMING_SOON_CATEGORY)
      ?.pages.some((p) => p.href === href) ?? false
  );
};

/** The test both the sign-in restore and the mode switch use. */
export const isDevOnlyRoute = (route: string): boolean =>
  isComingSoonRoute(route.replace(/^\//, ""));
