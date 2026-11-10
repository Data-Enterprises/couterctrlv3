// Hooks
import { useCouponSalesCtx } from "../../hooks";

// Utils
import { TABS } from "../utils";

// Interfaces
import type { CouponBreakdown } from "../../../../../features/dev/devCouponSalesSlice";

interface BreakdownTabsProps {
  onTab: (key: CouponBreakdown) => void;
}

/** What the left column lists: sub departments, cashiers or items. */
const BreakdownTabs = ({ onTab }: BreakdownTabsProps) => {
  const { breakdown } = useCouponSalesCtx();
  return (
    <div data-help="tabs" className="flex items-center border-b border-gray-100 px-3 flex-shrink-0">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onTab(t.key)}
          className={`px-3 py-1.5 text-[12px] font-medium border-b-2 transition-colors ${
            breakdown === t.key
              ? "border-brand_navy text-content"
              : "border-transparent text-content"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default BreakdownTabs;
