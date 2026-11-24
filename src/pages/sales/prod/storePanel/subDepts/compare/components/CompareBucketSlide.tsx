// Utils
import { ITEM_COLS, itemAmount, itemAmountClass } from "../utils";

// Interfaces
import type { GradingMetric } from "../../../../../../../features/salesLedgerSlice";
import type { BucketItem } from "../interfaces";

// Components
import ListBadge from "../../components/ListBadge";

interface CompareBucketSlideProps {
  items: BucketItem[];
  metric: GradingMetric;
}

/** One bucket's items from both lists, tagged A or B, biggest change first. */
const CompareBucketSlide = ({ items, metric }: CompareBucketSlideProps) =>
  items.length ? (
    <div>
      {items.map(({ side, row }) => (
        <div key={`${side}-${row.key}`} className={`${ITEM_COLS} h-[34px] px-2 rounded-md even:bg-row_stripe hover:bg-fill_soft`}>
          <ListBadge side={side} />
          <span className="truncate text-[13px] font-medium text-content" title={row.desc}>
            {row.desc}
          </span>
          <span className="text-[12px] text-content tabular-nums">{row.upc}</span>
          <span className={`text-right text-[13px] font-semibold text-content tabular-nums ${itemAmountClass(row)}`}>
            {itemAmount(row, metric)}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <p className="py-2 px-2 text-[12px] text-content">None in either list.</p>
  );

export default CompareBucketSlide;
