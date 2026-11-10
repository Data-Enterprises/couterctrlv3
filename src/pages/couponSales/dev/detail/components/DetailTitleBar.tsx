// Hooks
import { useAppDispatch } from "../../../../../hooks";

// Redux
import { setCouponExportOpen } from "../../../../../features/dev/devCouponSalesSlice";

// Utils
import { couponHeaderBgClass } from "../../utils";

// Interfaces
import type { CouponTier } from "../../../../../features/dev/devCouponSalesSlice";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";

interface DetailTitleBarProps {
  storeTier: CouponTier;
  storeLabel: string;
  rangeLabel: string;
}

/** The panel's title bar, tinted to the store's grade, with the export. */
const DetailTitleBar = ({ storeTier, storeLabel, rangeLabel }: DetailTitleBarProps) => {
  const dispatch = useAppDispatch();
  return (
    <div
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 flex-shrink-0 ${couponHeaderBgClass[storeTier]}`}
    >
      <span className="text-custom-white text-[13px] font-bold truncate justify-self-start">
        {storeLabel}
      </span>
      <span className="text-custom-white text-[13px] font-bold justify-self-center whitespace-nowrap">
        Coupon Performance · {rangeLabel}
      </span>
      <div className="flex items-center gap-3 justify-self-end">
        <button
          onClick={() => dispatch(setCouponExportOpen(true))}
          title="Export CSV"
          className="text-custom-white transition-colors"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DetailTitleBar;
