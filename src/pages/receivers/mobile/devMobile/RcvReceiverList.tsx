import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getReceiverDetails } from "../../../../api/receivers";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import type {
  ReceiverListItem,
  ReceiverDetailsItem,
  ReceiverDetailsTotals,
  ReceiverDetailsResponse,
  JsonError,
} from "../../../../interfaces";
import BottomSheet from "../../../../components/BottomSheet";
import { rowsToCsv, downloadCsv, fmtNum } from "../../../../utils/csvExport";

interface Props {
  receivers: ReceiverListItem[];
  storeName: string;
  dateRangeLabel: string;
  storeid: number;
  onSearch: () => void;
}

const fmtDate = (dateStr: string) => {
  if (!dateStr) return "";
  const trimmed = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  return new Date(`${trimmed}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const toApiDate = (dateStr: string) => {
  const trimmed = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [y, m, d] = trimmed.split("-");
  return `${parseInt(m)}/${parseInt(d)}/${y}`;
};

const gmColor = (gm: number) => {
  if (gm >= 30) return "text-emerald-600";
  if (gm >= 25) return "text-amber-600";
  return "text-red-500";
};

// Date → Invoice collapsible list, mirroring the desktop dev ReceiverListPanel
// layout — replaces the old two-screen Vendor-list → Receiver-list drill-down
// with a single screen grouped by date, tapping an invoice opens the same
// line-items BottomSheet directly.
const RcvReceiverList = ({
  receivers,
  storeName,
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

  const totalItems = receivers.reduce((s, r) => s + r.items, 0);
  const uniqueVendors = new Set(receivers.map((r) => r.vendorid)).size;
  const uniqueOperators = new Set(receivers.map((r) => r.cashier_number)).size;

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

  const handleExport = () => {
    if (!details.length || !selectedReceiver) return;
    const headers = [
      "Line #",
      "UPC",
      "Description",
      "Cases",
      "Units",
      "Ext Cost",
      "Ext Retail",
      "GM%",
    ];
    const rows = [
      ...details.map((r) => [
        r.line_number,
        r.product_code,
        r.product_description,
        r.cases,
        r.units,
        fmtNum(r.ext_cost),
        fmtNum(r.ext_retail),
        fmtNum(r.gm),
      ]),
      [],
      [
        "",
        "",
        "TOTALS",
        totals?.cases ?? "",
        totals?.units ?? "",
        totals?.ext_cost != null ? fmtNum(totals.ext_cost) : "",
        totals?.ext_retail != null ? fmtNum(totals.ext_retail) : "",
        "",
      ],
    ];
    const csv = rowsToCsv(headers, rows);
    const filename = `receiver_${selectedReceiver.vendorid}_${selectedReceiver.invoice_date}.csv`;
    downloadCsv(csv, filename);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden bg-gray-50">
      <div
        className="flex-shrink-0 px-3 pt-2 pb-2.5"
        style={{ background: "#1e2a4a" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-custom-white truncate">
              {storeName}
            </div>
            <div className="text-[10px] mt-0.5 text-custom-white/85">
              {dateRangeLabel}
            </div>
          </div>
          <button
            onClick={onSearch}
            className="w-[28px] h-[28px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/85 flex-shrink-0"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 grid grid-cols-4 bg-custom-white border-b border-gray-100">
        {[
          { label: "Receivers", value: String(receivers.length) },
          { label: "Items", value: String(totalItems) },
          { label: "Vendors", value: String(uniqueVendors) },
          { label: "Operators", value: String(uniqueOperators) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="px-2.5 py-1.5 border-r border-gray-100 last:border-r-0"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
              {label}
            </div>
            <div className="text-[12px] font-bold text-content mt-0.5 tabular-nums">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[#1e2a4a]/15 pb-14">
        {grouped.map((group) => {
          const isOpen = openDates.has(group.date);
          return (
            <div key={group.date}>
              <button
                onClick={() => toggleDate(group.date)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-custom-white text-left active:bg-gray-50 gap-3"
              >
                <span className="text-[12px] font-medium text-content">
                  {fmtDate(group.date)}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-content/85 tabular-nums">
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "invoice" : "invoices"}
                  </span>
                  <svg
                    className="w-4 h-4 text-content/85 transition-transform"
                    style={{
                      transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="bg-gray-50 divide-y divide-[#1e2a4a]/15">
                  {group.items.map((r) => (
                    <button
                      key={`${r.invoiceid}-${r.invoice_date}`}
                      onClick={() => handleReceiverTap(r)}
                      className="w-full flex items-center pl-6 pr-3 py-2.5 text-left active:bg-gray-100 gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-content truncate">
                          #{r.invoiceid}
                          <span className="ml-2 text-[11px] text-content/85 truncate">
                            {r.vendor_name}
                          </span>
                        </div>
                        <div className="text-[10px] text-content/85 mt-0.5">
                          {r.items} items
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedReceiver && (
        <BottomSheet onClose={handleSheetClose}>
          <div className="px-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-2">
            <div>
              <div className="text-[13px] font-bold text-content">
                #{selectedReceiver.reference_number}
                <span className="ml-2 text-[10px] font-normal text-content/85">
                  {selectedReceiver.cashier_name}
                </span>
              </div>
              <div className="text-[10px] text-content/85 mt-0.5">
                {fmtDate(selectedReceiver.invoice_date)} ·{" "}
                {selectedReceiver.items} items
              </div>
            </div>
            {details.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-2 py-1 rounded border border-gray-200 text-content/85 hover:text-content hover:border-gray-300 transition-colors flex-shrink-0"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Export</span>
              </button>
            )}
          </div>

          {loadingDetails || details.length === 0 ? (
            <div className="py-8 text-center text-[11px] text-content/85">
              {loadingDetails ? "Loading line items…" : "No line items"}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 border-b border-gray-100">
                {[
                  { label: "Lines", value: String(details.length) },
                  {
                    label: "Cases",
                    value: String(
                      totals?.cases ?? details.reduce((s, d) => s + d.cases, 0),
                    ),
                  },
                  {
                    label: "Units",
                    value: String(
                      totals?.units ?? details.reduce((s, d) => s + d.units, 0),
                    ),
                  },
                  {
                    label: "Cost",
                    value: formatCurrency2(
                      totals?.ext_cost ??
                        details.reduce((s, d) => s + d.ext_cost, 0),
                    ),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="px-2.5 py-1.5 border-r border-gray-100 last:border-r-0"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
                      {label}
                    </div>
                    <div className="text-[11px] font-bold text-content mt-0.5 tabular-nums">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="grid px-3 py-1.5 bg-gray-50 border-b border-gray-100"
                style={{ gridTemplateColumns: "1fr 30px 30px 48px 32px" }}
              >
                {["Description", "Cs", "Un", "Cost", "GM%"].map((h, i) => (
                  <div
                    key={h}
                    className={`text-[10px] font-semibold uppercase tracking-wide text-content/85 ${i > 0 ? "text-right" : ""}`}
                  >
                    {h}
                  </div>
                ))}
              </div>

              <div className="overflow-y-auto max-h-[320px]">
                {details.map((item, i) => (
                  <div
                    key={i}
                    className="grid px-3 py-1.5 border-b border-gray-50 items-center"
                    style={{ gridTemplateColumns: "1fr 30px 30px 48px 32px" }}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="text-[10px] text-content truncate">
                        {item.product_description}
                      </div>
                      <div className="text-[10px] text-content/85">
                        {item.product_code}
                      </div>
                    </div>
                    <div className="text-[10px] text-content text-right tabular-nums">
                      {item.cases}
                    </div>
                    <div className="text-[10px] text-content text-right tabular-nums">
                      {item.units}
                    </div>
                    <div className="text-[10px] font-semibold text-content text-right tabular-nums">
                      {formatCurrency2(item.ext_cost)}
                    </div>
                    <div
                      className={`text-[10px] font-bold text-right tabular-nums ${gmColor(item.gm)}`}
                    >
                      {formatBigNumber(item.gm, 2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
                <span className="text-[10px] text-content/85 tabular-nums">
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
