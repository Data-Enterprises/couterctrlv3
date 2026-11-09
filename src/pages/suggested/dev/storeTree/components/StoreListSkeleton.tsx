// Utils
import { NAME_W, STORE_COLS } from "../../utils";

// Components
import Bar from "../../components/Bar";

/** The store tree, mid-load. Mirrors the real row grid and its `py-3`. */
const StoreListSkeleton = ({ rows = 8 }: { rows?: number }) => (
  <div
    className="flex-1 overflow-hidden"
    role="status"
    aria-label="Loading stores"
  >
    <div className={`grid ${STORE_COLS} gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-content/85`}>
      <div>Store</div>
      <div className="text-center">Items</div>
      <div className="text-right">Order lb</div>
      <div />
    </div>
    {Array.from({ length: rows }, (_, i) => (
      <div
        key={i}
        className={`grid ${STORE_COLS} items-center gap-2 px-3 py-3 border-b border-brand_navy/10`}
      >
        <Bar w={NAME_W[i % NAME_W.length]} />
        <div className="flex justify-center">
          <Bar w="60%" />
        </div>
        <div className="flex justify-end">
          <Bar w="70%" />
        </div>
        <div />
      </div>
    ))}
  </div>
);

export default StoreListSkeleton;
