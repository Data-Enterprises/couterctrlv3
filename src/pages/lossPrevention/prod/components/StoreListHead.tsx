// Utils
import { PERF_SORT_HEADER } from "../../../../components/utils";

// Interfaces
import type { SortState } from "../../../../utils/useTriStateSort";
import type { LpSortCol } from "../interfaces";

// Components
import SortHeader from "../../../../components/SortHeader";

interface StoreListHeadProps {
  sort: SortState<LpSortCol>;
  onSort: (col: LpSortCol) => void;
  hasAmount: boolean;
}

/** The store list's headings, each figure column sortable. */
const StoreListHead = ({ sort, onSort, hasAmount }: StoreListHeadProps) => (
  <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-line_hair flex-shrink-0">
    <span className="w-2.5 flex-shrink-0" />
    <span className="text-[11.5px] cc-caps flex-1">Store</span>
    <div data-help="sort" className="flex items-center gap-[14px]">
      <SortHeader
        col="trans"
        label="Trans"
        sort={sort}
        onSort={onSort}
        width={58}
        className={`${PERF_SORT_HEADER} justify-center`}
      />
      <SortHeader
        col="qty"
        label="Qty"
        sort={sort}
        onSort={onSort}
        width={58}
        className={`${PERF_SORT_HEADER} justify-center`}
      />
      {hasAmount && (
        <SortHeader
          col="amount"
          label="Total $"
          sort={sort}
          onSort={onSort}
          width={64}
          className={`${PERF_SORT_HEADER} justify-center pl-2.5`}
        />
      )}
      {hasAmount && (
        <SortHeader
          col="avg"
          label="Avg $"
          sort={sort}
          onSort={onSort}
          width={58}
          className={`${PERF_SORT_HEADER} justify-center`}
        />
      )}
    </div>
  </div>
);

export default StoreListHead;
