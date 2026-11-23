// Interfaces
import type { SortState } from "../../../../../utils/useTriStateSort";
import type { StoreSortCol } from "../../interfaces";

// Components
import SortHeader from "../../../../../components/SortHeader";

interface StoreColumnHeadProps {
  sort: SortState<StoreSortCol>;
  onSort: (col: StoreSortCol) => void;
  /** vs Baseline only means something in Trend mode. */
  isTrend: boolean;
}

/** The store list's column heads; Amount, Trans and Count sort. */
const StoreColumnHead = ({ sort, onSort, isTrend }: StoreColumnHeadProps) => (
  <div className="flex items-center gap-2.5 px-3 py-1.5 bg-custom-white border-x border-b border-line_hair flex-shrink-0">
    <span className="w-2.5 flex-shrink-0" />
    <span className="flex-1 text-[10px] cc-caps-strong">Store</span>
    <div data-help="sort" className="flex items-center gap-[14px]">
      <SortHeader
        col="amount"
        label="Amount"
        sort={sort}
        onSort={onSort}
        className="text-[10px] cc-caps-strong justify-end w-[64px] flex-shrink-0 hover:underline"
      />
      <SortHeader
        col="trans"
        label="Trans"
        sort={sort}
        onSort={onSort}
        className="text-[10px] cc-caps-strong justify-end w-[46px] flex-shrink-0 hover:underline"
      />
      <SortHeader
        col="count"
        label="Count"
        sort={sort}
        onSort={onSort}
        className="text-[10px] cc-caps-strong justify-end w-[46px] flex-shrink-0 hover:underline"
      />
      <span
        className="text-[10px] cc-caps-strong text-center"
        style={{ width: 58 }}
      >
        Avg
      </span>
      {isTrend && (
        <span
          className="text-[10px] cc-caps-strong text-center"
          style={{ width: 62 }}
          title="Change in average coupon versus this store's own prior two weeks"
        >
          vs Baseline
        </span>
      )}
    </div>
  </div>
);

export default StoreColumnHead;
