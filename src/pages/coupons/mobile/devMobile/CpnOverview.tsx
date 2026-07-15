import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, ChevronLeftIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../../utils";
import type { CouponItem } from "../../../../interfaces";
import type { GroupTab } from "./CouponsMobileDev";
import CpnExportSheet from "./CpnExportSheet";

interface Props {
  coupons: CouponItem[];
  storeName: string;
  dateRangeLabel: string;
  isGroup: boolean;
  sortMetric: "amount" | "qty";
  onSortMetric: (v: "amount" | "qty") => void;
  selectedTab: GroupTab;
  onTabChange: (tab: GroupTab) => void;
  onSectionSelect: (key: string, label: string) => void;
  onBack: () => void;
  onSearch: () => void;
}

const TABS: { key: GroupTab; label: string }[] = [
  { key: "subdept", label: "Sub dept" },
  { key: "date", label: "Date" },
  { key: "cashier", label: "Cashier" },
];

const CpnOverview = ({
  coupons,
  storeName,
  dateRangeLabel,
  isGroup,
  sortMetric,
  onSortMetric,
  selectedTab,
  onTabChange,
  onSectionSelect,
  onBack,
  onSearch,
}: Props) => {
  const [exportOpen, setExportOpen] = useState(false);

  const totalAmount = coupons.reduce((s, c) => s + c.coupon_amount, 0);
  const avgPerCoupon = coupons.length > 0 ? totalAmount / coupons.length : 0;
  const uniqueProducts = new Set(coupons.map((c) => c.product_code)).size;

  const sections = useMemo(() => {
    const build = (
      getKey: (c: CouponItem) => string,
      getLabel: (c: CouponItem) => string,
      chrono = false,
    ) => {
      const map = new Map<string, { label: string; count: number; total: number }>();
      coupons.forEach((c) => {
        const k = getKey(c);
        const cur = map.get(k) ?? { label: getLabel(c), count: 0, total: 0 };
        map.set(k, { ...cur, count: cur.count + 1, total: cur.total + c.coupon_amount });
      });
      const rows = Array.from(map.entries()).map(([key, data]) => ({ key, ...data }));
      if (chrono) return rows.sort((a, b) => a.key.localeCompare(b.key));
      return sortMetric === "qty"
        ? rows.sort((a, b) => b.count - a.count)
        : rows.sort((a, b) => b.total - a.total);
    };

    if (selectedTab === "subdept")
      return build(
        (c) => c.sub_department_description,
        (c) => c.sub_department_description,
      );
    if (selectedTab === "date")
      return build(
        (c) => c.sale_date.split("T")[0],
        (c) =>
          new Date(c.sale_date.split("T")[0] + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "short",
            month: "numeric",
            day: "numeric",
          }),
        true,
      );
    return build(
      (c) => c.cashier_name || "unknown",
      (c) => c.cashier_name || "Unknown cashier",
    );
  }, [coupons, selectedTab, sortMetric]);

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden">
      <div className="flex-shrink-0 px-3 pt-2 pb-2.5" style={{ background: "#1e2a4a" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 min-w-0">
            <button
              onClick={onBack}
              className="text-custom-white/85 hover:text-custom-white transition-colors flex-shrink-0 mt-0.5"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-custom-white truncate">{storeName}</div>
              <div className="text-[10px] mt-0.5 text-custom-white/85">
                {dateRangeLabel}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex border border-custom-white/20 rounded overflow-hidden">
              {(["amount", "qty"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onSortMetric(m)}
                  className={`px-2 py-1 text-[10px] font-medium ${
                    sortMetric === m ? "bg-custom-white/20 text-custom-white" : "text-custom-white/85"
                  }`}
                >
                  {m === "amount" ? "Amt" : "Qty"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setExportOpen(true)}
              className="w-[28px] h-[28px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/85"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
            {isGroup && (
              <button
                onClick={onSearch}
                className="w-[28px] h-[28px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/85"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {/* <div className="flex items-baseline gap-3 mt-2 pt-1.5 border-t border-white/[0.08]">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-custom-white/85">Records</span>
            <span className="text-[12px] font-semibold text-custom-white">{coupons.length}</span>
          </div>
          <span className="text-[10px] font-medium text-custom-white/85">{formatCurrency2(totalAmount)} total</span>
        </div> */}
      </div>

      {/* KPI strip */}
      <div className="flex-shrink-0 grid grid-cols-4 bg-custom-white border-b border-gray-100">
        {[
          { label: "Coupons", value: String(coupons.length) },
          { label: "Total", value: formatCurrency2(totalAmount) },
          { label: "Avg", value: formatCurrency2(avgPerCoupon) },
          { label: "Products", value: String(uniqueProducts) },
        ].map(({ label, value }) => (
          <div key={label} className="px-2.5 py-1.5 border-r border-gray-100 last:border-r-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">{label}</div>
            <div className="text-[12px] font-bold text-content mt-0.5 tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 flex bg-custom-white border-b border-gray-100">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${
              selectedTab === t.key
                ? "border-[#1e2a4a] text-content font-semibold"
                : "border-transparent text-content/85"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {sections.map(({ key, label, count, total }) => (
          <button
            key={key}
            onClick={() => onSectionSelect(key, label)}
            className="w-full flex items-center px-3 py-2.5 bg-custom-white border-b border-gray-100 text-left active:bg-gray-50 gap-3"
          >
            <span className="text-[12px] font-medium text-content flex-1 truncate">{label}</span>
            <span className="text-[10px] text-content/85 flex-shrink-0">{count}</span>
            <span className="text-[11px] font-semibold text-content flex-shrink-0 tabular-nums">
              {formatCurrency2(total)}
            </span>
            <svg
              className="w-4 h-4 text-content/85 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
        {sections.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
            No coupons to display
          </div>
        )}
      </div>

      {exportOpen && (
        <CpnExportSheet
          onClose={() => setExportOpen(false)}
          title={storeName}
          subtitle={dateRangeLabel}
          rows={coupons}
        />
      )}
    </div>
  );
};

export default CpnOverview;
