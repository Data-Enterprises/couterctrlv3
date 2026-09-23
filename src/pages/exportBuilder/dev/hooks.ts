import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useDevApi } from "../../../hooks/useDevApi";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { isGroupSearch } from "../../../features/searchSlice";
import { formatGoliathDate } from "../../../utils";
import {
  getExportPreview,
  runExport,
  type ExportDryRunResp,
  type ExportPreviewResp,
  type ExportResp,
} from "../../../api/salesExport";
import {
  failConfigLoad,
  failExport,
  finishExport,
  markExportSlow,
  setConfig,
  setSql,
  startConfigLoad,
  startExport,
  startSqlLoad,
} from "../../../features/dev/devExportBuilderSlice";
import type { JsonError } from "../../../interfaces";
import { filterSampleRows } from "./sampleRows";

/** The load balancer gives up at 150s. The page says so at 120, so the
 *  explanation arrives before the failure does. */
const SLOW_AFTER_MS = 120_000;

export const useExportBuilderCtx = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  // Coming Soon: dev API only, by construction rather than by whichever
  // environment the session happens to be pointed at.
  const { url, token } = useDevApi();
  const search = useAppSelector((s) => s.search);
  const config = useAppSelector((s) => s.dev.exportBuilder);

  const startDate = formatGoliathDate(search.startDate);
  const endDate = formatGoliathDate(search.endDate);

  /**
   * The columns as the file will hold them: the user's order, narrowed to what
   * is ticked. Derived once here so the preview table and the export request
   * can never disagree about what the file looks like.
   */
  const orderedColumns = config.columnOrder
    .map((name) => config.columns.find((c) => c.name === name))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .filter((c) => config.selectedColumns.includes(c.name));

  /**
   * Why the export cannot run, or null.
   *
   * The empty-list case is the one worth catching: `if payload.saleTypes:` on
   * the endpoint reads `[]` as "no filter given", so unticking every sale type
   * would hand back a file holding all of them — while the sample on screen,
   * which does mean "none", shows nothing at all. The two readings cannot both
   * be served, so the page refuses to send it.
   */
  const emptied = [
    config.saleTypes.length > 0 && config.selectedSaleTypes.length === 0
      ? "sale type"
      : null,
    config.itemRingTypes.length > 0 && config.selectedRingTypes.length === 0
      ? "ring type"
      : null,
    config.subDepartments.length > 0 &&
    config.selectedSubDepartments.length === 0
      ? "sub department"
      : null,
    config.vendors.length > 0 && config.selectedVendors.length === 0
      ? "vendor"
      : null,
  ].filter(Boolean) as string[];

  const blocked =
    config.selectedStoreIds.length === 0
      ? "Pick at least one store."
      : config.selectedColumns.length === 0
        ? "Pick at least one column."
        : emptied.length > 0
          ? `Every ${emptied.join(", ")} is unticked. The export reads an empty list as no filter at all, so the file would hold every one of them — tick at least one, or tick them all.`
          : null;

  /** The sample rows the file would actually hold. */
  const visibleRows = filterSampleRows(config.rows, {
    saleTypes: config.selectedSaleTypes,
    ringTypes: config.selectedRingTypes,
    subDepartments: config.selectedSubDepartments,
    vendors: config.selectedVendors,
    productCodes: config.productCodes,
    excludeVoids: config.flags.excludeVoids,
  });

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
            itemRingTypes: j.itemRingTypes ?? [],
            subDepartments: j.subDepartments ?? [],
            vendors: j.vendors ?? [],
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
  /**
   * The request the page is about to send, as SQL.
   *
   * Same endpoint and the same body, with `dryRun` on: it resolves the stores
   * and validates the columns exactly as a real run does, then stops before
   * writing and answers with the statement instead. So what comes back is the
   * query this configuration would actually run, not an approximation of it.
   */
  const params = () => {
    // Null means "every one" to the endpoint, so a list that has not been
    // narrowed is sent as null rather than as every value — same result, and
    // it keeps the condition out of the SQL entirely.
    const all = (picked: unknown[], available: unknown[]) =>
      picked.length === available.length;
    return {
      startDate,
      endDate,
      storeids: config.selectedStoreIds,
      // Always the explicit list, never null. Null means "every column" to
      // the endpoint, which is 102 — including the three provenance columns
      // the preview withholds — and in the endpoint's own order. Either would
      // hand back a file that is not the one on screen.
      columns: orderedColumns.map((c) => c.name),
      saleTypes: all(config.selectedSaleTypes, config.saleTypes)
        ? null
        : config.selectedSaleTypes,
      itemRingTypes: all(config.selectedRingTypes, config.itemRingTypes)
        ? null
        : config.selectedRingTypes,
      subDepartments: all(config.selectedSubDepartments, config.subDepartments)
        ? null
        : config.selectedSubDepartments.map(Number),
      vendorIds: all(config.selectedVendors, config.vendors)
        ? null
        : config.selectedVendors,
      // Empty means no filter here, which is the endpoint's own reading of an
      // empty list — and the right one, since nothing typed is nothing asked.
      productCodes: config.productCodes.length ? config.productCodes : null,
      excludeVoids: config.flags.excludeVoids,
      fileFormat: config.flags.fileFormat,
      filePrefix: config.flags.filePrefix || null,
      ordered: config.flags.ordered,
      dryRun: false,
    };
  };

  const showSql = () => {
    dispatch(startSqlLoad());
    runExport(url, token, { ...params(), dryRun: true })
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
        toast.error("Could not read the query back: " + err.message);
      });
  };

  const build = () => {
    dispatch(startExport());
    const slowTimer = window.setTimeout(
      () => dispatch(markExportSlow()),
      SLOW_AFTER_MS,
    );

    runExport(url, token, params())
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
            config.slow
              ? "The connection gave up before the file was ready. It is still being written, so try a shorter range rather than assuming it failed."
              : "The export failed: " + err.message,
          ),
        );
      });
  };

  return {
    ...config,
    dispatch,
    search,
    startDate,
    endDate,
    orderedColumns,
    visibleRows,
    blocked,
    loadConfig,
    showSql,
    build,
  };
};
