// Components
import { ArrowPathIcon } from "@heroicons/react/16/solid";

interface ConfigFooterProps {
  /** Rows every filter keeps. */
  matched: number;
  /** Rows the search loaded. */
  total: number;
  /** How many filters are narrowing the list. */
  active: number;
  onClear: () => void;
}

/** The left panel's foot: how many lines the filters keep, and Clear. */
const ConfigFooter = ({ matched, total, active, onClear }: ConfigFooterProps) => (
  <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-2 flex-shrink-0">
    <span className="text-[11px] text-content/95 flex-1">
      {matched.toLocaleString()} of {total.toLocaleString()} lines
    </span>
    <button
      onClick={onClear}
      disabled={active === 0}
      title="Clear every filter"
      className="flex items-center gap-1 rounded border border-content/20 px-2 py-1 text-[11px] font-medium text-content/95 transition-colors hover:text-content hover:border-content/35 disabled:opacity-50"
    >
      <ArrowPathIcon className="w-3 h-3" />
      Clear{active > 0 ? ` (${active})` : ""}
    </button>
  </div>
);

export default ConfigFooter;
