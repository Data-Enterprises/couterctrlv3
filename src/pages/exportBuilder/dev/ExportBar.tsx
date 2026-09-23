import { ArrowDownTrayIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useExportBuilderCtx } from "./hooks";
import { countPii } from "./piiColumns";
import { aliasFor } from "./aggregates";
import {
  dismissBuild,
  openQuery,
  openDownloads,
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
   * Every filter that is actually narrowing something.
   *
   * A list left whole says nothing, so only the narrowed ones appear — the
   * point is that a heavily filtered file should not look like a full one in
   * the strip you are about to press.
   */
  const narrowed = [
    ctx.selectedSaleTypes.length < ctx.saleTypes.length &&
      `${ctx.selectedSaleTypes.length} of ${ctx.saleTypes.length} sale types`,
    ctx.selectedRingTypes.length < ctx.itemRingTypes.length &&
      `${ctx.selectedRingTypes.length} of ${ctx.itemRingTypes.length} ring types`,
    ctx.selectedSubDepartments.length < ctx.subDepartments.length &&
      `${ctx.selectedSubDepartments.length} of ${ctx.subDepartments.length} sub departments`,
    ctx.selectedVendors.length < ctx.vendors.length &&
      `${ctx.selectedVendors.length} of ${ctx.vendors.length} vendors`,
    ctx.selectedCashiers.length < ctx.cashiers.length &&
      `${ctx.selectedCashiers.length} of ${ctx.cashiers.length} cashiers`,
    ctx.selectedSaleDates.length < ctx.saleDates.length &&
      `${ctx.selectedSaleDates.length} of ${ctx.saleDates.length} days`,
    ctx.productCodes.length > 0 &&
      `${ctx.productCodes.length} product code${
        ctx.productCodes.length === 1 ? "" : "s"
      }`,
    ctx.productDescriptions.length > 0 &&
      `description${ctx.productDescriptions.length === 1 ? "" : "s"} matching ${ctx.productDescriptions
        .map((t) => `"${t}"`)
        .join(", ")}`,
    ctx.flags.voidFlag === 0 && "voided lines excluded",
    ctx.flags.voidFlag === 1 && "voided lines only",
    ctx.flags.refundFlag === 0 && "refunds excluded",
    ctx.flags.refundFlag === 1 && "refunds only",
    ctx.flags.ordered && "sorted",
  ].filter(Boolean) as string[];

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
        <div className="flex items-center gap-4 mt-2">
          <button
            type="button"
            onClick={() => ctx.dispatch(dismissBuild())}
            className="text-[11.5px] font-semibold text-brand_navy_hover underline underline-offset-2"
          >
            Back to configuring
          </button>
          <button
            type="button"
            onClick={ctx.build}
            className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
          >
            Build it again
          </button>
          {ctx.builds.length > 1 && (
            <button
              type="button"
              onClick={() => ctx.dispatch(openDownloads(true))}
              className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
            >
              All {ctx.builds.length} files
            </button>
          )}
          <span className="text-[11px] text-content/55">
            The file stays here while its link lasts, whatever you build next.
          </span>
        </div>
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
          {ctx.selectedStoreIds.length} of {ctx.stores.length} store
          {ctx.stores.length === 1 ? "" : "s"} ·{" "}
          {ctx.aggregating
            ? `grouped by ${ctx.groupBy.join(", ") || "nothing yet"}`
            : `${ctx.selectedColumns.length} of ${ctx.columns.length} column${
                ctx.columns.length === 1 ? "" : "s"
              }`}{" "}
          · {ctx.flags.fileFormat.toUpperCase()}
        </div>
        {ctx.aggregating && ctx.aggregates.length > 0 && (
          <div className="text-[11.5px] text-custom-white/75 mt-1 font-mono">
            {ctx.aggregates.map((m) => aliasFor(m.column, m.fn)).join(" · ")}
          </div>
        )}
        {narrowed.length > 0 && (
          <div className="text-[11.5px] text-custom-white/75 mt-1">
            Filtered: {narrowed.join(" · ")}
          </div>
        )}
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
      {/*
        * Unlike Show SQL, this one is visible: it runs in the browser over the
        * fifty sample rows and sends nothing, so it promises nothing the
        * product cannot keep.
        */}
      {ctx.builds.length > 0 && (
        <button
          type="button"
          onClick={() => ctx.dispatch(openDownloads(true))}
          className="border border-custom-white/30 text-custom-white text-[13px] font-medium px-4 py-2.5 rounded-lg hover:bg-custom-white/10 transition-colors"
        >
          Files ({ctx.builds.length})
        </button>
      )}
      <button
        type="button"
        onClick={() => ctx.dispatch(openQuery(true))}
        className="border border-custom-white/30 text-custom-white text-[13px] font-medium px-4 py-2.5 rounded-lg hover:bg-custom-white/10 transition-colors"
      >
        Query sample
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
