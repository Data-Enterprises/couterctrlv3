import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import { type TopTenItem } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { cpu, gpm, ppu, rpu } from "../../../functions";

const TopItem = () => {
  const [topItem, setTopItem] = useState<TopTenItem | null>(null);
  const { topTenItems, selectedSalesPanel } = useAppSelector(
    (state) => state.sales,
  );

  useEffect(() => {
    if (topTenItems.length === 0) {
      setTopItem(null);
      return;
    }

    let item = null;
    if (!selectedSalesPanel.storeid) {
      // not selected
      item = [...topTenItems].sort((a, b) => b.total_sales - a.total_sales)[0];
    } else {
      // selected
      const filtered = topTenItems.filter(
        (item) => item.storeid === selectedSalesPanel.storeid,
      );
      item = [...filtered].sort((a, b) => b.total_sales - a.total_sales)[0];
    }

    setTopItem(item);
  }, [topTenItems, selectedSalesPanel]);

  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
      {topItem ? (
        <>
          <div className="border-b border-content/30 mx-2 rounded-t-lg font-medium flex justify-between">
            Top Item
            <div className="font-semibold">{topItem.product_code}</div>
          </div>

          <div className="p-2 text-xs select-none">
            <div className="flex justify-between text-sm border-b">
              <div className="font-medium">{topItem.store_name}</div>
              <div className="font-medium">{topItem.product_description}</div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-4 gap-4 py-1">
              <div>
                <div className="text-sm text-content/60">Revenue</div>
                <div className="font-medium">
                  {formatCurrency2(topItem.total_sales)}
                </div>
              </div>
              <div>
                <div className="text-sm text-content/60">Qty</div>
                <div className="font-medium">
                  {formatBigNumber(topItem.qty, 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-content/60">COGS</div>
                <div className="font-medium">
                  {formatCurrency2(topItem.cost)}
                </div>
              </div>
              <div>
                <div className="text-sm text-content/60">Profit</div>
                <div className="font-medium">
                  {formatCurrency2(topItem.total_sales - topItem.cost)}
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
                  {gpm(topItem.total_sales, topItem.cost)}
                </div>
              </div>
              <div>
                <div className="text-sm text-content/60">Profit</div>
                <div className="font-medium">
                  {formatCurrency2(
                    ppu(topItem.total_sales, topItem.cost, topItem.qty),
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-content/60">Revenue</div>
                <div className="font-medium">
                  {formatCurrency2(rpu(topItem.total_sales, topItem.qty))}
                </div>
              </div>
              <div>
                <div className="text-sm text-content/60">Cost</div>
                <div className="font-medium">
                  {formatCurrency2(cpu(topItem.cost, topItem.qty))}
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
