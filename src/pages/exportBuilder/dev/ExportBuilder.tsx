import { useEffect, useState } from "react";
import SearchCard from "../../../components-dev/SearchCard";
import ConfigPanel from "./ConfigPanel";
import CsvPreview from "./CsvPreview";
import SummaryPreview from "./SummaryPreview";
import ExportBar from "./ExportBar";
import SqlModal from "./SqlModal";
import QueryPanel from "./QueryPanel";
import DownloadsModal from "./DownloadsModal";
import SavedExportsModal from "./SavedExportsModal";
import SourcePicker from "./SourcePicker";
import { useExportBuilderCtx } from "./hooks";
import { keepSortable } from "./sortRows";
import {
  clearSavedNotes,
  setOrderBy,
  setSearchSource,
} from "../../../features/dev/devExportBuilderSlice";

/**
 * Data Export — pick a table and a scope, narrow what goes in the file,
 * build it.
 *
 * Two calls and one screen. `export/{table}/preview` resolves the scope and
 * describes the data; every list on the left is that response. Narrowing is
 * local, so the sample redraws as it is ticked and nothing is fetched twice.
 * `export/{table}` then writes the file to storage and answers with a link.
 */
const ExportBuilder = () => {
  /**
   * Closed on arrival.
   *
   * The page opens on the sample and the query, which is what somebody came
   * to read — the configuration is where you go to change it, and 340px of
   * lists nobody has asked for yet is 340px the table does not get.
   */
  const [configOpen, setConfigOpen] = useState(false);

  /**
   * No animation on the very first paint.
   *
   * The sleeve starts closed, and a transition present from the first frame
   * plays that as a movement — the column sweeps shut on arrival, which
   * announces a panel nobody opened. The class arrives after the first
   * render, so the page lands closed and only moves when somebody asks it
   * to.
   */
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const ctx = useExportBuilderCtx();

  /**
   * The search card over the loaded page, from Change on the Data line.
   *
   * An overlay rather than a return to the entry card, as on the other
   * pages: closing it leaves the page exactly as it was. It opens on the
   * table on screen, and the build never reads the card's dates, so nothing
   * changed on it and abandoned reaches the file.
   */
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = () => {
    ctx.dispatch(setSearchSource(ctx.source.key));
    setSearchOpen(true);
  };

  /**
   * A sort key goes when its column does.
   *
   * Unticking a sorted column, removing a sorted measure or switching between
   * lines and a summary left the key in the sort, and the endpoint refused
   * the next build over a column the file no longer had. Pruned here, once,
   * rather than in each of the dozen actions that can take a key away -- and
   * in the slice, so the chips, the preview and the request all agree.
   */
  const sortableKey = ctx.sortableKeys.join(",");
  useEffect(() => {
    if (!ctx.loaded) return;
    const kept = keepSortable(ctx.orderBy, ctx.sortableKeys);
    if (kept !== ctx.orderBy) ctx.dispatch(setOrderBy(kept));
  }, [ctx.loaded, sortableKey, ctx.orderBy]);

  const searchCard = (
    <SearchCard
      title="Data Export"
      description="Choose the data, a store or group, and a date range, then shape the file from what the search finds."
      buttonLabel="Load config"
      loadingMessage="Reading the range..."
      loading={ctx.loadingConfig}
      blocked={ctx.searchBlocked}
      leadingControls={<SourcePicker />}
      onSearch={() => {
        setSearchOpen(false);
        ctx.loadConfig();
      }}
    />
  );

  if (!ctx.loaded) return searchCard;

  return (
    <div className="h-[calc(100vh-3rem)] bg-bkg flex flex-col p-3 gap-3">
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            {searchCard}
          </div>
        </div>
      )}
      <div className="flex gap-3 flex-1 min-h-0">
        {/*
          * The sleeve, not the panel, is what moves.
          *
          * Width animates here while ConfigPanel keeps its own 340px inside,
          * so the controls hold their layout as the edge travels over them.
          * Animating the panel itself reflows every label on every frame,
          * which reads as broken rather than as sliding.
          *
          * `gap-3` sits between two children, so the closed sleeve keeps a
          * 12px gutter it does not need — hence the negative margin, which
          * takes it back only while closed.
          */}
        <div
          className={`flex-shrink-0 overflow-hidden ${
            settled
              ? "transition-[width,margin] duration-300 ease-out motion-reduce:transition-none"
              : ""
          } ${configOpen ? "w-[340px]" : "w-0 -mr-3"}`}
          aria-hidden={!configOpen}
          data-help="config"
        >
          <ConfigPanel onChangeSearch={openSearch} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <QueryPanel
            configOpen={configOpen}
            onToggleConfig={() => setConfigOpen((v) => !v)}
          />
          {/*
            * What the last load could not carry over.
            *
            * On the page, not in a modal: Load (Saved) and Reload (Previous
            * builds) both close the window they were pressed in, so these
            * notes used to wait inside the Saved window until somebody
            * happened to open it again.
            */}
          {ctx.savedNotes.length > 0 && (
            <div className="flex-shrink-0 bg-severity_watch_bg border border-severity_watch_text/20 rounded-lg px-3 py-2 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-severity_watch_text">
                  Loaded, with notes
                </div>
                {ctx.savedNotes.map((note, i) => (
                  <div key={i} className="text-[11.5px] text-severity_watch_text mt-0.5">
                    · {note}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => ctx.dispatch(clearSavedNotes())}
                className="flex-shrink-0 text-[11.5px] font-medium text-severity_watch_text underline underline-offset-2"
              >
                Dismiss
              </button>
            </div>
          )}
          {!ctx.hasData ? (
            <div className="flex-1 bg-card_bg border border-brand_line rounded-xl flex items-center justify-center text-center px-6">
              <div className="max-w-[40ch]">
                <div className="text-[13.5px] font-semibold">
                  Nothing to export
                </div>
                <div className="text-[12.5px] text-content/95 mt-2 leading-relaxed">
                  {ctx.message ??
                    "There are no lines in this range for these stores."}
                </div>
                <div className="text-[12px] text-content/95 mt-3">
                  The column list is still here, so changing the dates keeps
                  every pick you have made.
                </div>
              </div>
            </div>
          ) : ctx.aggregating ? (
            <SummaryPreview />
          ) : (
            <CsvPreview />
          )}
          <div data-help="build">
            <ExportBar />
          </div>
          <SqlModal />
          {ctx.buildsOpen && <DownloadsModal />}
          {ctx.savedOpen && <SavedExportsModal />}
        </div>
      </div>
    </div>
  );
};

export default ExportBuilder;
