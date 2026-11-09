// Hooks
import { useState } from "react";
import { useLoadMarkdowns, useMarkdownsCtx } from "./hooks";

// Components
import SearchCard from "../../../components-dev/SearchCard";
import SearchPopup from "../../../components-dev/SearchPopup";
import MarkdownsConfigPanel from "./config/MarkdownsConfigPanel";
import MarkdownsGrid from "./grid/MarkdownsGrid";
import MarkdownsExportModal from "./export/MarkdownsExportModal";

/** The Markdowns page: the search card until every page of markdowns has
 *  loaded, then the filters beside the grid. */
const Markdowns = () => {
  const ctx = useMarkdownsCtx();
  const load = useLoadMarkdowns();
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const searchCard = (onSearch: () => void) => (
    <SearchCard
      title="Markdowns"
      description="Select a store or group and date range to load its markdowns."
      buttonLabel="Load markdowns"
      onSearch={onSearch}
      loading={ctx.loading}
      loadingMessage={
        ctx.progress
          ? `Reading page ${ctx.progress.page} of ${ctx.progress.total}…`
          : "Loading markdowns…"
      }
      notice={ctx.notice ?? undefined}
    />
  );

  if (ctx.loading || ctx.markdowns.length === 0) return searchCard(load);

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-3">
      <MarkdownsConfigPanel onOpenSearch={() => setSearchOpen(true)} />
      <MarkdownsGrid onExport={() => setExportOpen(true)} />

      {searchOpen && (
        <SearchPopup onClose={() => setSearchOpen(false)}>
          {searchCard(() => {
            setSearchOpen(false);
            load();
          })}
        </SearchPopup>
      )}
      {exportOpen && <MarkdownsExportModal onClose={() => setExportOpen(false)} />}
    </div>
  );
};

export default Markdowns;
