/** A sub department as one store rang it, from `subs/sub_sales`. */
export interface StoreSubDept {
  storeid: number;
  sub_department: number;
  /** As the POS spells it. Case and spacing vary between stores. */
  description: string;
  /** The last day it rang, `YYYY-MM-DD`, within the catalogue window.*/
  lastRung: string;
}

/** A row of `sub_department_exclusions`, as the GET returns it. */
export interface ExclusionRow {
  storeid: number;
  sub_department: number;
  sub_department_description: string | null;
}

/** The store identity this module needs. A subset of `Store`. */
export interface ExclStore {
  storeid: number;
  store_number: string;
  store_name: string;
}

/** One write, ready for the endpoint. Both endpoints are idempotent — the
 *  insert is `on conflict do nothing`, the delete matches or does not — so a
 *  plan that has gone slightly stale is safe to send. */
export type ExclusionWrite =
  | {
      op: "add";
      storeid: number;
      sub_department: number;
      sub_department_description: string;
    }
  | { op: "remove"; storeid: number; sub_department: number };

/** How a department stands at one store. */
export interface DeptAtStore {
  storeid: number;
  store_number: string;
  store_name: string;
  /** This store's own number for it. */
  sub_department: number;
  excluded: boolean;
  lastRung: string;
}

/** `"all"`, `"none"`, or `"some"` of the stores that have it. */
export type DeptState = "all" | "some" | "none";

/** One department, across every store that has it. */
export interface CompanyDeptRow {
  key: string;
  label: string;
  at: DeptAtStore[];
  absent: ExclStore[];
  excludedCount: number;
  lastRung: string;
  hashHint: boolean;
}
