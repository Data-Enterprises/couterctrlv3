// Hooks
import { useAppDispatch } from "../../../../hooks";
import { useDevApi } from "../../../../hooks/useDevApi";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import {
  failExport,
  finishExport,
  markExportSlow,
  markSavedLoaded,
  openBuilds,
  relabelBuild,
  setBuilds,
  startBuildsLoad,
  startExport,
  type ExportBuilderState,
} from "../../../../features/dev/devExportBuilderSlice";

// API
import {
  runExport,
  type ExportParams,
  type ExportResp,
  type ExportTableKey,
} from "../../../../api/salesExport";
import {
  deleteExportBuild,
  linkExportBuild,
  listExportBuilds,
  type BuildLinkResp,
  type DeleteBuildResp,
  type ExportBuild,
  type ExportBuildsResp,
} from "../../../../api/exportBuilds";
import type { SavedConfigPayload } from "../../../../api/savedConfigs";

// Utils
import {
  reasonOf,
  serverDetail,
  serverStatus,
} from "../../../../utils/serverError";
import { answerFailed as failed, buildsFailed, SLOW_AFTER_MS } from "../utils";
import { planLoad } from "../utils/savedExports";

// Interfaces
import type { JsonError } from "../../../../interfaces";
import type { ExportSource } from "../utils/sources";

/** Past builds and the build itself: list, label, reload one's settings,
 *  delete, and run a new export. */
export const useBuilds = (
  config: ExportBuilderState,
  source: ExportSource,
  /** The request this configuration makes, and the filter names it may carry. */
  params: () => ExportParams,
  names: string[],
) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  // Coming Soon: dev API only.
  const { url, token } = useDevApi();
  const TABLE: ExportTableKey = source.key;

  /**
   * Past builds, from their manifests.
   *
   * Newest first, with links minted fresh by the listing — so this is read at
   * search time and again after a build, and never cached past the window the
   * response names.
   */

  const loadBuilds = (table: ExportTableKey = TABLE) => {
    dispatch(startBuildsLoad({ source: table }));
    listExportBuilds(url, token, table)
      .then((resp) => {
        const j = resp.data as ExportBuildsResp;
        if (failed(j)) {
          dispatch(buildsFailed(table, "Could not read your past builds."));
          return;
        }
        dispatch(
          setBuilds({
            source: table,
            builds: j.builds ?? [],
            expireMinutes: j.urlExpiresInMinutes ?? 60,
          }),
        );
      })
      .catch((err: JsonError) =>
        dispatch(
          buildsFailed(
            table,
            "Could not read your past builds: " + reasonOf(err),
          ),
        ),
      );
  };

  /**
   * Attach a saved configuration to a build that was run ad-hoc, or clear it.
   *
   * Only the manifest changes. A 409 means another tab wrote it since this
   * list was read, which is a reload rather than a retry.
   */
  const labelBuild = (buildId: string, userQueryId: number | null) => {
    linkExportBuild(url, token, TABLE, buildId, userQueryId)
      .then((resp) => {
        const j = resp.data as BuildLinkResp;
        if (failed(j)) {
          dispatch(buildsFailed(TABLE, "Could not label that build."));
          return;
        }
        dispatch(
          relabelBuild({
            buildId: j.buildId,
            userQueryId: j.userQueryId,
            userQueryName: j.userQueryName,
          }),
        );
      })
      .catch((err: JsonError) => {
        const status = serverStatus(err);
        dispatch(
          buildsFailed(
            TABLE,
            status === 409
              ? "That build was changed somewhere else. Reload the list and try again."
              : "Could not label that build: " + reasonOf(err),
          ),
        );
      });
  };

  /**
   * Put a past build back on screen.
   *
   * From the build, not from the config it names: the manifest is literally
   * what produced that file, and the config row may have been edited or
   * deleted since. The range comes back too — a configuration over somebody
   * else's dates is a hybrid nobody asked for — which means re-running the
   * preview for that scope.
   */
  /**
   * Put a past build's settings back on screen.
   *
   * From the build, never from the configuration it names: the manifest is
   * literally what produced that file, and the configuration row may have
   * been edited or deleted since.
   *
   * The DATES are left alone on purpose. A build is a question asked of one
   * window; reloading it is nearly always to ask the same question of a
   * different one, and re-running the preview for last week's range is a
   * three-second wait to undo. The days it pinned inside its own range go
   * with them, and the note says so.
   *
   * Everything else is intersected with what the open range actually holds,
   * through the same check a saved configuration goes through — including the
   * price types, which are a different company's words often enough to
   * matter.
   */
  const reloadBuild = (build: ExportBuild) => {
    const request = build.request;
    const filters = request.filters ?? {};
    // A list filter's values as strings, the way the slice holds them. A
    // number column came back from the manifest as numbers.
    const listValues = (name: string) => {
      const value = filters[name];
      return Array.isArray(value) ? value.map(String) : null;
    };
    const typed = (name: string) => listValues(name) ?? [];
    const payload: SavedConfigPayload = {
      v: 2,
      source: source.key,
      mode: request.groupBy?.length ? "summary" : "lines",
      columns: request.columns ?? [],
      columnOrder: request.columns ?? [],
      groupBy: request.groupBy ?? [],
      aggregates: request.aggregates ?? [],
      computed: request.computed ?? [],
      orderBy: request.orderBy ?? [],
      storeIds: request.storeids ?? null,
      filters: Object.fromEntries(
        source.lists.map((l) => [l.filter, listValues(l.filter)]),
      ),
      productCodes: typed(source.codes.filter),
      productDescriptions: typed(source.descriptions.filter),
      rowFlags: Object.fromEntries(
        source.flags.map((f) => {
          const value = filters[f.filter];
          return [f.filter, typeof value === "number" ? value : null];
        }),
      ),
      output: {
        dateFormat: request.dateFormat ?? "",
        fileFormat: request.fileFormat ?? "csv",
        // None is the table's own name, which is what "" means here.
        filePrefix: request.filePrefix ?? "",
        ordered: request.ordered ?? false,
      },
    };

    const plan = planLoad(payload, config, source);
    plan.actions.forEach((action) => dispatch(action));
    dispatch(
      markSavedLoaded({
        // Null for an ad-hoc build: there is no configuration behind it, and
        // claiming one would put the wrong name on the next build.
        id: build.userQueryId,
        notes: [
          `Loaded from the build of ${build.startDate} to ${build.endDate}. The dates you searched were left as they are.`,
          ...plan.missing,
        ],
      }),
    );
    dispatch(openBuilds(false));
  };

  /**
   * Delete a build, file and manifest together.
   *
   * The list is read again rather than patched: a partial delete is a real
   * outcome on that endpoint, and the listing is the only thing that knows
   * what is actually left.
   */
  const removeBuild = (buildId: string) => {
    dispatch(startBuildsLoad({ source: TABLE }));
    deleteExportBuild(url, token, TABLE, buildId)
      .then((resp) => {
        const j = resp.data as DeleteBuildResp;
        if (failed(j)) {
          dispatch(buildsFailed(TABLE, "That build could not be deleted."));
          loadBuilds();
          return;
        }
        toast.success(
          `Deleted ${j.filesDeleted} file${j.filesDeleted === 1 ? "" : "s"}, freeing ${(
            (j.bytesFreed ?? 0) /
            1024 /
            1024
          ).toFixed(1)} MB`,
        );
        loadBuilds();
      })
      .catch((err: JsonError) => {
        dispatch(
          buildsFailed(
            TABLE,
            "That build could not be deleted: " +
              reasonOf(err) +
              " — anything already removed stays removed, so trying again is safe.",
          ),
        );
        loadBuilds();
      });
  };

  const build = () => {
    dispatch(startExport());
    // This build's own, not `config.slow`: the callbacks below close over
    // the page as it was when Build was pressed, which is never slow yet.
    let wentSlow = false;
    const slowTimer = window.setTimeout(() => {
      wentSlow = true;
      dispatch(markExportSlow());
    }, SLOW_AFTER_MS);

    // The same object that was sent, so the card can tell later whether it
    // still describes what is on screen.
    const sent = params();
    runExport(url, token, TABLE, sent, names)
      .then((resp) => {
        window.clearTimeout(slowTimer);
        const j = resp.data as ExportResp;
        if (j.error !== 0 || j.success === false) {
          // The house convention: a 200 carrying `error: 1` and the reason
          // in `msg`. The reason is the useful half.
          const msg = (j as { msg?: string }).msg;
          dispatch(
            failExport(
              msg
                ? "The export did not complete: " + msg
                : "The export did not complete.",
            ),
          );
          return;
        }
        dispatch(
          finishExport({
            files: j.files ?? [],
            rowsUploaded: j.rowsUploaded ?? 0,
            elapsedSeconds: j.elapsedSeconds ?? 0,
            urlExpiresInMinutes: j.urlExpiresInMinutes ?? 60,
            buildId: j.buildId,
            userQueryId: j.userQueryId ?? null,
            userQueryName: j.userQueryName ?? null,
            // Absent from an older deploy reads as written, which is the
            // state that needs no warning.
            manifestWritten: j.manifestWritten !== false,
            request: JSON.stringify(sent),
          }),
        );
        // The listing mints its own links, so the new build appears with one.
        loadBuilds();
      })
      .catch((err: JsonError) => {
        window.clearTimeout(slowTimer);
        const status = serverStatus(err);
        const detail = serverDetail(err);

        // Each of these is a different thing to do next, so each says so.
        //
        // A 403 names a store this user no longer has, and a 400 names the
        // columns it did not recognise: the endpoint puts the answer in the
        // message, and swallowing it would leave someone guessing.
        //
        // The load balancer gives up at 150s and the browser reports that as
        // a CORS failure rather than a timeout. The file is usually still
        // being written, so it is not a failure to report as one.
        dispatch(
          failExport(
            status === 403
              ? (detail ?? "One of these stores is no longer yours to export.")
              : status === 400
                ? (detail ?? "The endpoint refused this configuration.")
                : status === 404
                  ? "That saved configuration is gone. Save this one again before building."
                  : !status || wentSlow
                    ? "The connection gave up before the file was ready — the load balancer stops waiting at 150 seconds. The file is probably still being written: look in Previous builds in a minute, or try a shorter range."
                    : "The export failed: " + reasonOf(err),
          ),
        );
      });
  };

  return { loadBuilds, labelBuild, reloadBuild, removeBuild, build };
};
