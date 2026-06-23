import { useState, useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import type { GroupedOrderCard, SelectedOrderKey } from "../../../features/ordersSlice";
import FilterBar from "../../../components/filters/FilterBar";
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
  const [activeType, setActiveType] = useState("all");
  const [storeFilter, setStoreFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

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
      style={{ flexBasis: "36%", minWidth: 0 }}
    >
      {/* Header */}
      <div className="bg-[#1e2a4a] px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium text-[13px]">Available orders</div>
            <div className="text-white/60 text-[10px] mt-0.5">
              {startDate} – {endDate}
            </div>
          </div>
          <button
            onClick={onOpenSearch}
            aria-label="New search"
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Type tabs */}
      {cards.length > 0 && (
        <div className="flex border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => { setActiveType("all"); setDateFilter(""); }}
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
              onClick={() => { setActiveType(card.order_type); setDateFilter(""); }}
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
        {loading && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/60">
            Loading orders…
          </div>
        )}

        {!loading && cards.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/60">
            No orders found for this date range.
          </div>
        )}

        {visibleCards.map((card) => (
          <div key={card.order_type} className="rounded-lg border border-gray-100">
            {/* Order type header — only shown in "All" tab */}
            {activeType === "all" && (
              <div className="bg-[#1e2a4a]/5 px-3 py-2 border-b border-gray-100">
                <span className="text-[11px] font-semibold text-[#1e2a4a] uppercase tracking-wide">
                  {card.order_type}
                </span>
              </div>
            )}

            {/* Dates */}
            {card.dates.map((dateGroup) => (
              <div key={dateGroup.order_date}>
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10px] font-medium text-content/65">
                    {fmtDate(dateGroup.order_date)}
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {dateGroup.stores.map((store) => {
                    const sel = isSelected(dateGroup.order_date, card.order_type, store.storeid);
                    return (
                      <button
                        key={store.storeid}
                        onClick={() => onSelectStore(dateGroup.order_date, card.order_type, store.storeid)}
                        style={sel ? { boxShadow: "inset 0 0 8px rgba(30,42,74,0.18)" } : undefined}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                          sel ? "bg-white" : "hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-[12px] font-medium text-content">{store.store_name}</span>
                        {store.frequency > 1 && (
                          <span className="text-[10px] text-content/65 bg-gray-100 rounded-full px-2 py-0.5 flex-shrink-0">
                            {store.frequency} orders
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableOrdersPanel;
