import { useState } from "react";
import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Modal from "../../../components-dev/Modal";
import SelectFilter from "../../../components-dev/filters/SelectFilter";
import { useExportBuilderCtx } from "./hooks";
import { openBuilds } from "../../../features/dev/devExportBuilderSlice";
import type { ExportBuild } from "../../../api/exportBuilds";

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * When it ran, in the reader's own time.
 *
 * The manifest stamps UTC with microseconds. A build run at 9:50am Central
 * carries 14:50, and printed as-is the list reads as the future.
 */
const ranAt = (iso: string) => {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  return at.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

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

  const close = () => ctx.dispatch(openBuilds(false));

  /** One bucket per configuration, in the order the builds arrive, with the
   *  ad-hoc ones last however many there are. */
  const groups: { id: number | null; name: string; builds: ExportBuild[] }[] = [];
  for (const build of ctx.builds) {
    const found = groups.find((g) => g.id === build.userQueryId);
    if (found) {
      found.builds.push(build);
      continue;
    }
    groups.push({
      id: build.userQueryId,
      name: build.userQueryName ?? "Ad-hoc",
      builds: [build],
    });
  }
  groups.sort((a, b) => (a.id === null ? 1 : 0) - (b.id === null ? 1 : 0));

  const configOptions = [
    { value: "", label: "Ad-hoc (no configuration)" },
    ...ctx.saved.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  return (
    <Modal
      isOpen
      onClose={close}
      modalClassName="bg-card_bg w-[860px] max-w-[94vw] max-h-[84vh]"
    >
      <div className="flex flex-col gap-3 p-4 min-h-0">
        <div className="flex items-baseline gap-3 flex-shrink-0">
          <h2 className="text-[15px] font-semibold">Previous builds</h2>
          <span className="text-[11.5px] text-content/60">
            yours, newest first · links last {ctx.buildsExpireMinutes} min from
            this listing
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={ctx.loadBuilds}
            disabled={ctx.buildsLoading}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
          >
            {ctx.buildsLoading ? "Reading..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={close}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white transition-colors"
          >
            Close
          </button>
        </div>

        {ctx.buildsError && (
          <div className="flex-shrink-0 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[12px] text-amber-900">
            {ctx.buildsError}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.id ?? "adhoc"} className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-content/60">
                  {group.name}
                </span>
                <span className="text-[11px] text-content/45">
                  {group.builds.length} build
                  {group.builds.length === 1 ? "" : "s"}
                </span>
              </div>

              {group.builds.map((build) => (
                <div
                  key={build.buildId}
                  className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 ${
                    build.expired
                      ? "border-brand_line bg-custom-white opacity-70"
                      : "border-brand_line bg-card_bg"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      build.expired ? "bg-brand_line" : "bg-brand_green_tint"
                    }`}
                  >
                    <ArrowDownTrayIcon
                      className={`w-4 h-4 ${
                        build.expired ? "text-content/40" : "text-brand_green"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold">
                      {build.startDate} to {build.endDate}
                      <span className="font-normal text-content/60">
                        {" "}
                        · {build.storeCount} store
                        {build.storeCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-content/70 mt-0.5">
                      {build.rowsUploaded.toLocaleString()} rows ·{" "}
                      {mb(build.bytesUploaded)} ·{" "}
                      {build.fileFormat.toUpperCase()} · built in{" "}
                      {build.elapsedSeconds.toFixed(1)}s
                    </div>
                    <div className="text-[11px] text-content/45 mt-0.5">
                      ran {ranAt(build.createdAt)}
                    </div>
                  </div>

                  {/* Relabelling only rewrites the manifest; the file is never
                      touched, which is why it is offered here at all. */}
                  {labelling === build.buildId ? (
                    <SelectFilter
                      plain
                      searchable
                      searchPlaceholder="Find a configuration..."
                      options={configOptions}
                      value={build.userQueryId ? String(build.userQueryId) : ""}
                      onChange={(value) => {
                        ctx.labelBuild(build.buildId, value ? Number(value) : null);
                        setLabelling(null);
                      }}
                      className="w-[170px] flex-shrink-0"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLabelling(build.buildId)}
                      className="text-[11.5px] text-brand_navy_hover underline underline-offset-2 flex-shrink-0"
                    >
                      {build.userQueryId ? "Relabel" : "Label"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => ctx.reloadBuild(build)}
                    title="Put this build's settings and dates back on the page"
                    className="flex items-center gap-1 text-[12.5px] font-medium px-3 py-2 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors flex-shrink-0"
                  >
                    <ArrowPathIcon className="w-3.5 h-3.5" />
                    Reload
                  </button>

                  {build.expired ? (
                    <span className="text-[11.5px] text-content/60 text-right max-w-[14ch] flex-shrink-0">
                      File is gone — build it again
                    </span>
                  ) : (
                    build.files.map((file) => (
                      <a
                        key={file.key}
                        href={file.url}
                        download
                        className="bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-colors flex-shrink-0"
                      >
                        Download
                      </a>
                    ))
                  )}
                </div>
              ))}
            </div>
          ))}

          {ctx.builds.length === 0 && (
            <div className="py-8 text-center">
              <div className="text-[13px] font-semibold">
                {ctx.buildsLoading ? "Reading your builds..." : "No builds yet"}
              </div>
              <div className="text-[12.5px] text-content/70 mt-1.5 max-w-[48ch] mx-auto">
                Every file you build lands here with the settings that made it,
                so a month from now you can download it again or put those
                settings back on the page.
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DownloadsModal;
