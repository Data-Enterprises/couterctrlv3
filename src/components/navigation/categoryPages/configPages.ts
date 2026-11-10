// Interfaces
import type { Navigation } from "../utils";

// Components
import { KeyIcon, BuildingOfficeIcon } from "@heroicons/react/16/solid";
import GroupsIcon from "../../../svgs/GroupsIcon";

export const configPages: Navigation[] = [
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
];
