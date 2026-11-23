// Components
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface DetailTitleBarProps {
  categoryName: string;
  /** The week, or the selected day. */
  periodLabel: string;
  /** The bar's tint, from the category's grade. */
  bgClass: string;
  onExport: () => void;
}

/** The detail panel's title bar, tinted to the category's grade: its name,
 *  the period, and Export. */
const DetailTitleBar = ({
  categoryName,
  periodLabel,
  bgClass,
  onExport,
}: DetailTitleBarProps) => (
  <div
    className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 flex-shrink-0 ${bgClass}`}
  >
    <p className="text-custom-white text-[13px] font-bold leading-tight justify-self-start truncate">
      {categoryName}
    </p>
    <span className="text-custom-white text-[13px] font-bold justify-self-center">
      Category Performance · {periodLabel}
    </span>
    <button
      onClick={onExport}
      className="justify-self-end w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 cc-navy-link hover:border-custom-white/40"
      title="Export"
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
    </button>
  </div>
);

export default DetailTitleBar;
