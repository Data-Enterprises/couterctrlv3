// Hooks
import { useAppDispatch } from "../../../../hooks";
import { useDevApi } from "../../../../hooks/useDevApi";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import {
  failConfigLoad,
  restoreSource,
  setConfig,
  setRouterFilters,
  startConfigLoad,
  stashSource,
  type ExportBuilderState,
} from "../../../../features/dev/devExportBuilderSlice";

// API
import {
  getExportPreview,
  getExportTables,
  type ExportPreviewResp,
  type ExportTableKey,
  type ExportTablesResp,
} from "../../../../api/salesExport";

// Utils
import { reasonOf } from "../../../../utils/serverError";
import { daysInRange } from "../utils";
import { sourceFor } from "../utils/sources";

// Interfaces
import type { JsonError } from "../../../../interfaces";
import type { RootState } from "../../../../store";

/** Running the search: the preview for the picked table, store and dates (or
 *  the same table brought back from the store), and the router's filter names. */
export const useConfigLoad = (args: {
  config: ExportBuilderState;
  search: RootState["search"];
  scope: string;
  searchingGroup: boolean;
  startDate: string;
  endDate: string;
  loadQueries: (table?: ExportTableKey) => void;
  loadSaved: (table?: ExportTableKey) => void;
  loadBuilds: (table?: ExportTableKey) => void;
}) => {
  const {
    config,
    search,
    scope,
    searchingGroup,
    startDate,
    endDate,
    loadQueries,
    loadSaved,
    loadBuilds,
  } = args;
  const dispatch = useAppDispatch();
  const toast = useToast();
  // Coming Soon: dev API only.
  const { url, token } = useDevApi();

  /**
   * One call, and everything the page offers comes out of it: the stores the
   * scope resolved to, the lists actually present, every column, and the
   * sample rows. Narrowing afterwards is local -- nothing here is asked twice.
   *
   * Nor is a source: one already loaded for this same search comes back from
   * the store as it was left, and only its builds are read again, because
   * their links expire.
   */
  const loadConfig = () => {
    const chosen = sourceFor(config.searchSource);
    // Kept before another table replaces it: the same search may come back
    // to it. The same table asked again is a re-read (rows that arrived
    // since), which keeps its shape as a new range does.
    if (config.loaded && chosen.key !== config.source) dispatch(stashSource());
    // A failed search puts that page back (failConfigLoad), and says so.
    const kept = config.loaded ? " The page is as it was." : "";
    if (scope === config.cacheScope && config.cache[chosen.key]) {
      // Its queries were still on their way when it was left, and that
      // answer was dropped: ask again.
      const unanswered = config.cache[chosen.key]?.queriesLoading;
      dispatch(restoreSource(chosen.key));
      loadBuilds(chosen.key);
      if (unanswered) loadQueries(chosen.key);
      return;
    }
    dispatch(
      startConfigLoad({ source: chosen.key, scope, startDate, endDate }),
    );
    // Alongside the preview rather than after it. None of these waits on
    // another, and the lists are ready by the time anyone looks for them.
    loadQueries(chosen.key);
    loadSaved(chosen.key);
    loadBuilds(chosen.key);
    loadRouterFilters();
    getExportPreview(url, token, chosen.key, {
      startDate,
      endDate,
      singleStore: searchingGroup ? 0 : 1,
      useGroups: searchingGroup ? 1 : 0,
      searchValue: searchingGroup
        ? search.selectedGroup.id
        : search.selectedStore.storeid,
    })
      .then((resp) => {
        const j = resp.data as ExportPreviewResp;
        if (j.error !== 0) {
          dispatch(failConfigLoad());
          toast.error(`Could not load ${chosen.label}.${kept}`);
          return;
        }
        const facets = j.facets ?? {};
        dispatch(
          setConfig({
            source: chosen.key,
            stores: j.stores ?? [],
            // Each list turned into choices by the source's description.
            lists: Object.fromEntries(
              chosen.lists.map((l) => [l.filter, l.toItems(facets[l.facet])]),
            ),
            dateFormats: j.dateFormats ?? [],
            // Not from the response: the endpoint returns no day list, and a
            // day with no rows is still a day someone can ask to exclude.
            days: daysInRange(startDate, endDate),
            columns: j.columns ?? [],
            rows: j.rows ?? [],
            hasData: j.hasData,
            message: j.message,
          }),
        );
      })
      .catch((err: JsonError) => {
        dispatch(failConfigLoad());
        toast.error(
          `Could not load ${chosen.label}: ${reasonOf(err).replace(/\.$/, "")}.${kept}`,
        );
      });
  };

  /**
   * The filter names each table takes, from the router. Read once a session:
   * it is static on the router's side. A failure leaves the check off rather
   * than blocking every build -- the request is built from the source's own
   * names either way.
   */
  const loadRouterFilters = () => {
    if (config.routerFilters) return;
    getExportTables(url, token)
      .then((resp) => {
        const j = resp.data as ExportTablesResp;
        if (j.error !== 0 || !Array.isArray(j.tables)) return;
        dispatch(
          setRouterFilters(
            Object.fromEntries(
              j.tables.map((t) => [t.key, t.filters.map((x) => x.name)]),
            ),
          ),
        );
      })
      .catch(() => undefined);
  };

  return { loadConfig };
};
