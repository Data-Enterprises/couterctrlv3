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
  // ScaleIcon, // Suggested Weight — commented out for publish
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
    userLevels: PROGRAMMER_ONLY_LEVELS,
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
    userLevels: PROGRAMMER_ONLY_LEVELS,
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Invoices",
    href: "invoices",
    icon: DocumentArrowUpIcon,
    // Desktop only — reading a fixed-width file is a two-panel job.
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
        name: "Store Groups",
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
        userLevels: PROGRAMMER_ONLY_LEVELS,
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
        userLevels: PROGRAMMER_ONLY_LEVELS,
        isHovering: false,
        isVisible: true,
      },
      {
        name: "Invoices",
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
        // An experiment on hold. Programmer tier: it is not answerable to a
        // client, and like every Coming Soon page it only exists in the dev UI
        // tree, against the dev API. Desktop only.
        mobile: false,
        children: [],
        childOpen: false,
        userLevels: PROGRAMMER_ONLY_LEVELS,
        isHovering: false,
        isVisible: true,
      },
    ],
  },
];

/**
 * The menu for the current mode.
 *
 * Prod gets `categories` exactly as they are. Dev mode — where User Management
 * is being rebuilt — moves Store Groups into User Management as its User Groups
 * tab, so there:
 *   - Store Groups leaves the menu (its route still works), and
 *   - User Management opens to everyone. It stays off the phone menu: its
 *     mobile layout is being reworked, so dev has no phone version for now.
 * The tabs inside User Management gate themselves by level.
 */
export const categoriesFor = (apiEnv: "dev" | "prod"): NavCategory[] =>
  apiEnv !== "dev"
    ? categories
    : categories.map((cat) => ({
        ...cat,
        pages: cat.pages
          .filter((p) => p.href !== "groups")
          .map((p) =>
            p.href === "user-management" ? { ...p, userLevels: ["*"] } : p,
          ),
      }));
