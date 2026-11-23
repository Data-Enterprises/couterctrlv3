// Utils
import { FILTERS, releaseLabel } from "../utils";

// Interfaces
import type { Release } from "../../../content/releaseNotes";
import type { Filter } from "../interfaces";

// Components
import { XMarkIcon } from "@heroicons/react/20/solid";

interface PanelHeaderProps {
  releases: Release[];
  date: string;
  onDate: (date: string) => void;
  filter: Filter;
  onFilter: (filter: Filter) => void;
  /** Each chip's count for the release showing. */
  counts: Record<Filter, number>;
  sample: boolean;
  onClose: () => void;
}

/** The panel's title, the release picker and the kind chips. */
const PanelHeader = ({
  releases,
  date,
  onDate,
  filter,
  onFilter,
  counts,
  sample,
  onClose,
}: PanelHeaderProps) => (
  <div className="flex flex-shrink-0 flex-col gap-2.5 border-b border-brand_line bg-custom-white px-5 pb-3 pt-4">
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-content/95">
          What&rsquo;s new in CounterCtrl
        </div>
        <h2 className="m-0 mt-0.5 text-[20px] font-bold text-content">
          Release notes
        </h2>
      </div>
      {sample ? (
        <span className="mt-1 rounded-md border border-severity_watch_text/20 bg-severity_watch_bg px-2 py-0.5 text-[11px] font-medium text-severity_watch_text">
          Sample notes, for trying the panel
        </span>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close release notes"
        className="rounded-md p-1 cc-muted-link hover:bg-brand_navy/[0.06]"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>

    {releases.length > 0 ? (
      <label className="flex items-center gap-2.5 text-[12px] font-semibold text-brand_slate">
        Release
        <select
          value={date}
          onChange={(e) => onDate(e.target.value)}
          className="h-[34px] flex-1 rounded-lg border border-brand_line bg-brand_paper py-0 pl-2.5 pr-9 text-[13px] font-medium text-content outline-none focus:border-brand_navy"
        >
          {releases.map((r, i) => (
            <option key={r.date} value={r.date}>
              {releaseLabel(r, i === 0)}
            </option>
          ))}
        </select>
      </label>
    ) : null}

    <div role="group" aria-label="Show" className="flex gap-1.5">
      {FILTERS.map((f) => {
        const on = filter === f.key;
        return (
          <button
            key={f.key}
            type="button"
            aria-pressed={on}
            onClick={() => onFilter(f.key)}
            className={`inline-flex h-[30px] items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition-colors ${
              on
                ? "border-brand_navy bg-brand_navy text-custom-white"
                : "border-brand_line bg-brand_paper text-content hover:border-brand_line_2"
            }`}
          >
            {f.Icon ? <f.Icon aria-hidden className="h-3.5 w-3.5" /> : null}
            {f.label}{" "}
            <span
              className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                on ? "bg-custom-white/20" : "bg-brand_navy/[0.08]"
              }`}
            >
              {counts[f.key]}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default PanelHeader;
