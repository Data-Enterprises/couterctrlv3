// Utils
import { severityHeaderBgClass } from "../../../../../utils/severity";

// Interfaces
import type { Severity } from "../../../../../utils/severity";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface TransactionTitleBarProps {
  tier: Severity;
  storeName: string;
  selectedSaleType: string;
  dateLabel: string;
  canExport: boolean;
  onExport: () => void;
}

/** The panel's title bar, tinted to the store's grade, with the export. */
const TransactionTitleBar = ({
  tier,
  storeName,
  selectedSaleType,
  dateLabel,
  canExport,
  onExport,
}: TransactionTitleBarProps) => {
  return (
    <div className={`relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 flex-shrink-0 ${severityHeaderBgClass[tier]}`}>
      <p className="text-custom-white text-[13px] font-bold leading-tight justify-self-start">
        {storeName}
        <span className="ml-2 text-[11px] font-normal text-custom-white/70">
          — {selectedSaleType}
        </span>
      </p>
      <span className="text-custom-white text-[13px] font-bold justify-self-center">
        Weekly LP Report · {dateLabel}
      </span>
      <div className="flex items-center gap-2 justify-self-end">
        {canExport && (
          <button
            onClick={onExport}
            title="Export CSV"
            className="text-custom-white transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionTitleBar;
