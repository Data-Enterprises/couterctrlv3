import { getCatItems } from "../../../../api/cats";
import { getCats } from "../../../../api/sales";
import { fetchAllPages } from "../../../../utils/paging";
import { fetchSubDeptRows } from "../../../../utils/marginRows";
import type {
  CatItem,
  CatSalesDaily,
  CatSalesResponse,
} from "../../../../interfaces";
import type { ItemDimension, ItemRow } from "../../../../features/itemPerfSlice";

/** Every group in one read. As a REQUEST argument 0 means "all"; as a ROW
 *  value 0 is a real department, which is why this is named. */
const ALL = 0;

/** Single store, always. These pages never take a group. */
const USE_GROUPS = 0;
const SINGLE_STORE = 1;

interface Scope {
  url: string;
  token: string;
  storeid: number;
}

const catPage = (scope: Scope, category: number, range: [string, string]) =>
  getCatItems(
    scope.url,
    scope.token,
    category,
    range[0],
    range[1],
    USE_GROUPS,
    scope.storeid,
    SINGLE_STORE,
  );

/**
 * Every item in a store's week, from `categories/cats`.
 *
 * `subs/subs` takes `sub_department: 0` to mean "all departments", which is
 * what lets Sub Dept Margins load a whole store in one read. Whether
 * `categories/cats` reads `category: 0` the same way is undocumented and no
 * other caller in this codebase has ever asked it — every existing call names
 * a single category.
 *
 * So this asks, and then checks the answer rather than trusting it: if 0 is an
 * all-selector the rows carry many different `category` values, and if it is
 * literally category zero they all carry the same one. Trusting it blindly is
 * the dangerous version — a page that quietly reports one category's items as
 * the whole store looks completely normal and is completely wrong.
 *
 * The fallback costs one request per category per period, which is why it is
 * the fallback.
 */
export const fetchCategoryRows = async (
  scope: Scope,
  start: string,
  end: string,
): Promise<CatItem[]> => {
  const range: [string, string] = [start, end];

  const first = await catPage(scope, ALL, range);
  const body = first.data as CatSalesResponse<CatItem>;
  if (body.error !== 0) throw new Error("Failed to load category items");

  const rows = body.subs ?? [];
  const distinct = new Set(rows.map((r) => r.category));

  if (distinct.size > 1) {
    // 0 is an all-selector. One read, paged.
    return fetchAllPages(body, rows, async (page) => {
      const resp = await getCatItems(
        scope.url,
        scope.token,
        ALL,
        start,
        end,
        USE_GROUPS,
        scope.storeid,
        SINGLE_STORE,
        page,
      );
      const j = resp.data as CatSalesResponse<CatItem>;
      return j.error === 0 ? (j.subs ?? []) : [];
    });
  }

  // 0 is not an all-selector. Enumerate the categories from the totals
  // endpoint — which has no category parameter and so always covers the
  // store — then read each one.
  const categories = await listCategories(scope, start, end);
  const perCategory = await Promise.all(
    categories.map(async (category) => {
      try {
        const resp = await catPage(scope, category, range);
        const j = resp.data as CatSalesResponse<CatItem>;
        if (j.error !== 0) return [];
        return fetchAllPages(j, j.subs ?? [], async (page) => {
          const more = await getCatItems(
            scope.url,
            scope.token,
            category,
            start,
            end,
            USE_GROUPS,
            scope.storeid,
            SINGLE_STORE,
            page,
          );
          const mj = more.data as CatSalesResponse<CatItem>;
          return mj.error === 0 ? (mj.subs ?? []) : [];
        });
      } catch {
        // One category failing should not lose the rest of the store.
        return [];
      }
    }),
  );

  return perCategory.flat();
};

/** The store's categories, from the totals endpoint. Used only to drive the
 *  fallback fan-out, so it is never called on the fast path. */
const listCategories = async (
  scope: Scope,
  start: string,
  end: string,
): Promise<number[]> => {
  const call = (page: number) =>
    getCats(
      scope.url,
      scope.token,
      start,
      end,
      USE_GROUPS,
      scope.storeid,
      SINGLE_STORE,
      0,
      0,
      page,
    );

  const first = await call(1);
  const body = first.data as CatSalesResponse<CatSalesDaily>;
  if (body.error !== 0) return [];

  const all = await fetchAllPages(body, body.subs ?? [], async (page) => {
    const resp = await call(page);
    const j = resp.data as CatSalesResponse<CatSalesDaily>;
    return j.error === 0 ? (j.subs ?? []) : [];
  });

  return [...new Set(all.map((r) => r.category))];
};

/**
 * The week's item rows for whichever page is asking.
 *
 * Sub Dept Margins and Vendors read the same `subs/subs` rows and differ only
 * in how they group them. Categories comes off a different endpoint returning
 * the same columns with the grouping one swapped, so it lands on the same
 * screen through the same shape.
 */
export const fetchItemRows = async (
  dimension: ItemDimension,
  scope: Scope,
  start: string,
  end: string,
): Promise<ItemRow[]> =>
  dimension === "category"
    ? fetchCategoryRows(scope, start, end)
    : fetchSubDeptRows(
        scope.url,
        scope.token,
        ALL,
        start,
        end,
        USE_GROUPS,
        scope.storeid,
        SINGLE_STORE,
      );
