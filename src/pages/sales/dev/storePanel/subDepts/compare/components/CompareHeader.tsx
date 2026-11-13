// Interfaces
import type { BarList } from "../interfaces";

// Components
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import CompareBarList from "./CompareBarList";

interface CompareHeaderProps {
  lists: [BarList, BarList];
  canExport: boolean;
  onExport: () => void;
  onClose: () => void;
}

/** The compare bar: the two lists as pills, each with its size and how much of
 *  it has not sold since last year, then export and close. */
const CompareHeader = ({
  lists,
  canExport,
  onExport,
  onClose,
}: CompareHeaderProps) => (
  <div className="flex items-center gap-2.5 h-12 px-[18px] bg-custom-white border-b border-line_field flex-shrink-0">
    <CompareBarList list={lists[0]} />
    <span className="text-[12px] text-content flex-shrink-0">vs</span>
    <CompareBarList list={lists[1]} />
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
