// Utils
import {
  COMING_SOON_LEVELS,
  PROGRAMMER_ONLY_LEVELS,
} from "../../../utils/comingSoon";

// Interfaces
import type { Navigation } from "../interfaces";

// Components
import {
  ArrowTrendingUpIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  ArchiveBoxIcon,
  ShieldExclamationIcon,
  DocumentArrowUpIcon,
  TicketIcon,
  // DocumentArrowDownIcon, (Markdowns, below)
  QrCodeIcon,
} from "@heroicons/react/16/solid";

export const comingSoonPages: Navigation[] = [
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
    name: "Data Export",
    href: "data-export",
    icon: DocumentArrowUpIcon,
    // Desktop only — a two-panel builder with a 102-column file in it has
    // no phone form.
    mobile: false,
    children: [],
    childOpen: false,
    // Level 9 while it is being tested. It stays in Coming Soon, so it is
    // still dev-API only — but a build here writes a real file to S3 from
    // real store data, which is not something an owner should reach by
    // wandering into the section.
    userLevels: PROGRAMMER_ONLY_LEVELS,
    isHovering: false,
    isVisible: true,
  },
  {
    name: "Upc Scanner",
    href: "upc-scanner",
    icon: QrCodeIcon,
    // The first mobile-only page in here. Scanning needs a scanner, so the
    // desktop route renders a notice rather than a second build of it.
    mobile: true,
    children: [],
    childOpen: false,
    // Level 9 while the file format is open: a send writes a real file a
    // client's tag printer picks up. Same reasoning as Data Export.
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
    userLevels: COMING_SOON_LEVELS,
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
    userLevels: COMING_SOON_LEVELS,
    isHovering: false,
    isVisible: true,
  },
  {
    name: "AWG Invoices",
    href: "invoices",
    icon: DocumentArrowUpIcon,
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: PROGRAMMER_ONLY_LEVELS,
    isHovering: false,
    isVisible: true,
  },
  // Commented out for the 11 Nov publish. Restore this entry and the
  // DocumentArrowDownIcon import together.
  // {
  //   name: "Markdowns",
  //   href: "markdowns",
  //   icon: DocumentArrowDownIcon,
  //   mobile: false,
  //   children: [],
  //   childOpen: false,
  //   userLevels: PROGRAMMER_ONLY_LEVELS,
  //   isHovering: false,
  //   isVisible: true,
  // },
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
    // Every level. Who sees which tickets is the server's answer, by tier:
    // below Manager their own, a Manager also their stores', an Owner
    // also their companies'. Report an issue already files from any
    // level in dev, so a level gate here only hid the tickets people had
    // just filed, from the very readers the "own" tier exists for.
    mobile: false,
    children: [],
    childOpen: false,
    userLevels: ["*"],
    isHovering: false,
    isVisible: true,
  },
];
