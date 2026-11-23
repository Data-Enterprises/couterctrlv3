// Hooks
import { useMemo, useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useForecastCtx } from "../hooks";

// Redux
import {
  toggleCheckedUpc,
  setCheckedUpcs,
  setListFilter,
} from "../../../../features/forecastDevSlice";

// Components
import ListHeader from "./components/ListHeader";
import ListFilterStrip from "./components/ListFilterStrip";
import ItemRow from "./components/ItemRow";

interface ForecastListPanelProps {
  onReSearch: () => void;
}

/**
 * The item panel, shaped like `UpcLeftPanel`. Ticking items narrows what the
 * grid and the KPI strip cover, without re-running the search.
 */
const ForecastListPanel = ({ onReSearch }: ForecastListPanelProps) => {
  const dispatch = useAppDispatch();
  const { search, rowData, checkedUpcs, listFilter, adListRows } =
    useForecastCtx();
  const [showSelectedOnly, setShowSelectedOnly] = useState<boolean>(false);

  const locationLabel =
    search.type === "Store"
      ? search.selectedStore.store_name ||
        `Store ${search.selectedStore.storeid}`
      : search.selectedGroup.group_name || "Group";

  const visible = useMemo(() => {
    let rows = rowData;
    if (showSelectedOnly)
      rows = rows.filter((r) => checkedUpcs.includes(r.upc));
    if (listFilter) {
      const q = listFilter.toLowerCase();
      rows = rows.filter(
        (r) => r.upc.includes(q) || r.description.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [rowData, checkedUpcs, listFilter, showSelectedOnly]);

  return (
    <div className="w-[300px] flex-shrink-0 shadow-lg flex flex-col overflow-hidden rounded-xl">
      <ListHeader
        singleDate={search.singleDate}
        checkedCount={checkedUpcs.length}
        totalCount={rowData.length}
        locationLabel={locationLabel}
        onReSearch={onReSearch}
      />

      <div className="flex-1 bg-custom-white flex flex-col min-h-0 overflow-hidden">
        <ListFilterStrip
          filter={listFilter}
          onFilter={(v) => dispatch(setListFilter(v))}
          onAll={() => dispatch(setCheckedUpcs(visible.map((r) => r.upc)))}
          onNone={() => dispatch(setCheckedUpcs([]))}
          showSelectedOnly={showSelectedOnly}
          onToggleOnly={() => setShowSelectedOnly((p) => !p)}
        />

        {/* list */}
        <div data-help="item-list" className="cc-scroll">
          {visible.length === 0 ? (
            <div className="flex items-center justify-center h-16 text-[10px] text-content/95">
              {listFilter ? "No matches" : "No items"}
            </div>
          ) : (
            visible.map((row) => (
              <ItemRow
                key={row.upc}
                row={row}
                checked={checkedUpcs.includes(row.upc)}
                isAd={!!adListRows[row.upc]}
                onToggle={() => dispatch(toggleCheckedUpc(row.upc))}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastListPanel;
