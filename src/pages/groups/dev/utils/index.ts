import type { Group } from "@/features/groupSlice";

/** Who a group belongs to, from where the user stands. */
export const kindOf = (g: Group, userid: number): "mine" | "sharedByYou" | "sharedWithYou" =>
  g.userid !== userid ? "sharedWithYou" : g.is_shared ? "sharedByYou" : "mine";

export const BADGE = {
  sharedByYou: { label: "Shared by you", cls: "bg-blue-50 text-blue-700" },
  sharedWithYou: { label: "Shared with you", cls: "bg-emerald-50 text-emerald-700" },
} as const;