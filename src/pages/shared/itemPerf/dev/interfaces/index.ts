// Interfaces
import type { useItemPerfView, useScrollCarry } from "../hooks";

/** Which of the four screens is on. */
export type ItemPerfScreen = "list" | "items" | "search" | "item";

/** Everything the screens read: the figures built once per render, the group
 *  filter the list screen types into, and the scroll carried between Search
 *  and the list. */
export type ItemPerfCtxValue = ReturnType<typeof useItemPerfView> & {
  groupFilter: string;
  setGroupFilter: (v: string) => void;
  scrollCarry: ReturnType<typeof useScrollCarry>;
};
