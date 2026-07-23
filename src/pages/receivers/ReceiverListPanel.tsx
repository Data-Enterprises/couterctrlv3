import { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/20/solid";
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
import InfoPopover from "../../components/InfoPopover";
import { RECEIVERS_INFO } from "./receiversInfo";

const ReceiverListPanel = ({ onOpenSearch }: { onOpenSearch: () => void }) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const state = useAppSelector((s) => s.receivers);
  const search = useAppSelector((s) => s.search);

  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const toggleDate = (key: string) =>
    setOpenDates((prev) => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });

  const grouped = useMemo(() => {
    const dateMap = new Map<string, typeof state.listGridData>();
    state.listGridData
      .filter((item) => !vendorFilter || item.vendorid === vendorFilter)
      .forEach((item) => {
        const dKey = item.invoice_date.split("T")[0];
        if (!dateMap.has(dKey)) dateMap.set(dKey, []);
        dateMap.get(dKey)!.push(item);
      });
    return Array.from(dateMap.entries())
      .filter(([date]) => !dateFilter || date === dateFilter)
      .map(([date, items]) => ({
        date,
        items: [...items].sort((a, b) =>
          b.invoice_date.localeCompare(a.invoice_date),
        ),
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((g) => g.items.length > 0);
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

  const dateOptions = useMemo(
    () =>
      Array.from(new Set(state.list.map((r) => r.invoice_date.split("T")[0])))
        .sort((a, b) => b.localeCompare(a))
        .map((d) => ({ value: d, label: formatDate(d) })),
    [state.list],
  );

  const vendorIdOptions = useMemo(
    () =>
      Array.from(
        new Map(state.list.map((r) => [r.vendorid, r.vendor_name])).entries(),
      )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, name]) => ({ value: id, label: `${id} — ${name}` })),
    [state.list],
  );

  const storeName = useStoreName(Number(state.storeid));
  const [infoOpen, setInfoOpen] = useState(false);
  const hasFilters = !!vendorFilter || !!dateFilter;

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white flex-shrink-0"
      style={{ width: "26%" }}
    >
      {/* Navy header */}
      <div
        className="flex-shrink-0 px-3 pt-1 pb-2.5 flex flex-col gap-0"
        style={{ background: "#1e2a4a" }}
      >
        {/* Row 1: title + date | record count */}
        <div className="flex items-end gap-3 min-h-[24px]">
          <span className="text-[13px] font-semibold text-custom-white flex-shrink-0">
            Receivers
          </span>
          <span className="text-custom-white text-[10px] flex-shrink-0">
            {dateLabel}
          </span>
          <div className="flex-1" />
          {state.listGridData.length > 0 && (
            <div className="flex items-baseline gap-1 flex-shrink-0">
              <span className="text-custom-white text-[10px] font-semibold uppercase tracking-wide">
                Total
              </span>
              <span className="text-[13px] font-medium text-custom-white">
                {state.listGridData.length}
              </span>
            </div>
          )}
        </div>
        {/* Row 2: re-search icon + store name */}
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-white/[0.08]">
          <button
            onClick={onOpenSearch}
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-custom-white/60 hover:text-custom-white hover:border-white/40 transition-colors flex-shrink-0"
            aria-label="New search"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
          {state.storeid && (
            <span className="text-[11px] font-medium text-custom-white truncate">
              {storeName}
            </span>
          )}
          <div className="flex-1" />
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setInfoOpen((prev) => !prev)}
              title="About this view"
              className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-custom-white/50 hover:text-custom-white hover:border-white/40 transition-colors"
            >
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
            </button>
            {infoOpen && (
              <InfoPopover
                title={RECEIVERS_INFO.title}
                purpose={RECEIVERS_INFO.purpose}
                glossary={RECEIVERS_INFO.glossary}
                onClose={() => setInfoOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      <FilterBar>
        <SelectFilter
          options={vendorIdOptions}
          value={vendorFilter}
          onChange={setVendorFilter}
          placeholder="All Vendors"
          className="flex-1"
        />
        <SelectFilter
          options={dateOptions}
          value={dateFilter}
          onChange={setDateFilter}
          placeholder="All Dates"
          className="w-[30%]"
        />
      </FilterBar>

      {/* Collapsible tree: Date → Invoice */}
      <div className="flex-1 overflow-y-auto thin-scrollbar flex flex-col">
        {grouped.length === 0 && (
          <div className="flex items-center justify-center py-8 text-[11px] text-content/70">
            No results match filters
          </div>
        )}

        {grouped.length > 0 && (
          <div className="grid grid-cols-[1fr_56px_10%_32px] gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-content/50 flex-shrink-0">
            <div>Date</div>
            <div className="text-center">Invoices</div>
            <div></div>
            <div></div>
          </div>
        )}

        <div className="divide-y divide-[#1e2a4a]/25">
          {grouped.map((group) => {
            const dateOpen = openDates.has(group.date) || hasFilters;

            return (
              <div key={group.date}>
                {/* Date row */}
                <button
                  onClick={() => toggleDate(group.date)}
                  className="w-full grid grid-cols-[1fr_56px_10%_32px] items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[12px] font-medium text-content text-left truncate">
                    {formatDate(group.date)}
                  </span>
                  <span className="text-[12px] text-content flex-shrink-0 text-center font-medium">
                    {group.items.length}
                  </span>
                  <div></div>
                  <ChevronRightIcon
                    className="w-3 h-3 text-content/40 flex-shrink-0 justify-self-end transition-transform"
                    style={{
                      transform: dateOpen ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                {/* Invoice rows */}
                {dateOpen && (
                  <div>
                    <div className="grid grid-cols-[60px_70px_1fr] gap-2 pl-6 pr-3 py-1.5 bg-gray-50 text-[9.5px] font-bold uppercase tracking-wide text-content/85">
                      <div>Invoice #</div>
                      <div>Item count</div>
                      <div>Vendor</div>
                    </div>
                    <div className="divide-y divide-[#1e2a4a]/15">
                      {group.items.map((item) => {
                        const isSel =
                          state.selectedInvoice === item.invoiceid.toString();
                        return (
                          <button
                            key={item.invoiceid}
                            onClick={() =>
                              getSelectedDetails(
                                item.invoiceid,
                                formatDate(item.invoice_date),
                              )
                            }
                            className={`w-full grid grid-cols-[60px_70px_1fr] items-center gap-2 pl-6 pr-3 py-2 text-left transition-colors ${
                              isSel ? "bg-custom-white" : "hover:bg-gray-50"
                            }`}
                            style={
                              isSel
                                ? {
                                    boxShadow:
                                      "inset 0 0 8px rgba(37,99,235,0.22)",
                                  }
                                : undefined
                            }
                          >
                            <span className="text-[12px] text-content">
                              {item.invoiceid}
                            </span>
                            <span className="text-[12px] text-content">
                              {item.items}
                            </span>
                            <span className="text-[12px] text-content truncate">
                              {item.vendor_name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReceiverListPanel;
