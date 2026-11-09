// Hooks
import { useLoadMarkdowns, useMarkdownsCtx } from "../hooks";

// Components
import SearchCard from "../../../../components-dev/SearchCard";

/** The Markdowns page: the search card until markdowns are loaded, then the
 *  filters beside the grid. */
const Markdowns = () => {
  const ctx = useMarkdownsCtx();
  const load = useLoadMarkdowns();

  if (ctx.markdowns.length === 0) {
    return (
      <SearchCard
        title="Markdowns"
        description="Select a store or group and date range to load its markdowns."
        buttonLabel="Load markdowns"
        onSearch={load}
        loading={ctx.loading}
        loadingMessage={ctx.progress ? `Reading page ${ctx.progress.page} of ${ctx.progress.total}…` : "Loading markdowns…"}
        notice={ctx.notice ?? undefined}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-3">
      {/* MarkdownsFilterPanel goes here (step 7) */}
      {/* MarkdownsGrid goes here (step 8) */}
      <p className="text-content">{ctx.markdowns.length.toLocaleString()} markdowns loaded</p>
    </div>
  );
};

export default Markdowns;