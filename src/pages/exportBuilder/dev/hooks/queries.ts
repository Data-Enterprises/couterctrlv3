// Hooks
import { useAppDispatch } from "../../../../hooks";
import { useDevApi } from "../../../../hooks/useDevApi";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import {
  clearDeletedQuery,
  forgetQuery,
  setQueries,
  startQueriesLoad,
  upsertQuery,
  type ExportBuilderState,
} from "../../../../features/dev/devExportBuilderSlice";

// API
import {
  createSavedQuery,
  deleteSavedQuery,
  listSavedQueries,
  queryProject,
  updateSavedQuery,
  type DeletedQueryResp,
  type SavedQueriesResp,
  type SavedQuery,
  type SavedQueryResp,
} from "../../../../api/savedQueries";

// Utils
import { reasonOf } from "../../../../utils/serverError";
import { queriesFailed } from "../utils";

// Interfaces
import type { ExportTableKey } from "../../../../api/salesExport";
import type { JsonError } from "../../../../interfaces";

/** The user's saved queries for this table: list, save, rename, delete and
 *  undo the delete. */
export const useSavedQueries = (
  config: ExportBuilderState,
  TABLE: ExportTableKey,
) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  // Coming Soon: dev API only.
  const { url, token } = useDevApi();

  /**
   * The user's saved queries.
   *
   * Filtered to this page's own label: the table is shared with the developer
   * query window, whose rows are real SQL — REINDEX, INSERT INTO stores — and
   * a developer who also uses this page should not find those in their export
   * list.
   */
  const loadQueries = (table: ExportTableKey = TABLE) => {
    dispatch(startQueriesLoad());
    listSavedQueries(url, token, queryProject(table))
      .then((resp) => {
        const j = resp.data as SavedQueriesResp;
        if (j.error !== 0) {
          dispatch(queriesFailed(table, "Could not read your saved queries."));
          return;
        }
        dispatch(setQueries({ source: table, queries: j.queries ?? [] }));
      })
      .catch((err: JsonError) =>
        dispatch(
          queriesFailed(
            table,
            "Could not read your saved queries: " + reasonOf(err),
          ),
        ),
      );
  };

  /**
   * Save what is in the scratchpad.
   *
   * `id` decides which call it is: the row it was loaded from gets a PUT, and
   * Save as sends null for a POST. Names are not unique on that table, so the
   * page is what keeps Save from quietly making a second copy every time.
   */
  const saveQuery = (
    name: string,
    sql: string,
    id: number | null,
    description = "",
  ) => {
    const trimmed = name.trim();
    if (!trimmed || !sql.trim()) return;
    // A new row stores a blank description as null. An update cannot send
    // null for that: the endpoint reads null as "leave it alone", so a
    // description someone had emptied stayed on the row. An update sends the
    // empty string instead, which every list here shows as no description.
    const note = description.trim() || null;
    const noteOnUpdate = description.trim();
    const done = (resp: { data: unknown }) => {
      const j = resp.data as SavedQueryResp;
      if (j.error !== 0 || !j.query) {
        dispatch(queriesFailed(TABLE, "That did not save."));
        return;
      }
      // The write returns the whole row, so there is nothing to refetch.
      dispatch(upsertQuery(j.query));
      toast.success(`Saved "${j.query.name}"`);
    };
    const failed = (err: JsonError) =>
      dispatch(queriesFailed(TABLE, "That did not save: " + reasonOf(err)));

    if (id === null) {
      createSavedQuery(url, token, {
        name: trimmed,
        sql,
        description: note,
        project: queryProject(TABLE),
      }).then(done, failed);
    } else {
      updateSavedQuery(url, token, id, {
        name: trimmed,
        sql,
        description: noteOnUpdate,
      }).then(done, failed);
    }
  };

  /**
   * A rename carries the name and the description; the query text is not
   * touched. Rename used to go through saveQuery with whatever was in the
   * box, so renaming a query you had been editing also replaced what it
   * said -- and a new name went out as a POST, leaving the old row behind.
   */
  const renameQuery = (id: number, name: string, description = "") => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateSavedQuery(url, token, id, {
      name: trimmed,
      // Empty, not null, so an emptied description is cleared (see saveQuery).
      description: description.trim(),
    })
      .then((resp) => {
        const j = resp.data as SavedQueryResp;
        if (j.error !== 0 || !j.query) {
          dispatch(queriesFailed(TABLE, "That did not rename."));
          return;
        }
        dispatch(upsertQuery(j.query));
        toast.success(`Renamed to "${j.query.name}"`);
      })
      .catch((err: JsonError) =>
        dispatch(queriesFailed(TABLE, "That did not rename: " + reasonOf(err))),
      );
  };

  const removeQuery = (query: SavedQuery) => {
    // Gone from the list at once, with the row held for the undo — the
    // endpoint hands the whole row back for exactly this.
    dispatch(forgetQuery(query));
    deleteSavedQuery(url, token, query.id)
      .then((resp) => {
        const j = resp.data as DeletedQueryResp;
        if (j.error !== 0) {
          dispatch(upsertQuery(query));
          dispatch(clearDeletedQuery());
          dispatch(queriesFailed(TABLE, "That did not delete."));
        }
      })
      .catch((err: JsonError) => {
        dispatch(upsertQuery(query));
        dispatch(clearDeletedQuery());
        dispatch(queriesFailed(TABLE, "That did not delete: " + reasonOf(err)));
      });
  };

  /** Posts the held row back; it returns with a new id, which is honest —
   *  the old one is gone. */
  const undoDeleteQuery = () => {
    const row = config.deletedQuery;
    if (!row) return;
    dispatch(clearDeletedQuery());
    createSavedQuery(url, token, {
      name: row.name,
      sql: row.sql,
      description: row.description,
      // Back into the list it was deleted from.
      project: row.project ?? queryProject(TABLE),
    })
      .then((resp) => {
        const j = resp.data as SavedQueryResp;
        if (j.error === 0 && j.query) dispatch(upsertQuery(j.query));
      })
      .catch((err: JsonError) =>
        dispatch(
          queriesFailed(TABLE, "Could not put it back: " + reasonOf(err)),
        ),
      );
  };

  return { loadQueries, saveQuery, renameQuery, removeQuery, undoDeleteQuery };
};
