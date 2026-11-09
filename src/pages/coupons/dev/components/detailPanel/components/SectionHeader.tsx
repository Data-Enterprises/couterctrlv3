// Utils
import { formatCurrency2 } from "../../../../../../utils";
import { GROUP_TABS } from "../utils";

// Interfaces
import type { GroupTab } from "../../../interfaces";
import type { GroupedSection } from "../interfaces";

interface SectionHeaderProps {
  groupedSections: GroupedSection[];
  selectedSection: string;
  groupTab: GroupTab;
  dateRangeLabel: string;
  secCoupons: number;
  secAmount: number;
  secAvg: number;
  secProducts: number;
}

/** The picked group's name and its four totals, above the grid. */
const SectionHeader = ({
  groupedSections,
  selectedSection,
  groupTab,
  dateRangeLabel,
  secCoupons,
  secAmount,
  secAvg,
  secProducts,
}: SectionHeaderProps) => {
  const sec = groupedSections.find(
    (s) => s.key === selectedSection,
  );
  if (!sec) return null;
  const tabLabel =
    GROUP_TABS.find((t) => t.key === groupTab)?.label ??
    groupTab;
  return (
    <>
      <div className="flex items-baseline gap-1.5 px-3 py-1.5 bg-gray-100 border-b border-gray-100 flex-shrink-0">
        <span className="text-[12px] font-semibold text-content truncate">
          {sec.label}
        </span>
        <span className="text-[11px] text-content/45 italic flex-shrink-0">
          {tabLabel} · {dateRangeLabel}
        </span>
      </div>
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 flex-shrink-0">
        {[
          { label: "Coupons", value: String(secCoupons) },
          {
            label: "Total amt",
            value: formatCurrency2(secAmount),
          },
          {
            label: "Avg / coupon",
            value: formatCurrency2(secAvg),
          },
          { label: "Products", value: String(secProducts) },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 pt-2.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              {label}
            </div>
            <div className="text-[13px] font-bold text-content">
              {value}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default SectionHeader;
