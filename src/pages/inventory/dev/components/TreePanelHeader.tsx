// Interfaces
import type { HelpPage } from "../../../../constants/helpPages";

// Components
import BackButton from "../../../../components-dev/BackButton";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import PageInfoButton from "../../../../components-dev/PageInfoButton";
import HeaderIconButton from "../../../../components-dev/HeaderIconButton";

interface TreePanelHeaderProps {
  title: string;
  helpPage: HelpPage;
  storeName: string;
  dateLabel: string;
  onSearchOpen: () => void;
  onExportOpen: () => void;
}

/** The tree's navy header: the page, its store and dates, help, export and
 *  back to the search. */
const TreePanelHeader = ({
  title,
  helpPage,
  storeName,
  dateLabel,
  onSearchOpen,
  onExportOpen,
}: TreePanelHeaderProps) => (
  <div className="flex-shrink-0 px-4 py-[10px] flex items-center justify-between gap-3 bg-brand_navy">
    <div className="min-w-0">
      <div className="text-[14px] cc-navy-title leading-tight truncate">
        {title}
      </div>
      <div className="text-[11px] mt-0.5 text-custom-white truncate">
        {storeName} · {dateLabel}
      </div>
    </div>
    <div data-help="scope" className="flex items-center gap-1.5 flex-shrink-0">
      <PageInfoButton page={helpPage} />
      <HeaderIconButton onClick={onExportOpen} title="Export CSV">
        <ArrowDownTrayIcon className="h-3 w-3" />
      </HeaderIconButton>
      <BackButton onClick={onSearchOpen} />
    </div>
  </div>
);

export default TreePanelHeader;
