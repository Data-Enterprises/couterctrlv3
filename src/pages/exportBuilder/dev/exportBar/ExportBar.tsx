// Hooks
import { useExportBuilderCtx } from "../hooks";

// Redux
import {
  dismissBuild,
  openBuilds,
  openSaved,
} from "../../../../features/dev/devExportBuilderSlice";

// Utils
import { countPii } from "../utils/piiColumns";

// Components
import BuiltFiles from "./components/BuiltFiles";
import BuildingNotice from "./components/BuildingNotice";
import ExportSummary from "./components/ExportSummary";
import ExportActions from "./components/ExportActions";

/**
 * The strip under the file: what will be built, then what was built. The
 * download lands where the button was, so nothing covers the configuration
 * that made it.
 */
const ExportBar = () => {
  const ctx = useExportBuilderCtx();
  // A summary carries whatever it groups by, so that is what to count.
  const pii = countPii(ctx.aggregating ? ctx.groupBy : ctx.selectedColumns);

  // The filters actually narrowing something, counted rather than listed, so a
  // heavily filtered file does not look like a full one.
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

  const shape = ctx.aggregating
    ? `${ctx.groupBy.length} key${ctx.groupBy.length === 1 ? "" : "s"} · ${
        ctx.measureItems.length
      } aggregate${ctx.measureItems.length === 1 ? "" : "s"}`
    : `${ctx.selectedColumns.length} of ${ctx.columns.length} column${
        ctx.columns.length === 1 ? "" : "s"
      }`;
  const title = `${ctx.selectedStoreIds.length} of ${ctx.stores.length} store${
    ctx.stores.length === 1 ? "" : "s"
  } · ${shape} · ${ctx.flags.fileFormat.toUpperCase()}`;

  if (ctx.files.length > 0) {
    return (
      <BuiltFiles
        files={ctx.files}
        stale={ctx.staleBuild}
        queryName={ctx.builtQueryName}
        rowsUploaded={ctx.rowsUploaded}
        elapsedSeconds={ctx.elapsedSeconds}
        urlExpiresInMinutes={ctx.urlExpiresInMinutes}
        manifestWritten={ctx.manifestWritten}
        onGoBack={() => ctx.dispatch(dismissBuild())}
      />
    );
  }

  if (ctx.building) return <BuildingNotice slow={ctx.slow} />;

  return (
    <div className="flex-shrink-0 bg-brand_navy rounded-xl px-4 py-3 flex items-center gap-4">
      <ExportSummary
        title={title}
        filterCount={narrowed.length}
        pii={pii}
        exportError={ctx.exportError}
      />
      <ExportActions
        buildCount={ctx.builds.length}
        blocked={ctx.blocked}
        loadingSql={ctx.loadingSql}
        onBuilds={() => ctx.dispatch(openBuilds(true))}
        onSaved={() => ctx.dispatch(openSaved(true))}
        onShowSql={ctx.showSql}
        onBuild={ctx.build}
      />
    </div>
  );
};

export default ExportBar;
