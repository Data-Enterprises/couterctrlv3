// Utils
import { fileName, mb, ranAt } from "../utils";

// Interfaces
import type { ExportBuild } from "../../../../../api/exportBuilds";
import type { SelectFilterOption } from "../../../../../components-dev/filters/interfaces";

// Components
import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";

interface BuildRowProps {
  build: ExportBuild;
  /** Its label picker is open. */
  labelling: boolean;
  /** The query it ran is showing under the group. */
  showingQuery: boolean;
  /** Its parts list is open under the group. */
  partsOpen: boolean;
  /** The saved configurations it can be labelled with. */
  configOptions: SelectFilterOption[];
  onStartLabel: () => void;
  /** A configuration id, or null for ad-hoc. */
  onLabel: (userQueryId: number | null) => void;
  onToggleQuery: () => void;
  onToggleParts: () => void;
  onDelete: () => void;
  onReload: () => void;
}

/** One past build: its file, range, size and when it ran, with Label,
 *  Delete, Reload and its download (or its parts, for a split build). */
const BuildRow = ({
  build,
  labelling,
  showingQuery,
  partsOpen,
  configOptions,
  onStartLabel,
  onLabel,
  onToggleQuery,
  onToggleParts,
  onDelete,
  onReload,
}: BuildRowProps) => (
  <div
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
        className={`w-4 h-4 ${build.expired ? "text-content/95" : "text-brand_green"}`}
      />
    </div>

    <div className="flex-1 min-w-0">
      {/* The file's own name first, and a count for a split build: joined, the
          names ran past the row and truncated mid-word. */}
      <div className="font-mono text-[12.5px] font-semibold truncate">
        {build.files[0] ? fileName(build.files[0].key) : "no file"}
        {build.files.length > 1 && (
          <span className="font-sans font-normal text-content/95">
            {" "}
            + {build.files.length - 1} more
          </span>
        )}
      </div>
      <div className="text-[11.5px] text-content/95 mt-0.5">
        {build.startDate} to {build.endDate} · {build.storeCount} store
        {build.storeCount === 1 ? "" : "s"} ·{" "}
        {build.rowsUploaded.toLocaleString()} rows · {mb(build.bytesUploaded)} ·{" "}
        {build.fileFormat.toUpperCase()}
      </div>
      <div className="text-[11px] text-content/95 mt-0.5">
        ran {ranAt(build.createdAt)} · built in{" "}
        {build.elapsedSeconds.toFixed(1)}s{" · "}
        <button
          type="button"
          onClick={onToggleQuery}
          className="text-brand_navy_hover underline underline-offset-2"
        >
          {showingQuery ? "hide the query" : "the query it ran"}
        </button>
      </div>
    </div>

    {/* Relabelling only rewrites the manifest; the file is never touched,
        which is why it is offered here at all. */}
    {labelling ? (
      <SelectFilter
        plain
        searchable
        searchPlaceholder="Find a configuration..."
        placeholder="Ad-hoc (no configuration)"
        options={configOptions}
        value={build.userQueryId ? String(build.userQueryId) : ""}
        onChange={(value) => onLabel(value ? Number(value) : null)}
        className="w-[170px] flex-shrink-0"
      />
    ) : (
      <button
        type="button"
        onClick={onStartLabel}
        className="text-[11.5px] text-brand_navy_hover underline underline-offset-2 flex-shrink-0"
      >
        {build.userQueryId ? "Relabel" : "Label"}
      </button>
    )}

    <button
      type="button"
      onClick={onDelete}
      aria-label={`Delete the build from ${build.startDate}`}
      title="Delete this build's file and its record"
      className="text-[11.5px] font-medium px-2.5 py-2 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors flex-shrink-0"
    >
      Delete
    </button>

    <button
      type="button"
      onClick={onReload}
      title="Put this build's settings and dates back on the page"
      className="flex items-center gap-1 text-[12.5px] font-medium px-3 py-2 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors flex-shrink-0"
    >
      <ArrowPathIcon className="w-3.5 h-3.5" />
      Reload
    </button>

    {/* One control per build, not one per file: a split build drew identical
        Download buttons for every part. Now the parts are a list you open,
        and each one is named. */}
    {build.expired ? (
      <span className="text-[11.5px] text-content/95 text-right max-w-[14ch] flex-shrink-0">
        File is gone — build it again
      </span>
    ) : build.files.length === 1 ? (
      <a
        href={build.files[0].url}
        download
        className="bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-colors flex-shrink-0"
      >
        Download
      </a>
    ) : (
      <button
        type="button"
        onClick={onToggleParts}
        aria-expanded={partsOpen}
        className="bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-colors flex-shrink-0"
      >
        {build.files.length} files
      </button>
    )}
  </div>
);

export default BuildRow;
