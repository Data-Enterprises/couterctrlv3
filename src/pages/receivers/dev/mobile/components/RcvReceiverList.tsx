// Hooks
import { useMemo, useState } from "react";
import { useAppSelector } from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// API
import { getReceiverDetails } from "../../../../../api/receivers";

// Utils
import { formatCurrency2 } from "../../../../../utils";
import { fmtDate, handleExport, toApiDate } from "./utils";

// Interfaces
import type {
  ReceiverListItem,
  ReceiverDetailsItem,
  ReceiverDetailsTotals,
  ReceiverDetailsResponse,
  JsonError,
} from "../../../../../interfaces";

// Components
import LocationTabs from "../../../../../components-dev/filters/LocationTabs";
import MobilePerfHeader from "../../../../../components-dev/mobile/MobilePerfHeader";
import BottomSheet from "../../../../../components-dev/BottomSheet";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import SummaryStrip from "./components/SummaryStrip";
import ReceiverDateGroup from "./components/ReceiverDateGroup";
import SheetKpiStrip from "./components/SheetKpiStrip";
import LineItemsHeader from "./components/LineItemsHeader";
import LineItemRows from "./components/LineItemRows";

interface Props {
  receivers: ReceiverListItem[];
  storeName: string;
  dateRangeLabel: string;
  storeid: number;
  onSearch: () => void;
  storeNumbers: string[];
  selectedStoreNumber: string | null;
  onStoreNumberChange: (storeNumber: string | null) => void;
}

// Date → Invoice collapsible list, mirroring the desktop dev ReceiverListPanel
const RcvReceiverList = ({
  receivers,
  storeName,
  storeNumbers,
  selectedStoreNumber,
  onStoreNumberChange,
  dateRangeLabel,
  storeid,
  onSearch,
}: Props) => {
  const toast = useToast();
  const { url, token } = useAppSelector((s) => s.app);

  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  const [selectedReceiver, setSelectedReceiver] =
    useState<ReceiverListItem | null>(null);
  const [details, setDetails] = useState<ReceiverDetailsItem[]>([]);
  const [totals, setTotals] = useState<ReceiverDetailsTotals | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const toggleDate = (key: string) =>
    setOpenDates((prev) => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });

  const grouped = useMemo(() => {
    const dateMap = new Map<string, ReceiverListItem[]>();
    receivers.forEach((r) => {
      const dKey = r.invoice_date.split("T")[0];
      if (!dateMap.has(dKey)) dateMap.set(dKey, []);
      dateMap.get(dKey)!.push(r);
    });
    return Array.from(dateMap.entries())
      .map(([date, items]) => ({
        date,
        items: [...items].sort((a, b) =>
          b.invoice_date.localeCompare(a.invoice_date),
        ),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [receivers]);

  const handleReceiverTap = (receiver: ReceiverListItem) => {
    setSelectedReceiver(receiver);
    setDetails([]);
    setTotals(null);
    setLoadingDetails(true);
    getReceiverDetails(
      url,
      token,
      storeid,
      receiver.invoiceid,
      toApiDate(receiver.invoice_date),
    )
      .then((resp) => {
        const j: ReceiverDetailsResponse = resp.data;
        if (j.error === 0) {
          setDetails(j.records ?? []);
          setTotals(j.totals?.[0] ?? null);
        } else {
          toast.warn("Failed to load line items");
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setLoadingDetails(false));
  };

  const handleSheetClose = () => {
    setSelectedReceiver(null);
    setDetails([]);
    setTotals(null);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden bg-gray-50">
      <MobilePerfHeader
        pageName="Receivers"
        storeName={storeName}
        dateRange={dateRangeLabel}
        onSearch={onSearch}
        helpPage="receivers"
      />

      <SummaryStrip receivers={receivers} />
      <LocationTabs
        numbers={storeNumbers}
        selected={selectedStoreNumber}
        onChange={onStoreNumberChange}
        variant="bare"
      />

      <div className="flex-1 overflow-y-auto divide-y divide-brand_navy/15 pb-14">
        {grouped.map((group) => {
          const isOpen = openDates.has(group.date);
          return (
            <ReceiverDateGroup
              group={group}
              isOpen={isOpen}
              toggleDate={toggleDate}
              handleReceiverTap={handleReceiverTap}
            />
          );
        })}
      </div>

      {selectedReceiver && (
        <BottomSheet onClose={handleSheetClose}>
          <div className="px-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-2">
            <div>
              <div className="text-[13px] font-bold text-content">
                #{selectedReceiver.reference_number}
                <span className="ml-2 text-[10px] font-normal text-content/95">
                  {selectedReceiver.cashier_name}
                </span>
              </div>
              <div className="text-[10px] text-content/95 mt-0.5">
                {fmtDate(selectedReceiver.invoice_date)} ·{" "}
                {selectedReceiver.items} items
              </div>
            </div>
            {details.length > 0 && (
              <button
                onClick={() => handleExport(details, totals, selectedReceiver)}
                className="flex items-center gap-1 px-2 py-1 rounded border border-gray-200 text-content/95 hover:text-content hover:border-gray-300 transition-colors flex-shrink-0"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Export</span>
              </button>
            )}
          </div>

          {loadingDetails || details.length === 0 ? (
            <div className="py-8 text-center text-[11px] text-content/95">
              {loadingDetails ? "Loading line items…" : "No line items"}
            </div>
          ) : (
            <>
              <SheetKpiStrip details={details} totals={totals} />
              <LineItemsHeader />
              <LineItemRows details={details} />

              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
                <span className="text-[10px] text-content/95 tabular-nums">
                  {totals?.cases ?? details.reduce((s, d) => s + d.cases, 0)} cs
                  · {totals?.units ?? details.reduce((s, d) => s + d.units, 0)}{" "}
                  un
                </span>
                <span className="text-[10px] font-bold text-content tabular-nums">
                  {formatCurrency2(
                    totals?.ext_cost ??
                      details.reduce((s, d) => s + d.ext_cost, 0),
                  )}
                </span>
              </div>
            </>
          )}
          <div className="h-4 flex-shrink-0" />
        </BottomSheet>
      )}
    </div>
  );
};

export default RcvReceiverList;
