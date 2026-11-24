interface DataLineProps {
  sourceLabel: string;
  /** A build is running; its answer belongs to this source. */
  building: boolean;
  onChangeSearch: () => void;
}

/**
 * Which table this is, and the way to another search. Change opens the search
 * card over the page with this table, store and dates on it; another table
 * keeps this one as it is, so coming back to it is not a second fetch.
 */
const DataLine = ({ sourceLabel, building, onChangeSearch }: DataLineProps) => (
  <div className="px-2.5 pb-1.5 flex-shrink-0" data-help="source">
    <div className="flex items-baseline gap-2 rounded-lg border border-brand_line_2 bg-card_bg px-2.5 py-1.5">
      <span className="text-[11px] cc-caps">Data</span>
      <span className="text-[12px] font-semibold flex-1">{sourceLabel}</span>
      <button
        type="button"
        onClick={onChangeSearch}
        disabled={building}
        title={
          building
            ? "Wait for the build to finish"
            : "Search another table, store or dates"
        }
        className="text-[11.5px] font-medium text-brand_navy_hover underline underline-offset-2 disabled:opacity-50 disabled:no-underline"
      >
        Change
      </button>
    </div>
  </div>
);

export default DataLine;
