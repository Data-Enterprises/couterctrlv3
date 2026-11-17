// Hooks
import { useAppDispatch } from "../../../../hooks";
import { useDevApi } from "../../../../hooks/useDevApi";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import {
  setSql,
  startSqlLoad,
  type ExportBuilderState,
} from "../../../../features/dev/devExportBuilderSlice";

// API
import {
  runExport,
  type ExportDryRunResp,
  type ExportFilters,
  type ExportParams,
} from "../../../../api/salesExport";

// Utils
import { reasonOf } from "../../../../utils/serverError";

// Interfaces
import type { JsonError } from "../../../../interfaces";
import type { ExportSource } from "../utils/sources";
import type { fileShapeOf } from "../utils/shape";

/** The export request this configuration makes, and Show SQL, which sends it
 *  as a dry run and shows the statement it would run. */
export const useExportRequest = (
  config: ExportBuilderState,
  source: ExportSource,
  shape: ReturnType<typeof fileShapeOf>,
) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  // Coming Soon: dev API only.
  const { url, token } = useDevApi();
  const TABLE = source.key;
  const { names, rangeStart, rangeEnd, aggregating, orderedColumns } = shape;

  /**
   * The stores are sent explicitly, so the scope modes never run on this side
   * — the question of which stores was settled by the config call.
   */
  /**
   * The request the page is about to send, as SQL.
   *
   * Same endpoint and the same body, with `dryRun` on: it resolves the stores
   * and validates the columns exactly as a real run does, then stops before
   * writing and answers with the statement instead. So what comes back is the
   * query this configuration would actually run, not an approximation of it.
   */
  const params = (): ExportParams => {
    // Null means "every one" to the endpoint, so a list that has not been
    // narrowed is sent as null rather than as every value — same result, and
    // it keeps the condition out of the SQL entirely.
    const all = (picked: unknown[], available: unknown[]) =>
      picked.length === available.length;
    const filters: ExportFilters = {};
    for (const list of source.lists) {
      const picked = config.picks[list.filter] ?? [];
      filters[list.filter] = all(picked, config.lists[list.filter] ?? [])
        ? null
        : list.numeric
          ? picked.map(Number)
          : picked;
    }
    // Every day ticked is the range itself, which startDate and endDate
    // already say — sending the list as well would add a predicate that
    // cannot exclude anything.
    filters[source.days.filter] = all(config.selectedDays, config.days)
      ? null
      : config.selectedDays;
    // Empty means no filter here, which is the endpoint's own reading of an
    // empty list — and the right one, since nothing typed is nothing asked.
    filters[source.codes.filter] = config.productCodes.length
      ? config.productCodes
      : null;
    filters[source.descriptions.filter] = config.productDescriptions.length
      ? config.productDescriptions
      : null;
    for (const flag of source.flags) {
      filters[flag.filter] = config.rowFlags[flag.filter] ?? null;
    }
    return {
      startDate: rangeStart,
      endDate: rangeEnd,
      storeids: config.selectedStoreIds,
      // Always the explicit list, never null — null means "every column" to
      // the endpoint, including the provenance columns the preview withholds,
      // and in the endpoint's own order. Either would hand back a file that
      // is not the one on screen.
      //
      // Except when aggregating, where the endpoint refuses a column list
      // outright: the output is the group keys and the measures, so a list of
      // line columns has nothing to say about it.
      columns: aggregating ? null : orderedColumns.map((c) => c.name),
      groupBy: aggregating ? config.groupBy : null,
      aggregates: aggregating ? config.aggregates : null,
      // Null rather than an empty list, so a summary with nothing computed
      // sends nothing rather than sending emptiness.
      computed:
        aggregating && config.computed.length > 0 ? config.computed : null,
      filters,
      orderBy: config.orderBy.length > 0 ? config.orderBy : null,
      // A key from the preview's own list, not a pattern of ours.
      dateFormat: config.flags.dateFormat || null,
      userQueryId: config.savedCurrentId,
      fileFormat: config.flags.fileFormat,
      filePrefix: config.flags.filePrefix || null,
      ordered: config.flags.ordered,
      dryRun: false,
    };
  };

  const showSql = () => {
    dispatch(startSqlLoad());
    runExport(url, token, TABLE, { ...params(), dryRun: true }, names)
      .then((resp) => {
        const j = resp.data as ExportDryRunResp;
        if (j.error !== 0) {
          dispatch(setSql(null));
          toast.error("Could not read the query back");
          return;
        }
        dispatch(
          setSql({
            query: j.query,
            bucket: j.bucket,
            filePath: j.filePath,
            copyOptions: j.copyOptions,
          }),
        );
      })
      .catch((err: JsonError) => {
        dispatch(setSql(null));
        toast.error("Could not read the query back: " + reasonOf(err));
      });
  };

  return { params, showSql };
};
