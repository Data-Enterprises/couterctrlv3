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
  CircleStackIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/16/solid";
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
    name: "Team",
    href: "team",
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
    userLevels: ["9"],
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
        name: "Team",
        href: "team",
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
        userLevels: ["9"],
        isHovering: false,
        isVisible: true,
      },
    ],
  },
];
