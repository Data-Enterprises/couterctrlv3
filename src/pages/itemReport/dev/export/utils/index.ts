// Interfaces
import type { Col, Preset, Source } from "../interfaces";

export const PREVIEW_ROWS = 5;

export const ITEM_COLS: Col[] = [
  { key: "action", label: "Action", defaultOn: true },
  { key: "evidence", label: "Evidence", defaultOn: true },
  { key: "dept", label: "Sub department", defaultOn: true },
  { key: "vendor", label: "Vendor", defaultOn: true },
  { key: "upc", label: "UPC", defaultOn: true },
  { key: "description", label: "Description", defaultOn: true },
  { key: "source", label: "Source", defaultOn: true },
  { key: "sales", label: "Sales", defaultOn: true },
  { key: "units", label: "Units", defaultOn: true },
  { key: "lwPct", label: "vs LW units %", defaultOn: true },
  { key: "lyPct", label: "vs LY units %", defaultOn: true },
  { key: "lwUnits", label: "LW units", defaultOn: true },
  { key: "lyUnits", label: "LY units", defaultOn: true },
  { key: "lwSales", label: "LW sales", defaultOn: false },
  { key: "lySales", label: "LY sales", defaultOn: false },
  { key: "unitCost", label: "Cost / unit", defaultOn: true },
  { key: "marginPct", label: "GM %", defaultOn: true },
  { key: "daysSold", label: "Days sold", defaultOn: false },
  { key: "lastReceived", label: "Last received", defaultOn: true },
  { key: "daysSinceRecv", label: "Days since received", defaultOn: true },
  { key: "receivedUnits", label: "Units received", defaultOn: true },
  { key: "moveReceived", label: "Received (14d)", defaultOn: true },
  { key: "moveSold", label: "Sold (14d)", defaultOn: true },
  { key: "moveNet", label: "Net units (14d)", defaultOn: true },
  { key: "moveDays", label: "Movement days", defaultOn: false },
  { key: "unaccounted", label: "Unaccounted since delivery", defaultOn: true },
  { key: "intendedRetail", label: "Intended retail", defaultOn: true },
];

export const ERA_COLS: Col[] = [
  { key: "upc", label: "UPC", defaultOn: true },
  { key: "description", label: "Description", defaultOn: true },
  { key: "start", label: "From", defaultOn: true },
  { key: "end", label: "To", defaultOn: true },
  { key: "days", label: "Days", defaultOn: true },
  { key: "price", label: "Price", defaultOn: true },
  { key: "unitCost", label: "Cost / unit", defaultOn: true },
  { key: "marginPct", label: "GM %", defaultOn: true },
  { key: "units", label: "Units", defaultOn: true },
  { key: "unitsPerDay", label: "Units / day", defaultOn: true },
];

export const RECEIPT_COLS: Col[] = [
  { key: "upc", label: "UPC", defaultOn: true },
  { key: "description", label: "Description", defaultOn: true },
  { key: "date", label: "Date", defaultOn: true },
  { key: "vendor", label: "Vendor", defaultOn: true },
  { key: "invoice", label: "Invoice", defaultOn: true },
  // "Qty" rather than "Units", matching the screen and the API: this is the
  // sellable-unit count, and the endpoint's own `units` field means something
  // else entirely.
  { key: "units", label: "Qty", defaultOn: true },
  { key: "cases", label: "Cases", defaultOn: true },
  { key: "billedIn", label: "Billed in", defaultOn: true },
  { key: "caseSize", label: "Case size", defaultOn: true },
  { key: "unitCost", label: "Unit cost", defaultOn: true },
  { key: "retail", label: "Intended retail", defaultOn: true },
  // Flags, not counts. They were visible on screen and absent from the file,
  // which is the wrong way round for a page most people read as a CSV — a
  // delivery flagged as a return simply vanished on the way out.
  { key: "free", label: "Free", defaultOn: true },
  { key: "returned", label: "Returned", defaultOn: true },
];

/** One row per department. The only grain here that isn't per item, and the
 *  reason it exists: a district manager will not read seven hundred rows. */
export const SUMMARY_COLS: Col[] = [
  { key: "dept", label: "Sub department", defaultOn: true },
  { key: "items", label: "Items flagged", defaultOn: true },
  { key: "investigate", label: "Investigate", defaultOn: true },
  { key: "reorder", label: "Reorder", defaultOn: true },
  { key: "reprice", label: "Reprice", defaultOn: true },
  { key: "vendor", label: "Call vendor", defaultOn: true },
  { key: "none", label: "No action", defaultOn: true },
  { key: "insufficient", label: "Insufficient", defaultOn: false },
  { key: "sales", label: "TY sales", defaultOn: true },
  { key: "units", label: "TY units", defaultOn: true },
  { key: "lyPct", label: "vs LY units %", defaultOn: true },
];

export const COLS: Record<Source, Col[]> = {
  items: ITEM_COLS,
  eras: ERA_COLS,
  receipts: RECEIPT_COLS,
  summary: SUMMARY_COLS,
};

/** Custom mode still picks a grain directly — that is what "custom" means. */
export const SOURCE_LABEL: { key: Source; label: string }[] = [
  { key: "items", label: "One row per item" },
  { key: "eras", label: "One row per price held" },
  { key: "receipts", label: "One row per delivery" },
  { key: "summary", label: "One row per department" },
];

export const PRESETS: Preset[] = [
  {
    key: "full-report",
    title: "The action list",
    blurb: "Every row as it appears on screen, action and evidence included.",
    source: "items",
    cols: ITEM_COLS.map((c) => c.key),
    filters: ["vendor", "dept"],
  },
  {
    key: "vendor-packet",
    title: "Vendor packet",
    blurb:
      "For the supplier: what is selling that they have not delivered, and what the invoice prices have been. No cost or margin columns.",
    source: "items",
    actions: ["vendor", "reorder"],
    cols: [
      "upc",
      "description",
      "vendor",
      "dept",
      "units",
      "lwUnits",
      "lastReceived",
      "daysSinceRecv",
      "receivedUnits",
      "intendedRetail",
      "evidence",
    ],
    filters: ["vendor"],
  },
  {
    key: "order-list",
    title: "Order list",
    blurb:
      "For whoever places orders: what is about to run out, biggest sellers first.",
    source: "items",
    actions: ["reorder", "vendor"],
    cols: [
      "upc",
      "description",
      "dept",
      "vendor",
      "units",
      "lwUnits",
      "lastReceived",
      "daysSinceRecv",
      "moveReceived",
      "moveSold",
      "moveNet",
      "unaccounted",
      "evidence",
    ],
    filters: ["vendor", "dept"],
  },
  {
    key: "price-review",
    title: "Price review",
    blurb:
      "For whoever sets retails: every price the flagged items held, against the cost in force at the time.",
    source: "eras",
    actions: ["reprice"],
    cols: ERA_COLS.map((c) => c.key),
    filters: ["dept"],
  },
  {
    key: "dept-worklist",
    title: "Department worklist",
    blurb:
      "For the floor: what to do and why, one department at a time. No cost or margin, so it can be handed to anyone.",
    source: "items",
    cols: [
      "action",
      "upc",
      "description",
      "dept",
      "units",
      "daysSinceRecv",
      "evidence",
    ],
    filters: ["dept"],
  },
  {
    key: "store-summary",
    title: "Store summary",
    blurb:
      "For a district manager: one row per department, counted by action, with the sales behind it.",
    source: "summary",
    cols: SUMMARY_COLS.map((c) => c.key),
    filters: [],
  },
  {
    key: "receipts",
    title: "Received",
    blurb:
      "One row per delivery: dated unit costs and the retail each invoice intended.",
    source: "receipts",
    cols: RECEIPT_COLS.map((c) => c.key),
    filters: ["vendor", "dept"],
  },
];

/** Safe for a filename and still readable a month later in a Downloads folder
 *  next to four others from the same week. */
export const slug = (s: string) =>
  s
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
