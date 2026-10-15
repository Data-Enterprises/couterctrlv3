import axios from "axios";

/**
 * `sub_department_exclusions` — the sub departments a store does not want
 * counted in its net sales.
 *
 * The backend reads this table in `excluded_subs_filter`, keyed on **storeid
 * and the store's own sub-department number**. 14 is Lottery at one store and
 * TOBACCO at another, so every call here is per store. A chain-wide change is
 * a fan-out, not a single write — see `planToggle` in
 * `pages/admin/dev/shared/subDeptExclusions`.
 */

/** A row of the exclusions table. */
export interface SubDeptExclusionRow {
  storeid: number;
  sub_department: number;
  sub_department_description: string | null;
  created_at: string;
}

/** A row of the catalogue — a department a store rang inside the window. */
export interface SubDeptCatalogRow {
  storeid: number;
  sub_department: number;
  sub_department_description: string;
  last_rung: string;
}

/**
 * How many stores to ask for at once.
 *
 * The endpoint is bounded on `sale_date` and runs with a raised `work_mem`,
 * and it is still a grouped scan of `sales_partitioned`: measured at the
 * 120-day default, 25 stores comes back in about 1.6s while 109 does not
 * finish inside the gateway's 110s at all. So a chain is asked for in
 * batches rather than in one call that cannot succeed.
 *
 * Sequentially, not in parallel — the server is holding 64MB of `work_mem`
 * per sort node to make each batch fast, and firing five of them at once
 * spends the thing that made them fast.
 */
export const CATALOG_BATCH = 25;

const catalogCall = async (
  url: string,
  token: string,
  storeids: number[],
  days: number,
) =>
  axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/sub_department_catalog",
    params: { storeids: storeids.join(","), days },
  });

/**
 * Which sub departments each store has, and when each last rang.
 *
 * `sales_partitioned` is partitioned on `sale_date`, so the endpoint's `days`
 * bound is what keeps this quick — the same grouping unbounded scans every
 * partition and takes over a minute for a single store.
 *
 * Carries no sales figures on purpose: net sales is `subs/sub_sales`' number,
 * and a second nearly-equal one here would just disagree with the Sales page.
 *
 * Batched at `CATALOG_BATCH`. `onProgress` is called as each batch lands, so a
 * five-batch chain can say which batch it is on rather than showing eight
 * seconds of the same spinner.
 */
export const getSubDeptCatalog = async (
  url: string,
  token: string,
  storeids: number[],
  days: number = 120,
  onProgress?: (done: number, total: number) => void,
): Promise<SubDeptCatalogRow[]> => {
  const batches: number[][] = [];
  for (let i = 0; i < storeids.length; i += CATALOG_BATCH) {
    batches.push(storeids.slice(i, i + CATALOG_BATCH));
  }

  const rows: SubDeptCatalogRow[] = [];
  for (let i = 0; i < batches.length; i++) {
    const resp = await catalogCall(url, token, batches[i], days);
    const j = resp.data;
    // A batch that fails is not a partial answer to fall back on: the store
    // whose departments are missing looks exactly like a store with none, and
    // the form would offer nothing to exclude there with no sign why.
    if (j.error !== 0) {
      throw new Error(j.msg || "Could not read the sub departments");
    }
    rows.push(...(j.data ?? []));
    onProgress?.(i + 1, batches.length);
  }
  return rows;
};

/**
 * Current exclusions for a set of stores.
 *
 * Takes the whole set in one call: a twelve-store company read one store at a
 * time is twelve round trips before the view can render anything.
 */
export const getSubDeptExclusions = async (
  url: string,
  token: string,
  storeids: number[],
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/sub_department_exclusions",
    params: { storeids: storeids.join(",") },
  });
  return json;
};

/**
 * Stop counting one sub department at one store.
 *
 * Idempotent — the insert is `on conflict (sub_department, storeid) do
 * nothing` — so a fan-out that includes a store already excluded is harmless.
 */
export const addSubDeptExclusion = async (
  url: string,
  token: string,
  storeid: number,
  sub_department: number,
  sub_department_description: string,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/add_sub_department_exclusion",
    data: { storeid, sub_department, sub_department_description },
  });
  return json;
};

/**
 * Count it again.
 *
 * A DELETE carrying a body, which is what the endpoint takes — hence `data`
 * rather than `params`.
 */
export const removeSubDeptExclusion = async (
  url: string,
  token: string,
  storeid: number,
  sub_department: number,
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/remove_sub_department_exclusion",
    data: { storeid, sub_department },
  });
  return json;
};
