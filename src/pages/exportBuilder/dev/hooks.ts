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
  failSavedWork,
  markSavedLoaded,
  removeSaved,
  setSaved,
  startSavedWork,
  upsertSaved,
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
import { aliasFor } from "./aggregates";
import {
  listSavedExports,
  removeSavedExport,
  saveSavedExport,
  type SavedExport,
  type SavedExportsResp,
  type SavedExportResp,
} from "../../../api/savedExports";
import { planLoad, toPayload } from "./savedExports";
import { rollupSampleRows } from "./rollup";

/** The load balancer gives up at 150s. The page says so at 120, so the
 *  explanation arrives before the failure does. */
const SLOW_AFTER_MS = 120_000;

/**
 * A day list is only offered for a range someone could reasonably tick
 * through. Past this the section is hidden and the range itself is the filter
 * — a thousand checkboxes is not a question anyone answers.
 */
const MAX_DAYS = 366;

/**
 * Every day the range covers, inclusive, as `YYYY-MM-DD`.
 *
 * Built in UTC on purpose. Both ends are already plain days by the time they
 * get here, and stepping a local Date by 24 hours skips or repeats one on the
 * two days a year the clocks move — which would drop a day out of the list
 * or offer the same one twice.
 */
export const daysInRange = (start: string, end: string) => {
  const from = Date.parse(start + "T00:00:00Z");
  const to = Date.parse(end + "T00:00:00Z");
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return [];
  const days: string[] = [];
  const DAY = 86_400_000;
  for (let at = from; at <= to && days.length <= MAX_DAYS; at += DAY) {
    days.push(new Date(at).toISOString().slice(0, 10));
  }
  return days.length > MAX_DAYS ? [] : days;
};

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
    config.cashiers.length > 0 && config.selectedCashiers.length === 0
      ? "cashier"
      : null,
    config.saleDates.length > 0 && config.selectedSaleDates.length === 0
      ? "day"
      : null,
  ].filter(Boolean) as string[];

  const aggregating = config.mode === "summary";

  /**
   * A measure whose name another one already has.
   *
   * The endpoint refuses these, and it counts the group keys as taken too —
   * grouping by `qty` and also asking for its total is fine, but two measures
   * that both land on `qty_sum` is a file with a column written twice.
   */
  const aliases = config.aggregates.map((m) => aliasFor(m.column, m.fn));
  const duplicate =
    aliases.find(
      (name, i) => aliases.indexOf(name) !== i || config.groupBy.includes(name),
    ) ?? null;

  /** What is wrong with the file's shape, as opposed to its filters. */
  const shapeProblem = aggregating
    ? config.groupBy.length === 0
      ? "Pick at least one column to group by."
      : config.aggregates.length === 0
        ? "Add at least one measure — a summary with no numbers in it is a list of the groups."
        : duplicate
          ? `Two of these would both be written as ${duplicate}. Change one of them.`
          : null
    : config.selectedColumns.length === 0
      ? "Pick at least one column."
      : null;

  const blocked =
    config.selectedStoreIds.length === 0
      ? "Pick at least one store."
      : (shapeProblem ??
        (emptied.length > 0
          ? `Every ${emptied.join(", ")} is unticked. The export reads an empty list as no filter at all, so the file would hold every one of them — tick at least one, or tick them all.`
          : null));

  /** The sample rows the file would actually hold. */
  const visibleRows = filterSampleRows(config.rows, {
    saleTypes: config.selectedSaleTypes,
    ringTypes: config.selectedRingTypes,
    subDepartments: config.selectedSubDepartments,
    vendors: config.selectedVendors,
    cashiers: config.selectedCashiers,
    saleDates: config.selectedSaleDates,
    productCodes: config.productCodes,
    productDescriptions: config.productDescriptions,
    voidFlag: config.flags.voidFlag,
    refundFlag: config.flags.refundFlag,
  });

  /**
   * One line describing what is about to be built.
   *
   * Kept with the build, because a list of four downloads called sales.csv,
   * sales.csv, sales.csv and sales.csv is a list of four riddles. This is
   * written at build time from the configuration that made it.
   */
  const describeBuild = () => {
    const narrowed = [
      config.selectedStoreIds.length < config.stores.length &&
        `${config.selectedStoreIds.length} stores`,
      config.selectedSaleTypes.length < config.saleTypes.length &&
        `${config.selectedSaleTypes.length} sale types`,
      config.selectedRingTypes.length < config.itemRingTypes.length &&
        `${config.selectedRingTypes.length} ring types`,
      config.selectedSubDepartments.length < config.subDepartments.length &&
        `${config.selectedSubDepartments.length} sub departments`,
      config.selectedVendors.length < config.vendors.length &&
        `${config.selectedVendors.length} vendors`,
      config.selectedCashiers.length < config.cashiers.length &&
        `${config.selectedCashiers.length} cashiers`,
      config.selectedSaleDates.length < config.saleDates.length &&
        `${config.selectedSaleDates.length} days`,
      config.productCodes.length > 0 && `${config.productCodes.length} codes`,
      config.productDescriptions.length > 0 &&
        `"${config.productDescriptions.join('", "')}"`,
      config.flags.voidFlag === 0 && "no voids",
      config.flags.voidFlag === 1 && "voids only",
      config.flags.refundFlag === 0 && "no refunds",
      config.flags.refundFlag === 1 && "refunds only",
    ].filter(Boolean) as string[];

    const shape = aggregating
      ? `Summary by ${config.groupBy.join(", ")}`
      : `${config.selectedColumns.length} of ${config.columns.length} columns`;

    return [`${startDate} to ${endDate}`, shape, ...narrowed].join(" · ");
  };

  /**
   * The same rollup the endpoint would run, over the sample.
   *
   * The filters come first, because they are a WHERE and this is a GROUP BY.
   * Fifty lines cannot stand in for a month, so what this shows honestly is
   * the file's columns and which group keys the data produces — the preview
   * says as much where the numbers are.
   */
  const summary = aggregating
    ? rollupSampleRows(visibleRows, {
        groupBy: config.groupBy,
        aggregates: config.aggregates,
        columns: config.columns,
        ordered: config.flags.ordered,
      })
    : { columns: [] as string[], rows: [] as typeof visibleRows };

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
            cashiers: j.cashiers ?? [],
            // Not from the response: the endpoint returns no day list, and a
            // day with no sales is still a day someone can ask to exclude.
            saleDates: daysInRange(startDate, endDate),
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
      // Always the explicit list, never null — null means "every column" to
      // the endpoint, which is 102, including the three provenance columns the
      // preview withholds, and in the endpoint's own order. Either would hand
      // back a file that is not the one on screen.
      //
      // Except when aggregating, where the endpoint refuses a column list
      // outright: the output is the group keys and the measures, so a list of
      // line columns has nothing to say about it.
      columns: aggregating ? null : orderedColumns.map((c) => c.name),
      groupBy: aggregating ? config.groupBy : null,
      aggregates: aggregating ? config.aggregates : null,
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
      cashierNumbers: all(config.selectedCashiers, config.cashiers)
        ? null
        : config.selectedCashiers,
      // Every day ticked is the range itself, which startDate and endDate
      // already say — sending the list as well would add a predicate that
      // cannot exclude anything.
      saleDates: all(config.selectedSaleDates, config.saleDates)
        ? null
        : config.selectedSaleDates,
      // Empty means no filter here, which is the endpoint's own reading of an
      // empty list — and the right one, since nothing typed is nothing asked.
      productCodes: config.productCodes.length ? config.productCodes : null,
      productDescriptions: config.productDescriptions.length
        ? config.productDescriptions
        : null,
      // `excludeVoids` is not sent at all. It is the older spelling of
      // `voidFlag: 0`, the endpoint lets voidFlag win when both arrive, and
      // sending a switch this page no longer reads would only be one more
      // thing to keep in step.
      voidFlag: config.flags.voidFlag,
      refundFlag: config.flags.refundFlag,
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

  /**
   * Saved configurations: list, save, remove, load.
   *
   * They live in one JSON file per user in S3 rather than in this page, so a
   * report someone set up on Monday is still there on Friday and on another
   * machine. The page holds the shape; the endpoint holds the file.
   */
  const loadSaved = () => {
    dispatch(startSavedWork());
    listSavedExports(url, token)
      .then((resp) => {
        const j = resp.data as SavedExportsResp;
        if (j.error !== 0) {
          dispatch(failSavedWork("Could not read your saved exports."));
          return;
        }
        dispatch(setSaved(j.configs ?? []));
      })
      .catch((err: JsonError) =>
        dispatch(failSavedWork("Could not read your saved exports: " + err.message)),
      );
  };

  const saveCurrent = (name: string, id: string | null) => {
    dispatch(startSavedWork());
    saveSavedExport(url, token, {
      id,
      name,
      payload: toPayload(config, config.querySql || undefined),
    })
      .then((resp) => {
        const j = resp.data as SavedExportResp;
        if (j.error !== 0 || !j.config) {
          dispatch(failSavedWork("That did not save."));
          return;
        }
        dispatch(upsertSaved(j.config));
        toast.success(`Saved "${j.config.name}"`);
      })
      .catch((err: JsonError) =>
        dispatch(failSavedWork("That did not save: " + err.message)),
      );
  };

  const deleteSaved = (id: string) => {
    dispatch(startSavedWork());
    removeSavedExport(url, token, id)
      .then(() => dispatch(removeSaved(id)))
      .catch((err: JsonError) =>
        dispatch(failSavedWork("That did not delete: " + err.message)),
      );
  };

  /**
   * Put a saved configuration onto the range that is open.
   *
   * Everything is intersected with what this range holds — a vendor that did
   * not trade this month is not a filter, it is an empty file — and whatever
   * fell out is reported rather than quietly dropped.
   */
  const applySaved = (saved: SavedExport) => {
    const plan = planLoad(saved.payload, config);
    plan.actions.forEach((action) => dispatch(action));
    dispatch(markSavedLoaded({ id: saved.id, notes: plan.missing }));
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
            label: describeBuild(),
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
    /** The whole slice, for the few callers that translate it wholesale. */
    config,
    dispatch,
    search,
    startDate,
    endDate,
    orderedColumns,
    visibleRows,
    loadSaved,
    saveCurrent,
    deleteSaved,
    applySaved,
    aggregating,
    summary,
    blocked,
    loadConfig,
    showSql,
    build,
  };
};
