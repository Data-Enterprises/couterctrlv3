// Components
import PageInfoButton from "../../../../components-dev/PageInfoButton";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface AdminHeaderProps {
  /** Store activity is open, so its counts and Export CSV show. */
  showActivity: boolean;
  storeCount: number;
  missingCount: number;
  onExport: () => void;
}

/** Admin's navy title bar. On Store activity it also carries the store and
 *  missing counts and the Export CSV button. */
const AdminHeader = ({
  showActivity,
  storeCount,
  missingCount,
  onExport,
}: AdminHeaderProps) => (
  <div className="bg-brand_navy px-3 py-2 flex-shrink-0 flex items-center gap-3">
    <span className="cc-navy-title text-[13px] flex-shrink-0">Admin</span>
    {showActivity && (
      <>
        <div className="flex-1" />
        <span className="text-custom-white text-[10px] uppercase tracking-wide">
          Stores
        </span>
        <span className="text-custom-white text-[12px] font-medium">
          {storeCount}
        </span>
        <div className="w-px h-3.5 bg-custom-white/15" />
        <span className="text-custom-white text-[10px] uppercase tracking-wide">
          Missing
        </span>
        <span className="text-custom-white text-[12px] font-medium">
          {missingCount}
        </span>
        <button
          data-help="export"
          onClick={onExport}
          disabled={storeCount === 0}
          title="Export CSV"
          className="w-[20px] h-[20px] flex items-center justify-center rounded border border-custom-white/20 cc-navy-link hover:border-custom-white/40 flex-shrink-0 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
        </button>
      </>
    )}
    {!showActivity && <div className="flex-1" />}
    <PageInfoButton page="admin" title="About Admin" />
  </div>
);

export default AdminHeader;
