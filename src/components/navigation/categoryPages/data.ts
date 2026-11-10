// Interfaces
import type { Navigation } from "../interfaces";

// Components
import {
  DocumentCheckIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/16/solid";
import CouponIcon from "../../../svgs/CouponIcon";

export const dataPages: Navigation[] = [
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
];
