import { useState, useMemo } from "react";
import { MagnifyingGlassIcon, ChevronRightIcon, QuestionMarkCircleIcon } from "@heroicons/react/20/solid";
import type { GroupedOrderCard, SelectedOrderKey } from "../../../features/ordersSlice";
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
  onOpenSearch: () => void;
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
  onOpenSearch,
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
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());

  const toggleType = (type: string) =>
    setOpenTypes((prev) => { const s = new Set(prev); s.has(type) ? s.delete(type) : s.add(type); return s; });

  const toggleDate = (key: string) =>
    setOpenDates((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  const isSelected = (order_date: string, order_type: string, storeid: number) =>
    selectedKey?.order_date === order_date &&
    selectedKey?.order_type === order_type &&
    selectedKey?.storeid === storeid;

  const typeFiltered = activeType === "all" ? cards : cards.filter((c) => c.order_type === activeType);

  // Build date options from all dates in the type-filtered cards
  const dateOptions = useMemo<SelectFilterOption[]>(() => {
    const dates = new Set<string>();
    typeFiltered.forEach((c) => c.dates.forEach((d) => dates.add(d.order_date)));
    return Array.from(dates)
      .sort((a, b) => b.localeCompare(a))
      .map((d) => ({ value: d, label: fmtDate(d) }));
  }, [typeFiltered]);

  // Apply store + date filters
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

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white"
      style={{ flexBasis: "27%", minWidth: 0 }}
    >
      {/* Header */}
      <div className="bg-[#1e2a4a] px-3 pt-1 pb-2.5 flex-shrink-0 flex flex-col gap-0">
        {/* Row 1: title + date | totals */}
        <div className="flex items-end gap-3 min-h-[26px]">
          <span className="text-white font-medium text-[13px] flex-shrink-0">Available Orders</span>
          <span className="text-white/45 text-[10px] flex-shrink-0">{dateLabel}</span>
          <div className="flex-1" />
          {cards.length > 0 && (
            <>
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-white/45">Types</span>
                <span className="text-[13px] font-medium text-white">{cards.length}</span>
              </div>
              <div className="w-px h-4 bg-white/15 flex-shrink-0" />
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-white/45">Orders</span>
                <span className="text-[13px] font-medium text-white">
                  {cards.reduce((acc, c) => acc + c.dates.reduce((a, d) => a + d.stores.length, 0), 0)}
                </span>
              </div>
            </>
          )}
        </div>
        {/* Row 2: search + legend */}
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-white/[0.08]">
          <button
            onClick={onOpenSearch}
            aria-label="New search"
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" onMouseEnter={() => setLegendHover(true)} onMouseLeave={() => setLegendHover(false)}>
            <button className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-colors">
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
                    <span className="text-[11px] text-white/70 leading-snug">
                      <span className="text-white font-medium">{label}</span> — {desc}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Type tabs */}
      {cards.length > 0 && (
        <div className="flex border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => { setActiveType("all"); setDateFilter(""); setOpenTypes(new Set()); setOpenDates(new Set()); }}
            className={`text-[10px] font-semibold py-2 whitespace-nowrap border-b-2 transition-colors flex-1 text-center ${
              activeType === "all"
                ? "border-[#1e2a4a] text-[#1e2a4a]"
                : "border-transparent text-content/60 hover:text-content"
            }`}
          >
            All
          </button>
          {cards.map((card) => (
            <button
              key={card.order_type}
              onClick={() => { setActiveType(card.order_type); setDateFilter(""); setOpenTypes(new Set()); setOpenDates(new Set()); }}
              className={`text-[10px] font-semibold py-2 whitespace-nowrap border-b-2 transition-colors flex-1 text-center ${
                activeType === card.order_type
                  ? "border-[#1e2a4a] text-[#1e2a4a]"
                  : "border-transparent text-content/60 hover:text-content"
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
            onChange={setStoreFilter}
            placeholder="Filter by store name or number…"
          />
          <SelectFilter
            options={dateOptions}
            value={dateFilter}
            onChange={setDateFilter}
            placeholder="All dates"
            className="w-[30%]"
          />
        </FilterBar>
      )}

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar p-3 flex flex-col gap-3">
        {loading && <div className="flex-1 relative"><LoadingIndicator message="Loading orders" /></div>}

        {!loading && cards.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/60">
            No orders found for this date range.
          </div>
        )}

        {visibleCards.map((card) => {
          const typeOpen = activeType !== "all" || openTypes.has(card.order_type) || !!dateFilter || !!storeFilter;
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
                  <span className="text-[11px] font-semibold text-[#1e2a4a] uppercase tracking-wide flex-1 text-left">
                    {card.order_type}
                  </span>
                  <span className="text-[10px] text-[#1e2a4a]/55">{card.dates.reduce((n, d) => n + d.stores.length, 0)}</span>
                </button>
              )}

              {/* Dates — collapsible, closed by default */}
              {typeOpen && card.dates.map((dateGroup) => {
                const dateKey = `${card.order_type}::${dateGroup.order_date}`;
                const dateOpen = openDates.has(dateKey) || !!dateFilter || !!storeFilter;
                return (
                  <div key={dateGroup.order_date} className="border-t border-gray-100 first:border-t-0">
                    <button
                      onClick={() => toggleDate(dateKey)}
                      className="w-full flex items-center gap-2 pl-6 pr-3 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRightIcon
                        className="w-3 h-3 text-content/40 flex-shrink-0 transition-transform"
                        style={{ transform: dateOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                      />
                      <span className="text-[10px] font-medium text-content/65 flex-1 text-left">
                        {fmtDate(dateGroup.order_date)}
                      </span>
                      <span className="text-[10px] text-content/55">{dateGroup.stores.length}</span>
                    </button>

                    {dateOpen && (
                      <div className="divide-y divide-gray-100">
                        {dateGroup.stores.map((store) => {
                          const sel = isSelected(dateGroup.order_date, card.order_type, store.storeid);
                          return (
                            <button
                              key={store.storeid}
                              onClick={() => onSelectStore(dateGroup.order_date, card.order_type, store.storeid)}
                              style={sel ? { boxShadow: "inset 0 0 8px rgba(30,42,74,0.18)" } : undefined}
                              className={`w-full flex items-center justify-between pl-9 pr-3 py-2 text-left transition-colors ${
                                sel ? "bg-white" : "hover:bg-gray-50"
                              }`}
                            >
                              <span className="text-[10px] font-medium text-content">{store.store_name}</span>
                              <span className="text-[10px] text-content/75 bg-gray-100 rounded-full px-2 py-0.5 flex-shrink-0">
                                {store.frequency} {store.frequency === 1 ? "order" : "orders"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvailableOrdersPanel;
