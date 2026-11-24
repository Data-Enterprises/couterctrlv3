// Utils
import { PCT_COL_W } from "../../../../../utils/severity";
import { PERF_SORT_HEADER } from "../../../../../components-dev/utils";

// Interfaces
import type { ListSortCol } from "../../interfaces";
import type { SortState } from "../../../../../utils/useTriStateSort";

// Components
import SortHeader from "../../../../../components-dev/SortHeader";

interface ListColumnHeadProps {
  sort: SortState<ListSortCol>;
  onSort: (col: ListSortCol) => void;
}

/** The category list's column heads; TY, vs LW and vs LY sort. */
const ListColumnHead = ({ sort, onSort }: ListColumnHeadProps) => (
  <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-line_hair flex-shrink-0">
    <span className="w-2.5 flex-shrink-0" />
    <span className="text-[11.5px] cc-caps flex-1">Category</span>
    <div data-help="sort" className="flex items-center gap-[14px]">
      <SortHeader
        col="ty"
        label="TY"
        sort={sort}
        onSort={onSort}
        width={64}
        className={`${PERF_SORT_HEADER} justify-end pl-2.5`}
      />
      <SortHeader
        col="lw"
        label="vs LW"
        sort={sort}
        onSort={onSort}
        width={PCT_COL_W}
        className={`${PERF_SORT_HEADER} justify-center`}
      />
      <SortHeader
        col="ly"
        label="vs LY"
        sort={sort}
        onSort={onSort}
        width={PCT_COL_W}
        className={`${PERF_SORT_HEADER} justify-center`}
      />
    </div>
  </div>
);

export default ListColumnHead;
