// Components
import { ClockIcon } from "@heroicons/react/24/outline";

interface ExportSummaryProps {
  /** Stores, the file's shape and its format, in a line. */
  title: string;
  /** How many filters are narrowing something. */
  filterCount: number;
  /** How many personal columns the file carries. */
  pii: number;
  exportError: string | null;
}

/**
 * What will be built, as counts rather than lists: the panel on the left
 * already names the keys, measures and filters, and the table shows the
 * columns themselves.
 */
const ExportSummary = ({
  title,
  filterCount,
  pii,
  exportError,
}: ExportSummaryProps) => (
  <div className="flex-1 min-w-0">
    <div className="text-[13px] cc-navy-title">
      {title}
      {filterCount > 0 && (
        <span className="font-normal text-custom-white/95">
          {" "}
          · {filterCount} filter{filterCount === 1 ? "" : "s"}
        </span>
      )}
    </div>
    {pii > 0 && (
      <div className="text-[11.5px] text-custom-white/95 mt-1">
        Includes {pii} personal column{pii === 1 ? "" : "s"}
      </div>
    )}
    {exportError && (
      <div className="flex items-center gap-1.5 mt-1.5 text-[11.5px] text-severity_watch_bg">
        <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
        {exportError}
      </div>
    )}
  </div>
);

export default ExportSummary;
