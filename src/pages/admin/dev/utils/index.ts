import type { AdminForm } from "../../../../features/dev/devAdminPageSlice";

export const adminTabs: { id: AdminForm; label: string; programmerOnly?: boolean }[] = [
  { id: "companies", label: "Companies", programmerOnly: true },
  { id: "store_activity", label: "Store activity" },
  { id: "store_records", label: "Stores" },
  { id: "sub_exclusions", label: "Sub dept exclusions" },
];

export const adminPanel: Record<AdminForm, { key: string; width: number; height: number }> =
  {
    companies: { key: "admin-panel-size", width: 820, height: 640 },
    store_activity: { key: "admin-panel-size", width: 820, height: 640 },
    store_records: { key: "admin-panel-size-stores", width: 900, height: 620 },
    // Wider: a department row carries a name, a number, a sentence about where
    // it stands across the chain, and a date.
    sub_exclusions: {
      key: "admin-panel-size-subexcl",
      width: 1040,
      height: 660,
    },
  };