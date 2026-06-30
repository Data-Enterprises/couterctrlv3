import { useState, useMemo } from "react";
import { MagnifyingGlassIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import type { GroupedOrderCard, SelectedOrderKey } from "../../../features/ordersSlice";
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

const OrdersAvailableScreen = ({
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

  const dateOptions = useMemo<SelectFilterOption[]>(() => {
    const dates = new Set<string>();
    typeFiltered.forEach((c) => c.dates.forEach((d) => dates.add(d.order_date)));
    return Array.from(dates)
      .sort((a, b) => b.localeCompare(a))
      .map((d) => ({ value: d, label: fmtDate(d) }));
  }, [typeFiltered]);

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

  const fmtRangePart = (mdy: string, withYear = false) => {
    const [m, d, y] = mdy.split("/");
    return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
  };
  const weekLabel = `${fmtRangePart(startDate)} – ${fmtRangePart(endDate, true)}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header — matches Sales/LP mobile */}
      <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white font-semibold text-[15px]">Available Orders</div>
            <div className="text-white/65 text-[11px] mt-0.5">{weekLabel}</div>
          </div>
          <button
            onClick={onOpenSearch}
            aria-label="New search"
            className="flex-shrink-0 w-[28px] h-[28px] flex items-center justify-center rounded-md border border-white/25 text-white/65 hover:text-white hover:border-white/45 transition-colors"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Type tabs */}
      {cards.length > 0 && (
        <div className="flex border-b border-gray-100 flex-shrink-0 bg-white">
          <button
            onClick={() => { setActiveType("all"); setDateFilter(""); setOpenTypes(new Set()); setOpenDates(new Set()); }}
            className={`text-[10px] font-semibold py-2 whitespace-nowrap border-b-2 transition-colors flex-1 text-center ${
              activeType === "all" ? "border-[#1e2a4a] text-[#1e2a4a]" : "border-transparent text-content/70"
            }`}
          >
            All
          </button>
          {cards.map((card) => (
            <button
              key={card.order_type}
              onClick={() => { setActiveType(card.order_type); setDateFilter(""); setOpenTypes(new Set()); setOpenDates(new Set()); }}
              className={`text-[10px] font-semibold py-2 whitespace-nowrap border-b-2 transition-colors flex-1 text-center ${
                activeType === card.order_type ? "border-[#1e2a4a] text-[#1e2a4a]" : "border-transparent text-content/70"
              }`}
            >
              {card.order_type}
            </button>
          ))}
        </div>
      )}

      {/* Filter bar */}
      {cards.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white flex-shrink-0">
          <TextFilter value={storeFilter} onChange={setStoreFilter} placeholder="Filter by store…" />
          <SelectFilter
            options={dateOptions}
            value={dateFilter}
            onChange={setDateFilter}
            placeholder="All dates"
            className="w-[32%]"
          />
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {loading && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">Loading…</div>
        )}
        {!loading && cards.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">
            No orders found for this date range.
          </div>
        )}

        {visibleCards.map((card) => {
          const typeOpen = activeType !== "all" || openTypes.has(card.order_type) || !!dateFilter || !!storeFilter;
          return (
            <div key={card.order_type} className="border-b border-gray-100">
              {/* Order type header — collapsible in All tab */}
              {activeType === "all" && (
                <button
                  onClick={() => toggleType(card.order_type)}
                  className="w-full flex items-center gap-2 bg-[#1e2a4a]/5 hover:bg-[#1e2a4a]/10 px-4 py-2.5 transition-colors"
                >
                  <ChevronRightIcon
                    className="w-3 h-3 text-[#1e2a4a]/60 flex-shrink-0 transition-transform"
                    style={{ transform: typeOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                  />
                  <span className="text-[11px] font-semibold text-[#1e2a4a] uppercase tracking-wide flex-1 text-left">
                    {card.order_type}
                  </span>
                  <span className="text-[10px] text-[#1e2a4a]/55">
                    {card.dates.reduce((n, d) => n + d.stores.length, 0)}
                  </span>
                </button>
              )}

              {/* Date groups */}
              {typeOpen && card.dates.map((dateGroup) => {
                const dateKey = `${card.order_type}::${dateGroup.order_date}`;
                const dateOpen = openDates.has(dateKey) || !!dateFilter || !!storeFilter;
                return (
                  <div key={dateGroup.order_date} className="border-t border-gray-100 first:border-t-0">
                    <button
                      onClick={() => toggleDate(dateKey)}
                      className="w-full flex items-center gap-2 pl-8 pr-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
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
                              style={sel ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
                              className={`w-full flex items-center justify-between pl-12 pr-4 py-3 text-left transition-colors ${
                                sel ? "bg-white" : "bg-white hover:bg-gray-50"
                              }`}
                            >
                              <span className="text-[13px] font-medium text-content">{store.store_name}</span>
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

export default OrdersAvailableScreen;
