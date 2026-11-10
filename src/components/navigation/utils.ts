// Utils
import {
  COMING_SOON_CATEGORY,
  COMING_SOON_LEVELS,
  PROGRAMMER_ONLY_LEVELS,
} from "../../utils/comingSoon";
import { performancePages } from "./categoryPages/performance";
import { analyticsPages } from "./categoryPages/analytics";
import { dataPages } from "./categoryPages/data";
import { configPages } from "./categoryPages/config";
import { comingSoonPages } from "./categoryPages/comingSoon";

// Interfaces
import type { Navigation, NavCategory } from "./interfaces";

// Components
import {
  HomeIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  KeyIcon,
  MagnifyingGlassCircleIcon,
  DocumentCheckIcon,
  ChartBarSquareIcon,
  ClipboardDocumentListIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  TruckIcon,
  ArchiveBoxIcon,
  ClockIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/16/solid";
import SalesIconV2 from "../../svgs/SalesIconV2";
import CashierIcon from "../../svgs/CashierIcon";
import GroupsIcon from "../../svgs/GroupsIcon";
import UpcListIcon from "../../svgs/UpcListIcon";
import DashboardIconV2 from "../../svgs/DashbordIconV2";
import CouponIcon from "../../svgs/CouponIcon";

/**
 * User Levels: current
 * 1 => Basic User
 * 2 => User
 * 5 => Manager
 * 7 => Owner
 * 9 => Programmer
 */
export const navigation: Navigation[] = [
  {
    name: "Home",
    href: "/",
    icon: HomeIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["9"],
    isHovering: false,
    isVisible: false,
  },
  {
    name: "Sales",
    href: "sales",
    icon: SalesIconV2,
    mobile: true,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
  {
    name: "User Management",
    href: "user-management",
    icon: BuildingOfficeIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["5", "7", "8", "9"],
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Loss Prevention",
    href: "loss-prevention",
    icon: CashierIcon,
    mobile: true,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
  {
    name: "User Groups",
    href: "groups",
    icon: GroupsIcon,
    mobile: true,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Upc List",
    href: "upc-upload",
    icon: UpcListIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Item Lookup",
    href: "item-lookup",
    icon: MagnifyingGlassIcon,
    mobile: true,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
  // The unreleased pages that also appear in this flat list. Gated here as well
  // as in the "Coming Soon" category below — this list feeds the Settings nav
  // editor, which would otherwise offer every user a page they cannot reach.
  // Two different gates, per page: see the category's docblock. LP Actions and
  // Sales Tracker are absent from this list entirely, which is why neither
  // appears below.
  {
    name: "Item Actions",
    href: "item-report",
    icon: ClipboardDocumentListIcon,
    // Desktop only — the two-panel report has no mobile form yet.
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: COMING_SOON_LEVELS,
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Price Opt Sub Dept",
    href: "inventory-sub-department",
    icon: ArchiveBoxIcon,
    // Desktop only — the two-panel tree has no mobile form yet.
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: COMING_SOON_LEVELS,
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Price Opt Vendor",
    href: "inventory-vendor",
    icon: TruckIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: COMING_SOON_LEVELS,
    isHovering: false,
    isVisible: true,
  },
  {
    name: "AWG Invoices",
    href: "invoices",
    icon: DocumentArrowUpIcon,
    // Desktop only — correcting a line means eight columns side by side.
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: PROGRAMMER_ONLY_LEVELS,
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Forecasting",
    href: "forecasting",
    icon: ArrowTrendingUpIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Quicksight",
    href: "quicksight",
    icon: DashboardIconV2,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["9"],
    isHovering: false,
    isVisible: false,
  },
  {
    name: "Receivers",
    href: "receivers",
    icon: ClipboardDocumentCheckIcon,
    mobile: true,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Coupons",
    href: "coupons",
    icon: CouponIcon,
    mobile: true,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Sub Dept Margins",
    href: "sub-dept-margins",
    icon: CurrencyDollarIcon,
    mobile: true,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Cashiers",
    href: "cashiers",
    icon: MagnifyingGlassCircleIcon,
    mobile: true,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Orders",
    href: "orders",
    icon: DocumentCheckIcon,
    mobile: true,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Admin",
    href: "admin",
    icon: KeyIcon,
    mobile: false,
    children: [],
    childOpen: false,
    // Level 5 and up. The page itself narrows what each of them can see —
    // below 9 the companies and stores are scoped to their own assignments,
    // and the Companies tab stays out of reach entirely.
    userLevels: ["5", "7", "8", "9"],
    isHovering: false,
    isVisible: true,
  },
  // This fake link is just to show that user types can be restricted
  {
    name: "fake link",
    href: "fake-link",
    icon: HomeIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["9999", "22"],
    isHovering: false,
    isVisible: true,
  },
];

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
