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
    userLevels: ["*"],
    isHovering: false,
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
  },
  {
    name: "Team",
    href: "team",
    icon: UsersIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["5", "7", "9"],
    isHovering: false,
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
  },
  {
    name: "Receivers",
    href: "receivers",
    icon: ClipboardDocumentCheckIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
  },
  {
    name: "Coupons",
    href: "coupons",
    icon: CouponIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
  },
  {
    name: "Sub Dept Margins",
    href: "sub-dept-margins",
    icon: CurrencyDollarIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["5", "7", "9"],
    isHovering: false,
  },
  {
    name: "Cashiers",
    href: "cashiers",
    icon: MagnifyingGlassCircleIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["5", "7", "9"],
    isHovering: false,
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
  },
  // This fake link is just to show that user types can be restricted
  {
    name: "fake link",
    href: "fake-link",
    icon: HomeIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["9999"],
    isHovering: false,
  },
];
