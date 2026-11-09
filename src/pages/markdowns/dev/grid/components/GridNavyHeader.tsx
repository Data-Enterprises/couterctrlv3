// Hooks
import { useMarkdownsCtx } from "../../hooks";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";

interface GridNavyHeaderProps {
  /** Rows the filters keep. */
  shown: number;
  onExport: () => void;
}

/** The grid's navy header, as Receivers' detail panel has it: the page and
 *  its scope, then export and the row counts. */
const GridNavyHeader = ({ shown, onExport }: GridNavyHeaderProps) => {
  const ctx = useMarkdownsCtx();
  return (
    <div className="flex-shrink-0 px-4 py-[11px] flex items-start justify-between bg-brand_navy">
      <div className="text-[13px] font-semibold text-custom-white min-w-0 truncate">
        Markdowns
        <span className="ml-2 text-[11px] font-normal text-custom-white">
          — {ctx.scopeLabel} · {ctx.startDate} – {ctx.endDate}
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
        <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <span className="text-[10px] uppercase tracking-wide text-custom-white">Shown</span>
          <span className="text-[13px] font-medium text-custom-white">{shown.toLocaleString()}</span>
        </div>
        <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <span className="text-[10px] uppercase tracking-wide text-custom-white">Loaded</span>
          <span className="text-[13px] font-medium text-custom-white">
            {ctx.markdowns.length.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GridNavyHeader;
