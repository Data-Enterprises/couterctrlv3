// Components
import type { UsersIcon } from "@heroicons/react/16/solid";

/** One menu entry: a page, who can see it, and whether it has a phone form. */
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

/** A heading in the menu and the pages under it. */
export type NavCategory = {
  name: string;
  icon: typeof UsersIcon | any;
  pages: Navigation[];
};
