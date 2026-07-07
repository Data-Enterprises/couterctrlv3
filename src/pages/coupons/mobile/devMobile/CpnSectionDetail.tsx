import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { useAppSelector } from "../../../../hooks";
import { useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { formatCurrency2, formatDate } from "../../../../utils";
import { getCashierTransaction } from "../../../../api/lossPrevention";
import { setTransactionDrillDown } from "../../../../features/lossPreventionSlice";
import type { CouponItem, JsonError } from "../../../../interfaces";
import BottomSheet from "../../../../components/BottomSheet";

interface Props {
  coupons: CouponItem[];
  sectionLabel: string;
  sectionSub: string;
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

const CpnSectionDetail = ({ coupons, sectionLabel, sectionSub, sortMetric, onBack }: Props) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token } = useAppSelector((s) => s.app);
  const txData = useAppSelector((s) => s.lossPrevention.transactionDrillDown);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedSaleId, setSelectedSaleId] = useState("");

  const totalAmount = coupons.reduce((s, c) => s + c.coupon_amount, 0);
  const avgPerCoupon = coupons.length > 0 ? totalAmount / coupons.length : 0;
  const uniqueProducts = new Set(coupons.map((c) => c.product_code)).size;

  const aggRows = useMemo((): AggRow[] => {
    const map = new Map<string, AggRow>();
    coupons.forEach((c) => {
      const key = c.product_code ? String(Math.round(Number(c.product_code))) : c.product_description;
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
      agg.total += c.coupon_amount;
      const existing = agg.uses.find((u) => u.sale_id === c.sale_id);
      if (existing) {
        existing.amount += c.coupon_amount;
      } else {
        agg.uses.push({
          sale_id: c.sale_id,
          sale_date: c.sale_date,
          cashier_name: c.cashier_name,
          terminal: c.terminal,
          storeid: c.storeid,
          amount: c.coupon_amount,
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
    dispatch(setTransactionDrillDown([]));
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
          dispatch(setTransactionDrillDown([transactions]));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleSheetClose = () => {
    setSelectedSaleId("");
    dispatch(setTransactionDrillDown([]));
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
          isCpn ? (r.coupon_amount ?? 0).toFixed(2) : "",
        ];
      }),
      [],
      ["", "", "", "", "Gross", txGross.toFixed(2)],
      ["", "", "", "", "Coupons", (-txCoupons).toFixed(2)],
      ["", "", "", "", "Tax", txTax.toFixed(2)],
      ["", "", "", "", "Total", txTotal.toFixed(2)],
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const cashier = txMeta?.cashier_name ?? "cashier";
    const date = txMeta?.sale_date ? txMeta.sale_date.split("T")[0] : "transaction";
    const filename = `transaction_${cashier.replace(/\s+/g, "_")}_${date}.csv`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const txLines: any[] = Array.isArray(txData?.[0]) ? txData[0] : [];
  const txMeta = txLines[0] ?? null;
  const saleLines = txLines.filter((r: any) => r.sale_type === "Sale" && r.is_coupon !== 1);
  const couponLines = txLines.filter((r: any) => r.is_coupon === 1);
  const txGross = saleLines.reduce((s: number, r: any) => s + (r.total_sales ?? 0), 0);
  const txCoupons = couponLines.reduce((s: number, r: any) => s + (r.coupon_amount ?? 0), 0);
  const txTax = saleLines.reduce((s: number, r: any) => s + (r.total_rounded_tax ?? 0), 0);
  const txNet = txGross - txCoupons;
  const txTotal = txNet + txTax;

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-2 pb-2.5" style={{ background: "#1e2a4a" }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-white/65 hover:text-white transition-colors flex-shrink-0 -ml-1">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[13px] font-semibold text-white">{sectionLabel}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              {sectionSub}
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="flex-shrink-0 grid grid-cols-4 bg-white border-b border-gray-100">
        {[
          { label: "Coupons", value: String(coupons.length) },
          { label: "Total", value: formatCurrency2(totalAmount) },
          { label: "Avg", value: formatCurrency2(avgPerCoupon) },
          { label: "Products", value: String(uniqueProducts) },
        ].map(({ label, value }) => (
          <div key={label} className="px-2.5 py-1.5 border-r border-gray-100 last:border-r-0">
            <div className="text-[7px] font-semibold uppercase tracking-wide text-content/45">{label}</div>
            <div className="text-[12px] font-bold text-content mt-0.5 tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      {/* Product rows */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
        {aggRows.map((agg) => {
          const isExp = expanded.has(agg.product_code);
          return (
            <div key={agg.product_code} className="bg-white border-b border-gray-100">
              <button
                onClick={() => toggleExpanded(agg.product_code)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left active:bg-gray-50"
              >
                {isExp ? (
                  <ChevronDownIcon className="w-3.5 h-3.5 text-content/30 flex-shrink-0" />
                ) : (
                  <ChevronRightIcon className="w-3.5 h-3.5 text-content/30 flex-shrink-0" />
                )}
                <span className="flex-1 text-[11px] font-medium text-content truncate">
                  {agg.product_description}
                </span>
                <span className="text-[10px] text-content/45 flex-shrink-0">{agg.product_code}</span>
                <span className="text-[10px] text-content/45 flex-shrink-0">{agg.count}×</span>
                <span className="text-[11px] font-semibold text-content flex-shrink-0 tabular-nums">
                  {formatCurrency2(agg.total)}
                </span>
              </button>
              {isExp && (
                <div className="border-t border-gray-100">
                  <div className="grid grid-cols-4 gap-2 px-3 py-1 bg-gray-50 border-b border-gray-100">
                    {["Cashier", "Date", "Trans #", "Amt"].map((h, i) => (
                      <div
                        key={h}
                        className={`text-[7px] font-semibold uppercase tracking-wide text-content/35 ${i === 3 ? "text-right" : ""}`}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                  {agg.uses.map((use) => (
                    <button
                      key={use.sale_id}
                      onClick={() => handleUseClick(use)}
                      className="w-full grid grid-cols-4 gap-2 px-3 py-2 bg-gray-50/60 border-b border-gray-100 last:border-0 text-left active:bg-blue-50/40"
                    >
                      <span className="text-[9px] text-content/65 truncate">{use.cashier_name}</span>
                      <span className="text-[9px] text-content/50">
                        {formatDate(use.sale_date.split("T")[0])}
                      </span>
                      <span className="text-[9px] text-content/38 tabular-nums">#{use.sale_id}</span>
                      <span className="text-[9px] font-semibold text-content text-right tabular-nums">
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

      {/* Transaction bottom sheet */}
      {selectedSaleId && (
        <BottomSheet onClose={handleSheetClose}>
          <div className="px-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-2">
            <div>
              <div className="text-[13px] font-bold text-content">
                {txMeta?.cashier_name ?? "Loading…"}
                {txMeta?.terminal && (
                  <span className="ml-2 text-[10px] font-normal text-content/45">
                    Terminal {txMeta.terminal}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-content/45 mt-0.5">
                {txMeta?.sale_date ? formatDate(txMeta.sale_date.split("T")[0]) : ""}
                {txMeta?.sale_start_time ? ` · ${String(txMeta.sale_start_time).replace(/(\d{2})(\d{2})/, "$1:$2")}` : ""}
              </div>
            </div>
            {txLines.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-2 py-1 rounded border border-gray-200 text-content/50 hover:text-content hover:border-gray-300 transition-colors flex-shrink-0"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                <span className="text-[9px] font-medium">Export</span>
              </button>
            )}
          </div>
          {txLines.length === 0 ? (
            <div className="py-8 text-center text-[11px] text-content/45">Loading transaction…</div>
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
                      className={`text-[7px] font-semibold uppercase tracking-wide text-content/38 ${
                        i >= 2 && i <= 3 ? "text-right" : i === 4 ? "text-right" : ""
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
                      <span className="text-[9px] text-content/35 tabular-nums">
                        {item.line_number}
                      </span>
                      <span className={`text-[9px] truncate ${isCpn ? "text-amber-700" : "text-content"}`}>
                        {item.product_description}
                      </span>
                      <span className="text-[9px] text-content/45 text-right">
                        {item.qty > 0 ? item.qty : "—"}
                      </span>
                      <span
                        className={`text-[9px] font-semibold text-right tabular-nums ${
                          isCpn ? "text-amber-700" : "text-content"
                        }`}
                      >
                        {formatCurrency2(isCpn ? item.coupon_amount : item.total_sales)}
                      </span>
                      <div className="flex justify-end">
                        <span
                          className={`text-[7px] font-bold rounded px-1 py-0.5 ${
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
                  <span className="text-[9.5px] text-amber-700">
                    Cpns{" "}
                    <span className="font-semibold">-{formatCurrency2(txCoupons)}</span>
                  </span>
                )}
                <span className="text-[9.5px] text-content/50">
                  Tax{" "}
                  <span className="text-content font-semibold">{formatCurrency2(txTax)}</span>
                </span>
                <span className="text-[9.5px] text-content/50">
                  Net{" "}
                  <span className="text-content font-semibold">{formatCurrency2(txNet)}</span>
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
    </div>
  );
};

export default CpnSectionDetail;
