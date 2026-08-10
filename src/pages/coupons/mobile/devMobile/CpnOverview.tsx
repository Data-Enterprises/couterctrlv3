import { useMemo, useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../../utils";
import type { CouponItem } from "../../../../interfaces";
import type { GroupTab } from "./CouponsMobileDev";
import MobilePerfHeader from "../../../../components/mobile/MobilePerfHeader";
import HeaderIconButton from "../../../../components/HeaderIconButton";
import { COUPONS_INFO } from "../../couponsInfo";
import CpnExportSheet from "./CpnExportSheet";
import CpnSortToggle from "./CpnSortToggle";
import { sumCouponAmount } from "../../../../utils/couponValue";

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

  const totalAmount = sumCouponAmount(coupons);
  const avgPerCoupon = coupons.length > 0 ? totalAmount / coupons.length : 0;
  const uniqueProducts = new Set(coupons.map((c) => c.product_code)).size;

  const sections = useMemo(() => {
    const build = (
      getKey: (c: CouponItem) => string,
      getLabel: (c: CouponItem) => string,
      chrono = false,
    ) => {
      // Rows collected first, then totalled — a running sum can't dedupe the
      // transaction-level coupon fallback. See utils/couponValue.
      const map = new Map<string, { label: string; rows: CouponItem[] }>();
      coupons.forEach((c) => {
        const k = getKey(c);
        const cur = map.get(k);
        if (cur) {
          cur.rows.push(c);
          return;
        }
        map.set(k, { label: getLabel(c), rows: [c] });
      });
      const rows = Array.from(map.entries()).map(([key, data]) => ({
        key,
        label: data.label,
        count: data.rows.length,
        total: sumCouponAmount(data.rows),
      }));
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
          new Date(c.sale_date.split("T")[0] + "T12:00:00").toLocaleDateString(
            "en-US",
            {
              weekday: "short",
              month: "numeric",
              day: "numeric",
            },
          ),
        true,
      );
    return build(
      (c) => c.cashier_name || "unknown",
      (c) => c.cashier_name || "Unknown cashier",
    );
  }, [coupons, selectedTab, sortMetric]);

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden">
      <MobilePerfHeader
        pageName="Coupons"
        storeName={storeName}
        dateRange={dateRangeLabel}
        onBack={onBack}
        // Single-store searches have no store list behind them, so back already
        // lands on the search card — a second button to the same place would
        // just be noise.
        onSearch={isGroup ? onSearch : undefined}
        info={COUPONS_INFO}
        actions={
          <>
            <CpnSortToggle value={sortMetric} onChange={onSortMetric} />
            <HeaderIconButton
              onClick={() => setExportOpen(true)}
              title="Export CSV"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            </HeaderIconButton>
          </>
        }
      />

      {/* KPI strip */}
      <div className="flex-shrink-0 grid grid-cols-4 bg-custom-white border-b border-gray-100">
        {[
          { label: "Coupons", value: String(coupons.length) },
          { label: "Total", value: formatCurrency2(totalAmount) },
          { label: "Avg", value: formatCurrency2(avgPerCoupon) },
          { label: "Products", value: String(uniqueProducts) },
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

      {/* Section list — pb-14 clears the fixed bottom tab bar. */}
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-14">
        {sections.map(({ key, label, count, total }) => (
          <button
            key={key}
            onClick={() => onSectionSelect(key, label)}
            className="w-full flex items-center px-3 py-2.5 bg-custom-white border-b border-gray-100 text-left active:bg-gray-50 gap-3"
          >
            <span className="text-[12px] font-medium text-content flex-1 truncate">
              {label}
            </span>
            <span className="text-[10px] text-content/85 flex-shrink-0">
              {count}
            </span>
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
