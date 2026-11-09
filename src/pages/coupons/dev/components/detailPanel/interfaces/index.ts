// Interfaces
import type { ThresholdValue } from "../../../../../../interfaces";

/** One group in the detail panel's list: a sub dept, a date or a cashier. */
export type GroupedSection = {
  key: string;
  label: string;
  count: number;
  total: number;
  rows: any[];
};

/** One sale a coupon was used in, within the grid. */
export type AggUse = {
  sale_id: string;
  sale_date: string;
  cashier_name: string;
  storeid: number;
  store_number: string;
  terminal: string;
  count: number;
  amount: number;
  row: any;
};

/** A coupon's uses in the grid, grouped by UPC or product. */
export type AggRow = {
  product_code: string;
  product_description: string;
  sub_department_description: string;
  count: number;
  total: number;
  uses: AggUse[];
};

/** The grid's column filters: what is typed (draft) and what is applied. */
export interface GridFilters {
  draftUpc: string;
  setDraftUpc: (v: string) => void;
  appliedUpc: string;
  setAppliedUpc: (v: string) => void;
  draftProduct: string;
  setDraftProduct: (v: string) => void;
  appliedProduct: string;
  setAppliedProduct: (v: string) => void;
  draftSubDept: string;
  setDraftSubDept: (v: string) => void;
  appliedSubDept: string;
  setAppliedSubDept: (v: string) => void;
  draftAmount: ThresholdValue | null;
  setDraftAmount: (v: ThresholdValue | null) => void;
  appliedAmount: ThresholdValue | null;
  setAppliedAmount: (v: ThresholdValue | null) => void;
  uniqueSubDeptOptions: { label: string; value: string }[];
}
