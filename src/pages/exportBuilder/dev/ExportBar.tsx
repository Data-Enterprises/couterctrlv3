import { ArrowDownTrayIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useExportBuilderCtx } from "./hooks";
import { countPii } from "./piiColumns";
import {
  dismissBuild,
  openBuilds,
  openSaved,
} from "../../../features/dev/devExportBuilderSlice";
import { formatBigNumber } from "../../../utils";

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * Show SQL: built, wired and off.
 *
 * It asks the export endpoint for the statement this configuration would run
 * (`dryRun`), which is a support tool rather than something a client needs to
 * see — so it stays hidden until someone asks for it. Flip this to true.
 */
export const SHOW_SQL_BUTTON = false;

/**
 * The strip under the file: what will be built, then what was built.
 *
 * The download lands where the button was, with the configuration that made it
 * still on screen — the second export is nearly always an adjustment of the
 * first, so nothing here covers the picker or has to be dismissed.
 */
const ExportBar = () => {
  const ctx = useExportBuilderCtx();
  // A summary carries whatever it groups by, so that is what to count.
  const pii = countPii(ctx.aggregating ? ctx.groupBy : ctx.selectedColumns);
  const nothingToBuild = ctx.blocked !== null;

  /**
   * How many filters are actually narrowing something.
   *
   * Counted rather than listed. Spelled out in full this was the third copy
   * of the configuration on one screen, after the panel that sets it and the
   * table that shows its result — but a heavily filtered file should still
   * not look like a full one in the strip you are about to press, so the
   * count stays.
   */
  const narrowed = [
    ...ctx.source.lists.map((l) => {
      const picked = (ctx.picks[l.filter] ?? []).length;
      const total = (ctx.lists[l.filter] ?? []).length;
      return picked < total && `${picked} of ${total} ${l.noun}`;
    }),
    ctx.selectedDays.length < ctx.days.length &&
      `${ctx.selectedDays.length} of ${ctx.days.length} days`,
    ctx.productCodes.length > 0 &&
      `${ctx.productCodes.length} product code${
        ctx.productCodes.length === 1 ? "" : "s"
      }`,
    ctx.productDescriptions.length > 0 &&
      `description${ctx.productDescriptions.length === 1 ? "" : "s"} matching ${ctx.productDescriptions
        .map((t) => `"${t}"`)
        .join(", ")}`,
    ...ctx.source.flags.map((f) => {
      const value = ctx.rowFlags[f.filter] ?? null;
      return value === 0 ? f.excluded : value === 1 ? f.only : false;
    }),
    ctx.flags.ordered && "sorted",
  ].filter(Boolean) as string[];

  if (ctx.files.length > 0) {
    return (
      <div
        className={`flex-shrink-0 rounded-xl px-4 py-3 border ${
          ctx.staleBuild
            ? "bg-severity_watch_bg border-severity_watch_text/20"
            : "bg-card_bg border-brand_green"
        }`}
      >
        {/* A file left on screen while the configuration moves under it looks
            like the answer and is not. */}
        {ctx.staleBuild && (
          <div className="text-[12px] font-semibold text-severity_watch_text mb-2">
            The configuration has changed since this file was built — it does
            not match what is on screen. Build export again for a file that
            does.
          </div>
        )}
        {ctx.files.map((f) => (
          <div key={f.key} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand_green_tint flex items-center justify-center flex-shrink-0">
              <ArrowDownTrayIcon className="w-4 h-4 text-brand_green" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">
                {f.key.split("/").pop()}
                {ctx.builtQueryName && (
                  <span className="font-normal text-content/95">
                    {" "}
                    · {ctx.builtQueryName}
                  </span>
                )}
              </div>
              <div className="text-[11.5px] text-content/95 mt-0.5">
                {formatBigNumber(ctx.rowsUploaded, 0)} rows · {mb(f.bytes)} ·
                built in {ctx.elapsedSeconds.toFixed(1)}s
              </div>
            </div>
            <div className="text-right mr-1">
              <div className="text-[11.5px] font-semibold text-severity_watch_text">
                Link expires in {ctx.urlExpiresInMinutes} min
              </div>
              <div className="text-[11px] text-content/95 mt-0.5">
                Build it again after that
              </div>
            </div>
            <a
              href={f.url}
              download
              className="bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Download
            </a>
            {/* The way out, beside the way on. Building again and the list of
                past builds are both a click away once you are back. */}
            <button
              type="button"
              onClick={() => ctx.dispatch(dismissBuild())}
              className="text-[13px] font-medium px-4 py-2.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
            >
              Go back
            </button>
          </div>
        ))}
        <div className="text-[11px] text-content/95 mt-2">
          {ctx.manifestWritten
            ? "This build is in Previous builds, with the settings that made it."
            : "This build has no manifest, so it will not appear in Previous builds — keep this link."}
        </div>
      </div>
    );
  }

  if (ctx.building) {
    return (
      <div className="flex-shrink-0 bg-brand_navy rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-custom-white/25 border-t-brand_green animate-spin flex-shrink-0" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-custom-white">
            {ctx.slow ? "Still building" : "Building your file"}
          </div>
          <div className="text-[11.5px] text-custom-white/95 mt-0.5">
            {ctx.slow
              ? "Past the point the connection usually waits. It is still being written — if no link arrives, try a shorter range."
              : "Written straight to storage — nothing downloads here."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 bg-brand_navy rounded-xl px-4 py-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        {/*
          * Counts, not lists.
          *
          * The keys, the aggregates and the narrowing were all spelled out
          * here in full, and every one of them is already open on the panel
          * to the left in the same words — while the table above shows the
          * columns themselves. Three restatements of one configuration, and
          * the one people read is the table.
          */}
        <div className="text-[13px] font-semibold text-custom-white">
          {ctx.selectedStoreIds.length} of {ctx.stores.length} store
          {ctx.stores.length === 1 ? "" : "s"} ·{" "}
          {ctx.aggregating
            ? `${ctx.groupBy.length} key${ctx.groupBy.length === 1 ? "" : "s"} · ${
                ctx.measureItems.length
              } aggregate${ctx.measureItems.length === 1 ? "" : "s"}`
            : `${ctx.selectedColumns.length} of ${ctx.columns.length} column${
                ctx.columns.length === 1 ? "" : "s"
              }`}{" "}
          · {ctx.flags.fileFormat.toUpperCase()}
          {narrowed.length > 0 && (
            <span className="font-normal text-custom-white/95">
              {" "}
              · {narrowed.length} filter{narrowed.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {pii > 0 && (
          <div className="text-[11.5px] text-custom-white/95 mt-1">
            Includes {pii} personal column{pii === 1 ? "" : "s"}
          </div>
        )}
        {ctx.exportError && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[11.5px] text-severity_watch_bg">
            <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {ctx.exportError}
          </div>
        )}
      </div>
      {/*
        * Unlike Show SQL, this one is visible: it runs in the browser over the
        * sample rows and sends nothing, so it promises nothing the
        * product cannot keep.
        */}
      {ctx.builds.length > 0 && (
        <button
          type="button"
          onClick={() => ctx.dispatch(openBuilds(true))}
          className="border border-custom-white/30 text-custom-white text-[13px] font-medium px-4 py-2.5 rounded-lg hover:bg-custom-white/10 transition-colors"
        >
          Previous builds ({ctx.builds.length})
        </button>
      )}
      <button
        type="button"
        onClick={() => ctx.dispatch(openSaved(true))}
        className="border border-custom-white/30 text-custom-white text-[13px] font-medium px-4 py-2.5 rounded-lg hover:bg-custom-white/10 transition-colors"
      >
        Saved
      </button>
      {SHOW_SQL_BUTTON && (
        <button
          type="button"
          onClick={ctx.showSql}
          disabled={nothingToBuild || ctx.loadingSql}
          className="border border-custom-white/30 text-custom-white text-[13px] font-medium px-4 py-2.5 rounded-lg hover:bg-custom-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {ctx.loadingSql ? "Reading..." : "Show SQL"}
        </button>
      )}
      {/* The reason sits with the button, not only in the paragraph on the
          left: a greyed button with its explanation ten inches away is a
          button nobody knows how to un-grey. */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={ctx.build}
          disabled={nothingToBuild}
          title={ctx.blocked ?? undefined}
          className="bg-custom-white text-brand_navy text-[13px] font-semibold px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Build export
        </button>
        {ctx.blocked && (
          <span className="text-[11px] text-severity_watch_bg text-right max-w-[34ch]">
            {ctx.blocked}
          </span>
        )}
      </div>
    </div>
  );
};

export default ExportBar;
