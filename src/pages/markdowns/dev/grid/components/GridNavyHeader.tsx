// Hooks
import { useMarkdownsCtx } from "../../hooks";

// Utils
import { sortLabel } from "../utils";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";

interface GridNavyHeaderProps {
  onExport: () => void;
}

/** The grid's navy header, as Receivers' detail panel has it: the page and
 *  the order its rows are in, then export. */
const GridNavyHeader = ({ onExport }: GridNavyHeaderProps) => {
  const ctx = useMarkdownsCtx();
  return (
    <div className="flex-shrink-0 px-4 py-[11px] flex items-start justify-between bg-brand_navy">
      <div className="text-[13px] cc-navy-title min-w-0 truncate">
        Markdowns
        <span className="ml-2 text-[11px] font-normal text-custom-white">
          — {sortLabel(ctx.sort)}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-0.5 flex-shrink-0">
        <button
          data-help="export"
          onClick={onExport}
          title="Export CSV"
          className="text-custom-white/95 hover:text-custom-white transition-colors flex-shrink-0"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default GridNavyHeader;
