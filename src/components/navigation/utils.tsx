// Icons
import {
  HomeIcon,
  UsersIcon,
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
  Squares2X2Icon,
  TruckIcon,
  ArchiveBoxIcon,
  ClockIcon,
  ShieldExclamationIcon,
  DocumentArrowUpIcon,
  TicketIcon,
} from "@heroicons/react/16/solid";
import {
  COMING_SOON_CATEGORY,
  COMING_SOON_LEVELS,
  PROGRAMMER_ONLY_LEVELS,
} from "../../utils/comingSoon";
import SalesIconV2 from "../../svgs/SalesIconV2";
import CashierIcon from "../../svgs/CashierIcon";
import GroupsIcon from "../../svgs/GroupsIcon";
import UpcListIcon from "../../svgs/UpcListIcon";
import DashboardIconV2 from "../../svgs/DashbordIconV2";
import CouponIcon from "../../svgs/CouponIcon";

export type Navigation = {
  name: string;
  href: string;
  icon: typeof UsersIcon | any;
  current?: boolean;
  children: Navigation[];
  childOpen: boolean;
  mobile: boolean;
  userLevels: string[];
  isHovering: boolean;
  isVisible: boolean;
};

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

export type NavCategory = {
  name: string;
  icon: typeof UsersIcon | any;
  pages: Navigation[];
};

export const categories: NavCategory[] = [
  {
    name: "Performance",
    icon: ArrowTrendingUpIcon,
    pages: [
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
        name: "Categories",
        href: "categories",
        icon: Squares2X2Icon,
        mobile: true,
        children: [],
        childOpen: false,
        userLevels: ["*"],
        isHovering: false,
        isVisible: true,
      },
      {
        name: "Vendors",
        href: "vendors",
        icon: TruckIcon,
        mobile: true,
        children: [],
        childOpen: false,
        userLevels: ["*"],
        isHovering: false,
        isVisible: true,
      },
      {
        name: "Coupon Sales",
        href: "coupon-sales",
        icon: CouponIcon,
        // Has its own mobile view (pages/shared/eventPerf, shared with Loss
        // Prevention) — store list, per-store report, receipts. The Data-category
        // Coupons page is a different report, not this one's phone version.
        mobile: true,
        children: [],
        childOpen: false,
        userLevels: ["*"],
        isHovering: false,
        isVisible: true,
      },
    ],
  },
  {
    name: "Analytics",
    icon: ChartBarSquareIcon,
    pages: [
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
    ],
  },
  {
    name: "Data",
    icon: CircleStackIcon,
    pages: [
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
    ],
  },
  {
    name: "Config",
    icon: Cog6ToothIcon,
    pages: [
      {
        name: "Groups",
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
        name: "Admin",
        href: "admin",
        icon: KeyIcon,
        mobile: false,
        children: [],
        childOpen: false,
        userLevels: ["5", "7", "8", "9"],
        isHovering: false,
        isVisible: true,
      },
    ],
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
   *
   *   COMING_SOON_LEVELS (7, 8, 9) — unfinished but usable. An owner running
   *   one against real data is the point.
   *
   *   PROGRAMMER_ONLY_LEVELS (9) — not answerable to a client yet. LP Actions,
   *   Invoices and both Price Opt pages depend on backend decisions that are
   *   still open, so putting them in front of an owner buys a support call
   *   rather than feedback.
   *
   * Levels are matched exactly, not as a floor (see `canSee`), so "and up" has
   * to be spelled out. 8 is undocumented in the list above but is used by the
   * existing Admin and User Management gates, so it is included in the wider
   * gate too.
   *
   * Promoting a page from 9 to owner-visible is a one-word change to its
   * `userLevels`. Moving a page out of here entirely is the release: cut its
   * entry back to the category it belongs to and restore `userLevels: ["*"]`.
   */
  {
    name: COMING_SOON_CATEGORY,
    icon: ClockIcon,
    pages: [
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
        name: "LP Actions",
        href: "lp-actions",
        icon: ShieldExclamationIcon,
        // Desktop only — the two-panel ledger has no mobile form yet.
        mobile: false,
        children: [],
        childOpen: false,
        userLevels: PROGRAMMER_ONLY_LEVELS,
        isHovering: false,
        isVisible: true,
      },
      {
        name: "Sales Export",
        href: "sales-export",
        icon: DocumentArrowUpIcon,
        // Desktop only — a two-panel builder with a 102-column file in it has
        // no phone form.
        mobile: false,
        children: [],
        childOpen: false,
        // Level 9 while it is being tested. It stays in Coming Soon, so it is
        // still dev-API only — but a build here writes a real file to S3 from
        // real store data, which is not something an owner should reach by
        // wandering into the section.
        userLevels: PROGRAMMER_ONLY_LEVELS,
        isHovering: false,
        isVisible: true,
      },
      {
        name: "Sales Tracker",
        href: "sales-tracker",
        icon: ArrowTrendingUpIcon,
        // Desktop only — the two-panel tracker has no mobile form yet.
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
        mobile: false,
        children: [],
        childOpen: false,
        userLevels: PROGRAMMER_ONLY_LEVELS,
        isHovering: false,
        isVisible: true,
      },
      // Commented out for publish — `suggested/order_weight` is dev-API only.
      // Restore this entry, the ScaleIcon import and the route in main.tsx
      // together when the endpoint ships.
      // {
      //   name: "Suggested Weight",
      //   href: "suggested-weight",
      //   icon: ScaleIcon,
      //   // Desktop only — the order sheet is a two-panel report with no mobile
      //   // form yet.
      //   mobile: false,
      //   children: [],
      //   childOpen: false,
      //   // Programmer tier, and for a harder reason than the rest of this
      //   // category: `suggested/order_weight` is only deployed to the dev API,
      //   // so on prod the page would render an error rather than an unfinished
      //   // feature. It moves to COMING_SOON_LEVELS the day the endpoint ships.
      //   userLevels: PROGRAMMER_ONLY_LEVELS,
      //   isHovering: false,
      //   isVisible: true,
      // },
      {
        name: "Tickets",
        href: "tickets",
        icon: TicketIcon,
        // Owner and up, so the client half can be tested by somebody who
        // really is one: both capability flags trip at level 8, so a level-7
        // account gets the client view from the server rather than from a
        // preview switch. That is the only way to prove the internal-note
        // filter, which has never been exercised by a non-tech.
        //
        // Still Coming Soon: dev UI tree only, against the dev API, desktop
        // only.
        mobile: false,
        children: [],
        childOpen: false,
        userLevels: COMING_SOON_LEVELS,
        isHovering: false,
        isVisible: true,
      },
    ],
  },
];

/**
 * The menu for the current mode.
 *
 * The same menu either way now.
 *
 * Dev used to differ: Store Groups had been folded into User Management as a
 * User Groups tab, so dev dropped it from the menu and opened User Management
 * to everyone to keep people's own groups reachable. Both tabs have since
 * moved back out, to Config > Groups — a user group is somebody's own saved
 * set of their own stores and a shared group is one passed to a colleague,
 * and neither is an administrator's to set, which is all User Management now
 * holds. So Groups belongs in the menu again, and User Management goes back to
 * its own levels: with Users at 5 and the rest at owner, opening it to
 * everyone would show a level 2 a page of nothing.
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

/**
 * Routes that exist on the dev API only, whether or not the menu offers them.
 *
 * The Coming Soon pages render `DevOnlyNotice` on prod; Release Notes would
 * render perfectly well, which is the more dangerous case — its avatar entry
 * is dev-gated because the notes name unreleased work, but the route itself
 * is reachable by typing it, and nothing about the page says it should not
 * have been.
 *
 * Release Notes is named here rather than read off the nav because it is
 * deliberately not in the nav at all.
 */
const DEV_ONLY_ROUTES = new Set(["release-notes"]);

/** The test both the sign-in restore and the mode switch use. */
export const isDevOnlyRoute = (route: string): boolean => {
  const href = route.replace(/^\//, "");
  return DEV_ONLY_ROUTES.has(href) || isComingSoonRoute(href);
};
