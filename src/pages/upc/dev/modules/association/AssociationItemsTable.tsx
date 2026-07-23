import { formatCurrency2 } from "../../../../../utils";
import type { AssociationItem } from "../../../../../features/upcDevSlice";

interface Props {
  items: AssociationItem[];
  onReroot: (upc: string) => void;
  onContextMenu: (e: React.MouseEvent, upc: string) => void;
}

const COLS = "1fr 110px 60px 70px 80px 70px 75px";

// Mirrors PriceOptPricePointsTable.tsx's shape — a variable-length list of
// items with several numeric attributes each maps naturally onto columns,
// same as Price Opt's price-point history did. Sorted by attach rate (the
// module's own primary metric), not the endpoint's own qty-based order.
const AssociationItemsTable = ({ items, onReroot, onContextMenu }: Props) => {
  const sorted = [...items].sort((a, b) => b.attach_rate - a.attach_rate);

  return (
    <div>
      <div
        className="grid gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-content/85"
        style={{ gridTemplateColumns: COLS }}
      >
        <span>Product</span>
        <span>Department</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Baskets</span>
        <span className="text-right">Revenue</span>
        <span className="text-right">Avg $</span>
        <span className="text-right">Attach</span>
      </div>
      {sorted.map((item) => (
        <div
          key={item.product_code}
          onClick={() => onReroot(item.product_code)}
          onContextMenu={(e) => onContextMenu(e, item.product_code)}
          className="grid gap-1.5 items-center px-2 py-[7px] border-b border-[#1e2a4a]/15 last:border-b-0 cursor-pointer hover:bg-gray-50"
          style={{ gridTemplateColumns: COLS }}
        >
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-content truncate">
              {item.product_description}
            </div>
          </div>
          <span className="text-[11px] text-content/85 truncate">
            {item.sub_department_description}
          </span>
          <span className="text-right text-[12px] tabular-nums text-content">
            {item.qty.toLocaleString()}
          </span>
          <span className="text-right text-[12px] tabular-nums text-content">
            {item.basket_count.toLocaleString()}
          </span>
          <span className="text-right text-[12px] tabular-nums text-content">
            {formatCurrency2(item.revenue)}
          </span>
          <span className="text-right text-[12px] tabular-nums text-content">
            {formatCurrency2(item.avg_price)}
          </span>
          <span className="text-right text-[13px] font-bold tabular-nums text-content">
            {item.attach_rate.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default AssociationItemsTable;
