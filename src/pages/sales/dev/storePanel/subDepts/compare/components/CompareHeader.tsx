// Components
import { XMarkIcon } from "@heroicons/react/20/solid";
import CompareListName from "./CompareListName";

interface CompareHeaderProps {
  deptName: string;
  names: [string, string];
  counts: [number, number];
  canExport: boolean;
  onExport: () => void;
  onClose: () => void;
}

/** The compare bar, light like the panel under it: the two lists face to
 *  face, the department, export and close. */
const CompareHeader = ({ deptName, names, counts, canExport, onExport, onClose }: CompareHeaderProps) => (
  <div className="flex items-center gap-2.5 h-12 px-[18px] bg-custom-white border-b border-line_field flex-shrink-0">
    <CompareListName side="A" name={names[0]} count={counts[0]} />
    <span className="px-1 text-[12px] text-content flex-shrink-0">vs</span>
    <CompareListName side="B" name={names[1]} count={counts[1]} />
    <span className="w-px h-[18px] mx-1.5 bg-line_field flex-shrink-0" />
    <span className="truncate min-w-0 text-[12.5px] text-content">{deptName}</span>
    <button
      data-help="compare-export"
      disabled={!canExport}
      onClick={onExport}
      title="Download both lists, where each item stands and the totals, as a CSV file"
      className="cc-btn-outline ml-auto h-[30px] px-3 rounded-md text-[12.5px] text-content flex-shrink-0 disabled:opacity-40"
    >
      Export CSV
    </button>
    <button
      onClick={onClose}
      title="Close the comparison"
      aria-label="Close the comparison"
      className="cc-btn-outline w-[30px] h-[30px] px-0 rounded-md flex items-center justify-center text-content flex-shrink-0"
    >
      <XMarkIcon className="w-4 h-4" />
    </button>
  </div>
);

export default CompareHeader;
