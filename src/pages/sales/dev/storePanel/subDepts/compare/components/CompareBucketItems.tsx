// Utils
import { BUCKETS, ITEM_COLS, itemAmount } from "../utils";

// Interfaces
import type { GradingMetric } from "../../../../../../../features/dev/devSalesLedgerSlice";
import type { Bucket, BucketItem } from "../interfaces";

// Components
import ListBadge from "../../components/ListBadge";

interface CompareBucketItemsProps {
  /** Each bucket's count across both lists. */
  counts: Record<Bucket, number>;
  open: Bucket;
  onOpen: (b: Bucket) => void;
  items: BucketItem[];
  metric: GradingMetric;
}

/** The items behind the table: a tab per bucket, and the open one's items
 *  from both lists, tagged A or B, biggest change first. */
const CompareBucketItems = ({ counts, open, onOpen, items, metric }: CompareBucketItemsProps) => (
  <section className="flex flex-col flex-1 min-h-0">
    <div role="tablist" className="flex gap-5 border-b border-line_field flex-shrink-0">
      {BUCKETS.map((b) => (
        <button
          key={b.key}
          role="tab"
          aria-selected={open === b.key}
          onClick={() => onOpen(b.key)}
          className={`flex items-center gap-1.5 pb-2 -mb-px border-b-[3px] text-[12.5px] font-bold text-content whitespace-nowrap ${
            open === b.key ? "border-brand_navy" : "border-transparent hover:text-brand_navy"
          }`}
        >
          {b.tab}
          <span className="px-1.5 rounded-full bg-fill_muted text-[11px]">{counts[b.key]}</span>
        </button>
      ))}
    </div>
    <div className="cc-scroll">
      {items.length ? (
        items.map(({ side, row }) => (
          <div key={`${side}-${row.key}`} className={`${ITEM_COLS} h-9 px-0.5 border-b border-line_hair hover:bg-fill_soft`}>
            <ListBadge side={side} />
            <span className="truncate text-[13px] font-medium text-content" title={row.desc}>
              {row.desc}
            </span>
            <span className="text-[11.5px] text-content tabular-nums">{row.upc}</span>
            <span className="text-right text-[13px] font-bold text-content tabular-nums">{itemAmount(row, metric)}</span>
          </div>
        ))
      ) : (
        <p className="py-4 px-0.5 text-[12px] text-content">No items here in either list.</p>
      )}
    </div>
  </section>
);

export default CompareBucketItems;
