// Helpers for companies whose POS doesn't use sub department numbers — every
// row comes back with `sub_department: 0` and only the description tells the
// departments apart.
//
// Grouping those rows by id collapses the entire store into a single "0"
// bucket, so every sub-department breakdown reads as one line worth the store's
// whole sales. Grouping by description instead is correct for them, but wrong
// as a blanket rule: a company that does number its departments may reuse a
// description across two ids, and merging those would be just as wrong in the
// other direction.
//
// So the key is chosen per response rather than per company or per build: if
// nothing in the data carries a usable id, fall back to the description.
// Companies that number their departments keep the exact behaviour they have
// today, down to the bucket keys.
//
// Shared rather than page-local because Sales, Sub Dept Margins, Orders and
// Coupons all cut by sub department — if one page splits them and another
// merges them, the numbers stop lining up.

/** The minimum a row needs for either keying mode. */
export type SubDeptRow = {
  sub_department: number;
  sub_department_description: string;
};

export type SubDeptKeyMode = "id" | "desc";

/**
 * Which field identifies a sub department in this response.
 *
 * "desc" only when NO row carries a non-zero id. A single real id anywhere
 * means the company numbers its departments and 0 is a genuine department
 * (it is — see the note in subMarginSlice), so the id stays authoritative.
 *
 * An empty list is "id": there's nothing to key, and defaulting to the
 * established mode keeps a page that renders before its data arrives from
 * flipping modes underneath itself.
 */
export const subDeptKeyMode = (rows: SubDeptRow[]): SubDeptKeyMode =>
  rows.some((r) => Number(r.sub_department) !== 0) ? "id" : "desc";

/**
 * Bucket key for one row. Always a string: in "desc" mode the key is a name,
 * and a Record keyed by number would coerce it to "[object Object]"-grade
 * nonsense at the first lookup.
 *
 * A blank description in "desc" mode keys as "0" — the id it actually has —
 * rather than "", so unlabelled rows land in one identifiable bucket instead of
 * silently joining whichever department happens to sort first.
 */
export const subDeptKeyOf = (row: SubDeptRow, mode: SubDeptKeyMode): string =>
  mode === "desc"
    ? (row.sub_department_description || "").trim() ||
      String(row.sub_department ?? 0)
    : String(row.sub_department);

/**
 * One keyer for a whole response, so every derived map in a page agrees.
 *
 * `mode` is exposed because callers need it for more than keying: the item
 * drill-down has to know whether it can ask the API for one sub department by
 * id or must fetch and filter by description, and a label like "Dept 12" is
 * meaningless when every id is 0.
 */
export const subDeptKeyer = (rows: SubDeptRow[]) => {
  const mode = subDeptKeyMode(rows);
  return {
    mode,
    /** True when ids are meaningless and the description is the identity. */
    byDesc: mode === "desc",
    keyOf: (row: SubDeptRow) => subDeptKeyOf(row, mode),
    /** Whether `row` belongs to the bucket `key`. */
    matches: (row: SubDeptRow, key: string) => subDeptKeyOf(row, mode) === key,
  };
};

/**
 * Distinct sub departments in a response, in the order a page should list them:
 * by id when ids are real, alphabetically when the description is the identity
 * (numeric order over a column of zeroes is no order at all).
 *
 * `id` is kept alongside the key because it's still what the margins endpoint
 * is queried with — in "desc" mode that's 0 for every department, which is
 * exactly the filter value those rows need. See selectSubDept.
 */
export const distinctSubDepts = (
  rows: SubDeptRow[],
): { key: string; id: number; desc: string }[] => {
  const mode = subDeptKeyMode(rows);
  const out: { key: string; id: number; desc: string }[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const key = subDeptKeyOf(row, mode);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      key,
      id: Number(row.sub_department) || 0,
      desc: row.sub_department_description,
    });
  }
  return mode === "desc"
    ? out.sort((a, b) => a.desc.localeCompare(b.desc))
    : out.sort((a, b) => a.id - b.id);
};

/**
 * Narrow rows fetched from a sub-department endpoint down to one department.
 *
 * In "id" mode the API already filtered by id and this is a no-op pass-through.
 * In "desc" mode the request necessarily asked for id 0 — the only id these
 * rows have — so it comes back carrying every department, and the description
 * is what separates them. Doing this here rather than at each call site keeps
 * the two modes from drifting apart.
 */
export const scopeToSubDept = <T extends SubDeptRow>(
  rows: T[],
  key: string,
  mode: SubDeptKeyMode,
): T[] =>
  mode === "id" ? rows : rows.filter((r) => subDeptKeyOf(r, mode) === key);
