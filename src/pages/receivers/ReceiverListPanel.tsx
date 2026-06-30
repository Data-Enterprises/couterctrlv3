import { useState, useMemo } from "react";
import { MagnifyingGlassIcon, ChevronRightIcon, QuestionMarkCircleIcon } from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch, useStoreName } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getReceiverDetails } from "../../api/receivers";
import {
  setIsFetchingDetails,
  setSelectedInvoice,
  setReceiverDetails,
  setTotals,
} from "../../features/receiversSlice";
import { formatDate } from "../../utils";
import type { JsonError, ReceiverDetailsResponse } from "../../interfaces";
import SelectFilter from "../../components/filters/SelectFilter";
import FilterBar from "../../components/filters/FilterBar";

const ReceiverListPanel = ({ onOpenSearch }: { onOpenSearch: () => void }) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const state = useAppSelector((s) => s.receivers);
  const search = useAppSelector((s) => s.search);

  const [openVendors, setOpenVendors] = useState<Set<string>>(new Set());
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const toggleVendor = (key: string) =>
    setOpenVendors((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  const toggleDate = (key: string) =>
    setOpenDates((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  const grouped = useMemo(() => {
    const vendorMap = new Map<string, { vendorName: string; dateMap: Map<string, typeof state.listGridData> }>();
    state.listGridData.forEach((item) => {
      const vKey = item.vendorid;
      if (!vendorMap.has(vKey)) vendorMap.set(vKey, { vendorName: item.vendor_name, dateMap: new Map() });
      const vendor = vendorMap.get(vKey)!;
      const dateKey = item.invoice_date.split("T")[0];
      if (!vendor.dateMap.has(dateKey)) vendor.dateMap.set(dateKey, []);
      vendor.dateMap.get(dateKey)!.push(item);
    });
    return Array.from(vendorMap.entries())
      .filter(([vendorid]) => !vendorFilter || vendorid === vendorFilter)
      .map(([vendorid, { vendorName, dateMap }]) => ({
        vendorid,
        vendorName,
        dates: Array.from(dateMap.entries())
          .filter(([date]) => !dateFilter || date === dateFilter)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, items]) => ({ date, items })),
      }))
      .filter((v) => v.dates.length > 0);
  }, [state.listGridData, vendorFilter, dateFilter]);

  const getSelectedDetails = (invoiceid: number, transDate: string) => {
    dispatch(setIsFetchingDetails(true));
    dispatch(setSelectedInvoice(invoiceid.toString()));
    getReceiverDetails(url, token, state.storeid, invoiceid, transDate)
      .then((resp) => {
        const j: ReceiverDetailsResponse = resp.data;
        if (j.error === 0) {
          dispatch(setReceiverDetails(j.records));
          dispatch(setTotals(j.totals));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsFetchingDetails(false)));
  };

const fmtRangePart = (mdy: string, withYear = false) => {
    const [m, d, y] = mdy.split("/");
    return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
  };
  const dateLabel = `${fmtRangePart(search.startDate)} – ${fmtRangePart(search.endDate, true)}`;

  const dateOptions = useMemo(() =>
    Array.from(new Set(state.list.map((r) => r.invoice_date.split("T")[0])))
      .sort((a, b) => b.localeCompare(a))
      .map((d) => ({ value: d, label: formatDate(d) })),
  [state.list]);

  const vendorIdOptions = useMemo(() =>
    Array.from(new Map(state.list.map((r) => [r.vendorid, r.vendor_name])).entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, name]) => ({ value: id, label: `${id} — ${name}` })),
  [state.list]);

  const storeName = useStoreName(Number(state.storeid));
  const [legendHover, setLegendHover] = useState(false);
  const hasFilters = !!vendorFilter || !!dateFilter;

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white flex-shrink-0"
      style={{ width: "26%" }}
    >
      {/* Navy header */}
      <div className="flex-shrink-0 px-3 pt-1 pb-2.5 flex flex-col gap-0" style={{ background: "#1e2a4a" }}>
        {/* Row 1: title + date | record count */}
        <div className="flex items-end gap-3 min-h-[24px]">
          <span className="text-[13px] font-semibold text-white flex-shrink-0">Receivers</span>
          <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.45)" }}>
            {dateLabel}
          </span>
          <div className="flex-1" />
          {state.listGridData.length > 0 && (
            <div className="flex items-baseline gap-1 flex-shrink-0">
              <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>
                Records
              </span>
              <span className="text-[13px] font-medium text-white">{state.listGridData.length}</span>
            </div>
          )}
        </div>
        {/* Row 2: re-search icon + store name */}
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-white/[0.08]">
          <button
            onClick={onOpenSearch}
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
            aria-label="New search"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
          {state.storeid && (
            <span className="text-[11px] font-medium text-white/80 truncate">{storeName}</span>
          )}
          <div className="flex-1" />
          <div className="relative flex-shrink-0" onMouseEnter={() => setLegendHover(true)} onMouseLeave={() => setLegendHover(false)}>
            <button className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-colors">
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
            </button>
            {legendHover && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-[#1e2a4a] border border-white/15 rounded-lg shadow-lg px-3 py-2.5 flex flex-col gap-2" style={{ minWidth: 230 }}>
                {[
                  {
                    color: "#60a5fa",
                    label: `${grouped.length} vendor${grouped.length !== 1 ? "s" : ""}`,
                    desc: "Distinct vendors returned for the selected store and date range",
                  },
                  {
                    color: "#a78bfa",
                    label: "Vendor ID filter",
                    desc: "Exact match — shows only receivers from the selected vendor",
                  },
                  {
                    color: "#34d399",
                    label: "Date filter",
                    desc: "Exact match — shows only receivers on the selected invoice date",
                  },
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

      <FilterBar>
        <SelectFilter
          options={vendorIdOptions}
          value={vendorFilter}
          onChange={setVendorFilter}
          placeholder="Vendor ID"
          className="flex-1"
        />
        <SelectFilter
          options={dateOptions}
          value={dateFilter}
          onChange={setDateFilter}
          placeholder="Date"
          className="w-[30%]"
        />
      </FilterBar>

      {/* Collapsible tree: Vendor → Date → Receiver */}
      <div className="flex-1 overflow-y-auto thin-scrollbar p-3 flex flex-col gap-3">
        {grouped.length === 0 && (
          <div className="flex items-center justify-center py-8 text-[11px] text-content/70">
            No results match filters
          </div>
        )}

        {grouped.map((vendor) => {
          const vendorOpen = openVendors.has(vendor.vendorid) || hasFilters;
          const totalItems = vendor.dates.reduce((n, d) => n + d.items.length, 0);

          return (
            <div key={vendor.vendorid} className="rounded-lg border border-gray-100">
              {/* Vendor row */}
              <button
                onClick={() => toggleVendor(vendor.vendorid)}
                className="w-full flex items-center gap-2 bg-[#1e2a4a]/5 hover:bg-[#1e2a4a]/10 pl-3 pr-3 py-2 transition-colors"
              >
                <ChevronRightIcon
                  className="w-3 h-3 text-[#1e2a4a]/60 flex-shrink-0 transition-transform"
                  style={{ transform: vendorOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                />
                <span className="text-[11px] font-semibold text-[#1e2a4a] flex-1 text-left truncate">
                  {vendor.vendorName}
                </span>
                <span className="text-[10px] text-[#1e2a4a]/55 flex-shrink-0">{totalItems}</span>
              </button>

              {/* Date rows */}
              {vendorOpen && vendor.dates.map((dateGroup) => {
                const dateKey = `${vendor.vendorid}::${dateGroup.date}`;
                const dateOpen = openDates.has(dateKey) || hasFilters;

                return (
                  <div key={dateGroup.date} className="border-t border-gray-100">
                    <button
                      onClick={() => toggleDate(dateKey)}
                      className="w-full flex items-center gap-2 pl-6 pr-3 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRightIcon
                        className="w-3 h-3 text-content/40 flex-shrink-0 transition-transform"
                        style={{ transform: dateOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                      />
                      <span className="text-[10px] font-medium text-content/65 flex-1 text-left">
                        {formatDate(dateGroup.date)}
                      </span>
                      <span className="text-[10px] text-content/55 flex-shrink-0">{dateGroup.items.length}</span>
                    </button>

                    {/* Leaf: individual receivers */}
                    {dateOpen && (
                      <div className="divide-y divide-gray-100">
                        {dateGroup.items.map((item) => {
                          const isSel = state.selectedInvoice === item.invoiceid.toString();
                          return (
                            <button
                              key={item.invoiceid}
                              onClick={() => getSelectedDetails(item.invoiceid, formatDate(item.invoice_date))}
                              className={`w-full flex items-center justify-between pl-9 pr-3 py-2 text-left transition-colors ${
                                isSel ? "bg-white" : "hover:bg-gray-50"
                              }`}
                              style={isSel ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
                            >
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-[10px] font-medium text-content">
                                  Ref #{item.reference_number}
                                </span>
                                <span className="text-[9px] text-content/50">{item.cashier_name}</span>
                              </div>
                              <span className="text-[10px] text-content/75 bg-gray-100 rounded-full px-2 py-0.5 flex-shrink-0 ml-2">
                                {item.items} {item.items === 1 ? "item" : "items"}
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

export default ReceiverListPanel;
