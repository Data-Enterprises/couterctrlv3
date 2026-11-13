// Components
import { XMarkIcon } from "@heroicons/react/20/solid";
import HeaderIconButton from "../../../../../../../components-dev/HeaderIconButton";
import CompareListName from "./CompareListName";

interface CompareHeaderProps {
  deptName: string;
  names: [string, string];
  metas: [string, string];
  canExport: boolean;
  onExport: () => void;
  onClose: () => void;
}

/** The drawer's navy header: what it compares, export and close, then the two
 *  lists face to face. */
const CompareHeader = ({ deptName, names, metas, canExport, onExport, onClose }: CompareHeaderProps) => (
  <div className="flex-shrink-0 bg-brand_navy px-[18px] pt-3 pb-3.5">
    <div className="flex items-center gap-2">
      <span className="cc-caps text-[11px] text-custom-white truncate min-w-0 mr-auto">
        Compare two lists | {deptName}
      </span>
      <button
        data-help="compare-export"
        disabled={!canExport}
        onClick={onExport}
        title="Download both lists, where each item stands and the totals, as a CSV file"
        className="cc-navy-link h-[26px] px-2.5 rounded-md border border-custom-white/35 text-[12px] font-semibold flex-shrink-0 disabled:opacity-40"
      >
        Export CSV
      </button>
      <HeaderIconButton onClick={onClose} title="Close the comparison">
        <XMarkIcon className="w-3.5 h-3.5" />
      </HeaderIconButton>
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3.5 mt-2.5">
      <CompareListName side="A" name={names[0]} meta={metas[0]} />
      <span className="text-[12px] text-custom-white">vs</span>
      <CompareListName side="B" name={names[1]} meta={metas[1]} />
    </div>
  </div>
);

export default CompareHeader;
