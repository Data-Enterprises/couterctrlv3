// Hooks
import { useMarkdownsCtx } from "../../hooks";

// Components
import BackButton from "../../../../../components-dev/BackButton";
import PageInfoButton from "../../../../../components-dev/PageInfoButton";

interface ConfigHeaderProps {
  onOpenSearch: () => void;
}

/** The left panel's two-row navy header: "Markdowns" and Back,
 *  then the store or group searched and its dates. */
const ConfigHeader = ({ onOpenSearch }: ConfigHeaderProps) => {
  const ctx = useMarkdownsCtx();
  return (
    <div className="bg-brand_navy px-3 pt-2 pb-2.5 flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-custom-white font-medium text-[13px] flex-1 truncate">
          Markdowns
        </span>
        <BackButton onClick={onOpenSearch} helpAnchor="search" />
        <PageInfoButton page="markdowns" />
      </div>
      <div className="pt-1.5 mt-1 border-t border-custom-white/[0.08] flex items-baseline gap-2">
        <span className="text-custom-white/95 text-[12px] truncate">{ctx.shown.scope}</span>
        <span className="text-custom-white/95 text-[12px] flex-shrink-0 ml-auto">
          {ctx.shown.startDate} – {ctx.shown.endDate}
        </span>
      </div>
    </div>
  );
};

export default ConfigHeader;
