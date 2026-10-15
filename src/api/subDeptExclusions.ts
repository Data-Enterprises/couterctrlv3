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
 * Which sub departments each store has, and when each last rang.
 *
 * One call for the whole list. `sales_partitioned` is partitioned on
 * `sale_date`, so the endpoint's `days` bound is what keeps it quick — the
 * same grouping unbounded scans every partition and takes over a minute for a
 * single store.
 *
 * Carries no sales figures on purpose: net sales is `subs/sub_sales`' number,
 * and a second nearly-equal one here would just disagree with the Sales page.
 */
export const getSubDeptCatalog = async (
  url: string,
  token: string,
  storeids: number[],
  days: number = 120,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/sub_department_catalog",
    params: { storeids: storeids.join(","), days },
  });
  return json;
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
