// Utils
import { ITEM_COLS, itemAmount } from "../utils";

// Interfaces
import type { GradingMetric } from "../../../../../../../features/dev/devSalesLedgerSlice";
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
        <div key={`${side}-${row.key}`} className={`${ITEM_COLS} h-7 px-0.5 border-b border-line_hair hover:bg-fill_soft`}>
          <ListBadge side={side} />
          <span className="truncate text-[12px] font-medium text-content" title={row.desc}>
            {row.desc}
          </span>
          <span className="text-[11px] text-content tabular-nums">{row.upc}</span>
          <span className="text-right text-[12px] font-semibold text-content tabular-nums">{itemAmount(row, metric)}</span>
        </div>
      ))}
    </div>
  ) : (
    <p className="py-2 text-[11.5px] text-content">None in either list.</p>
  );

export default CompareBucketSlide;
