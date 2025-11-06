// Types
import type Radiation from "../../svgs/Radiation";
import type StoresIcon from "../../svgs/StoresIcon";

// Icons
import { UsersIcon } from "@heroicons/react/24/outline";
import { HomeIcon } from "@heroicons/react/16/solid";
import SalesIconV2 from "../../svgs/SalesIconV2";
import CashierIcon from "../../svgs/CashierIcon";

export type Navigation = {
  name: string;
  href: string;
  icon: typeof UsersIcon | typeof Radiation | typeof StoresIcon | any;
  current?: boolean;
  children?: Navigation[];
  childOpen?: boolean;
  mobile: boolean;
  userTypes: string[];
};

export const navigation: Navigation[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: HomeIcon,
    mobile: true,
    userTypes: ["*"],
  },
  {
    name: "Sales",
    href: "sales",
    icon: SalesIconV2,
    mobile: true,
    userTypes: ["*"],
  },
  {
    name: "Cashiers",
    href: "cashiers",
    icon: CashierIcon,
    mobile: true,
    userTypes: ["*"],
  },
];
