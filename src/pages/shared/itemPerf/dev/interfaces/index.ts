// Interfaces
import type { useItemPerfView } from "../hooks";

/** Which of the four screens is on. */
export type ItemPerfScreen = "list" | "items" | "search" | "item";

/** Everything the screens read: the figures built once per render, plus the
 *  group filter the list screen types into. */
export type ItemPerfCtxValue = ReturnType<typeof useItemPerfView> & {
  groupFilter: string;
  setGroupFilter: (v: string) => void;
};
