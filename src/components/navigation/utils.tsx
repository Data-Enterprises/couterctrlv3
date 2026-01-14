// Icons
import {
  HomeIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentCheckIcon,
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
  userTypes: string[];
};

export const navigation: Navigation[] = [
  {
    name: "Home",
    href: "/",
    icon: HomeIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userTypes: ["*"],
  },
  {
    name: "Sales",
    href: "sales",
    icon: SalesIconV2,
    mobile: true,
    children: [],
    childOpen: false,
    userTypes: ["*"],
  },
  {
    name: "Team",
    href: "team",
    icon: UsersIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userTypes: ["*"],
  },
  {
    name: "Loss Prevention",
    href: "loss-prevention",
    icon: CashierIcon,
    mobile: true,
    children: [],
    childOpen: false,
    userTypes: ["*"],
  },
  {
    name: "Groups",
    href: "groups",
    icon: GroupsIcon,
    mobile: true,
    children: [],
    childOpen: false,
    userTypes: ["*"],
  },
  {
    name: "Upc List",
    href: "upc-upload",
    icon: UpcListIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userTypes: ["*"],
  },
  {
    name: "Item Lookup",
    href: "item-lookup",
    icon: MagnifyingGlassIcon,
    mobile: true,
    children: [],
    childOpen: false,
    userTypes: ["*"],
  },
  {
    name: "Forecasting",
    href: "forecasting",
    icon: ArrowTrendingUpIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userTypes: ["*"],
  },
  {
    name: "Quicksight",
    href: "quicksight",
    icon: DashboardIconV2,
    mobile: false,
    children: [],
    childOpen: false,
    userTypes: ["*"],
  },
  {
    name: "Receivers",
    href: "receivers",
    icon: ClipboardDocumentCheckIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userTypes: ["*"],
  },
  {
    name: "Coupons",
    href: "coupons",
    icon: CouponIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userTypes: ["*"],
  },
  // This fake link is just to show that user types can be restricted
  {
    name: "fake link",
    href: "fake-link",
    icon: HomeIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userTypes: ["9999"],
  },
];
