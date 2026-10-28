import { useMemo, useState } from "react";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/20/solid";
import MobilePerfDetail from "../../../../components-dev/mobile/MobilePerfDetail";
import CpnTotalsCard from "./CpnTotalsCard";
import { useAppSelector } from "../../../../hooks";
import { useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { formatCurrency2, formatDate } from "../../../../utils";
import { getCashierTransaction } from "../../../../api/lossPrevention";
import { setCouponReceiptLines } from "../../../../features/dev/devCouponSlice";
import type { CouponItem, JsonError } from "../../../../interfaces";
import BottomSheet from "../../../../components-dev/BottomSheet";
import { couponValueOf } from "../../../../utils/couponValue";

interface Props {
  coupons: CouponItem[];
  sectionLabel: string;
  /** "Sub dept" | "Date" | "Cashier" — the tab this section came from. */
  tabLabel: string;
  dateRangeLabel: string;
  sortMetric: "amount" | "qty";
  onBack: () => void;
}

type AggUse = {
  sale_id: number;
  sale_date: string;
  cashier_name: string;
  terminal: string;
  storeid: number;
  amount: number;
  row: CouponItem;
};

type AggRow = {
  product_code: string;
  product_description: string;
  count: number;
  total: number;
  uses: AggUse[];
};

const buildSaleId = (row: CouponItem) => {
  const [y, m, d] = row.sale_date.split("T")[0].split("-");
  return `${row.storeid}-${row.sale_id}-${row.terminal}-${+m}-${+d}-${y}`;
};

const CpnSectionDetail = ({
  coupons,
  sectionLabel,
  tabLabel,
  dateRangeLabel,
  sortMetric,
  onBack,
}: Props) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token } = useAppSelector((s) => s.app);
  const txLines: any[] = useAppSelector((s) => s.dev.coupons.receiptLines);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedSaleId, setSelectedSaleId] = useState("");


  const aggRows = useMemo((): AggRow[] => {
    const map = new Map<string, AggRow>();
    coupons.forEach((c) => {
      // `!= null`, not truthiness — matching CouponDetailPanel. A product_code
      // of 0 is a real code; a falsy check silently regroups those rows under
      // their description instead, splitting one UPC across two rows.
      const key =
        c.product_code != null
          ? String(Math.round(Number(c.product_code)))
          : c.product_description;
      if (!map.has(key)) {
        map.set(key, {
          product_code: key,
          product_description: c.product_description,
          count: 0,
          total: 0,
          uses: [],
        });
      }
      const agg = map.get(key)!;
      agg.count++;
      agg.total += couponValueOf(c);
      const existing = agg.uses.find((u) => u.sale_id === c.sale_id);
      if (existing) {
        existing.amount += couponValueOf(c);
      } else {
        agg.uses.push({
          sale_id: c.sale_id,
          sale_date: c.sale_date,
          cashier_name: c.cashier_name,
          terminal: c.terminal,
          storeid: c.storeid,
          amount: couponValueOf(c),
          row: c,
        });
      }
    });
    const rows = Array.from(map.values());
    return sortMetric === "qty"
      ? rows.sort((a, b) => b.count - a.count)
      : rows.sort((a, b) => b.total - a.total);
  }, [coupons, sortMetric]);

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleUseClick = (use: AggUse) => {
    const saleId = buildSaleId(use.row);
    dispatch(setCouponReceiptLines([]));
    setSelectedSaleId(saleId);
    getCashierTransaction(url, token, use.sale_date, saleId, use.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions = [...(j.transaction ?? [])].map((item: any) => ({
            ...item,
            transaction_id: item.sale_id?.split("-")[1] ?? "",
            qty: item.qty ?? 0,
          }));
          dispatch(setCouponReceiptLines(transactions));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleSheetClose = () => {
    setSelectedSaleId("");
    dispatch(setCouponReceiptLines([]));
  };

  const handleExport = () => {
    if (txLines.length === 0) return;
    const rows = [
      ["Line #", "Description", "Qty", "Total", "Type", "Coupon Amt"],
      ...txLines.map((r: any) => {
        const isCpn = r.is_coupon === 1;
        const isTender = r.sale_type === "Tender";
        return [
          r.line_number ?? "",
          r.product_description ?? "",
          r.qty > 0 ? r.qty : "",
          isCpn ? "" : (r.total_sales ?? 0).toFixed(2),
          isCpn ? "Coupon" : isTender ? "Tender" : "Sale",
          isCpn ? couponValueOf(r).toFixed(2) : "",
        ];
      }),
      [],
      ["", "", "", "", "Gross", txGross.toFixed(2)],
      ["", "", "", "", "Coupons", (-txCoupons).toFixed(2)],
      ["", "", "", "", "Tax", txTax.toFixed(2)],
      ["", "", "", "", "Total", txTotal.toFixed(2)],
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const cashier = txMeta?.cashier_name ?? "cashier";
    const date = txMeta?.sale_date
      ? txMeta.sale_date.split("T")[0]
      : "transaction";
    const filename = `transaction_${cashier.replace(/\s+/g, "_")}_${date}.csv`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const txMeta = txLines[0] ?? null;
  const saleLines = txLines.filter(
    (r: any) => r.sale_type === "Sale" && r.is_coupon !== 1,
  );
  const couponLines = txLines.filter((r: any) => r.is_coupon === 1);
  const txGross = saleLines.reduce(
    (s: number, r: any) => s + (r.total_sales ?? 0),
    0,
  );
  const txCoupons = couponLines.reduce(
    (s: number, r: any) => s + couponValueOf(r),
    0,
  );
  const txTax = saleLines.reduce(
    (s: number, r: any) => s + (r.total_rounded_tax ?? 0),
    0,
  );
  const txNet = txGross - txCoupons;
  const txTotal = txNet + txTax;

  // The deepest level, and the same wrapper the two above it use. One tab:
  // MobilePerfDetail renders no tab row for a single entry, which is right —
  // there is one reading of a section and a lone tab would be a label
  // pretending to be a control. The tab it came FROM names the level, and the
  // section itself is the scope.
  return (
    <>
    <MobilePerfDetail
      tabs={[{ key: "products" as const, label: tabLabel }]}
      active="products"
      onTab={() => {}}
      scopeName={sectionLabel}
      when={dateRangeLabel}
      backLabel="Back to coupons"
      onBack={onBack}
      levelKey={`cpnSection|${sectionLabel}`}
    >
      <div className="flex flex-col gap-3">
        <CpnTotalsCard coupons={coupons} caption={`${tabLabel} total`} />

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
      {/* No scroll container and no pb-14 of its own: MobilePerfDetail owns
          the scroll and already clears the fixed tab bar. */}
      <div>
        {aggRows.map((agg) => {
          const isExp = expanded.has(agg.product_code);
          return (
            <div
              key={agg.product_code}
              className="border-b border-brand_line last:border-b-0"
            >
              <button
                onClick={() => toggleExpanded(agg.product_code)}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left active:bg-bkg"
              >
                {isExp ? (
                  <ChevronDownIcon className="w-3.5 h-3.5 text-content/95 flex-shrink-0" />
                ) : (
                  <ChevronRightIcon className="w-3.5 h-3.5 text-content/95 flex-shrink-0" />
                )}
                <span className="flex-1 text-[11px] font-medium text-content truncate">
                  {agg.product_description}
                </span>
                <span className="text-[10px] text-content/95 flex-shrink-0">
                  {agg.product_code}
                </span>
                <span className="text-[10px] text-content/95 flex-shrink-0">
                  {agg.count}×
                </span>
                <span className="text-[11px] font-semibold text-content flex-shrink-0 tabular-nums">
                  {formatCurrency2(agg.total)}
                </span>
              </button>
              {isExp && (
                <div className="border-t border-brand_line">
                  <div className="grid grid-cols-4 gap-2 px-3.5 py-1 bg-gray-100 border-b border-brand_line">
                    {["Cashier", "Date", "Trans #", "Amt"].map((h, i) => (
                      <div
                        key={h}
                        className={`text-[10px] font-semibold uppercase tracking-wide text-content/95 ${i === 3 ? "text-right" : ""}`}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                  {agg.uses.map((use) => (
                    <button
                      key={use.sale_id}
                      onClick={() => handleUseClick(use)}
                      className="w-full grid grid-cols-4 gap-2 px-3.5 py-2 border-b border-brand_line last:border-0 text-left active:bg-bkg"
                    >
                      <span className="text-[10px] text-content/95 truncate">
                        {use.cashier_name}
                      </span>
                      <span className="text-[10px] text-content/95">
                        {formatDate(use.sale_date.split("T")[0])}
                      </span>
                      <span className="text-[10px] text-content/95 tabular-nums">
                        #{use.sale_id}
                      </span>
                      <span className="text-[10px] font-semibold text-content text-right tabular-nums">
                        {formatCurrency2(use.amount)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
        </section>
      </div>
    </MobilePerfDetail>

      {/* Transaction bottom sheet */}
      {selectedSaleId && (
        <BottomSheet onClose={handleSheetClose}>
          <div className="px-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-2">
            <div>
              <div className="text-[13px] font-bold text-content">
                {txMeta?.cashier_name ?? "Loading…"}
                {txMeta?.terminal && (
                  <span className="ml-2 text-[10px] font-normal text-content/95">
                    Terminal {txMeta.terminal}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-content/95 mt-0.5">
                {txMeta?.sale_date
                  ? formatDate(txMeta.sale_date.split("T")[0])
                  : ""}
                {txMeta?.sale_start_time
                  ? ` · ${String(txMeta.sale_start_time).replace(/(\d{2})(\d{2})/, "$1:$2")}`
                  : ""}
              </div>
            </div>
            {txLines.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-2 py-1 rounded border border-gray-200 text-content/95 hover:text-content hover:border-gray-300 transition-colors flex-shrink-0"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {txLines.length === 0 ? (
            <div className="py-8 text-center text-[11px] text-content/95">
              Loading transaction…
            </div>
          ) : (
            <>
              <div className="overflow-y-auto max-h-[420px]">
                <div
                  className="grid px-4 py-1.5 bg-gray-50 border-b border-gray-100"
                  style={{ gridTemplateColumns: "18px 1fr 20px 56px 40px" }}
                >
                  {["#", "Description", "Qty", "Total", "Type"].map((h, i) => (
                    <div
                      key={h}
                      className={`text-[10px] font-semibold uppercase tracking-wide text-content/95 ${
                        i >= 2 && i <= 3
                          ? "text-right"
                          : i === 4
                            ? "text-right"
                            : ""
                      }`}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {txLines.map((item: any, i: number) => {
                  const isCpn = item.is_coupon === 1;
                  const isTender = item.sale_type === "Tender";
                  return (
                    <div
                      key={i}
                      className="grid px-4 py-1.5 border-b border-gray-50 items-center"
                      style={{
                        gridTemplateColumns: "18px 1fr 20px 56px 40px",
                        background: isCpn ? "rgba(234,179,8,0.06)" : undefined,
                      }}
                    >
                      <span className="text-[10px] text-content/95 tabular-nums">
                        {item.line_number}
                      </span>
                      <span
                        className={`text-[10px] truncate ${isCpn ? "text-amber-700" : "text-content"}`}
                      >
                        {item.product_description}
                      </span>
                      <span className="text-[10px] text-content/95 text-right">
                        {item.qty > 0 ? item.qty : "—"}
                      </span>
                      <span
                        className={`text-[10px] font-semibold text-right tabular-nums ${
                          isCpn ? "text-amber-700" : "text-content"
                        }`}
                      >
                        {formatCurrency2(
                          isCpn ? couponValueOf(item) : item.total_sales,
                        )}
                      </span>
                      <div className="flex justify-end">
                        <span
                          className={`text-[10px] font-bold rounded px-1 py-0.5 ${
                            isCpn
                              ? "bg-amber-100 text-amber-800"
                              : isTender
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {isCpn ? "Cpn" : isTender ? "Tndr" : "Sale"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-3 px-4 py-2 border-t border-gray-100 bg-gray-50">
                {txCoupons > 0 && (
                  <span className="text-[10px] text-amber-700">
                    Cpns{" "}
                    <span className="font-semibold">
                      -{formatCurrency2(txCoupons)}
                    </span>
                  </span>
                )}
                <span className="text-[10px] text-content/95">
                  Tax{" "}
                  <span className="text-content font-semibold">
                    {formatCurrency2(txTax)}
                  </span>
                </span>
                <span className="text-[10px] text-content/95">
                  Net{" "}
                  <span className="text-content font-semibold">
                    {formatCurrency2(txNet)}
                  </span>
                </span>
                <span className="text-[10.5px] font-bold text-content">
                  Total {formatCurrency2(txTotal)}
                </span>
              </div>
            </>
          )}
          <div className="h-4 flex-shrink-0" />
        </BottomSheet>
      )}
    </>
  );
};

export default CpnSectionDetail;
