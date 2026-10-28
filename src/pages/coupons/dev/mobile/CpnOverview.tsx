import { useMemo, useState } from "react";
import type { CouponItem } from "../../../../interfaces";
import type { GroupTab } from "./CouponsMobile";
import MobilePerfDetail from "../../../../components-dev/mobile/MobilePerfDetail";
import CpnExportSheet from "./CpnExportSheet";
import CpnListControls from "./CpnListControls";
import CpnSectionRow from "./CpnSectionRow";
import CpnTotalsCard from "./CpnTotalsCard";
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
  /** The store list on a group search, the search card on a single store —
   *  `CouponsMobile` decides which, the same way it decides whether a store
   *  list exists at all. A drill has one way back, so there is no separate
   *  search control here. */
  onBack: () => void;
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
}: Props) => {
  const [exportOpen, setExportOpen] = useState(false);

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
    <>
      {/* A drill level, so it wears the same wrapper every other mobile drill
          does — the back control, the scope line and start-at-the-top all come
          with it. The three group-bys ARE its tabs: Sub dept, Date and
          Cashier are three readings of one week, which is exactly what this
          component's tab row is for.

          Back goes to the store list on a group search and to the search card
          on a single store, because a single store has no list behind it —
          the same fork `CouponsMobile` already makes to decide whether the
          store list is shown at all. */}
      <MobilePerfDetail
        tabs={TABS}
        active={selectedTab}
        onTab={onTabChange}
        scopeName={storeName}
        when={dateRangeLabel}
        backLabel={isGroup ? "Back to stores" : "Back to search"}
        onBack={onBack}
        levelKey={`coupons|${storeName}|${selectedTab}`}
      >
        <div className="flex flex-col gap-3">
          <CpnTotalsCard coupons={coupons} caption="Coupon value this week" />

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            <CpnListControls
              value={sortMetric}
              onChange={onSortMetric}
              onExport={() => setExportOpen(true)}
            />

            {sections.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12.5px] text-content/95">
                No coupons to display
              </div>
            ) : (
              sections.map(({ key, label, count, total }) => (
                <CpnSectionRow
                  key={key}
                  label={label}
                  count={count}
                  total={total}
                  onClick={() => onSectionSelect(key, label)}
                />
              ))
            )}
          </section>
        </div>
      </MobilePerfDetail>

      {exportOpen && (
        <CpnExportSheet
          onClose={() => setExportOpen(false)}
          title={storeName}
          subtitle={dateRangeLabel}
          rows={coupons}
        />
      )}
    </>
  );
};

export default CpnOverview;
