// Interfaces

/** One group in the detail panel's list: a sub dept, a date or a cashier. */
export type GroupedSection = {
  key: string;
  label: string;
  count: number;
  total: number;
  rows: any[];
};
