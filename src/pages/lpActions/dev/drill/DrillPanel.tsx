import { ArrowDownTrayIcon, ArrowLeftIcon } from "@heroicons/react/20/solid";
import FacetDrillChart from "./FacetDrillChart";
import { FACETS } from "./facetModel";
import type { FacetBranch, FacetKey, FacetSpec } from "./facetModel";

/**
 * The zoomed node: a facet switcher over one exception type.
 *
 * The switcher is the whole idea. Nine voids are a Friday habit, one lane, one
 * hour or one item, and the only way to find out which is to cut the same nine
 * against each axis in turn — so changing the cut is one click, and the centre
 * never moves while you do it.
 */
interface Props {
  saleType: string;
  total: number;
  fill: string;
  facet: FacetKey;
  onFacet: (facet: FacetKey) => void;
  branches: FacetBranch[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  onBack: () => void;
  onExport: () => void;
  linesLoading: boolean;
}

const emptyText = (spec: FacetSpec, loading: boolean) =>
  spec.needsLines && loading
    ? "Reading the receipts…"
    : `No ${spec.noun} data came back for these receipts.`;

const DrillPanel = ({
  saleType,
  total,
  fill,
  facet,
  onFacet,
  branches,
  selected,
  onSelect,
  onBack,
  onExport,
  linesLoading,
}: Props) => {
  const spec = FACETS.find((f) => f.key === facet) ?? FACETS[0];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11.5px] font-medium text-content hover:underline flex-shrink-0"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          All types
        </button>
        <span className="flex-1 min-w-0 text-[11px] font-semibold uppercase tracking-wide text-content/85 truncate">
          {saleType} by {spec.label.toLowerCase()}
        </span>
        <button
          onClick={onExport}
          title="Export these cuts to CSV"
          className="flex-shrink-0 flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded border border-gray-200 text-content hover:bg-gray-50 transition-colors"
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <div className="flex items-center gap-1 flex-wrap mb-2">
        {FACETS.map((f) => {
          const on = f.key === facet;
          return (
            <button
              key={f.key}
              onClick={() => onFacet(f.key)}
              className={`text-[11.5px] px-2 py-0.5 rounded border transition-colors ${
                on
                  ? "border-[#1e2a4a] bg-[#1e2a4a] text-custom-white"
                  : "border-gray-200 text-content hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {branches.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-center text-[12px] text-content/85 px-4">
          {emptyText(spec, linesLoading)}
        </div>
      ) : (
        <FacetDrillChart
          centreLabel={saleType}
          centreCount={total}
          centreFill={fill}
          branches={branches}
          selected={selected}
          onSelect={onSelect}
        />
      )}

      <p className="text-[11.5px] text-content/85 leading-snug px-1">
        Each branch is the same {saleType.toLowerCase()} cut by{" "}
        {spec.label.toLowerCase()}. Click one to read it against every other
        axis, and to narrow the timeline and the receipts beside it.
      </p>
    </div>
  );
};

export default DrillPanel;
