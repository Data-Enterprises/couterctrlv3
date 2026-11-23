// Utils
import { COLS, HEAD, HEAD_CELLS } from "../../utils";
import { PERF_SORT_HEADER } from "../../../../../components/utils";
import { colInputStyle } from "../../../../../components/filters/colFilterStyles";

// Interfaces
import type { SortState } from "../../../../../utils/useTriStateSort";
import type { SortCol } from "../../interfaces";

// Components
import SortHeader from "../../../../../components/SortHeader";
import ColFilter from "../../../../../components/filters/ColFilterPopover";

interface GridHeadProps {
  sort: SortState<SortCol>;
  onSort: (col: SortCol) => void;
  draftUpc: string;
  setDraftUpc: (v: string) => void;
  appliedUpc: string;
  setAppliedUpc: (v: string) => void;
  draftDesc: string;
  setDraftDesc: (v: string) => void;
  appliedDesc: string;
  setAppliedDesc: (v: string) => void;
}

/** The grid's heading row: Item with its UPC and Desc filters, then the
 *  sortable figure columns. */
const GridHead = ({
  sort,
  onSort,
  draftUpc,
  setDraftUpc,
  appliedUpc,
  setAppliedUpc,
  draftDesc,
  setDraftDesc,
  appliedDesc,
  setAppliedDesc,
}: GridHeadProps) => (
  <div className={HEAD} style={{ gridTemplateColumns: COLS }}>
    {/* Same construction as ItemMarginsTable's header: the column
        name, then the two filter labels beside it. */}
    <span
      className={`${PERF_SORT_HEADER} flex-1 flex items-center gap-2 min-w-0`}
    >
      Item
      <ColFilter
        label="UPC"
        labelSize="text-[9px]"
        active={!!appliedUpc}
        onApply={() => setAppliedUpc(draftUpc)}
        onClear={() => {
          setAppliedUpc("");
          setDraftUpc("");
        }}
      >
        <input
          autoFocus
          style={colInputStyle}
          placeholder="Search UPC…"
          value={draftUpc}
          onChange={(e) => setDraftUpc(e.target.value)}
        />
      </ColFilter>
      <ColFilter
        label="Desc"
        labelSize="text-[9px]"
        active={!!appliedDesc}
        onApply={() => setAppliedDesc(draftDesc)}
        onClear={() => {
          setAppliedDesc("");
          setDraftDesc("");
        }}
      >
        <input
          autoFocus
          style={colInputStyle}
          placeholder="Search description…"
          value={draftDesc}
          onChange={(e) => setDraftDesc(e.target.value)}
        />
      </ColFilter>
    </span>
    {HEAD_CELLS.slice(1).map((cell) =>
      cell.col ? (
        <SortHeader
          key={cell.label}
          col={cell.col}
          label={cell.label}
          sort={sort}
          onSort={onSort}
          className={`${PERF_SORT_HEADER} justify-end`}
        />
      ) : (
        <span
          key={cell.label}
          className={`${PERF_SORT_HEADER} ${
            cell.label === "Notes" ? "" : "text-right"
          }`}
        >
          {cell.label}
        </span>
      ),
    )}
  </div>
);

export default GridHead;
