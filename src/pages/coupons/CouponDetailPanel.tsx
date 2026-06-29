import { useState, useMemo, useEffect } from "react";
import { ArrowDownTrayIcon, ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch, useStoreName } from "../../hooks";
import { formatCurrency2, formatDate } from "../../utils";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import CouponsExportModal from "./CouponsExportModal";
import { getCashierTransaction } from "../../api/lossPrevention";
import { setTransactionDrillDown } from "../../features/lossPreventionSlice";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";

interface CouponDetailPanelProps {
  selectedKey: string; // sub dept name (single store) | store ID string (group) | "" for all
  sortMetric: "amount" | "qty";
}

type GroupTab = "subdept" | "date" | "upc";

const GROUP_TABS: { key: GroupTab; label: string }[] = [
  { key: "subdept", label: "Sub dept" },
  { key: "date",    label: "Date" },
  { key: "upc",     label: "Product" },
];

const parseMDY = (mdy: string) => {
  const [m, d, y] = mdy.split("/");
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};
const fmtShort = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
const fmtShortYear = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

type GroupedSection = { key: string; label: string; count: number; total: number; rows: any[] };

const CouponDetailPanel = ({ selectedKey, sortMetric }: CouponDetailPanelProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.coupons);
  const lp = useAppSelector((s) => s.lossPrevention);
  const search = useAppSelector((s) => s.search);
  const context = useAppSelector((s) => s.app);
  const selectedGroup = useAppSelector((s) => s.search.selectedGroup);
  const isGroup = search.type === "Group";
  const storeName = useStoreName(Number(search.lastStore));
  const assignedStores = useAppSelector((s) => s.user.assignedStores);

  const [exportOpen, setExportOpen] = useState(false);
  const [groupTab, setGroupTab] = useState<GroupTab>("subdept");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState("");

  const selectedStoreName = isGroup && selectedKey
    ? (assignedStores.find((s) => s.storeid === Number(selectedKey))?.store_name ?? selectedKey)
    : "";

  const fmtRangePart = (mdy: string, withYear = false) => {
    const [m, d, y] = mdy.split("/");
    return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
  };
  const dateRangeLabel = `${fmtRangePart(search.startDate)} – ${fmtRangePart(search.endDate, true)}`;

  // Comparison date ranges
  const startD = parseMDY(search.startDate);
  const endD   = parseMDY(search.endDate);
  const rangeDays = Math.round((endD.getTime() - startD.getTime()) / 86400000) + 1;
  const ppEnd   = new Date(startD.getTime() - 86400000);
  const ppStart = new Date(ppEnd.getTime() - (rangeDays - 1) * 86400000);
  const lyStart = new Date(startD); lyStart.setFullYear(lyStart.getFullYear() - 1);
  const lyEnd   = new Date(endD);   lyEnd.setFullYear(lyEnd.getFullYear() - 1);
  const ppLabel = `${fmtShort(ppStart)} – ${fmtShortYear(ppEnd)}`;
  const lyLabel = `${fmtShort(lyStart)} – ${fmtShortYear(lyEnd)}`;

  const visibleRows = useMemo(() => {
    if (!selectedKey) return state.coupons;
    return state.coupons.filter((c) => String(c.storeid) === selectedKey);
  }, [state.coupons, selectedKey]);

  const priorRows = useMemo(() => {
    if (!selectedKey) return state.priorCoupons;
    return state.priorCoupons.filter((c) => String(c.storeid) === selectedKey);
  }, [state.priorCoupons, selectedKey]);

  const lyRows = useMemo(() => {
    if (!selectedKey) return state.lyCoupons;
    return state.lyCoupons.filter((c) => String(c.storeid) === selectedKey);
  }, [state.lyCoupons, selectedKey]);

  // Reset selection when scope or tab changes
  useEffect(() => {
    setSelectedSection(null);
    setSelectedSaleId("");
    dispatch(setTransactionDrillDown([]));
  }, [selectedKey, groupTab]);

  // Clear transaction when section changes
  useEffect(() => {
    setSelectedSaleId("");
    dispatch(setTransactionDrillDown([]));
  }, [selectedSection]);

  // Pre-compute all groupings + comparison maps so tab switching is instant
  const allSections = useMemo(() => {
    const build = (
      rows: any[],
      getKey: (r: any) => string,
      getLabel: (r: any) => string,
      chronological = false,
    ): GroupedSection[] => {
      const map = new Map<string, { label: string; rows: any[] }>();
      rows.forEach((r) => {
        const k = getKey(r);
        if (!map.has(k)) map.set(k, { label: getLabel(r), rows: [] });
        map.get(k)!.rows.push(r);
      });
      const sections = Array.from(map.entries()).map(([key, { label, rows: rs }]) => ({
        key, label,
        count: rs.length,
        total: rs.reduce((s, r) => s + r.coupon_amount, 0),
        rows: rs,
      }));
      if (chronological) return sections.sort((a, b) => a.key.localeCompare(b.key));
      return sections.sort(
        sortMetric === "qty" ? (a, b) => b.count - a.count : (a, b) => b.total - a.total,
      );
    };

    const buildMap = (rows: any[], getKey: (r: any) => string): Map<string, { count: number; total: number }> => {
      const map = new Map<string, { count: number; total: number }>();
      rows.forEach((r) => {
        const k = getKey(r);
        const cur = map.get(k) ?? { count: 0, total: 0 };
        map.set(k, { count: cur.count + 1, total: cur.total + r.coupon_amount });
      });
      return map;
    };

    const subdeptKey = (r: any) => r.sub_department_description;
    const dateKey    = (r: any) => r.sale_date.split("T")[0];
    const upcKey     = (r: any) => r.product_code || "no-upc";

    return {
      ty: {
        subdept: build(visibleRows, subdeptKey, (r) => r.sub_department_description),
        date:    build(visibleRows, dateKey, (r) => new Date(r.sale_date.split("T")[0] + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }), true),
        upc:     build(visibleRows, upcKey, (r) => r.product_description || r.product_code || "Unknown product"),
      },
      pp: {
        subdept: buildMap(priorRows, subdeptKey),
        date:    buildMap(priorRows, dateKey),
        upc:     buildMap(priorRows, upcKey),
      },
      ly: {
        subdept: buildMap(lyRows, subdeptKey),
        date:    buildMap(lyRows, dateKey),
        upc:     buildMap(lyRows, upcKey),
      },
    };
  }, [visibleRows, priorRows, lyRows, sortMetric]);

  const groupedSections = allSections.ty[groupTab];

  // Rows shown in the right grid — all or filtered by selected card
  const gridRows = useMemo(() => {
    if (!selectedSection) return visibleRows;
    return groupedSections.find((s) => s.key === selectedSection)?.rows ?? [];
  }, [visibleRows, selectedSection, groupedSections]);

  // KPI calculations — TY reflects gridRows (filtered), PP/LY reflect scope-level rows
  const totalCoupons   = gridRows.length;
  const totalAmount    = gridRows.reduce((s, c) => s + c.coupon_amount, 0);
  const avgPerCoupon   = totalCoupons > 0 ? totalAmount / totalCoupons : 0;
  const uniqueProducts = new Set(gridRows.map((c) => c.product_code)).size;
  const uniqueSubDepts = new Set(gridRows.map((c) => c.sub_department_description)).size;
  const vendorCount    = gridRows.filter((c) => c.vendor_coupon === 1).length;
  const storeCount     = gridRows.filter((c) => c.store_coupon === 1).length;

  const ppTotalAmount = priorRows.reduce((s, c) => s + c.coupon_amount, 0);
  const ppTotalCount  = priorRows.length;
  const lyTotalAmount = lyRows.reduce((s, c) => s + c.coupon_amount, 0);
  const lyTotalCount  = lyRows.length;

  const pctDelta = (ty: number, prior: number) =>
    prior > 0 ? ((ty - prior) / prior) * 100 : null;
  const fmtDelta = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  const deltaClass = (pct: number | null) =>
    pct === null ? "neutral" : pct >= 0 ? "up" : "dn";

  const ppAmtDelta = pctDelta(totalAmount, ppTotalAmount);
  const lyAmtDelta = pctDelta(totalAmount, lyTotalAmount);

  // Header
  const groupName    = selectedGroup?.group_name ?? "Group";
  const headerTitle  = isGroup ? (selectedKey ? selectedStoreName : groupName) : storeName;
  const headerSuffix = selectedKey ? "— All Coupons" : isGroup ? "— All Stores" : "— All Coupons";

  const buildSaleId = (row: { storeid: number; sale_id: number; terminal: string; sale_date: string }) => {
    const [y, m, d] = row.sale_date.split("T")[0].split("-");
    return `${row.storeid}-${row.sale_id}-${row.terminal}-${+m}-${+d}-${y}`;
  };

  const handleRowClick = (row: any) => {
    const saleId = buildSaleId(row);
    if (saleId === selectedSaleId) return;
    setSelectedSaleId(saleId);
    dispatch(setTransactionDrillDown([]));
    getCashierTransaction(context.url, context.token, row.sale_date, saleId, row.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions = [...j.transaction].map((item: any) => ({
            ...item,
            transaction_id: item.sale_id.split("-")[1],
            qty: item.qty ?? 0,
          }));
          dispatch(setTransactionDrillDown([transactions]));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleBack = () => {
    setSelectedSaleId("");
    dispatch(setTransactionDrillDown([]));
  };

  const exportTransaction = () => {
    if (!txLines.length) return;
    const headers = ["Line", "Description", "Qty", "Sale Type", "Total", "Coupon Amount"];
    const rows = txLines.map((item: any) => [
      item.line_number,
      `"${(item.product_description ?? "").replace(/"/g, '""')}"`,
      item.qty ?? "",
      item.sale_type ?? "",
      item.is_coupon === 1 ? "" : (item.total_sales ?? ""),
      item.is_coupon === 1 ? (item.coupon_amount ?? "") : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const txId = txMeta?.transaction_id ?? txMeta?.sale_id?.split("-")[1] ?? "tx";
    const store = txMeta?.store_name?.replace(/\s+/g, "_") ?? "store";
    const date = txMeta?.sale_date?.split("T")[0] ?? "";
    a.href = url;
    a.download = `transaction_${store}_${date}_${txId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Transaction data
  const txLines: any[] = Array.isArray(lp.transactionDrillDown?.[0]) ? lp.transactionDrillDown[0] : [];
  const txMeta         = txLines[0] ?? null;
  const saleLines      = txLines.filter((r: any) => r.sale_type === "Sale" && r.is_coupon !== 1);
  const couponLines    = txLines.filter((r: any) => r.is_coupon === 1);
  const txGross        = saleLines.reduce((s: number, r: any) => s + (r.total_sales ?? 0), 0);
  const txCoupons      = couponLines.reduce((s: number, r: any) => s + (r.coupon_amount ?? 0), 0);
  const txTax          = saleLines.reduce((s: number, r: any) => s + (r.total_rounded_tax ?? 0), 0);
  const txNet          = txGross - txCoupons;
  const txTotal        = txNet + txTax;

  // Export
  const exportTitle    = selectedKey ? (isGroup ? selectedStoreName : selectedKey) : "All Coupons";
  const exportSubtitle = `${isGroup ? groupName : storeName} · ${dateRangeLabel}`;

  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white" style={{ flex: 1, minWidth: 0 }}>
      {exportOpen && (
        <CouponsExportModal
          onClose={() => setExportOpen(false)}
          title={exportTitle}
          subtitle={exportSubtitle}
          rows={visibleRows}
        />
      )}

      {/* Navy header */}
      <div className="flex-shrink-0 px-4 py-[11px] flex items-start justify-between" style={{ background: "#1e2a4a" }}>
        <div className="text-[13px] font-semibold text-white">
          {headerTitle}
          <span className="ml-2 text-[11px] font-normal" style={{ color: "rgba(255,255,255,0.55)" }}>
            {headerSuffix} · {dateRangeLabel}
          </span>
        </div>
        {totalCoupons > 0 && (
          <div className="flex items-center gap-3 mt-0.5">
            <button onClick={() => setExportOpen(true)} title="Export CSV" className="text-white/60 hover:text-white transition-colors">
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/15" />
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] uppercase tracking-wide text-white/45">Records</span>
              <span className="text-[13px] font-medium text-white">{totalCoupons}</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI strip — 3-col trend */}
      {!state.isFetching && totalCoupons > 0 && (
        <>
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            {/* TY */}
            <div className="px-4 py-2.5">
              <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">TY coupons</div>
              <div className="text-[8px] text-content/55 italic mb-1">{dateRangeLabel}</div>
              <div className="text-[14px] font-semibold text-content">{formatCurrency2(totalAmount)}</div>
              <div className="text-[10px] text-content/50 mt-0.5">{totalCoupons} uses · avg {formatCurrency2(avgPerCoupon)}</div>
            </div>
            {/* Prior period */}
            <div className="px-4 py-2.5">
              <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">Prior period</div>
              <div className="text-[8px] text-content/55 italic mb-1">{ppLabel}</div>
              {state.isComparisonFetching ? (
                <div className="text-[11px] text-content/40 italic">Loading…</div>
              ) : ppTotalAmount > 0 ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[14px] font-semibold text-content">{formatCurrency2(ppTotalAmount)}</span>
                    {ppAmtDelta !== null && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ppAmtDelta >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {fmtDelta(ppAmtDelta)}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-content/50 mt-0.5">{ppTotalCount} uses</div>
                </>
              ) : (
                <div className="text-[11px] text-content/40 italic">No data</div>
              )}
            </div>
            {/* Last year */}
            <div className="px-4 py-2.5">
              <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">Last year</div>
              <div className="text-[8px] text-content/55 italic mb-1">{lyLabel}</div>
              {state.isComparisonFetching ? (
                <div className="text-[11px] text-content/40 italic">Loading…</div>
              ) : lyTotalAmount > 0 ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[14px] font-semibold text-content">{formatCurrency2(lyTotalAmount)}</span>
                    {lyAmtDelta !== null && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${lyAmtDelta >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {fmtDelta(lyAmtDelta)}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-content/50 mt-0.5">{lyTotalCount} uses</div>
                </>
              ) : (
                <div className="text-[11px] text-content/40 italic">No data</div>
              )}
            </div>
          </div>
          {/* Secondary metrics row */}
          <div className="grid grid-cols-5 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
            {[
              { label: "Avg / coupon",  value: formatCurrency2(avgPerCoupon) },
              { label: "Products",      value: String(uniqueProducts) },
              { label: "Sub depts",     value: String(uniqueSubDepts) },
              { label: "Vendor",        value: String(vendorCount) },
              { label: "Store",         value: String(storeCount) },
            ].map(({ label, value }) => (
              <div key={label} className="px-3 py-1.5">
                <div className="text-[9px] font-medium uppercase tracking-wide text-content/60">{label}</div>
                <div className="text-[12px] font-semibold text-content">{value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {state.isFetching && (
        <div className="flex-1 relative min-h-0"><LoadingIndicator message="Loading coupons..." /></div>
      )}

      {!state.isFetching && (
        <div className="flex flex-1 min-h-0">

          {/* ── Left: group overview cards ── */}
          <div className="flex flex-col border-r border-gray-100 flex-shrink-0" style={{ width: "26%" }}>

            {/* Tab bar */}
            <div className="flex overflow-x-auto border-b border-gray-100 flex-shrink-0">
              {GROUP_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setGroupTab(t.key)}
                  className={`px-3 py-2 text-[10px] font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                    groupTab === t.key
                      ? "border-[#1e2a4a] text-content"
                      : "border-transparent text-content/50 hover:text-content/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Flat list — Orders style */}
            <div className="flex-1 overflow-y-auto thin-scrollbar">
              {/* All row */}
              <button
                onClick={() => setSelectedSection(null)}
                className={`w-full flex gap-2 items-start px-2.5 py-2 border-b border-gray-100 text-left transition-colors ${
                  selectedSection === null ? "bg-white" : "hover:bg-gray-50"
                }`}
                style={selectedSection === null ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
              >
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#1e2a4a]">All</span>
                    <span className="text-[9px] text-content/55 flex-shrink-0">{totalCoupons} coupons</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#1e2a4a]">{formatCurrency2(totalAmount)}</span>
                </div>
              </button>

              {groupedSections.map((section) => {
                const isSel = selectedSection === section.key;
                const ppData = allSections.pp[groupTab].get(section.key);
                const lyData = allSections.ly[groupTab].get(section.key);
                const ppDelta = pctDelta(section.total, ppData?.total ?? 0);
                const lyDelta = pctDelta(section.total, lyData?.total ?? 0);
                // Prefer LY if available, else PP
                const displayDelta = lyDelta ?? ppDelta;
                const displaySuffix = lyData?.total ? "LY" : ppData?.total ? "PP" : null;
                return (
                  <button
                    key={section.key}
                    onClick={() => setSelectedSection(isSel ? null : section.key)}
                    className={`w-full flex gap-2 items-start px-2.5 py-2 border-b border-gray-100 text-left transition-colors ${
                      isSel ? "bg-white" : "hover:bg-gray-50"
                    }`}
                    style={isSel ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
                  >
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#1e2a4a] truncate">{section.label}</span>
                        <span className="text-[9px] text-content/55 flex-shrink-0">{section.count}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-[10px] font-semibold text-[#1e2a4a]">{formatCurrency2(section.total)}</span>
                        {!state.isComparisonFetching && displayDelta !== null && displaySuffix && (
                          <span className={`text-[9px] font-semibold px-1 py-0.5 rounded flex-shrink-0 ${
                            displayDelta >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}>
                            {fmtDelta(displayDelta)} {displaySuffix}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right: coupon grid or transaction detail ── */}
          <div className="flex flex-col flex-1 min-w-0">
            {selectedSaleId ? (
              /* Transaction detail */
              <>
                <div className="flex-shrink-0 px-3 py-2 flex items-center justify-between border-b border-gray-100 bg-white">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1 text-content/50 hover:text-content transition-colors text-[11px]"
                    >
                      <ArrowLeftIcon className="w-3 h-3" />
                      Back to coupons
                    </button>
                    <div className="w-px h-4 bg-gray-200" />
                    <div>
                      <div className="text-[12px] font-semibold text-content">
                        {txMeta?.cashier_name}
                        <span className="ml-2 text-[10px] font-normal text-content/50">— Terminal {txMeta?.terminal}</span>
                      </div>
                      <div className="text-[10px] text-content/45">
                        {txMeta?.sale_start_time?.replace(/(\d{2})(\d{2})(\d{2})/, "$1:$2")} – {txMeta?.sale_end_time?.replace(/(\d{2})(\d{2})(\d{2})/, "$1:$2")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {txLines.length > 0 && (
                      <button
                        onClick={exportTransaction}
                        title="Export transaction CSV"
                        className="text-content/40 hover:text-content transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className="w-px h-5 bg-gray-200" />
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-wide text-content/45">Trans</div>
                      <div className="text-[12px] font-medium text-content">{txMeta?.transaction_id ?? txMeta?.sale_id?.split("-")[1]}</div>
                    </div>
                    <div className="w-px h-5 bg-gray-200" />
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-wide text-content/45">Items</div>
                      <div className="text-[12px] font-medium text-content">{txLines.length}</div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 px-3 py-1.5 flex items-center gap-3 border-b border-gray-100 bg-gray-50">
                  <span className="text-[11px] font-semibold text-content">{txMeta?.store_name}</span>
                  <span className="text-[10px] text-content/50">{txMeta?.store_address}, {txMeta?.store_city} {txMeta?.store_state}</span>
                  <div className="flex-1" />
                  <span className="text-[10px] font-medium text-content/70">{formatDate(txMeta?.sale_date?.split("T")[0])}</span>
                </div>
                {txLines.length === 0 ? (
                  <div className="flex-1 relative min-h-0">
                    <LoadingIndicator message="Loading transaction..." />
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-auto thin-scrollbar">
                      <table className="w-full border-collapse text-[11px]">
                        <thead>
                          <tr className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                            <th className="px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 text-right w-7">#</th>
                            <th className="px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 text-left">Description</th>
                            <th className="px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 text-right">Qty</th>
                            <th className="px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 text-right">Total</th>
                            <th className="px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 text-center w-14">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {txLines.map((item: any, i: number) => {
                            const isCpn    = item.is_coupon === 1;
                            const isTender = item.sale_type === "Tender";
                            return (
                              <tr key={i} style={isCpn ? { background: "rgba(234,179,8,0.07)" } : undefined}>
                                <td className="px-2 py-1.5 text-right tabular-nums text-content/50">{item.line_number}</td>
                                <td className="px-2 py-1.5 text-content truncate max-w-0" style={{ maxWidth: 200 }}>{item.product_description}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-content/60">{item.qty > 0 ? item.qty : "—"}</td>
                                <td className={`px-2 py-1.5 text-right tabular-nums font-semibold ${isCpn ? "text-amber-700" : "text-content"}`}>
                                  {formatCurrency2(isCpn ? item.coupon_amount : item.total_sales)}
                                </td>
                                <td className="px-2 py-1.5 text-center">
                                  {isCpn ? (
                                    <span className="text-[9px] font-semibold rounded px-1.5 py-0.5" style={{ background: "rgba(234,179,8,0.15)", color: "#92600a" }}>Cpn</span>
                                  ) : isTender ? (
                                    <span className="text-[9px] font-semibold rounded px-1.5 py-0.5" style={{ background: "rgba(37,99,235,0.1)", color: "#1d4ed8" }}>Tender</span>
                                  ) : (
                                    <span className="text-[9px] font-semibold rounded px-1.5 py-0.5" style={{ background: "rgba(22,163,74,0.1)", color: "#15803d" }}>Sale</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex-shrink-0 flex items-center justify-end gap-4 px-3 py-2 border-t border-gray-100 bg-gray-50">
                      {txCoupons > 0 && (
                        <div className="text-[10px] text-amber-700/70">Coupons <span className="font-medium ml-1">-{formatCurrency2(txCoupons)}</span></div>
                      )}
                      <div className="text-[10px] text-content/50">Tax <span className="text-content font-medium ml-1">{formatCurrency2(txTax)}</span></div>
                      <div className="text-[10px] text-content/50">Net <span className="text-content font-medium ml-1">{formatCurrency2(txNet)}</span></div>
                      <div className="text-[11px] text-content/70 font-medium">Total <span className="text-content ml-1">{formatCurrency2(txTotal)}</span></div>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Coupon grid */
              <>
                {gridRows.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-[12px] text-content/50">No coupons to display</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto thin-scrollbar">
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                          <th className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 text-left">Product</th>
                          <th className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 text-left">Sub dept</th>
                          <th className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 text-left">Date</th>
                          <th className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 text-left">Cashier</th>
                          {isGroup && <th className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 text-left">Store</th>}
                          <th className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content/70 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {gridRows.map((row: any, i: number) => (
                          <tr
                            key={`${row.sale_id}-${i}`}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleRowClick(row)}
                          >
                            <td className="px-3 py-2 text-content font-medium truncate max-w-0" style={{ maxWidth: 180 }}>{row.product_description}</td>
                            <td className="px-3 py-2 text-content/60 whitespace-nowrap">{row.sub_department_description}</td>
                            <td className="px-3 py-2 text-content/60 whitespace-nowrap">{formatDate(row.sale_date.split("T")[0])}</td>
                            <td className="px-3 py-2 text-content/60 whitespace-nowrap">{row.cashier_name}</td>
                            {isGroup && <td className="px-3 py-2 text-content/60 whitespace-nowrap">{row.store_number}</td>}
                            <td className="px-3 py-2 text-right tabular-nums font-semibold text-content">{formatCurrency2(row.coupon_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponDetailPanel;
