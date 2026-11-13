// Components
import { XMarkIcon } from "@heroicons/react/20/solid";
import HeaderIconButton from "../../../../../../../components-dev/HeaderIconButton";

interface CompareHeaderProps {
  /** "Comparing pepsi to coke". */
  title: string;
  canExport: boolean;
  onExport: () => void;
  onClearA: () => void;
  onClose: () => void;
}

/** The panel's navy bar: what is being compared, export, drop A, and close. */
const CompareHeader = ({ title, canExport, onExport, onClearA, onClose }: CompareHeaderProps) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-brand_navy flex-shrink-0">
    <span className="cc-navy-title text-[13px] truncate min-w-0 mr-auto">{title}</span>
    <button
      data-help="compare-export"
      disabled={!canExport}
      onClick={onExport}
      title="Download both lists and their totals as a CSV file"
      className="h-[22px] px-2.5 rounded bg-custom-white text-brand_navy text-[11px] font-semibold flex-shrink-0 disabled:opacity-40"
    >
      Export CSV
    </button>
    <button onClick={onClearA} className="cc-navy-link h-[22px] px-1.5 text-[11px] font-medium flex-shrink-0">
      Clear A
    </button>
    <HeaderIconButton onClick={onClose} title="Close the comparison">
      <XMarkIcon className="w-3.5 h-3.5" />
    </HeaderIconButton>
  </div>
);

export default CompareHeader;
