import { useState, useMemo } from "react";
import { MagnifyingGlassIcon, ChevronRightIcon, QuestionMarkCircleIcon } from "@heroicons/react/20/solid";
import type { GroupedOrderCard, SelectedOrderKey } from "../../../features/ordersSlice";
import type { Group } from "../../../features/groupSlice";
import type { Store } from "../../../interfaces";
import type { SEARCH_TYPE } from "../../../features/searchSlice";
import FilterBar from "../../../components/filters/FilterBar";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import TextFilter from "../../../components/filters/TextFilter";
import SelectFilter, { type SelectFilterOption } from "../../../components/filters/SelectFilter";

interface Props {
  cards: GroupedOrderCard[];
  selectedKey: SelectedOrderKey;
  loading: boolean;
  startDate: string;
  endDate: string;
  onSelectStore: (order_date: string, order_type: string, storeid: number) => void;
  onSelectAllStores: (order_date: string, order_type: string, storeids: number[]) => void;
  onOpenSearch: () => void;
  onReset: () => void;
  type?: SEARCH_TYPE;
  selectedGroup?: Group | null;
  selectedStore?: Store | null;
  groupStores?: Store[];
}

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};

const AvailableOrdersPanel = ({
  cards,
  selectedKey,
  loading,
  startDate,
  endDate,
  onSelectStore,
  onSelectAllStores,
  onOpenSearch,
  onReset,
  type,
  selectedGroup,
  selectedStore,
  groupStores = [],
}: Props) => {
  const fmtRangePart = (mdy: string, withYear = false) => {
    const [m, d, y] = mdy.split("/");
    return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
  };
  const dateLabel = `${fmtRangePart(startDate)} – ${fmtRangePart(endDate, true)}`;
  const [legendHover, setLegendHover] = useState(false);
  const [activeType, setActiveType] = useState("all");
  const [storeFilter, setStoreFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [openTypes, setOpenTypes] = useState<Set<string>>(new Set());

  const resetIfSelected = () => { if (selectedKey) onReset(); };

  const toggleType = (type: string) =>
    setOpenTypes((prev) => { const s = new Set(prev); s.has(type) ? s.delete(type) : s.add(type); return s; });

const isSelected = (order_date: string, order_type: string, storeid: number) => {
    if (!selectedKey || selectedKey.order_type !== order_type || !selectedKey.storeids.includes(storeid)) return false;
    const d = order_date.split("T")[0];
    return d >= selectedKey.order_date.split("T")[0] && d <= selectedKey.order_date_end.split("T")[0];
  };

  const typeFiltered = activeType === "all" ? cards : cards.filter((c) => c.order_type === activeType);

  const dateOptions = useMemo<SelectFilterOption[]>(() => {
    const dates = new Set<string>();
    typeFiltered.forEach((c) => c.dates.forEach((d) => dates.add(d.order_date)));
    return Array.from(dates)
      .sort((a, b) => b.localeCompare(a))
      .map((d) => ({ value: d, label: fmtDate(d) }));
  }, [typeFiltered]);

  // Apply store + date filters — dates flattened into each store row
  const visibleCards = useMemo(() => {
    return typeFiltered
      .map((card) => ({
        ...card,
        dates: card.dates
          .filter((dg) => !dateFilter || dg.order_date === dateFilter)
          .map((dg) => ({
            ...dg,
            stores: dg.stores.filter((s) =>
              !storeFilter || s.store_name.toLowerCase().includes(storeFilter.toLowerCase())
            ),
          }))
          .filter((dg) => dg.stores.length > 0),
      }))
      .filter((card) => card.dates.length > 0);
  }, [typeFiltered, storeFilter, dateFilter]);

  // "Select all stores" shows once a specific type is active, regardless of the
  // date filter. With a date chosen it's scoped to that day (visibleCards is
  // already narrowed to it); with no date chosen it spans every date currently
  // visible, combined — Orders.tsx widens the fetch to the full search range.
  const allVisibleStoreIds = useMemo(() => {
    if (activeType === "all") return [];
    const ids = new Set<number>();
    visibleCards[0]?.dates.forEach((d) => d.stores.forEach((s) => ids.add(s.storeid)));
    return Array.from(ids);
  }, [visibleCards, activeType]);

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white"
      style={{ flexBasis: "25%", minWidth: 0 }}
    >
      {/* Header */}
      <div className="bg-[#1e2a4a] px-3 pt-1 pb-2.5 flex-shrink-0 flex flex-col gap-0">
        {/* Row 1: title + date | totals */}
        <div className="flex items-end gap-3 min-h-[26px]">
          <span className="text-custom-white font-medium text-[13px] flex-shrink-0">Available Orders</span>
          <span className="text-custom-white text-[10px] flex-shrink-0">{dateLabel}</span>
          <div className="flex-1" />
        </div>
        {/* Row 2: search + group name + legend */}
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-white/[0.08]">
          <button
            onClick={onOpenSearch}
            aria-label="New search"
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-custom-white/60 hover:text-custom-white hover:border-white/40 transition-colors flex-shrink-0"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
          {type === "Group" && selectedGroup?.group_name && (
            <div className="flex flex-col leading-tight truncate">
              <span className="text-[11px] font-medium text-custom-white truncate">{selectedGroup.group_name}</span>
              {groupStores.length > 0 && (
                <span className="text-[9px] text-custom-white">{groupStores.length} stores</span>
              )}
            </div>
          )}
          {type === "Store" && selectedStore?.store_name && (
            <span className="text-[11px] font-medium text-custom-white truncate">{selectedStore.store_name}</span>
          )}
          <div className="flex-1" />
          <div className="relative flex-shrink-0" onMouseEnter={() => setLegendHover(true)} onMouseLeave={() => setLegendHover(false)}>
            <button className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-custom-white/50 hover:text-custom-white hover:border-white/40 transition-colors">
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
            </button>
            {legendHover && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-[#1e2a4a] border border-white/15 rounded-lg shadow-lg px-3 py-2.5 flex flex-col gap-2" style={{ minWidth: 220 }}>
                {[
                  { color: "#60a5fa", label: "Types", desc: "Distinct order types (e.g. DAM, DMG, INV, PER)" },
                  { color: "#a78bfa", label: "Orders", desc: "Total store-level order entries, not individual line items" },
                ].map(({ color, label, desc }) => (
                  <div key={label} className="flex items-start gap-2">
                    <div className="w-[7px] h-[7px] rounded-full flex-shrink-0 mt-[3px]" style={{ background: color }} />
                    <span className="text-[11px] text-custom-white leading-snug">
                      <span className="text-custom-white font-medium">{label}</span> — {desc}
                    </span>
                  </div>
                ))}
                {groupStores.length > 0 && (
                  <>
                    <div className="h-px bg-custom-white" />
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-custom-white">
                      {selectedGroup?.group_name ?? "Group"} stores
                    </div>
                    <div className="flex flex-col gap-1">
                      {groupStores.map((s) => (
                        <div key={s.storeid} className="flex items-center gap-1.5">
                          <span className="text-custom-white text-[10px]">·</span>
                          <span className="text-[10px] text-custom-white">{s.store_name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Type tabs */}
      {cards.length > 0 && (
        <div className="flex border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => { resetIfSelected(); setActiveType("all"); setOpenTypes(new Set()); }}
            className={`text-[10px] font-semibold py-2 whitespace-nowrap border-b-2 transition-colors flex-1 text-center ${
              activeType === "all"
                ? "border-[#1e2a4a] text-[#1e2a4a]"
                : "border-transparent text-content"
            }`}
          >
            All
          </button>
          {cards.map((card) => (
            <button
              key={card.order_type}
              onClick={() => { resetIfSelected(); setActiveType(card.order_type); setOpenTypes(new Set()); }}
              className={`text-[10px] font-semibold py-2 whitespace-nowrap border-b-2 transition-colors flex-1 text-center ${
                activeType === card.order_type
                  ? "border-[#1e2a4a] text-[#1e2a4a]"
                  : "border-transparent text-content"
              }`}
            >
              {card.order_type}
            </button>
          ))}
        </div>
      )}

      {/* Filter bar */}
      {cards.length > 0 && (
        <FilterBar>
          <TextFilter
            value={storeFilter}
            onChange={(v) => { resetIfSelected(); setStoreFilter(v); }}
            placeholder="Filter by store name or number…"
          />
          <SelectFilter
            options={dateOptions}
            value={dateFilter}
            onChange={(v) => { resetIfSelected(); setDateFilter(v); }}
            placeholder="All dates"
            className="w-[30%]"
          />
        </FilterBar>
      )}

      {allVisibleStoreIds.length > 1 && (
        <div className="px-3 pb-2 flex-shrink-0">
          <button
            onClick={() => onSelectAllStores(dateFilter, activeType, allVisibleStoreIds)}
            className="w-full text-[11px] font-medium py-1.5 rounded-md border border-[#1e2a4a]/20 text-[#1e2a4a] hover:bg-[#1e2a4a]/5 transition-colors"
          >
            Select all {allVisibleStoreIds.length} stores
          </button>
        </div>
      )}

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar p-3 flex flex-col gap-3">
        {loading && <div className="flex-1 relative"><LoadingIndicator message="Loading orders" /></div>}

        {!loading && cards.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content">
            No orders found for this date range.
          </div>
        )}

        {visibleCards.map((card) => {
          const typeOpen = activeType !== "all" || openTypes.has(card.order_type) || !!storeFilter;
          return (
            <div key={card.order_type} className="rounded-lg border border-gray-100">
              {/* Order type header — collapsible in "All" tab */}
              {activeType === "all" && (
                <button
                  onClick={() => toggleType(card.order_type)}
                  className="w-full flex items-center gap-2 bg-[#1e2a4a]/5 hover:bg-[#1e2a4a]/10 pl-3 pr-3 py-2 transition-colors"
                >
                  <ChevronRightIcon
                    className="w-3 h-3 text-[#1e2a4a]/60 flex-shrink-0 transition-transform"
                    style={{ transform: typeOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                  />
                  <span className="text-[12px] font-semibold text-[#1e2a4a] uppercase tracking-wide flex-1 text-left">
                    {card.order_type}
                  </span>
                  <span className="text-[11px] text-[#1e2a4a]">{card.dates.reduce((n, d) => n + d.stores.length, 0)}</span>
                </button>
              )}

              {/* Stores — flat list with date shown inline */}
              {typeOpen && (
                <div className="divide-y divide-gray-100">
                  {card.dates.flatMap((dateGroup) =>
                    dateGroup.stores.map((store) => {
                      const sel = isSelected(dateGroup.order_date, card.order_type, store.storeid);
                      return (
                        <button
                          key={`${dateGroup.order_date}-${store.storeid}`}
                          onClick={() => onSelectStore(dateGroup.order_date, card.order_type, store.storeid)}
                          style={sel ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
                          className={`w-full flex items-center justify-between pl-6 pr-3 py-2 text-left transition-colors ${
                            sel ? "bg-custom-white" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-medium text-content truncate">{store.store_name}</span>
                            <span className="text-[11px] text-content mt-px">{fmtDate(dateGroup.order_date)}</span>
                          </div>
                          <span className="text-[10px] text-content bg-custom-white rounded-full px-2 py-0.5 flex-shrink-0 ml-2">
                            {store.frequency} {store.frequency === 1 ? "order" : "orders"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvailableOrdersPanel;
