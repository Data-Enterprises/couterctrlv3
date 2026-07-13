import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowDownTrayIcon, ArrowLeftIcon, MagnifyingGlassIcon, ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch, useStoreName } from "../../hooks";
import { formatCurrency2, formatDate } from "../../utils";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import CouponsExportModal from "./CouponsExportModal";
import { getCashierTransaction } from "../../api/lossPrevention";
import { setTransactionDrillDown } from "../../features/lossPreventionSlice";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";
import ThresholdFilter, { type ThresholdValue } from "../../components/filters/ThresholdFilter";
import SelectFilter from "../../components/filters/SelectFilter";

interface CouponDetailPanelProps {
  selectedKey: string; // sub dept name (single store) | store ID string (group) | "" for all
  sortMetric: "amount" | "qty";
}

type GroupTab = "subdept" | "date" | "cashier";

const GROUP_TABS: { key: GroupTab; label: string }[] = [
  { key: "subdept", label: "Sub dept" },
  { key: "date",    label: "Date" },
  { key: "cashier", label: "Cashier" },
];

type GroupedSection = { key: string; label: string; count: number; total: number; rows: any[] };


const fmtThreshold = (t: ThresholdValue | null, prefix = ""): string => {
  if (!t) return "";
  const sym = t.op === "gt" ? ">" : t.op === "lt" ? "<" : "=";
  return `${sym} ${prefix}${t.amount}`;
};

interface ColFilterProps {
  label: string;
  active: boolean;
  appliedDisplay?: string;
  align?: "left" | "right";
  onApply: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

const ColFilter = ({ label, active, appliedDisplay, align = "left", onApply, onClear, children }: ColFilterProps) => {
  const [open, setOpen]       = useState(false);
  const [hovered, setHovered] = useState(false);
  const wrapRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleApply   = () => { onApply(); setOpen(false); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleApply(); };
  const labelColor    = open || active ? "#1e2a4a" : hovered ? "rgba(30,42,74,0.65)" : "rgba(30,42,74,0.4)";

  return (
    <div ref={wrapRef} className={`relative flex items-center gap-1 min-w-0 ${align === "right" ? "justify-end" : ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors select-none flex-shrink-0"
        style={{ color: labelColor }}
      >
        {label}
      </button>
      {active && appliedDisplay && (
        <span className="flex items-center gap-0.5 rounded px-1 py-0.5 flex-shrink-0" style={{ background: "rgba(30,42,74,0.08)", maxWidth: 90 }}>
          <span className="text-[8px] font-medium text-[#1e2a4a] truncate">{appliedDisplay}</span>
          {onClear && (
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="text-[8px] text-[#1e2a4a]/50 hover:text-[#1e2a4a] leading-none flex-shrink-0 ml-0.5"
            >✕</button>
          )}
        </span>
      )}
      {open && <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />}
      {open && (
        <div
          onKeyDown={handleKeyDown}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            zIndex: 200,
            background: "white",
            border: "1px solid rgba(30,42,74,0.12)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            padding: "10px 10px 8px",
            minWidth: 176,
          }}
        >
          {children}
          <button
            onClick={handleApply}
            className="mt-2 w-full flex items-center justify-center gap-1.5 rounded py-1 text-[10px] font-medium"
            style={{ background: "#1e2a4a", color: "white" }}
          >
            <MagnifyingGlassIcon className="w-3 h-3" />
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

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

  // Column filter draft state
  const [draftProduct,  setDraftProduct]  = useState("");
  const [draftUpc,      setDraftUpc]      = useState("");
  const [draftSubDept,  setDraftSubDept]  = useState("");
  const [draftAmount,   setDraftAmount]   = useState<ThresholdValue | null>(null);
  const [expandedCoupons, setExpandedCoupons] = useState<Set<string>>(new Set());
  // Applied (live) filter state
  const [appliedProduct,  setAppliedProduct]  = useState("");
  const [appliedUpc,      setAppliedUpc]      = useState("");
  const [appliedSubDept,  setAppliedSubDept]  = useState("");
  const [appliedAmount,   setAppliedAmount]   = useState<ThresholdValue | null>(null);
  const selectedStoreName = isGroup && selectedKey
    ? (assignedStores.find((s) => s.storeid === Number(selectedKey))?.store_name ?? selectedKey)
    : "";

  const fmtRangePart = (mdy: string, withYear = false) => {
    const [m, d, y] = mdy.split("/");
    return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
  };
  const dateRangeLabel = `${fmtRangePart(search.startDate)} – ${fmtRangePart(search.endDate, true)}`;

  const visibleRows = useMemo(() => {
    if (!selectedKey) return state.coupons;
    return state.coupons.filter((c) => String(c.storeid) === selectedKey);
  }, [state.coupons, selectedKey]);

  // Reset selection when scope or tab changes
  useEffect(() => {
    setSelectedSection(null);
    setSelectedSaleId("");
    dispatch(setTransactionDrillDown([]));
  }, [selectedKey, groupTab]);

  // Clear transaction + column filters when section changes
  useEffect(() => {
    setSelectedSaleId("");
    setDraftProduct(""); setAppliedProduct("");
    setDraftUpc(""); setAppliedUpc("");
    setDraftSubDept(""); setAppliedSubDept("");
    setDraftAmount(null); setAppliedAmount(null);
    setExpandedCoupons(new Set());
    dispatch(setTransactionDrillDown([]));
  }, [selectedSection]);

  // Pre-compute all groupings so tab switching is instant
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

    return {
      subdept: build(visibleRows, (r) => r.sub_department_description, (r) => r.sub_department_description),
      date:    build(visibleRows, (r) => r.sale_date.split("T")[0], (r) => new Date(r.sale_date.split("T")[0] + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }), true),
      cashier: build(visibleRows, (r) => r.cashier_name || "unknown", (r) => r.cashier_name || "Unknown cashier"),
    };
  }, [visibleRows, sortMetric]);

  const groupedSections = allSections[groupTab];

  // Rows shown in the right grid — all or filtered by selected card
  const gridRows = useMemo(() => {
    if (!selectedSection) return visibleRows;
    return groupedSections.find((s) => s.key === selectedSection)?.rows ?? [];
  }, [visibleRows, selectedSection, groupedSections]);

  // Unique values for select filters
  const uniqueSubDeptOptions = useMemo(() => {
    const depts = Array.from(new Set(gridRows.map((r: any) => r.sub_department_description as string))).sort();
    return depts.map((d) => ({ label: d, value: d }));
  }, [gridRows]);

  // Column-filtered rows for the grid
  const filteredGridRows = useMemo(() => {
    return gridRows.filter((r: any) => {
      if (appliedProduct && !r.product_description.toLowerCase().includes(appliedProduct.toLowerCase())) return false;
      if (appliedUpc && !String(r.product_code != null ? Math.round(Number(r.product_code)) : "").includes(appliedUpc)) return false;
      if (appliedSubDept && r.sub_department_description !== appliedSubDept) return false;
      if (appliedAmount) {
        const amt = r.coupon_amount;
        if (appliedAmount.op === "gt" && !(amt > appliedAmount.amount)) return false;
        if (appliedAmount.op === "lt" && !(amt < appliedAmount.amount)) return false;
        if (appliedAmount.op === "eq" && amt !== appliedAmount.amount)  return false;
      }
      return true;
    });
  }, [gridRows, appliedProduct, appliedUpc, appliedSubDept, appliedAmount]);

  // Aggregated coupon rows for the grid (grouped by UPC/product)
  const aggCouponRows = useMemo(() => {
    type AggUse = { sale_id: string; sale_date: string; cashier_name: string; storeid: number; store_number: string; terminal: string; count: number; amount: number; row: any };
    type AggRow = { product_code: string; product_description: string; sub_department_description: string; count: number; total: number; uses: AggUse[] };
    const map = new Map<string, AggRow>();
    filteredGridRows.forEach((r: any) => {
      const key = r.product_code != null ? String(Math.round(Number(r.product_code))) : r.product_description;
      if (!map.has(key)) {
        map.set(key, { product_code: key, product_description: r.product_description, sub_department_description: r.sub_department_description, count: 0, total: 0, uses: [] });
      }
      const agg = map.get(key)!;
      agg.count++;
      agg.total += r.coupon_amount;
      const existing = agg.uses.find((u) => u.sale_id === r.sale_id);
      if (existing) {
        existing.count++;
        existing.amount += r.coupon_amount;
      } else {
        agg.uses.push({ sale_id: r.sale_id, sale_date: r.sale_date, cashier_name: r.cashier_name, storeid: r.storeid, store_number: r.store_number, terminal: r.terminal, count: 1, amount: r.coupon_amount, row: r });
      }
    });
    const rows = Array.from(map.values());
    return sortMetric === "qty" ? rows.sort((a, b) => b.count - a.count) : rows.sort((a, b) => b.total - a.total);
  }, [filteredGridRows, sortMetric]);

  const toggleCoupon = (key: string) => {
    setExpandedCoupons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Top KPI strip — scoped to selected store (or all stores if none selected)
  const totalCoupons   = visibleRows.length;
  const totalAmount    = visibleRows.reduce((s, c) => s + c.coupon_amount, 0);
  const avgPerCoupon   = totalCoupons > 0 ? totalAmount / totalCoupons : 0;
  const uniqueProducts = new Set(visibleRows.map((c) => c.product_code)).size;
  const uniqueSubDepts = new Set(visibleRows.map((c) => c.sub_department_description)).size;
  const vendorCount    = visibleRows.filter((c) => c.vendor_coupon === 1).length;

  // Inner KPI strip — scoped to the selected section's rows
  const secCoupons   = gridRows.length;
  const secAmount    = gridRows.reduce((s, c) => s + c.coupon_amount, 0);
  const secAvg       = secCoupons > 0 ? secAmount / secCoupons : 0;
  const secProducts  = new Set(gridRows.map((c) => c.product_code)).size;

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
          <span className="ml-2 text-[11px] font-normal text-white">
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
              <span className="text-white text-[10px] uppercase tracking-wide">Records</span>
              <span className="text-[13px] font-medium text-white">{totalCoupons}</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI strip */}
      {!state.isFetching && totalCoupons > 0 && (
        <div className="grid grid-cols-6 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          {[
            { label: "Coupons",      value: String(totalCoupons) },
            { label: "Total amt",    value: formatCurrency2(totalAmount) },
            { label: "Avg / coupon", value: formatCurrency2(avgPerCoupon) },
            { label: "Products",     value: String(uniqueProducts) },
            { label: "Sub depts",    value: String(uniqueSubDepts) },
            { label: "Vendor",       value: String(vendorCount) },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 pt-2.5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wide text-content">{label}</div>
              <div className="text-[14px] font-bold text-content">{value}</div>
            </div>
          ))}
        </div>
      )}

      {state.isFetching && (
        <div className="flex-1 relative min-h-0"><LoadingIndicator message="Loading coupons..." /></div>
      )}

      {!state.isFetching && (
        <>
          {/* Tab bar — full width row */}
          <div className="flex items-center border-b border-gray-100 flex-shrink-0">
            {GROUP_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setGroupTab(t.key)}
                className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  groupTab === t.key
                    ? "border-[#1e2a4a] text-content"
                    : "border-transparent text-content/50 hover:text-content/70"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 min-h-0">

          {/* ── Left: group overview cards ── */}
          <div className="flex flex-col border-r border-gray-100 flex-shrink-0" style={{ width: "26%" }}>

            {/* Section cards */}
            <div className="flex-1 overflow-y-auto thin-scrollbar">
              {groupedSections.map((section) => {
                const isSel = selectedSection === section.key;
                return (
                  <button
                    key={section.key}
                    onClick={() => setSelectedSection(isSel ? null : section.key)}
                    className={`w-full px-3 py-2 border-b border-gray-100 last:border-0 gap-2 text-left transition-colors ${isSel ? "bg-white" : "hover:bg-gray-50"}`}
                    style={isSel ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium flex-1 truncate text-content">{section.label}</span>
                      <div className="flex items-baseline gap-1.5 flex-shrink-0">
                        <span className="text-[12px] font-semibold text-content">{formatCurrency2(section.total)}</span>
                        <span className="text-[11px] text-content/60">{section.count}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right: coupon grid or transaction detail ── */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Selected section header */}
            {selectedSection && !selectedSaleId && (() => {
              const sec = groupedSections.find((s) => s.key === selectedSection);
              if (!sec) return null;
              const tabLabel = GROUP_TABS.find((t) => t.key === groupTab)?.label ?? groupTab;
              return (
                <>
                <div className="flex items-baseline gap-1.5 px-3 py-1.5 bg-gray-100 border-b border-gray-100 flex-shrink-0">
                  <span className="text-[12px] font-semibold text-content truncate">{sec.label}</span>
                  <span className="text-[11px] text-content/45 italic flex-shrink-0">{tabLabel} · {dateRangeLabel}</span>
                </div>
                <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 flex-shrink-0">
                  {[
                    { label: "Coupons",      value: String(secCoupons) },
                    { label: "Total amt",    value: formatCurrency2(secAmount) },
                    { label: "Avg / coupon", value: formatCurrency2(secAvg) },
                    { label: "Products",     value: String(secProducts) },
                  ].map(({ label, value }) => (
                    <div key={label} className="px-4 pt-2.5 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-content">{label}</div>
                      <div className="text-[13px] font-bold text-content">{value}</div>
                    </div>
                  ))}
                </div>
                </>
              );
            })()}
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
                      <table className="w-full border-collapse text-[12px]">
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
                    <span className="text-[12px] text-content/50">{selectedSection ? "No coupons to display" : "Select a group to drill down"}</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto thin-scrollbar">
                    <table className="w-full border-collapse text-[12px]">
                      <thead>
                        <tr className="sticky top-0 bg-gray-100 border-b border-gray-100 z-10">
                          <th className="px-3 py-2 text-left w-32" style={{ overflow: "visible" }}>
                            <ColFilter label="UPC" active={!!appliedUpc} appliedDisplay={appliedUpc}
                              onApply={() => setAppliedUpc(draftUpc)}
                              onClear={() => { setAppliedUpc(""); setDraftUpc(""); }}>
                              <input autoFocus style={{ width: "100%", fontSize: 11, border: "1px solid rgba(30,42,74,0.15)", borderRadius: 4, padding: "4px 7px", outline: "none", color: "var(--color-text-primary)", background: "rgba(30,42,74,0.03)" }} placeholder="Search UPC…" value={draftUpc} onChange={(e) => setDraftUpc(e.target.value)} />
                            </ColFilter>
                          </th>
                          <th className="px-3 py-2 text-left" style={{ overflow: "visible" }}>
                            <ColFilter label="Product" active={!!appliedProduct} appliedDisplay={appliedProduct}
                              onApply={() => setAppliedProduct(draftProduct)}
                              onClear={() => { setAppliedProduct(""); setDraftProduct(""); }}>
                              <input autoFocus style={{ width: "100%", fontSize: 11, border: "1px solid rgba(30,42,74,0.15)", borderRadius: 4, padding: "4px 7px", outline: "none", color: "var(--color-text-primary)", background: "rgba(30,42,74,0.03)" }} placeholder="Search product…" value={draftProduct} onChange={(e) => setDraftProduct(e.target.value)} />
                            </ColFilter>
                          </th>
                          <th className="px-3 py-2 text-left" style={{ overflow: "visible", width: "10.2%" }}>
                            <ColFilter label="Sub dept" active={!!appliedSubDept} appliedDisplay={appliedSubDept}
                              onApply={() => setAppliedSubDept(draftSubDept)}
                              onClear={() => { setAppliedSubDept(""); setDraftSubDept(""); }}>
                              <SelectFilter options={uniqueSubDeptOptions} value={draftSubDept} onChange={setDraftSubDept} placeholder="All sub depts" className="w-full" />
                            </ColFilter>
                          </th>
                          <th className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content text-right whitespace-nowrap" style={{ width: "8%" }}>Trans</th>
                          <th className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content text-right w-12">Count</th>
                          <th className="px-3 py-2 text-right w-24" style={{ overflow: "visible" }}>
                            <ColFilter label="Total" active={!!appliedAmount} appliedDisplay={fmtThreshold(appliedAmount, "$")} align="right"
                              onApply={() => setAppliedAmount(draftAmount)}
                              onClear={() => { setAppliedAmount(null); setDraftAmount(null); }}>
                              <ThresholdFilter value={draftAmount} onChange={setDraftAmount} prefix="$" placeholder="Amount" showOp showClear stretch className="w-full" />
                            </ColFilter>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {aggCouponRows.map((agg) => {
                          const isExp = expandedCoupons.has(agg.product_code);
                          return (
                            <>
                              <tr
                                key={agg.product_code}
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleCoupon(agg.product_code)}
                              >
                                <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                                  <div className="flex items-center gap-1.5">
                                    {isExp
                                      ? <ChevronDownIcon className="w-3 h-3 text-content/30 flex-shrink-0" />
                                      : <ChevronRightIcon className="w-3 h-3 text-content/30 flex-shrink-0" />
                                    }
                                    <span className="text-content">{agg.product_code || "—"}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-content font-medium truncate max-w-0" style={{ maxWidth: 180 }}>{agg.product_description}</td>
                                <td className="px-3 py-2 text-content whitespace-nowrap">{agg.sub_department_description}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-content">{agg.uses.length}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-content">{agg.count}</td>
                                <td className="px-3 py-2 text-right tabular-nums font-semibold text-content">{formatCurrency2(agg.total)}</td>
                              </tr>
                              {isExp && (
                                <>
                                  <tr className="bg-gray-100/70">
                                    <td className="pl-8 pr-3 py-1" />
                                    <td className="px-3 py-1 text-[8px] font-semibold uppercase tracking-wide text-content">Cashier</td>
                                    <td className="px-3 py-1 text-[8px] font-semibold uppercase tracking-wide text-content">Date</td>
                                    <td className="px-3 py-1 text-[8px] font-semibold uppercase tracking-wide text-content">Trans ID</td>
                                    <td className="px-3 py-1 text-[8px] font-semibold uppercase tracking-wide text-content text-right">Qty</td>
                                    <td className="px-3 py-1 text-[8px] font-semibold uppercase tracking-wide text-content text-right">Amount</td>
                                  </tr>
                                  {agg.uses.map((use) => (
                                    <tr
                                      key={use.sale_id}
                                      className="bg-gray-50/60 cursor-pointer hover:bg-blue-50/40 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); handleRowClick(use.row); }}
                                    >
                                      <td className="pl-8 pr-3 py-1.5" />
                                      <td className="px-3 py-1.5 text-[10px] text-content truncate max-w-0" style={{ maxWidth: 180 }}>{use.cashier_name}</td>
                                      <td className="px-3 py-1.5 text-[10px] text-content whitespace-nowrap">{formatDate(use.sale_date.split("T")[0])}</td>
                                      <td className="px-3 py-1.5 text-[10px] text-content whitespace-nowrap tabular-nums">{use.sale_id}</td>
                                      <td className="px-3 py-1.5 text-right tabular-nums text-[10px] text-content">{use.count}</td>
                                      <td className="px-3 py-1.5 text-right tabular-nums text-[10px] font-semibold text-content">{formatCurrency2(use.amount)}</td>
                                    </tr>
                                  ))}
                                </>
                              )}
                            </>
                          );
                        })}
                        {aggCouponRows.length === 0 && (
                          <tr><td colSpan={6} className="px-3 py-6 text-center text-[11px] text-content">No results match the current filters</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default CouponDetailPanel;
