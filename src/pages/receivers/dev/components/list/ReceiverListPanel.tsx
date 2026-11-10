// Hooks
import { useState, useMemo } from "react";
import {
  useAppSelector,
  useAppDispatch,
  useStoreName,
} from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// Redux
import {
  setIsFetchingDetails,
  setSelectedInvoice,
  setReceiverDetails,
  setTotals,
  setSelectedStoreNumber,
  setListGridData,
} from "../../../../../features/dev/devReceiversSlice";

// API
import { getReceiverDetails } from "../../../../../api/receivers";

// Utils
import { formatDate } from "../../../../../utils";
import {
  applyStoreNumberToName,
  scopeToStoreNumber,
} from "../../../../../utils/storeIdentity";

// Interfaces
import type {
  JsonError,
  ReceiverDetailsResponse,
} from "../../../../../interfaces";

// Components
import LocationTabs from "../../../../../components-dev/filters/LocationTabs";
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";
import FilterBar from "../../../../../components-dev/filters/FilterBar";
import RListItemRows from "./components/RListItemRows";
import ListNavyHeader from "./components/ListNavyHeader";

interface ReceiverListPanelProps {
  onOpenSearch: () => void;
}

/** The left receiver list panel: header, store-number tabs, vendor and date filters, and receivers grouped by date.
 *  Clicking an invoice loads its line items into the detail panel. */
const ReceiverListPanel = ({ onOpenSearch }: ReceiverListPanelProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const state = useAppSelector((s) => s.dev.receivers);

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

  // Co-located stores share one assignedStores record, so the resolved name
  // embeds only one of the two numbers — rewrite it to the location on screen.
  const resolvedStoreName = useStoreName(Number(state.storeid));
  const storeName = state.selectedStoreNumber
    ? applyStoreNumberToName(
        resolvedStoreName,
        state.selectedStoreNumber,
        state.availableStoreNumbers,
      )
    : resolvedStoreName;

  // No refetch — the full response is already in state.list.
  const handleStoreNumberChange = (storeNumber: string | null) => {
    dispatch(setSelectedStoreNumber(storeNumber));
    dispatch(
      setListGridData(
        storeNumber ? scopeToStoreNumber(state.list, storeNumber) : state.list,
      ),
    );
  };
  const hasFilters = !!vendorFilter || !!dateFilter;

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white flex-shrink-0"
      style={{ width: "26%" }}
    >
      <ListNavyHeader onOpenSearch={onOpenSearch} storeName={storeName} />

      <LocationTabs
        numbers={state.availableStoreNumbers}
        selected={state.selectedStoreNumber}
        onChange={handleStoreNumberChange}
      />

      <FilterBar helpAnchor="filters">
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
      <div
        data-help="date-list"
        className="flex-1 overflow-y-auto thin-scrollbar flex flex-col"
      >
        {grouped.length === 0 && (
          <div className="flex items-center justify-center py-8 text-[11px] text-content/95">
            No results match filters
          </div>
        )}

        {grouped.length > 0 && (
          <div className="grid grid-cols-[1fr_56px_10%_32px] gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-content/95 flex-shrink-0">
            <div>Date</div>
            <div className="text-center">Invoices</div>
            <div></div>
            <div></div>
          </div>
        )}

        <div className="divide-y divide-brand_navy/25">
          {grouped.map((group) => {
            const dateOpen = openDates.has(group.date) || hasFilters;

            return (
              <RListItemRows
                key={group.date}
                group={group}
                toggleDate={toggleDate}
                dateOpen={dateOpen}
                selectedInvoice={state.selectedInvoice}
                getSelectedDetails={getSelectedDetails}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReceiverListPanel;
