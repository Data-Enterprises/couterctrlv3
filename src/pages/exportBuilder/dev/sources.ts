import type { ExportTableKey } from "../../../api/salesExport";
import type { ExportListItem } from "../../../features/dev/devExportBuilderSlice";

/**
 * What the page knows about each table it exports.
 *
 * Everything that differs between tables lives here and nowhere else: which
 * filters a table takes and what they are called, the preview list each one
 * is picked from, the column it narrows (for the query box and the sample),
 * how the router matches it, and how a row of the panel reads. The panel, the
 * query box, the sample, saved configurations and the request all read this,
 * so adding a table is adding an entry.
 *
 * The filter names are the router's own (models/export.py). The router refuses
 * one it does not know, and the request is built from these and nothing else.
 */

/**
 * How the router matches a list filter, mirrored by the sample narrowing.
 *
 *   in           column = ANY(values)
 *   in_lower     lower(column) = ANY(values), case ignored
 *   in_or_blank  coalesce(column, '') = ANY(values); "" picks the rows with none
 */
export type ListMatch = "in" | "in_lower" | "in_or_blank";

/**
 * How a list's choices read in the panel.
 *
 *   plain     the label alone (sale types, price types)
 *   idName    the id in bold, then the name (sub departments)
 *   name      the name, or the id when there is none (vendors)
 *   codeName  the number in mono, then the name or a dash (cashiers)
 */
export type ListLook = "plain" | "idName" | "name" | "codeName";

export interface ListFilter {
  /** The router's filter name, and this list's key in the slice. */
  filter: string;
  /** The preview list (facet) it is picked from. */
  facet: string;
  /** The table column it narrows: what the query box writes and the sample
   *  is matched on. */
  column: string;
  match: ListMatch;
  /** Sent as numbers (a bigint column). Held as strings everywhere else. */
  numeric?: boolean;
  /** The panel row's title. */
  label: string;
  /** "sale types", for counts and notes. */
  noun: string;
  /** "sale type", for a count of one. */
  nounOne: string;
  look: ListLook;
  /** A long list gets a search box with this placeholder. */
  search?: string;
  /** A line of explanation above the choices. */
  note?: string;
  /** What the open row says when the range holds none. */
  empty?: string;
  /** Beside the "" choice of an in_or_blank list: what picking it means. */
  blankHint?: string;
  /** Named in a saved configuration's one-line summary when narrowed. */
  inSummary?: boolean;
  /** The preview's facet, as the panel's choices. */
  toItems: (raw: unknown) => ExportListItem[];
}

/** A switch the router reads as null, 0 or 1 over COALESCE(column, 0). */
export interface FlagFilter {
  filter: string;
  column: string;
  /** The Output control's label. */
  label: string;
  /** "voids": "Exclude voids", "Only voids", "no voids", "voids only". */
  plural: string;
  /** The export bar's words for 0 and 1. */
  excluded: string;
  only: string;
  /** What the query box says it widened: "the void filter". */
  widened: string;
}

/** A filter the page fills from typing or the range, not from a list. */
export interface TypedFilter {
  filter: string;
  column: string;
}

export interface ExportSource {
  key: ExportTableKey;
  /** The search card's title for it. */
  label: string;
  /** The line under the title: what a row is. */
  blurb: string;
  /** Particular days inside the range. */
  days: TypedFilter;
  codes: TypedFilter;
  descriptions: TypedFilter;
  /** The panel's list rows, in the order they show. */
  lists: ListFilter[];
  /** The Output panel's switches, in the order they show. */
  flags: FlagFilter[];
  /** The file name when none is typed. */
  filePrefix: string;
}

const text = (v: unknown) => String(v ?? "").trim();

/** Bare values: one choice each, the value as its own label. */
const values = (raw: unknown): ExportListItem[] =>
  (Array.isArray(raw) ? raw : []).map((v) => ({ value: String(v), label: String(v) }));

/** `{value, label}` already, the null kept as "". */
const options = (raw: unknown): ExportListItem[] =>
  (Array.isArray(raw) ? (raw as { value: unknown; label: unknown }[]) : []).map((o) => ({
    value: String(o.value ?? ""),
    label: String(o.label ?? ""),
  }));

/**
 * Id/name pairs, folded to one choice per id.
 *
 * The router returns the distinct pairs it finds, and stores disagree about
 * what an id is called -- sub department 5 is Cigarettes in one and Tobacco in
 * another. The filter is the id, so two rows for one id would be two ticks
 * that mean the same thing; the names are gathered into one label instead.
 * Insertion order, so the router's own sort survives.
 *
 * An id that is null or blank is left out. The filter is on the id and the
 * router matches it with `= ANY`, so no tick could ever select those rows --
 * and String(null) used to turn a missing vendor id into a vendor called
 * "null". Their rows are not lost: they are in the file whenever the list is
 * not narrowed.
 */
const pairs =
  (idKey: string, nameKey: string) =>
  (raw: unknown): ExportListItem[] => {
    const names = new Map<string, string[]>();
    for (const row of (Array.isArray(raw) ? raw : []) as Record<string, unknown>[]) {
      const id = row[idKey];
      if (id === null || id === undefined || text(id) === "") continue;
      const key = String(id);
      const name = text(row[nameKey]);
      const seen = names.get(key) ?? [];
      if (name && !seen.includes(name)) seen.push(name);
      names.set(key, seen);
    }
    return [...names].map(([value, labels]) => ({ value, label: labels.join(" / ") }));
  };

/**
 * Sales lines, from `sales_partitioned`.
 *
 * The lists are in the panel's long-standing order. The flags are the two the
 * table has.
 */
export const SALES: ExportSource = {
  key: "sales",
  label: "Sales",
  blurb: "Every line of every transaction",
  days: { filter: "saleDates", column: "sale_date" },
  codes: { filter: "productCodes", column: "product_code" },
  descriptions: { filter: "productDescriptions", column: "product_description" },
  lists: [
    {
      filter: "saleTypes",
      facet: "saleTypes",
      column: "sale_type",
      match: "in_lower",
      label: "Sale Types",
      noun: "sale types",
      nounOne: "sale type",
      look: "plain",
      empty: "No sale types in this range.",
      inSummary: true,
      toItems: values,
    },
    {
      filter: "itemRingTypes",
      facet: "itemRingTypes",
      column: "item_ring_type",
      match: "in",
      label: "Ring Types",
      noun: "ring types",
      nounOne: "ring type",
      look: "plain",
      toItems: values,
    },
    {
      // The id arrives as a number -- the column is a bigint and the router
      // hands it back unconverted -- so it is held as a string like every
      // other value and sent as a number.
      filter: "subDepartments",
      facet: "subDepartments",
      column: "sub_department",
      match: "in",
      numeric: true,
      label: "Sub Departments",
      noun: "sub departments",
      nounOne: "sub department",
      look: "idName",
      search: "Find a sub department...",
      inSummary: true,
      toItems: pairs("sub_department", "sub_department_description"),
    },
    {
      // vendor_id is text despite looking numeric ("148" and "B3389" both
      // occur), and the name is often null, so the id is what shows then.
      filter: "vendorIds",
      facet: "vendors",
      column: "vendor_id",
      match: "in",
      label: "Vendors",
      noun: "vendors",
      nounOne: "vendor",
      look: "name",
      search: "Find a vendor...",
      inSummary: true,
      toItems: pairs("vendor_id", "vendor_name"),
    },
    {
      // A bigint, unlike vendor_id: the filter takes numbers. The name is
      // spelled differently between imports, so the router folds on the
      // number (one window had 384 number/name pairs for 188 cashiers).
      filter: "cashierNumbers",
      facet: "cashiers",
      column: "cashier_number",
      match: "in",
      numeric: true,
      label: "Cashiers",
      noun: "cashiers",
      nounOne: "cashier",
      look: "codeName",
      search: "Find a cashier...",
      inSummary: true,
      toItems: pairs("cashier_number", "cashier_name"),
    },
    {
      // A per-company vocabulary: Food Giant says Regular and Managers
      // Special, others say REG and STOR, and TPR is the only word they all
      // share. So a saved list only means anything against the stores it was
      // built from, which is why a load checks it against this window's list.
      // One choice is the absence of a value ("", labelled "(none)"): all of
      // one company's lines, 15% of another's, so it is a choice, not a gap.
      filter: "priceTypes",
      facet: "priceTypes",
      column: "price_type",
      match: "in_or_blank",
      label: "Price Types",
      noun: "price types",
      nounOne: "price type",
      look: "plain",
      note: "These words are the company's, not the table's — one company says Regular, another says REG. This list is what these stores use.",
      empty: "No price types in this range.",
      blankHint: "lines with no price type",
      toItems: options,
    },
  ],
  flags: [
    {
      filter: "voidFlag",
      column: "void_flag",
      label: "Voided lines",
      plural: "voids",
      excluded: "voided lines excluded",
      only: "voided lines only",
      widened: "the void filter",
    },
    {
      filter: "refundFlag",
      column: "refund_flag",
      label: "Refunds",
      plural: "refunds",
      excluded: "refunds excluded",
      only: "refunds only",
      widened: "the refund filter",
    },
  ],
  filePrefix: "sales",
};

/*
 * The lists every other table shares. Their shapes are the router's own: a
 * facet of pairs comes back keyed by the table's column names, so the same
 * list is spelled differently from table to table (invoices says vendorid and
 * subdepartment), and each source names its own.
 */
const vendors = (column: string): ListFilter => ({
  // Text, like sales's vendor_id, and the name is often missing.
  filter: "vendorIds",
  facet: "vendors",
  column,
  match: "in",
  label: "Vendors",
  noun: "vendors",
  nounOne: "vendor",
  look: "name",
  search: "Find a vendor...",
  inSummary: true,
  toItems: pairs(column, "vendor_name"),
});

const subDepartments = (column: string, nameColumn: string): ListFilter => ({
  filter: "subDepartments",
  facet: "subDepartments",
  column,
  match: "in",
  numeric: true,
  label: "Sub Departments",
  noun: "sub departments",
  nounOne: "sub department",
  look: "idName",
  search: "Find a sub department...",
  inSummary: true,
  toItems: pairs(column, nameColumn),
});

const CATEGORIES: ListFilter = {
  filter: "categories",
  facet: "categories",
  column: "category",
  match: "in",
  numeric: true,
  label: "Categories",
  noun: "categories",
  nounOne: "category",
  look: "idName",
  search: "Find a category...",
  inSummary: true,
  toItems: pairs("category", "category_description"),
};

const STATUSES: ListFilter = {
  filter: "statuses",
  facet: "statuses",
  column: "status",
  match: "in",
  label: "Statuses",
  noun: "statuses",
  nounOne: "status",
  look: "plain",
  empty: "No statuses in this range.",
  toItems: values,
};

/**
 * Order lines, from `orders`.
 *
 * Counts, damages and vendor orders share the table and are told apart by
 * order_type, so the type list is first: it is the question being asked.
 */
export const ORDERS: ExportSource = {
  key: "orders",
  label: "Orders",
  blurb: "Order lines, counts (INV, PER), damages",
  days: { filter: "orderDates", column: "order_date" },
  codes: { filter: "productCodes", column: "product_code" },
  descriptions: { filter: "productDescriptions", column: "description" },
  lists: [
    {
      filter: "orderTypes",
      facet: "orderTypes",
      column: "order_type",
      match: "in",
      label: "Order Types",
      noun: "order types",
      nounOne: "order type",
      look: "plain",
      note: "INV and PER are counts, DAM and DMG are damages, and the rest are orders.",
      empty: "No order types in this range.",
      inSummary: true,
      toItems: values,
    },
    STATUSES,
    vendors("vendor_id"),
    subDepartments("sub_department", "sub_department_description"),
    CATEGORIES,
  ],
  flags: [],
  filePrefix: "orders",
};

/**
 * Received vendor invoice lines, from `invoices`.
 *
 * The router takes cashier numbers here too, and the page leaves them out on
 * purpose: an invoice is an order received, entered by whoever runs the
 * back office, so the cashier is not a question anyone asks of one.
 */
export const INVOICES: ExportSource = {
  key: "invoices",
  label: "Invoices",
  blurb: "Received vendor invoice lines",
  days: { filter: "invoiceDates", column: "invoice_date" },
  codes: { filter: "productCodes", column: "product_code" },
  descriptions: { filter: "productDescriptions", column: "product_description" },
  lists: [
    vendors("vendorid"),
    subDepartments("subdepartment", "subdepartment_description"),
    CATEGORIES,
    STATUSES,
  ],
  flags: [
    {
      filter: "voidFlag",
      column: "void_flag",
      label: "Voided lines",
      plural: "voids",
      excluded: "voided lines excluded",
      only: "voided lines only",
      widened: "the void filter",
    },
    {
      filter: "refundFlag",
      column: "refund_key_flag",
      label: "Refunds",
      plural: "refunds",
      excluded: "refunds excluded",
      only: "refunds only",
      widened: "the refund filter",
    },
    {
      filter: "returnFlag",
      column: "item_return_flag",
      label: "Returns",
      plural: "returns",
      excluded: "returns excluded",
      only: "returns only",
      widened: "the return filter",
    },
  ],
  filePrefix: "invoices",
};

/**
 * Items marked down, from `markdowns`. Waste is one of the types, so it is
 * exported from here rather than a source of its own.
 */
export const MARKDOWNS: ExportSource = {
  key: "markdowns",
  label: "Markdowns",
  blurb: "Items marked down",
  days: { filter: "orderDates", column: "order_date" },
  codes: { filter: "productCodes", column: "product_code" },
  descriptions: { filter: "productDescriptions", column: "description" },
  lists: [
    {
      filter: "types",
      facet: "types",
      column: "type",
      match: "in",
      label: "Types",
      noun: "types",
      nounOne: "type",
      look: "plain",
      note: "Waste is one of these.",
      empty: "No markdown types in this range.",
      inSummary: true,
      toItems: values,
    },
    vendors("vendor_id"),
    subDepartments("sub_department", "sub_department_description"),
    CATEGORIES,
  ],
  flags: [],
  filePrefix: "markdowns",
};

/** Every source the page can export, in the search card's order. */
export const SOURCES: ExportSource[] = [SALES, ORDERS, INVOICES, MARKDOWNS];

/** The description for a table, Sales for one the page does not know. */
export const sourceFor = (key: ExportTableKey | string): ExportSource =>
  SOURCES.find((s) => s.key === key) ?? SALES;

/**
 * Every filter name a source can send, in the order it sends them.
 *
 * The request is built from this list, so it is also the allowlist: nothing
 * outside it reaches `filters`.
 */
export const filterNames = (source: ExportSource): string[] => [
  ...source.lists.map((l) => l.filter),
  source.days.filter,
  source.codes.filter,
  source.descriptions.filter,
  ...source.flags.map((f) => f.filter),
];

/** "Sale types", from "sale types". */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
