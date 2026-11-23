// Components
import Stat from "./Stat";

interface HourReportProps {
  /** The picked hour's title and figures, or null when none is picked. */
  report: { title: string; stats: [string, string][] } | null;
}

/** The Hours tab's right column: the picked hour's figures. */
const HourReport = ({ report }: HourReportProps) => (
  <div className="flex-1 min-w-0 flex flex-col min-h-0">
    {!report ? (
      <div className="flex-1 flex items-center justify-center text-[11px] text-content/95">
        Select an hour to see its report
      </div>
    ) : (
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        <div className="px-3 py-2 border-b border-line_hair bg-fill_soft">
          <span className="text-[12px] font-bold text-content">
            {report.title}
          </span>
        </div>
        {report.stats.map(([label, value]) => (
          <Stat key={label} label={label} value={value} />
        ))}
      </div>
    )}
  </div>
);

export default HourReport;
