// Types
import type StoresIcon from "../../svgs/StoresIcon";

// Icons
import {
  // HomeIcon,
  UsersIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/16/solid";
import SalesIconV2 from "../../svgs/SalesIconV2";
import CashierIcon from "../../svgs/CashierIcon";
import GroupsIcon from "../../svgs/GroupsIcon";
import UpcListIcon from "../../svgs/UpcListIcon";

export type Navigation = {
  name: string;
  href: string;
  icon: typeof UsersIcon | typeof StoresIcon | any;
  current?: boolean;
  children: Navigation[];
  childOpen: boolean;
  mobile: boolean;
  userTypes: string[];
};

export const navigation: Navigation[] = [
  // {
  //   name: "Home",
  //   href: "/",
  //   icon: HomeIcon,
  //   mobile: true,
  //   children: [],
  //   childOpen: false,
  //   userTypes: ["*"],
  // },
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
    name: "Cashiers",
    href: "cashiers",
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
];
