// Interfaces
import type { Group } from "../../../../features/groupSlice";
import type { StoreWithGroupStatus } from "../../../../interfaces";
import type { GroupsTab } from "../interfaces";

/** Who a group belongs to, from where the user stands. */
export const kindOf = (g: Group, userid: number): "mine" | "sharedByYou" | "sharedWithYou" =>
  g.userid !== userid ? "sharedWithYou" : g.is_shared ? "sharedByYou" : "mine";

export const BADGE = {
  sharedByYou: { label: "Shared by you", cls: "bg-blue-50 text-blue-700" },
  sharedWithYou: { label: "Shared with you", cls: "bg-severity_healthy_bg text-severity_healthy_text" },
} as const;

export const byFilter = (
  stores: StoreWithGroupStatus[],
  filter: string,
  active: 0 | 1,
) =>
  stores
    .filter((s) => s.active === active)
    .filter((s) => s.store_name.toLowerCase().includes(filter.toLowerCase()))

/** The page's two tabs, User Groups and Shared Groups, for FormNavTabs. */
export const groupsTabs: { id: GroupsTab; label: string }[] = [
  {
    id: "user",
    label: "User Groups",
  },
  {
    id: "shared",
    label: "Shared Groups",
  },
];
