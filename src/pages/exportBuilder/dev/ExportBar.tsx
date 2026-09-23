import { ArrowDownTrayIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useExportBuilderCtx } from "./hooks";
import { countPii } from "./piiColumns";
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
  const pii = countPii(ctx.selectedColumns);
  const nothingToBuild = ctx.blocked !== null;

  if (ctx.files.length > 0) {
    return (
      <div className="flex-shrink-0 bg-card_bg border border-brand_green rounded-xl px-4 py-3">
        {ctx.files.map((f) => (
          <div key={f.key} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand_green_tint flex items-center justify-center flex-shrink-0">
              <ArrowDownTrayIcon className="w-4 h-4 text-brand_green" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">
                {f.key.split("/").pop()}
              </div>
              <div className="text-[11.5px] text-content/70 mt-0.5">
                {formatBigNumber(ctx.rowsUploaded, 0)} rows · {mb(f.bytes)} ·
                built in {ctx.elapsedSeconds.toFixed(1)}s
              </div>
            </div>
            <div className="text-right mr-1">
              <div className="text-[11.5px] font-semibold text-amber-900">
                Link expires in {ctx.urlExpiresInMinutes} min
              </div>
              <div className="text-[11px] text-content/60 mt-0.5">
                Build it again after that
              </div>
            </div>
            <a
              href={f.url}
              download
              className="bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Download
            </a>
          </div>
        ))}
        <button
          type="button"
          onClick={ctx.build}
          className="text-[11.5px] text-brand_navy_hover underline underline-offset-2 mt-2"
        >
          Build it again
        </button>
      </div>
    );
  }

  if (ctx.building) {
    return (
      <div className="flex-shrink-0 bg-[#1e2a4a] rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-custom-white/25 border-t-brand_green animate-spin flex-shrink-0" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-custom-white">
            {ctx.slow ? "Still building" : "Building your file"}
          </div>
          <div className="text-[11.5px] text-custom-white/75 mt-0.5">
            {ctx.slow
              ? "This is past the point the connection usually waits. The file is still being written — if the link does not arrive, try a shorter range rather than assuming it failed."
              : "The file is written straight to storage, so nothing downloads yet."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 bg-[#1e2a4a] rounded-xl px-4 py-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-custom-white">
          {ctx.selectedStoreIds.length} store
          {ctx.selectedStoreIds.length === 1 ? "" : "s"} ·{" "}
          {ctx.selectedColumns.length} column
          {ctx.selectedColumns.length === 1 ? "" : "s"} ·{" "}
          {ctx.flags.fileFormat.toUpperCase()}
        </div>
        {pii > 0 ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11.5px] text-custom-white/75">
              Includes {pii} personal column{pii === 1 ? "" : "s"} — customer
              name, contact and location.
            </span>
          </div>
        ) : (
          <div className="text-[11.5px] text-custom-white/75 mt-1">
            A longer range across more stores takes longer to build.
          </div>
        )}
        {ctx.blocked && (
          <div className="text-[11.5px] text-amber-200 mt-1.5 max-w-[80ch]">
            {ctx.blocked}
          </div>
        )}
        {ctx.exportError && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[11.5px] text-amber-200">
            <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {ctx.exportError}
          </div>
        )}
      </div>
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
      <button
        type="button"
        onClick={ctx.build}
        disabled={nothingToBuild}
        className="bg-custom-white text-[#1e2a4a] text-[13px] font-semibold px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Build export
      </button>
    </div>
  );
};

export default ExportBar;
