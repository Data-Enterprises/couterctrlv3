import {
  buildDataGapCsv,
  getWeeklyGapCount,
  type WeeklyDataGaps,
  type PeriodGap,
} from "../../shared/ledgerUtils";
import { downloadCsv } from "../../../../utils/csvExport";
import BottomSheet from "../../../../components/BottomSheet";
import {
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";

interface DataGapReportProps {
  gaps: WeeklyDataGaps;
  storeName: string;
  storeNumber: string;
  onClose: () => void;
}

const fmtDayLabel = (dateStr: string) =>
  new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });

const PeriodSection = ({ period }: { period: PeriodGap }) => {
  const clean = period.missingDates.length === 0;
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <div
        className={`flex items-center justify-between px-2.5 py-1.5 text-[10px] font-medium ${
          clean
            ? "bg-severity_healthy_bg text-severity_healthy_text"
            : "bg-severity_watch_bg text-severity_watch_text"
        }`}
      >
        <span>{period.label}</span>
        <span className="flex items-center gap-1">
          {clean ? (
            <CheckCircleIcon className="w-2.5 h-2.5 flex-shrink-0" />
          ) : (
            <ExclamationTriangleIcon className="w-2.5 h-2.5 flex-shrink-0" />
          )}
          {clean
            ? `All ${period.totalDays} days present`
            : `${period.missingDates.length} of ${period.totalDays} missing`}
        </span>
      </div>
      {!clean && (
        <div className="flex flex-wrap gap-1.5 p-2">
          {period.missingDates.map((d) => (
            <span
              key={d}
              className="flex items-center gap-1 text-[10px] font-medium text-severity_watch_text bg-severity_watch_bg px-1.5 py-0.5 rounded"
            >
              <ExclamationTriangleIcon className="w-2.5 h-2.5 flex-shrink-0" />
              {fmtDayLabel(d)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const DataGapReport = ({
  gaps,
  storeName,
  storeNumber,
  onClose,
}: DataGapReportProps) => {
  const gapCount = getWeeklyGapCount(gaps);

  const handleExport = () => {
    const csv = buildDataGapCsv(storeName, storeNumber, gaps);
    downloadCsv(csv, `data-gap-report_${storeNumber}.csv`);
  };

  return (
    <BottomSheet onClose={onClose}>
      <div className="flex items-start justify-between gap-3 px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
        <div>
          <div className="text-[14px] font-semibold text-content">
            Missing sales report
          </div>
          <p className="text-[10px] text-content mt-0.5 leading-snug">
            {gapCount === 0
              ? "No missing sales reports — every date lines up across all three periods."
              : "TY dates missing their matching day of week in LW or LY are excluded from that comparison."}
          </p>
        </div>
        <button
          onClick={handleExport}
          title="Export CSV"
          className="text-content/85 flex-shrink-0 pt-0.5"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-2 p-3">
          <PeriodSection period={gaps.tw} />
          <PeriodSection period={gaps.lw} />
          <PeriodSection period={gaps.ly} />
        </div>
      </div>
    </BottomSheet>
  );
};

export default DataGapReport;
