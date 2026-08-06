import { useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import InfoButton from "../../../components/InfoButton";
import InfoPopover from "../../../components/InfoPopover";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  toggleCheckedUpc,
  setCheckedUpcs,
  setListFilter,
} from "../../../features/forecastDevSlice";
import { formatCurrency2 } from "../../../utils";
import { FORECAST_INFO } from "./forecastInfo";

/**
 * The item panel.
 *
 * Same shape as `UpcLeftPanel` / `LookupQueuePanel`: a 2-row navy header
 * carrying the search context, then a filter strip, then the list. Ticking
 * items narrows what the grid and the KPI strip on the right cover, which is
 * how you price an ad down to a subset without re-running the search.
 */

interface Props {
  onReSearch: () => void;
}

const ForecastListPanel = ({ onReSearch }: Props) => {
  const dispatch = useAppDispatch();
  const search = useAppSelector((s) => s.search);
  const { rowData, checkedUpcs, listFilter, adListRows } = useAppSelector(
    (s) => s.forecastDev,
  );
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const locationLabel =
    search.type === "Store"
      ? search.selectedStore.store_name ||
        `Store ${search.selectedStore.storeid}`
      : search.selectedGroup.group_name || "Group";

  const visible = useMemo(() => {
    let rows = rowData;
    if (showSelectedOnly) rows = rows.filter((r) => checkedUpcs.includes(r.upc));
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
      {/* 2-row navy header — same metrics as LookupQueuePanel's */}
      <div className="bg-[#1e2a4a] rounded-t-xl px-3 pt-1 pb-2.5 flex flex-col gap-0 flex-shrink-0 relative">
        <div className="flex items-end gap-3 min-h-[24px]">
          <span className="text-[13px] font-semibold text-custom-white flex-shrink-0">
            Forecast
          </span>
          {search.singleDate && (
            <span className="text-custom-white text-[10px] flex-shrink-0">
              {search.singleDate}
            </span>
          )}
          <div className="flex-1" />
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <span className="text-custom-white text-[10px] uppercase tracking-wide">
              Selected
            </span>
            <span className="text-[13px] font-medium text-custom-white tabular-nums">
              {checkedUpcs.length} / {rowData.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
          <button
            onClick={onReSearch}
            aria-label="New search"
            title="Search again"
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-medium text-custom-white truncate">
            {locationLabel}
          </span>
          <div className="flex-1" />
          <div className="relative flex-shrink-0">
            <InfoButton onClick={() => setInfoOpen((p) => !p)} />
            {infoOpen && (
              <InfoPopover
                title={FORECAST_INFO.title}
                purpose={FORECAST_INFO.purpose}
                glossary={FORECAST_INFO.glossary}
                onClose={() => setInfoOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-custom-white flex flex-col min-h-0 overflow-hidden">
        {/* filter strip */}
        <div className="flex-shrink-0 px-2 py-1.5 border-b border-gray-100 flex items-center gap-1.5">
          <input
            value={listFilter}
            onChange={(e) => dispatch(setListFilter(e.target.value))}
            placeholder="Filter…"
            className="flex-1 text-[10px] rounded px-2 py-1 border border-gray-200 bg-gray-50 min-w-0"
            style={{
              outline: "none",
              WebkitAppearance: "none",
              boxShadow: "none",
            }}
          />
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => dispatch(setCheckedUpcs(visible.map((r) => r.upc)))}
              className="text-[10px] text-[#1e2a4a] font-medium hover:underline"
            >
              All
            </button>
            <button
              onClick={() => dispatch(setCheckedUpcs([]))}
              className="text-[10px] text-[#1e2a4a] hover:text-content/85"
            >
              None
            </button>
            {/* Third control in the same strip rather than its own row —
                another bordered row would double the chrome above the list. */}
            <button
              onClick={() => setShowSelectedOnly((p) => !p)}
              className={`text-[10px] font-medium transition-colors ${
                showSelectedOnly ? "text-[#1e2a4a] underline" : "text-content/85"
              }`}
            >
              Only
            </button>
          </div>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto thin-scrollbar min-h-0">
          {visible.length === 0 ? (
            <div className="flex items-center justify-center h-16 text-[10px] text-content/85">
              {listFilter ? "No matches" : "No items"}
            </div>
          ) : (
            visible.map((row) => {
              const checked = checkedUpcs.includes(row.upc);
              return (
                <button
                  key={row.upc}
                  onClick={() => dispatch(toggleCheckedUpc(row.upc))}
                  className={`w-full text-left flex items-start gap-2 px-3 py-2.5 border-b border-gray-100 transition-colors ${
                    checked ? "bg-custom-white" : "hover:bg-gray-50"
                  }`}
                  style={
                    checked
                      ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" }
                      : undefined
                  }
                >
                  <div
                    className={`flex-shrink-0 mt-[1px] w-3.5 h-3.5 rounded border transition-colors ${
                      checked
                        ? "bg-[#1e2a4a] border-[#1e2a4a]"
                        : "border-gray-300 bg-custom-white"
                    }`}
                  >
                    {checked && (
                      <svg
                        viewBox="0 0 10 10"
                        className="w-full h-full text-custom-white"
                      >
                        <polyline
                          points="2,5 4,7.5 8,2.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`flex items-center gap-1 text-[12px] text-content ${
                        checked ? "font-semibold" : "font-medium"
                      }`}
                    >
                      <span className="truncate">{row.description}</span>
                      {adListRows[row.upc] && (
                        <span className="flex-shrink-0 text-[9px] bg-blue-500 text-custom-white rounded px-0.5 font-medium">
                          AD
                        </span>
                      )}
                      {row.singlePrice && (
                        <span className="flex-shrink-0 text-[9px] bg-yellow-200 text-yellow-700 rounded px-0.5 font-medium">
                          1pt
                        </span>
                      )}
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[11px] font-medium text-content tabular-nums">
                        {row.upc}
                      </span>
                      <span className="text-[11px] font-semibold text-content tabular-nums">
                        {formatCurrency2(row.fcstPrice)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastListPanel;
