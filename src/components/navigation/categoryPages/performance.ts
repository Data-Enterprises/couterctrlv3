// Interfaces
import type { Navigation } from "../utils";

// Components
import {
  CurrencyDollarIcon,
  Squares2X2Icon,
  TruckIcon,
} from "@heroicons/react/16/solid";
import SalesIconV2 from "../../../svgs/SalesIconV2";
import CashierIcon from "../../../svgs/CashierIcon";
import CouponIcon from "../../../svgs/CouponIcon";

export const performancePages: Navigation[] = [
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
    mobile: true,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
];
