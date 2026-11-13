// Components
import { XMarkIcon } from "@heroicons/react/20/solid";
import HeaderIconButton from "../../../../../../../components-dev/HeaderIconButton";
import CompareListName from "./CompareListName";

interface CompareHeaderProps {
  deptName: string;
  names: [string, string];
  counts: [number, number];
  canExport: boolean;
  onExport: () => void;
  onClose: () => void;
}

/** The drawer's navy bar on one line: the two lists face to face, the
 *  department, export and close. */
const CompareHeader = ({ deptName, names, counts, canExport, onExport, onClose }: CompareHeaderProps) => (
  <div className="flex items-center gap-2.5 px-4 py-2 bg-brand_navy flex-shrink-0">
    <CompareListName side="A" name={names[0]} count={counts[0]} />
    <span className="text-[11px] text-custom-white flex-shrink-0">vs</span>
    <CompareListName side="B" name={names[1]} count={counts[1]} />
    <span className="truncate min-w-0 text-[11px] text-custom-white">| {deptName}</span>
    <button
      data-help="compare-export"
      disabled={!canExport}
      onClick={onExport}
      title="Download both lists, where each item stands and the totals, as a CSV file"
      className="cc-navy-link ml-auto h-[22px] px-2 rounded border border-custom-white/35 text-[11px] font-semibold flex-shrink-0 disabled:opacity-40"
    >
      Export CSV
    </button>
    <HeaderIconButton onClick={onClose} title="Close the comparison">
      <XMarkIcon className="w-3.5 h-3.5" />
    </HeaderIconButton>
  </div>
);

export default CompareHeader;
