// Components
import BackButton from "../../../../components/BackButton";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface CashiersHeaderProps {
  scopeLabel: string;
  startDate: string;
  endDate: string;
  exception: string;
  /** Transactions past the cap that were not loaded. */
  truncated: number;
  onBack: () => void;
  onExport: () => void;
}

/** The explorer's navy title bar: what was searched, the cap note, Back to the
 *  search, and Export CSV. */
const CashiersHeader = ({
  scopeLabel,
  startDate,
  endDate,
  exception,
  truncated,
  onBack,
  onExport,
}: CashiersHeaderProps) => (
  <div className="bg-brand_navy px-3 py-2 flex-shrink-0 flex items-center gap-3">
    <span className="cc-navy-title text-[13px] flex-shrink-0">Cashiers</span>
    <span className="text-custom-white/95 text-[12px] truncate">
      {scopeLabel} · {startDate} – {endDate} · {exception}
    </span>
    <div className="flex-1" />
    {truncated > 0 && (
      <span className="text-custom-white/95 text-[10.5px] flex-shrink-0">
        capped — {truncated} older transactions not loaded
      </span>
    )}
    <BackButton onClick={onBack} helpAnchor="search" />
    <button
      onClick={onExport}
      title="Export CSV"
      className="w-[20px] h-[20px] flex items-center justify-center rounded border border-custom-white/20 cc-navy-link hover:border-custom-white/40 flex-shrink-0"
    >
      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
    </button>
  </div>
);

export default CashiersHeader;
