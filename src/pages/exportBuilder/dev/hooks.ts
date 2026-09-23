import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useDevApi } from "../../../hooks/useDevApi";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { isGroupSearch } from "../../../features/searchSlice";
import { formatGoliathDate } from "../../../utils";
import {
  getExportPreview,
  runExport,
  type ExportPreviewResp,
  type ExportResp,
} from "../../../api/salesExport";
import {
  failConfigLoad,
  failExport,
  finishExport,
  markExportSlow,
  setConfig,
  startConfigLoad,
  startExport,
} from "../../../features/dev/devExportBuilderSlice";
import type { JsonError } from "../../../interfaces";

/** The load balancer gives up at 150s. The page says so at 120, so the
 *  explanation arrives before the failure does. */
const SLOW_AFTER_MS = 120_000;

export const useExportBuilderCtx = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  // Coming Soon: dev API only, by construction rather than by whichever
  // environment the session happens to be pointed at.
  const { url, token } = useDevApi();
  const search = useAppSelector((state) => state.search);
  const state = useAppSelector((s) => s.dev.exportBuilder);

  const startDate = formatGoliathDate(search.startDate);
  const endDate = formatGoliathDate(search.endDate);

  /**
   * The columns as the file will hold them: the user's order, narrowed to what
   * is ticked. Derived once here so the preview table and the export request
   * can never disagree about what the file looks like.
   */
  const orderedColumns = state.columnOrder
    .map((name) => state.columns.find((c) => c.name === name))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .filter((c) => state.selectedColumns.includes(c.name));

  /**
   * One call, and everything the page offers comes out of it: the stores the
   * scope resolved to, the sale types actually present, every column, and ten
   * sample rows. Narrowing afterwards is local — nothing here is asked twice.
   */
  const loadConfig = () => {
    const group = isGroupSearch(search.type);
    dispatch(startConfigLoad());
    getExportPreview(url, token, {
      startDate,
      endDate,
      singleStore: group ? 0 : 1,
      useGroups: group ? 1 : 0,
      searchValue: group ? search.selectedGroup.id : search.selectedStore.storeid,
    })
      .then((resp) => {
        const j = resp.data as ExportPreviewResp;
        if (j.error !== 0) {
          dispatch(failConfigLoad());
          toast.error("Could not load the export config");
          return;
        }
        dispatch(
          setConfig({
            stores: j.stores ?? [],
            saleTypes: j.saleTypes ?? [],
            columns: j.columns ?? [],
            rows: j.rows ?? [],
            hasData: j.hasData,
            message: j.message,
          }),
        );
      })
      .catch((err: JsonError) => {
        dispatch(failConfigLoad());
        toast.error("Could not load the export config: " + err.message);
      });
  };

  /**
   * The stores are sent explicitly, so the scope modes never run on this side
   * — the question of which stores was settled by the config call.
   */
  const build = () => {
    // Null means "every column" to the endpoint, which also means its own
    // order — so it is only safe while the order has not been touched.
    const untouched = state.columnOrder.every(
      (name, i) => state.columns[i]?.name === name,
    );
    const everyColumn =
      untouched && state.selectedColumns.length === state.columns.length;
    const everyType = state.selectedSaleTypes.length === state.saleTypes.length;
    dispatch(startExport());
    const slowTimer = window.setTimeout(
      () => dispatch(markExportSlow()),
      SLOW_AFTER_MS,
    );

    runExport(url, token, {
      startDate,
      endDate,
      storeids: state.selectedStoreIds,
      // Null means every column, which is not the same as listing all of them
      // — it is what the endpoint documents, and it keeps the request small.
      columns: everyColumn ? null : orderedColumns.map((c) => c.name),
      saleTypes: everyType ? null : state.selectedSaleTypes,
      excludeVoids: state.flags.excludeVoids,
      fileFormat: state.flags.fileFormat,
      filePrefix: state.flags.filePrefix || null,
      ordered: state.flags.ordered,
      dryRun: state.flags.dryRun,
    })
      .then((resp) => {
        window.clearTimeout(slowTimer);
        const j = resp.data as ExportResp;
        if (j.error !== 0) {
          dispatch(failExport("The export did not complete."));
          return;
        }
        dispatch(
          finishExport({
            files: j.files ?? [],
            rowsUploaded: j.rowsUploaded ?? 0,
            elapsedSeconds: j.elapsedSeconds ?? 0,
            urlExpiresInMinutes: j.urlExpiresInMinutes ?? 60,
          }),
        );
      })
      .catch((err: JsonError) => {
        window.clearTimeout(slowTimer);
        // A request cut off at the load balancer looks like a network failure
        // here, but the file is usually still being written — so this says
        // what happened rather than calling it a failure.
        dispatch(
          failExport(
            state.slow
              ? "The connection gave up before the file was ready. It is still being written, so try a shorter range rather than assuming it failed."
              : "The export failed: " + err.message,
          ),
        );
      });
  };

  return {
    ...state,
    dispatch,
    search,
    startDate,
    endDate,
    orderedColumns,
    loadConfig,
    build,
  };
};
