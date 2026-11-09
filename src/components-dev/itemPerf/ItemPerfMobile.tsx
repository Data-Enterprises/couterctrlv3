// Hooks
import { useState } from "react";
import { useAppSelector } from "../../hooks";
import { ItemPerfCtx, useItemPerfLoad, useItemPerfView, useScrollCarry } from "./hooks";

// Interfaces
import type { ItemDimension } from "../../features/dev/devItemPerfSlice";

// Components
import ItemPerfSearchCard from "./components/ItemPerfSearchCard";
import ItemWeekScreen from "./components/ItemWeekScreen";
import ItemSearchScreen from "./components/ItemSearchScreen";
import GroupItemsScreen from "./components/GroupItemsScreen";
import StoreGroupsScreen from "./components/StoreGroupsScreen";

interface ItemPerfMobileProps {
  /** What this page groups by. One per page — the same rows could group the
   *  other way, but Sub Dept Margins and Vendors are different pages to a
   *  user and showing both groupings on one screen would blur that. */
  dimension: ItemDimension;
  title: string;
  /** The overview tab's label — "Sub depts" or "Vendors". */
  listLabel: string;
}

/**
 * Margins on mobile, without grading — shared by Sub Dept Margins and Vendors.
 *
 * One paged item read per period, single store, this year against last year.
 * Three views off that one fetch, switched from a bar under the header rather
 * than a control inside a card, because it is navigation and not a filter:
 *
 *   overview  the page's own list, by department or vendor
 *   search    find any item in the store's week, by name, UPC or scan
 *   daily     an item's week day by day, or the picker that gets you there
 *
 * Tapping a department goes to Daily scoped to it — the question after "which
 * department" is always "which item in it".
 *
 * Margin leads throughout: the hero is GPM and each row shows its own
 * percentage. Every bar on the screen — card, day chart and rows — carries
 * sales, so no two bars mean different things; profit dollars are printed
 * beside them. Percent answers how healthy, bars answer how much.
 */
const ItemPerfMobile = ({ dimension, title, listLabel }: ItemPerfMobileProps) => {
  const perf = useAppSelector((s) => s.dev.itemPerf);
  /**
   * Narrows the group list by name.
   *
   * Local rather than in the slice: it describes what is being looked for
   * right now, not what the search returned, and it should not survive
   * leaving the screen. The item lists filter through `itemQuery` instead,
   * because that one reaches into how their rows are built.
   */
  const [groupFilter, setGroupFilter] = useState("");

  const fetchItems = useItemPerfLoad(dimension);
  const view = useItemPerfView(dimension, listLabel, groupFilter);
  /** Arriving restores whatever this page was last left looking at — see the
   *  stash in itemPerfSlice. Until that lands, the state on screen is still
   *  the page we came from, so nothing may be read from it. */
  const mine = perf.active === dimension;

  // The search card until there are rows for this page to show.
  const screen =
    !mine || !perf.hasSearched || (!perf.loading && perf.itemsTy.length === 0)
      ? null
      : view.screen;
  const scrollCarry = useScrollCarry(screen);

  return (
    <ItemPerfCtx.Provider value={{ ...view, groupFilter, setGroupFilter, scrollCarry }}>
      {screen === null ? (
        <ItemPerfSearchCard title={title} onSearch={fetchItems} />
      ) : screen === "item" ? (
        <ItemWeekScreen />
      ) : screen === "search" ? (
        <ItemSearchScreen />
      ) : screen === "items" ? (
        <GroupItemsScreen />
      ) : (
        <StoreGroupsScreen />
      )}
    </ItemPerfCtx.Provider>
  );
};

export default ItemPerfMobile;
