// Hooks
import { useMarkdownsCtx } from "../../hooks";

// Components
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";

interface ConfigHeaderProps {
  onOpenSearch: () => void;
}

/** The left panel's two-row navy header: "Configuration" and the magnifier,
 *  then the store or group searched and its dates. */
const ConfigHeader = ({ onOpenSearch }: ConfigHeaderProps) => {
  const ctx = useMarkdownsCtx();
  return (
    <div className="bg-brand_navy px-3 pt-2 pb-2.5 flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-custom-white font-medium text-[13px] flex-1 truncate">
          Configuration
        </span>
        <button
          data-help="search"
          onClick={onOpenSearch}
          title="New search"
          className="text-custom-white/95 hover:text-custom-white transition-colors flex-shrink-0"
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="pt-1.5 mt-1 border-t border-custom-white/[0.08] flex items-baseline gap-2">
        <span className="text-custom-white/95 text-[12px] truncate">{ctx.scopeLabel}</span>
        <span className="text-custom-white/95 text-[12px] flex-shrink-0 ml-auto">
          {ctx.startDate} – {ctx.endDate}
        </span>
      </div>
    </div>
  );
};

export default ConfigHeader;
