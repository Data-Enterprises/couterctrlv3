// Interfaces
import type {
  CompanyDeptRow,
  DeptAtStore,
  DeptState,
  ExclStore,
  ExclusionRow,
  ExclusionWrite,
  StoreSubDept,
} from "../interfaces";

/**
 * The description, reduced to the part the stores agree on.
 *
 * Case and internal spacing are the differences actually observed between
 * stores running the same POS. Nothing more aggressive than that: stripping
 * punctuation or stemming would fuse "MONEY ORDER FEE" into "MONEY ORDERS",
 * and quietly excluding the fee along with the sale is a wrong number nobody
 * would go looking for.
 */
export const normalizeDesc = (desc: string): string =>
  desc.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Descriptions that are usually hash — a pass-through where the store takes
 * money that was never theirs.
 *
 * Only ever a **suggestion**. Whether a department belongs in net sales is the
 * operator's call: some chains book their own gift cards as revenue, and a
 * "LOTTERY PAYOUT" department is negative money that excluding would flatter.
 * So this sorts the list and ticks nothing.
 */
const HASH_HINTS = [
  "lottery",
  "lotto",
  "money order",
  "moneyorder",
  "money gram",
  "moneygram",
  "western union",
  "stamp",
  "postage",
  "bill pay",
  "billpay",
  "money transfer",
  "wire transfer",
  "phone card",
  "gift card",
  "atm",
];

/** Whether a description reads like a pass-through. Suggestion only. */
export const looksLikeHash = (desc: string): boolean => {
  const n = normalizeDesc(desc);
  return HASH_HINTS.some((h) => n.includes(h));
};

/**
 * The spelling to show for a group of stores that disagree about case.
 *
 * Most frequent wins, ties broken alphabetically, so the label does not
 * flicker between renders or between two stores loading in a different order.
 */
export const bestLabel = (spellings: string[]): string => {
  const counts = new Map<string, number>();
  spellings.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0][0];
};

export const deptState = (row: CompanyDeptRow): DeptState => {
  if (row.at.length === 0 || row.excludedCount === 0) return "none";
  return row.excludedCount === row.at.length ? "all" : "some";
};

const exclusionKey = (storeid: number, sub: number) => `${storeid}:${sub}`;

/**
 * Fold per-store departments and per-store exclusions into one row per
 * department.
 *
 * `stores` is the scope — the company, or the one store. A store with nothing
 * in `subs` still appears in every row's `absent`, which is the point: a chain
 * where one store has no Lottery department is a different situation from one
 * where it has it and it is not excluded, and the row has to be able to say
 * which.
 */
export const companyDeptRows = (
  stores: ExclStore[],
  subs: StoreSubDept[],
  exclusions: ExclusionRow[],
): CompanyDeptRow[] => {
  const inScope = new Set(stores.map((s) => s.storeid));
  const byId = new Map(stores.map((s) => [s.storeid, s]));
  const excluded = new Set(
    exclusions.map((e) => exclusionKey(e.storeid, e.sub_department)),
  );

  /** Grouped by normalised description, keeping every row — because a store
   *  can ring two numbers that describe the same thing, and the group has to
   *  hold both rather than let the later one win. */
  const groups = new Map<
    string,
    { spellings: string[]; rows: StoreSubDept[] }
  >();

  subs
    .filter(
      (s) =>
        inScope.has(s.storeid) &&
        typeof s.description === "string" &&
        s.description.trim().length > 0,
    )
    .forEach((s) => {
      const key = normalizeDesc(s.description);
      const g = groups.get(key) ?? { spellings: [], rows: [] };
      g.spellings.push(s.description.trim());
      g.rows.push(s);
      groups.set(key, g);
    });

  return [...groups.entries()]
    .map(([key, g]) => {
      const at: DeptAtStore[] = g.rows
        .map((r) => {
          const store = byId.get(r.storeid)!;
          return {
            storeid: r.storeid,
            store_number: store.store_number,
            store_name: store.store_name,
            sub_department: r.sub_department,
            excluded: excluded.has(exclusionKey(r.storeid, r.sub_department)),
            lastRung: r.lastRung,
          };
        })
        .sort(
          (a, b) =>
            a.store_number.localeCompare(b.store_number, undefined, {
              numeric: true,
            }) || a.sub_department - b.sub_department,
        );

      const has = new Set(at.map((a) => a.storeid));
      return {
        key,
        label: bestLabel(g.spellings),
        at,
        absent: stores.filter((s) => !has.has(s.storeid)),
        excludedCount: at.filter((a) => a.excluded).length,
        lastRung: at.reduce(
          (latest, a) => (a.lastRung > latest ? a.lastRung : latest),
          "",
        ),
        hashHint: looksLikeHash(key),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * The writes that make `row` excluded, or not excluded, at every store holding
 * it.
 *
 * Only the stores that disagree with `want` get a write. The endpoints would
 * tolerate the full fan-out, but the number of writes is what the confirmation
 * shows the user — "3 stores" has to mean three stores changed, not twelve
 * calls of which nine did nothing.
 */
export const planToggle = (
  row: CompanyDeptRow,
  want: boolean,
): ExclusionWrite[] =>
  row.at
    .filter((a) => a.excluded !== want)
    .map((a) =>
      want
        ? {
            op: "add" as const,
            storeid: a.storeid,
            sub_department: a.sub_department,
            sub_department_description: row.label,
          }
        : {
            op: "remove" as const,
            storeid: a.storeid,
            sub_department: a.sub_department,
          },
    );

/** `planToggle` for one store in a row — the single-store tab's tick. */
export const planStoreToggle = (
  row: CompanyDeptRow,
  storeid: number,
  want: boolean,
): ExclusionWrite[] =>
  planToggle({ ...row, at: row.at.filter((a) => a.storeid === storeid) }, want);

/**
 * "Lottery — excluded at 3 of 12 stores".
 *
 * Counts stores, not exclusion rows, because a store ringing two Lottery
 * numbers would otherwise read as two stores.
 */
export const coverageText = (row: CompanyDeptRow): string => {
  const stores = new Set(row.at.map((a) => a.storeid)).size;
  const done = new Set(row.at.filter((a) => a.excluded).map((a) => a.storeid))
    .size;
  const absent = row.absent.length;
  const tail = absent > 0 ? ` · not present at ${absent}` : "";
  if (stores === 0) return "not present at any store in scope";
  if (done === 0) return `counted in net sales at all ${stores}${tail}`;
  if (done === stores)
    return `excluded at ${
      stores === 1 ? "this store" : `all ${stores} stores`
    }${tail}`;
  return `excluded at ${done} of ${stores} stores${tail}`;
};

/** The numbers a department carries when the stores disagree — the reason the
 *  company view cannot write one number. Empty when they agree. */
export const differingNumbers = (row: CompanyDeptRow): string[] => {
  const nums = new Set(row.at.map((a) => a.sub_department));
  if (nums.size < 2) return [];
  return row.at.map((a) => `${a.store_number} → #${a.sub_department}`);
};

export const COLS =
  "grid-cols-[30px_minmax(0,24%)_72px_minmax(0,1fr)_92px_28px]";

/** How far back to look for "which departments does this store have".
 *
 *  There is no dimension table, so the answer is always "what it rang inside
 *  a window". 120 days is the default because it is quick and because a
 *  department that has not rung since spring is not one anybody is trying to
 *  keep out of this week's net sales. The longer options exist for onboarding,
 *  where a seasonal department genuinely has not rung yet. */
export const WINDOWS = [
  { value: "120", label: "Last 120 days" },
  { value: "365", label: "Last year" },
  { value: "730", label: "Last 2 years" },
];

export const ALL_STORES = "__all__";

export const prettyDate = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${Number(m)}/${Number(d)}/${y.slice(2)}`;
};
