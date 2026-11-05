// Interfaces
import type { Group } from "@/features/groupSlice";
import type { StoreWithGroupStatus } from "@/interfaces";

/** Who a group belongs to, from where the user stands. */
export const kindOf = (g: Group, userid: number): "mine" | "sharedByYou" | "sharedWithYou" =>
  g.userid !== userid ? "sharedWithYou" : g.is_shared ? "sharedByYou" : "mine";

export const BADGE = {
  sharedByYou: { label: "Shared by you", cls: "bg-blue-50 text-blue-700" },
  sharedWithYou: { label: "Shared with you", cls: "bg-emerald-50 text-emerald-700" },
} as const;

export const byFilter = (
  stores: StoreWithGroupStatus[],
  filter: string,
  active: 0 | 1,
) =>
  stores
    .filter((s) => s.active === active)
    .filter((s) => s.store_name.toLowerCase().includes(filter.toLowerCase()))