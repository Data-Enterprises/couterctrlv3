// Hooks
import { useState } from "react";
import { useExportBuilderCtx } from "../hooks/index";

// Redux
import { openBuilds } from "../../../../features/dev/devExportBuilderSlice";

// Utils
import { requestToQuery } from "../utils/query/configToQuery";
import { buildGroups, fileName } from "./utils";

// Interfaces
import type { ExportBuild } from "../../../../api/exportBuilds";

// Components
import Modal from "../../../../components-dev/Modal";
import ConfirmDelete from "../../../../components-dev/ConfirmDelete";
import BuildGroupHead from "./components/BuildGroupHead";
import BuildParts from "./components/BuildParts";
import BuildRow from "./components/BuildRow";
import DownloadsHeader from "./components/DownloadsHeader";
import NoBuilds from "./components/NoBuilds";

/**
 * Previous Builds: the questions as they were asked, and their files.
 *
 * A build is not a configuration. It is one run — the exact payload, the
 * dates, the stores, the counts — written to a manifest beside the file and
 * never rewritten. So reloading one comes from the build rather than from the
 * configuration it names: that configuration may have been edited or deleted
 * since, and the manifest is literally what produced the file.
 *
 * Grouped by the configuration it came from, with everything ad-hoc together
 * at the end. The grouping is ours to do — the endpoint joins nothing.
 */
const DownloadsModal = () => {
  const ctx = useExportBuilderCtx();
  const [labelling, setLabelling] = useState<string | null>(null);
  const [showing, setShowing] = useState<string | null>(null);
  const [parts, setParts] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ExportBuild | null>(null);

  const close = () => ctx.dispatch(openBuilds(false));

  const groups = buildGroups(ctx.builds);

  // The empty row is SelectFilter's `placeholder`; prepended here as well it
  // showed twice, under two different words.
  const configOptions = ctx.saved.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  return (
    <Modal
      isOpen
      onClose={close}
      modalClassName="bg-card_bg w-[860px] max-w-[94vw] max-h-[84vh] flex flex-col"
    >
      <div className="flex flex-1 flex-col gap-3 p-4 min-h-0">
        <DownloadsHeader
          expireMinutes={ctx.buildsExpireMinutes}
          loading={ctx.buildsLoading}
          onRefresh={() => ctx.loadBuilds()}
          onClose={close}
        />

        {ctx.buildsError && (
          <div className="flex-shrink-0 bg-severity_watch_bg border border-severity_watch_text/20 rounded-lg px-3 py-2 text-[12px] text-severity_watch_text">
            {ctx.buildsError}
          </div>
        )}

        <div className="cc-scroll flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.id ?? "adhoc"} className="flex flex-col gap-1.5">
              <BuildGroupHead name={group.name} count={group.builds.length} />

              {group.builds.map((build) => (
                <BuildRow
                  key={build.buildId}
                  build={build}
                  labelling={labelling === build.buildId}
                  showingQuery={showing === build.buildId}
                  partsOpen={parts === build.buildId}
                  configOptions={configOptions}
                  onStartLabel={() => setLabelling(build.buildId)}
                  onLabel={(userQueryId) => {
                    ctx.labelBuild(build.buildId, userQueryId);
                    setLabelling(null);
                  }}
                  onToggleQuery={() =>
                    setShowing(showing === build.buildId ? null : build.buildId)
                  }
                  onToggleParts={() =>
                    setParts(parts === build.buildId ? null : build.buildId)
                  }
                  onDelete={() => setDeleting(build)}
                  onReload={() => ctx.reloadBuild(build)}
                />
              ))}

              {group.builds
                .filter(
                  (build) => parts === build.buildId && build.files.length > 1,
                )
                .map((build) => (
                  <BuildParts key={`${build.buildId}-parts`} build={build} />
                ))}

              {group.builds
                .filter((build) => showing === build.buildId)
                .map((build) => (
                  <pre
                    key={`${build.buildId}-query`}
                    className="bg-custom-white border border-brand_line rounded-lg px-3 py-2 text-[11.5px] font-mono whitespace-pre-wrap break-words text-content"
                  >
                    {requestToQuery(build.request, ctx.source)}
                  </pre>
                ))}
            </div>
          ))}

          {ctx.builds.length === 0 && <NoBuilds loading={ctx.buildsLoading} />}
        </div>
      </div>

      {deleting && (
        <ConfirmDelete
          what={
            deleting.files.map((f) => fileName(f.key)).join(", ") ||
            `the build from ${deleting.startDate}`
          }
          kind="build"
          detail="The file and its record go together, and there is no undo — the bucket keeps no previous version. The configuration it came from is untouched."
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            ctx.removeBuild(deleting.buildId);
            setDeleting(null);
          }}
        />
      )}
    </Modal>
  );
};

export default DownloadsModal;
