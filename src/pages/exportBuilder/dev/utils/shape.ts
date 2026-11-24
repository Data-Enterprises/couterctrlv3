// Utils
import { filterSampleRows, rowFiltersFor } from "./sampleRows";
import { filterNames, type ExportSource } from "./sources";
import { sortRows } from "./sortRows";
import { aliasFor } from "./aggregates";
import { rollupMeasures, type MeasureItem } from "./query/evalQuery";

// Interfaces
import type { ExportBuilderState } from "../../../../features/dev/devExportBuilderSlice";

/**
 * What the file will be, worked out from the slice: its columns, whether it is
 * a summary, why it cannot be built yet, the sample rows it would hold, what
 * it may be sorted by, and the summary over the sample.
 */
export const fileShapeOf = (
  config: ExportBuilderState,
  source: ExportSource,
  startDate: string,
  endDate: string,
) => {
  /** The filter names the request may carry: the source's, and only those. */
  const names = filterNames(source);

  /** The dates the loaded search asked for, which the file is built over. */
  const rangeStart = config.rangeStart || startDate;
  const rangeEnd = config.rangeEnd || endDate;

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
    ...source.lists.map((l) =>
      (config.lists[l.filter] ?? []).length > 0 &&
      (config.picks[l.filter] ?? []).length === 0
        ? l.nounOne
        : null,
    ),
    config.days.length > 0 && config.selectedDays.length === 0 ? "day" : null,
  ].filter(Boolean) as string[];

  /**
   * Filter names the router does not take for this table.
   *
   * The request is built from the source's own names, so this only fires if
   * the description and the router have drifted apart -- and then the build
   * stops here, with the names, instead of failing after the wait.
   */
  const routerNames = config.routerFilters?.[source.key];
  const unknownNames = routerNames
    ? names.filter((n) => !routerNames.includes(n))
    : [];

  /**
   * The file's shape, read off the configuration rather than switched.
   *
   * Either half is enough to mean it: keys with no measures is a summary
   * someone has not finished, and `blocked` says which half is missing. That
   * is a better answer than quietly writing the lines instead.
   */
  const aggregating =
    config.groupBy.length > 0 ||
    config.aggregates.length > 0 ||
    config.computed.length > 0;

  /**
   * A measure whose name another one already has.
   *
   * The endpoint refuses these, and it counts the group keys as taken too —
   * grouping by `qty` and also asking for its total is fine, but two measures
   * that both land on `qty_sum` is a file with a column written twice.
   */
  /**
   * Every measure, plain or computed, as the file will name it.
   *
   * One list because the file has one header: a computed column called
   * qty_sum and a measure that derives the same name are the same collision,
   * and the endpoint refuses both.
   */
  const measureItems: MeasureItem[] = [
    ...config.aggregates.map((m) => ({
      alias: m.alias || aliasFor(m.column, m.fn),
      expr: { kind: "agg" as const, fn: m.fn, column: m.column },
    })),
    ...config.computed.map((c) => ({ alias: c.alias, expr: c.expr })),
  ];

  const aliases = measureItems.map((m) => m.alias);
  const duplicate =
    aliases.find(
      (name, i) => aliases.indexOf(name) !== i || config.groupBy.includes(name),
    ) ?? null;

  /** What is wrong with the file's shape, as opposed to its filters. */
  const shapeProblem = aggregating
    ? config.groupBy.length === 0
      ? "Pick at least one column to group by."
      : measureItems.length === 0
        ? "Add at least one measure — a summary with no numbers in it is a list of the groups."
        : duplicate
          ? `Two of these would both be written as ${duplicate}. Change one of them.`
          : null
    : config.selectedColumns.length === 0
      ? "Pick at least one column."
      : null;

  // The endpoint's own rule, so a bad name is caught before the wait
  // rather than after it.
  const badPrefix =
    config.flags.filePrefix !== "" &&
    !/^[A-Za-z0-9_-]{1,60}$/.test(config.flags.filePrefix);

  const blocked =
    unknownNames.length > 0
      ? `The export doesn't take ${unknownNames.join(", ")} for ${source.label}. This page needs updating before it can build.`
      : badPrefix
        ? "The file name takes letters, digits, - and _ only, up to 60 characters."
        : config.selectedStoreIds.length === 0
          ? "Pick at least one store."
          : (shapeProblem ??
            (emptied.length > 0
              ? `Every ${emptied.join(", ")} is unticked. The export reads an empty list as no filter at all, so the file would hold every one of them — tick at least one, or tick them all.`
              : null));

  /** The sample rows the file would actually hold. */
  const matchingRows = filterSampleRows(
    config.rows,
    rowFiltersFor(source, config),
  );

  /**
   * Every column the finished file has, which is what a sort may name.
   *
   * A summary's keys and measures, or the ticked columns — never anything
   * else, because sorting by a column the file does not carry is a question
   * about rows nobody can see.
   */
  const sortableKeys = aggregating
    ? [...config.groupBy, ...measureItems.map((m) => m.alias)]
    : orderedColumns.map((c) => c.name);

  const visibleRows = aggregating
    ? matchingRows
    : sortRows(matchingRows, config.orderBy, config.columns);

  /**
   * The same rollup the endpoint would run, over the sample.
   *
   * The filters come first, because they are a WHERE and this is a GROUP BY.
   * Two hundred lines cannot stand in for a month, so what this shows is
   * the file's columns and which group keys the data produces — the preview
   * says as much where the numbers are.
   */
  const summary = aggregating
    ? (() => {
        const rolled = rollupMeasures(matchingRows, {
          groupBy: config.groupBy,
          items: measureItems,
          columns: config.columns,
          // An explicit sort answers this; the key order is the fallback.
          ordered: config.flags.ordered && config.orderBy.length === 0,
        });
        return {
          columns: rolled.columns,
          rows: sortRows(rolled.rows, config.orderBy, config.columns),
        };
      })()
    : { columns: [] as string[], rows: [] as typeof matchingRows };

  return {
    names,
    rangeStart,
    rangeEnd,
    orderedColumns,
    aggregating,
    measureItems,
    blocked,
    sortableKeys,
    visibleRows,
    summary,
  };
};
