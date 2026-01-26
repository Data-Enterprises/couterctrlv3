import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { cpu, gpm, ppu, rpu } from "../../../functions";

interface Testing {
  product_code: string;
  product_description: string;
  total_sales: number;
  qty: number;
  cost: number;
}

const TopItem = () => {
  const [title, setTitle] = useState<string>("Top Item");
  const [item, setItem] = useState<Testing | null>(null);
  const { topTenItems, selectedSalesPanel, selectedItem } = useAppSelector(
    (state) => state.sales,
  );

  useEffect(() => {
    if (topTenItems.length === 0) {
      setItem(null);
      return;
    }

    // Keep in mind, if in a group setting, you might need to aggregate across all stores for the top/selected item and return the metrics for the group
    let item = null;
    if (selectedItem.length > 0) {
      const filtered = [...topTenItems]
        .filter((item) => {
          return item.product_code === selectedItem;
        })
        .reduce((acc: Testing[], curr) => {
          const exists = acc.find((d) => d.product_code === curr.product_code);
          if (exists) {
            exists.total_sales += curr.total_sales;
            exists.qty += curr.qty;
            exists.cost += curr.cost;
          } else {
            acc.push({
              product_code: curr.product_code,
              total_sales: curr.total_sales,
              product_description: curr.product_description,
              qty: curr.qty,
              cost: curr.cost,
            });
          }
          return acc;
        }, []);

      item = [...filtered].sort((a, b) => b.total_sales - a.total_sales)[0];

      setTitle("Selected Item");
      setItem(item);
      return;

      // if not selected, then the code runs below based on if a sales panel is selected or not
    } else if (!selectedSalesPanel.storeid) {
      // not selected
      item = [...topTenItems].sort((a, b) => b.total_sales - a.total_sales)[0];
    } else {
      // selected
      const filtered = topTenItems
        .filter((item) => item.storeid === selectedSalesPanel.storeid)
        .reduce((acc: Testing[], curr) => {
          const exists = acc.find((d) => d.product_code === curr.product_code);
          if (exists) {
            exists.total_sales += curr.total_sales;
            exists.qty += curr.qty;
            exists.cost += curr.cost;
          } else {
            acc.push({
              product_code: curr.product_code,
              total_sales: curr.total_sales,
              product_description: curr.product_description,
              qty: curr.qty,
              cost: curr.cost,
            });
          }
          return acc;
        }, []);

      item = [...filtered].sort((a, b) => b.total_sales - a.total_sales)[0];
    }
    setTitle("Top Item");
    setItem(item);
  }, [topTenItems, selectedSalesPanel, selectedItem]);

  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
      {item ? (
        <>
          <div className="border-b border-content/30 mx-2 rounded-t-lg font-medium flex justify-between">
            {title}
            <div className="font-semibold">{item.product_code}</div>
          </div>

          <div className="p-2 text-xs select-none">
            <div className="flex justify-between items-center text-sm border-b">
              <div className="font-medium">{item.product_description}</div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-4 gap-4 py-1">
              <div>
                <div className="text-sm text-content/60">Total Sales</div>
                <div className="font-medium">
                  {formatCurrency2(item.total_sales)}
                </div>
              </div>
              <div>
                <div className="text-sm text-content/60">Qty</div>
                <div className="font-medium">
                  {formatBigNumber(item.qty, 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-content/60">COGS</div>
                <div className="font-medium">{formatCurrency2(item.cost)}</div>
              </div>
              <div>
                <div className="text-sm text-content/60">Profit</div>
                <div className="font-medium">
                  {formatCurrency2(item.total_sales - item.cost)}
                </div>
              </div>
            </div>

            {/* Flags */}
            <div className="font-medium border-b mt-3 text-sm">
              Metrics/Unit
            </div>
            <div className="grid grid-cols-4 gap-4 py-1">
              <div>
                <div className="text-sm text-content/60">Margin</div>
                <div className="font-medium">
                  {gpm(item.total_sales, item.cost)}
                </div>
              </div>
              <div>
                <div className="text-sm text-content/60">Profit</div>
                <div className="font-medium">
                  {formatCurrency2(ppu(item.total_sales, item.cost, item.qty))}
                </div>
              </div>
              <div>
                <div className="text-sm text-content/60">Revenue</div>
                <div className="font-medium">
                  {formatCurrency2(rpu(item.total_sales, item.qty))}
                </div>
              </div>
              <div>
                <div className="text-sm text-content/60">Cost</div>
                <div className="font-medium">
                  {formatCurrency2(cpu(item.cost, item.qty))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default TopItem;
