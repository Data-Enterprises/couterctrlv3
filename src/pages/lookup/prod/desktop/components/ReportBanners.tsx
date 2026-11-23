// Utils
import { formatUnits } from "../../utils";

// Interfaces
import type { TrendResult } from "../../interfaces";

// Components
import {
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";

interface ReportBannersProps {
  trend: TrendResult;
  weighed: boolean;
  /** Days since the item last sold. */
  activeGapDays: number;
}

/** The slowing and no-recent-sales notices, side by side. */
const ReportBanners = ({
  trend,
  weighed,
  activeGapDays,
}: ReportBannersProps) => (
  <div className="px-4 pt-3 flex items-center gap-2 flex-shrink-0">
    {trend.isSlowing && (
      <div className="flex-1 flex items-center gap-1.5 px-2.5 py-2 bg-severity_watch_bg rounded-lg min-w-0">
        <ArrowTrendingDownIcon className="w-4 h-4 text-severity_watch_text flex-shrink-0" />
        <span className="text-[11.5px] text-severity_watch_text truncate">
          Slowing down - {formatUnits(trend.firstHalfUnits, weighed)}
          {weighed ? "" : " units"} first week,{" "}
          {formatUnits(trend.secondHalfUnits, weighed)}
          {weighed ? "" : " units"} this week
        </span>
      </div>
    )}
    {activeGapDays >= 2 && (
      <div className="flex-1 flex items-center gap-1.5 px-2.5 py-2 bg-severity_critical_bg rounded-lg min-w-0">
        <ExclamationTriangleIcon className="w-4 h-4 text-severity_critical_text flex-shrink-0" />
        <span className="text-[11.5px] text-severity_critical_text truncate">
          No sales in the last {activeGapDays} days
        </span>
      </div>
    )}
  </div>
);

export default ReportBanners;
