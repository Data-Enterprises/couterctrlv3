// Hooks
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useBuilds } from "./builds";
import { useConfigLoad } from "./load";
import { useSavedQueries } from "./queries";
import { useExportRequest } from "./request";
import { useSavedConfigs } from "./saved";

// Redux
import { isGroupSearch } from "../../../../features/searchSlice";
import { setCurrentQuery } from "../../../../features/dev/devExportBuilderSlice";

// Utils
import { formatGoliathDate } from "../../../../utils";
import { rangeBlock } from "../utils/rangeLimit";
import { sourceFor } from "../utils/sources";
import { scopeKey } from "../utils";
import { fileShapeOf } from "../utils/shape";

/**
 * The Export Builder page: the slice, what the file will be, and every call
 * the page makes (the search, saved queries and configurations, past builds,
 * Show SQL and the build), as one object.
 */
export const useExportBuilderCtx = () => {
  const dispatch = useAppDispatch();
  const search = useAppSelector((s) => s.search);
  const config = useAppSelector((s) => s.dev.exportBuilder);
  /** What the page knows about the table it exports. */
  const source = sourceFor(config.source);
  const TABLE = source.key;

  const startDate = formatGoliathDate(search.startDate);
  const endDate = formatGoliathDate(search.endDate);

  /** Why the search card cannot run this range, or null. */
  const searchBlocked = rangeBlock(startDate, endDate);

  /** The search the card holds now, keyed the way the kept sources are. */
  const searchingGroup = isGroupSearch(search.type);
  const scope = scopeKey(
    searchingGroup,
    searchingGroup ? search.selectedGroup.id : search.selectedStore.storeid,
    startDate,
    endDate,
  );

  const shape = fileShapeOf(config, source, startDate, endDate);
  const {
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
  } = shape;

  const { loadQueries, saveQuery, renameQuery, removeQuery, undoDeleteQuery } =
    useSavedQueries(config, TABLE);
  const { loadSaved, saveCurrent, deleteSaved, applySaved } = useSavedConfigs(
    config,
    source,
  );
  const { params, showSql } = useExportRequest(config, source, shape);
  const { loadBuilds, labelBuild, reloadBuild, removeBuild, build } = useBuilds(
    config,
    source,
    params,
    names,
  );
  const { loadConfig } = useConfigLoad({
    config,
    search,
    scope,
    searchingGroup,
    startDate,
    endDate,
    loadQueries,
    loadSaved,
    loadBuilds,
  });

  /**
   * The file on screen no longer describes what is configured.
   *
   * Compared as the request itself, because that is the thing that decides
   * what a file holds — a tick that changes nothing the endpoint sees should
   * not make a good file look stale.
   */
  const staleBuild =
    config.files.length > 0 &&
    config.builtRequest !== null &&
    config.builtRequest !== JSON.stringify(params());

  return {
    ...config,
    /** The whole slice, for the few callers that translate it wholesale. */
    config,
    /** What the page knows about the table it exports. The slice's own
     *  `source` is the key; this is the description. */
    source,
    dispatch,
    search,
    // The loaded search's, which is what the file is named and built by.
    startDate: rangeStart,
    endDate: rangeEnd,
    orderedColumns,
    visibleRows,
    measureItems,
    sortableKeys,
    loadSaved,
    saveCurrent,
    deleteSaved,
    applySaved,
    aggregating,
    summary,
    staleBuild,
    blocked,
    searchBlocked,
    loadConfig,
    loadBuilds,
    reloadBuild,
    labelBuild,
    removeBuild,
    loadQueries,
    saveQuery,
    renameQuery,
    removeQuery,
    undoDeleteQuery,
    setCurrentQuery,
    showSql,
    build,
  };
};

/** The table the search card is set to, read on its own so the picker does not
 *  run the whole page context. */
export const useSearchSource = () =>
  useAppSelector((s) => s.dev.exportBuilder.searchSource);
