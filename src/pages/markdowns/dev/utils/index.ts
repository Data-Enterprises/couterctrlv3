// Utils
import { formatCurrency2 } from "../../../../utils";

// Interfaces
import type { SortState } from "../../../../utils/useTriStateSort";
import type {
  MarkdownFilters,
  MarkdownItem,
  MarkdownSortKey,
} from "../../../../interfaces/markdowns";
import type { MarkdownColumn, MarkdownFilterKey } from "../interfaces";

/** A backend date or timestamp ("2026-11-03" or "2026-11-03T06:12:00") as dd/mm/yyyy. */
export const fmtDmy = (iso: string | null) =>
  iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "—";

/** A backend timestamp as dd/mm/yyyy hh:mm. */
export const fmtDmyTime = (iso: string | null) =>
  iso ? `${fmtDmy(iso)} ${iso.slice(11, 16)}` : "—";

const money = (n: number | null) => (n === null ? "—" : formatCurrency2(n));
const num = (n: number | null, digits = 0) =>
  n === null ? "—" : n.toFixed(digits);
const text = (s: string | number | null) =>
  s === null || s === "" ? "—" : String(s);

/**
 * Every column the export offers, in order: the event, the item, the prices,
 * the item's details, then who keyed it. storeid and storenumber are left
 * out: Store names the store.
 */
export const MARKDOWN_COLUMNS: MarkdownColumn[] = [
  {
    key: "order_date",
    label: "Date",
    align: "left",
    show: (r) => fmtDmy(r.order_date),
    csv: (r) => fmtDmy(r.order_date),
  },
  {
    key: "type",
    label: "Type",
    align: "left",
    show: (r) => text(r.type),
    csv: (r) => r.type,
  },
  {
    key: "storename",
    label: "Store",
    align: "left",
    show: (r) => r.storename,
    csv: (r) => r.storename,
  },
  {
    key: "product_code",
    label: "UPC",
    align: "left",
    show: (r) => r.product_code,
    csv: (r) => r.product_code,
  },
  {
    key: "description",
    label: "Description",
    align: "left",
    show: (r) => text(r.description),
    csv: (r) => r.description,
  },
  {
    key: "sub_department",
    label: "Sub Dept #",
    align: "right",
    grid: false,
    show: (r) => text(r.sub_department),
    csv: (r) => r.sub_department,
  },
  {
    key: "sub_department_description",
    label: "Sub Dept",
    align: "left",
    show: (r) => text(r.sub_department_description),
    csv: (r) => r.sub_department_description,
  },
  {
    key: "category",
    label: "Category #",
    align: "right",
    grid: false,
    show: (r) => text(r.category),
    csv: (r) => r.category,
  },
  {
    key: "category_description",
    label: "Category",
    align: "left",
    show: (r) => text(r.category_description),
    csv: (r) => r.category_description,
  },
  {
    key: "vendor_name",
    label: "Vendor",
    align: "left",
    show: (r) => text(r.vendor_name),
    csv: (r) => r.vendor_name,
  },
  {
    key: "original_price",
    label: "Orig Price",
    align: "right",
    show: (r) => money(r.original_price),
    csv: (r) => r.original_price,
  },
  {
    key: "new_price",
    label: "New Price",
    align: "right",
    show: (r) => money(r.new_price),
    csv: (r) => r.new_price,
  },
  {
    key: "markdown",
    label: "Markdown",
    align: "right",
    show: (r) => money(r.markdown),
    csv: (r) => r.markdown,
  },
  {
    key: "markdown_percent",
    label: "MD %",
    align: "right",
    show: (r) =>
      r.markdown_percent === null ? "—" : `${r.markdown_percent.toFixed(2)}%`,
    csv: (r) => r.markdown_percent,
  },
  {
    key: "qty",
    label: "Qty",
    align: "right",
    show: (r) => num(r.qty),
    csv: (r) => r.qty,
  },
  {
    key: "weight",
    label: "Weight",
    align: "right",
    show: (r) => num(r.weight, 2),
    csv: (r) => r.weight,
  },
  {
    key: "retail",
    label: "Retail",
    align: "right",
    show: (r) => money(r.retail),
    csv: (r) => r.retail,
  },
  {
    key: "case_size",
    label: "Case Size",
    align: "right",
    show: (r) => num(r.case_size),
    csv: (r) => r.case_size,
  },
  {
    key: "case_cost",
    label: "Case Cost",
    align: "right",
    show: (r) => money(r.case_cost),
    csv: (r) => r.case_cost,
  },
  {
    key: "scalable",
    label: "Scalable",
    align: "left",
    show: (r) => (r.scalable === null ? "—" : r.scalable ? "Yes" : "No"),
    csv: (r) => r.scalable,
  },
  {
    key: "vendor_id",
    label: "Vendor ID",
    align: "left",
    show: (r) => text(r.vendor_id),
    csv: (r) => r.vendor_id,
  },
  {
    key: "userid",
    label: "User",
    align: "left",
    show: (r) => r.userid,
    csv: (r) => r.userid,
  },
  {
    key: "markdown_id",
    label: "Markdown #",
    align: "right",
    show: (r) => text(r.markdown_id),
    csv: (r) => r.markdown_id,
  },
  {
    key: "id",
    label: "ID",
    align: "right",
    show: (r) => String(r.id),
    csv: (r) => r.id,
  },
  {
    key: "last_update_time",
    label: "Updated",
    align: "left",
    show: (r) => fmtDmyTime(r.last_update_time),
    csv: (r) => fmtDmyTime(r.last_update_time),
  },
];

/** The columns the grid draws: all but the sub department and category numbers. */
export const GRID_COLUMNS = MARKDOWN_COLUMNS.filter((c) => c.grid !== false);

/** A row's identity. The table's key is (storeid, id, order_date): an id alone
 *  repeats across stores and dates. */
export const rowKey = (r: MarkdownItem) =>
  `${r.storeid}-${r.id}-${r.order_date}`;

/** A row's value for one list filter, as the filter stores it. */
export const filterValue = (
  r: MarkdownItem,
  key: MarkdownFilterKey,
): string | null => {
  switch (key) {
    case "types":
      return r.type;
    case "storeNumbers":
      return r.storenumber;
    case "dates":
      return r.order_date ? r.order_date.slice(0, 10) : null;
    case "subIds":
      return r.sub_department === null ? null : String(r.sub_department);
    case "categories":
      return r.category === null ? null : String(r.category);
    case "vendorIds":
      return r.vendor_id;
    case "productCodes":
      return r.product_code;
    case "userIds":
      return r.userid;
  }
};

export const LIST_FILTERS: MarkdownFilterKey[] = [
  "types",
  "storeNumbers",
  "dates",
  "subIds",
  "categories",
  "vendorIds",
  "productCodes",
  "userIds",
];

/**
 * The filters as a row test. Each list's picks become a Set of strings (the
 * form filterValue returns) once, not once a row: tens of thousands of rows
 * run through it on every pick. `skip` leaves one list filter out, which is how
 * each filter learns what it can still offer given the others.
 */
export const compileFilters = (f: MarkdownFilters) => {
  const sets = LIST_FILTERS.filter((key) => f[key].length > 0).map(
    (key) => [key, new Set((f[key] as (string | number)[]).map(String))] as const,
  );
  return (skip: MarkdownFilterKey | null = null) =>
    (r: MarkdownItem): boolean => {
      for (const [key, chosen] of sets) {
        if (key === skip) continue;
        const v = filterValue(r, key);
        if (v === null || !chosen.has(v)) return false;
      }
      if (
        f.minPercent !== null &&
        (r.markdown_percent === null || r.markdown_percent < f.minPercent)
      )
        return false;
      return true;
    };
};

/** The rows every filter keeps, in the order they came. */
export const filterRows = (rows: MarkdownItem[], f: MarkdownFilters) =>
  rows.filter(compileFilters(f)());

/**
 * The rows in the sort's order. No sort keeps the backend's order (order_date,
 * storeid, markdown_id, id). Blanks go last either way.
 */
export const sortRows = (
  rows: MarkdownItem[],
  sort: SortState<MarkdownSortKey>,
) => {
  if (!sort) return rows;
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = a[sort.col];
    const vb = b[sort.col];
    if (va === null || va === "") return vb === null || vb === "" ? 0 : 1;
    if (vb === null || vb === "") return -1;
    if (typeof va === "number" && typeof vb === "number")
      return (va - vb) * dir;
    return (
      String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir
    );
  });
};
