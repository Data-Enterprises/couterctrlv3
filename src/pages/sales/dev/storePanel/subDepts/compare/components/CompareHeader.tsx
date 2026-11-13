// Components
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";

interface CompareHeaderProps {
  /** "pepsi 16 items, 13 not sold since last year | coke 31 items, 5 not sold since last year" */
  line: string;
  canExport: boolean;
  onExport: () => void;
  onClose: () => void;
}

/** The compare bar: each list's size and how much of it has not sold since
 *  last year, then export and close. */
const CompareHeader = ({
  line,
  canExport,
  onExport,
  onClose,
}: CompareHeaderProps) => (
  <div className="flex items-center gap-2.5 h-12 px-[18px] bg-custom-white border-b border-line_field flex-shrink-0">
    <span className="truncate min-w-0 text-[12.5px] font-semibold text-content">
      {line}
    </span>
    <button
      data-help="compare-export"
      disabled={!canExport}
      onClick={onExport}
      title="Download both lists, where each item stands and the totals, as a CSV file"
      aria-label="Export CSV"
      className="cc-btn-outline ml-auto w-[30px] h-[30px] px-0 rounded-md bg-custom-white flex items-center justify-center text-content flex-shrink-0 disabled:opacity-40"
    >
      <ArrowDownTrayIcon className="w-4 h-4" />
    </button>
    <button
      onClick={onClose}
      title="Close the comparison"
      aria-label="Close the comparison"
      className="cc-btn-outline w-[30px] h-[30px] px-0 rounded-md bg-custom-white flex items-center justify-center text-content flex-shrink-0"
    >
      <XMarkIcon className="w-4 h-4" />
    </button>
  </div>
);

export default CompareHeader;
