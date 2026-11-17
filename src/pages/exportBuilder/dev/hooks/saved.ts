// Hooks
import { useAppDispatch } from "../../../../hooks";
import { useDevApi } from "../../../../hooks/useDevApi";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import {
  markSavedLoaded,
  removeSaved,
  setSaved,
  startSavedWork,
  upsertSaved,
  type ExportBuilderState,
} from "../../../../features/dev/devExportBuilderSlice";

// API
import {
  createSavedConfig,
  deleteSavedConfig,
  listSavedConfigs,
  parseConfigRow,
  updateSavedConfig,
  type SavedConfig,
} from "../../../../api/savedConfigs";
import type {
  DeletedQueryResp,
  SavedQueriesResp,
  SavedQueryResp,
} from "../../../../api/savedQueries";

// Utils
import { reasonOf } from "../../../../utils/serverError";
import { answerFailed as failed, savedFailed } from "../utils";
import { planLoad, toPayload } from "../utils/savedExports";

// Interfaces
import type { ExportTableKey } from "../../../../api/salesExport";
import type { JsonError } from "../../../../interfaces";
import type { ExportSource } from "../utils/sources";

/** The user's saved configurations for this table: list, save, delete, and
 *  put one onto the range that is open. */
export const useSavedConfigs = (
  config: ExportBuilderState,
  source: ExportSource,
) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  // Coming Soon: dev API only.
  const { url, token } = useDevApi();
  const TABLE: ExportTableKey = source.key;

  /**
   * Saved configurations: list, save, remove, load.
   *
   * They live in one JSON file per user in S3 rather than in this page, so a
   * report someone set up on Monday is still there on Friday and on another
   * machine. The page holds the shape; the endpoint holds the file.
   */
  const loadSaved = (table: ExportTableKey = TABLE) => {
    dispatch(startSavedWork());
    listSavedConfigs(url, token, table)
      .then((resp) => {
        const j = resp.data as SavedQueriesResp;
        if (j.error !== 0) {
          dispatch(
            savedFailed(table, "Could not read your saved configurations."),
          );
          return;
        }
        // A row that will not parse is skipped rather than shown: the table
        // is shared, and one saved by hand is not ours to render. So is one
        // that exports another table, whatever label it was filed under.
        dispatch(
          setSaved({
            source: table,
            saved: (j.queries ?? [])
              .map(parseConfigRow)
              .filter(
                (c): c is SavedConfig =>
                  c !== null && c.payload.source === table,
              ),
          }),
        );
      })
      .catch((err: JsonError) =>
        dispatch(
          savedFailed(
            table,
            "Could not read your saved configurations: " + reasonOf(err),
          ),
        ),
      );
  };

  /**
   * Keep the configuration on screen.
   *
   * `id` decides the call: the row it was loaded from gets a PUT, and Save as
   * new sends null for a POST. Names are not unique on that table, so this is
   * what keeps Save from leaving a second copy every time.
   */
  const saveCurrent = (
    name: string,
    id: number | null,
    description: string | null = null,
  ) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch(startSavedWork());
    const payload = toPayload(config, source);
    const done = (resp: { data: unknown }) => {
      const j = resp.data as SavedQueryResp;
      const saved = j.error === 0 && j.query ? parseConfigRow(j.query) : null;
      if (!saved) {
        dispatch(savedFailed(TABLE, "That did not save."));
        return;
      }
      dispatch(upsertSaved(saved));
      toast.success(`Saved "${saved.name}"`);
    };
    const failed = (err: JsonError) =>
      dispatch(savedFailed(TABLE, "That did not save: " + reasonOf(err)));

    if (id === null) {
      createSavedConfig(url, token, {
        name: trimmed,
        description,
        payload,
      }).then(done, failed);
    } else {
      updateSavedConfig(url, token, id, {
        name: trimmed,
        description,
        payload,
      }).then(done, failed);
    }
  };

  const deleteSaved = (id: number) => {
    dispatch(startSavedWork());
    deleteSavedConfig(url, token, id)
      .then((resp) => {
        // The house 200 with `error: 1` inside: the row is still there, so
        // it stays in the list.
        if (failed(resp.data as DeletedQueryResp)) {
          dispatch(savedFailed(TABLE, "That did not delete."));
          return;
        }
        dispatch(removeSaved({ source: TABLE, id }));
      })
      .catch((err: JsonError) =>
        dispatch(savedFailed(TABLE, "That did not delete: " + reasonOf(err))),
      );
  };

  /**
   * Put a saved configuration onto the range that is open.
   *
   * Everything is intersected with what this range holds — a vendor that did
   * not trade this month is not a filter, it is an empty file — and whatever
   * fell out is reported rather than quietly dropped.
   */
  const applySaved = (saved: SavedConfig) => {
    const plan = planLoad(saved.payload, config, source);
    plan.actions.forEach((action) => dispatch(action));
    dispatch(markSavedLoaded({ id: saved.id, notes: plan.missing }));
  };

  return { loadSaved, saveCurrent, deleteSaved, applySaved };
};
