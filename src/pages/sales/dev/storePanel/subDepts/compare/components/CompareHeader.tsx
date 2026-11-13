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

/** The compare bar: the two lists face to face, the department, export and
 *  close. */
const CompareHeader = ({ deptName, names, counts, canExport, onExport, onClose }: CompareHeaderProps) => (
  <div className="flex items-center gap-2.5 h-12 px-[18px] bg-brand_navy flex-shrink-0">
    <CompareListName side="A" name={names[0]} count={counts[0]} />
    <span className="px-1 text-[12px] text-custom-white flex-shrink-0">vs</span>
    <CompareListName side="B" name={names[1]} count={counts[1]} />
    <span className="w-px h-[18px] mx-1.5 bg-custom-white/30 flex-shrink-0" />
    <span className="truncate min-w-0 text-[12.5px] text-custom-white">{deptName}</span>
    <button
      data-help="compare-export"
      disabled={!canExport}
      onClick={onExport}
      title="Download both lists, where each item stands and the totals, as a CSV file"
      className="cc-navy-link ml-auto h-[30px] px-3 rounded-md border border-custom-white/35 text-[12.5px] font-semibold flex-shrink-0 disabled:opacity-40"
    >
      Export CSV
    </button>
    <HeaderIconButton onClick={onClose} title="Close the comparison" className="w-[30px] h-[30px]">
      <XMarkIcon className="w-4 h-4" />
    </HeaderIconButton>
  </div>
);

export default CompareHeader;
