import { useSalesState } from "../hooks/useSalesState";
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { cpu, gpm, ppu, rpu } from "../../../functions";
import { setSelectedItem } from "../../../features/salesSlice";

interface TopTenGroupItem {
  product_code: string;
  product_description: string;
  total_sales: number;
  qty: number;
  cost: number;
}

const TopTenTablet = () => {
  const dispatch = useAppDispatch();
  const [topTen, setTopTen] = useState<TopTenGroupItem[]>([]);
  const [selectedTopTenItem, setSelectedTopTenItem] =
    useState<TopTenGroupItem | null>(null);
  const { topTenItems, selectedSalesPanel } = useSalesState();

  useEffect(() => {
    const p = selectedSalesPanel;
    const filtered = [...topTenItems].filter((item) => {
      const storeMatch = p.storeid ? item.storeid === p.storeid : true;
      return storeMatch;
    });

    const grouped = [...filtered].reduce((acc: TopTenGroupItem[], curr) => {
      const exists = acc.find((item) => {
        const upcMatch = item.product_code === curr.product_code;
        return upcMatch;
      });

      if (exists) {
        exists.total_sales += curr.total_sales;
        exists.qty += curr.qty;
        exists.cost += curr.cost;
      } else {
        acc.push({
          product_code: curr.product_code,
          product_description: curr.product_description,
          total_sales: curr.total_sales,
          qty: curr.qty,
          cost: curr.cost,
        });
      }

      return acc;
    }, []);
    const sorted = grouped.sort((a, b) => b.total_sales - a.total_sales);
    setTopTen(sorted.slice(0, 10));
    setSelectedTopTenItem(sorted[0]);
  }, [topTenItems, selectedSalesPanel]);

  const handleSelect = (upc: string | number) => {
    dispatch(setSelectedItem(upc as string));
    setSelectedTopTenItem(
      topTen.find((item) => item.product_code === (upc as string)) || null,
    );
  };

  return (
    <div className="grid gap-2">
      <div className="grid gap-3">
        <div className="rounded-2xl border border-slate-200 bg-custom-white p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-sm font-semibold text-blue-700">
                {selectedTopTenItem?.product_code}
              </div>
              <div className="mt-2 text-sm font-semibold text-content line-clamp-2">
                {selectedTopTenItem?.product_description}
              </div>
            </div>
          </div>

          <div className="">
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MetricTile
                label="GPM"
                value={gpm(
                  selectedTopTenItem?.total_sales as number,
                  selectedTopTenItem?.cost as number,
                )}
              />
              <MetricTile
                label="RPU"
                value={formatCurrency2(
                  rpu(
                    selectedTopTenItem?.total_sales as number,
                    selectedTopTenItem?.qty as number,
                  ),
                )}
              />
              <MetricTile
                label="PPU"
                value={formatCurrency2(
                  ppu(
                    selectedTopTenItem?.total_sales as number,
                    selectedTopTenItem?.cost as number,
                    selectedTopTenItem?.qty as number,
                  ),
                )}
              />
              <MetricTile
                label="CPU"
                value={formatCurrency2(
                  cpu(
                    selectedTopTenItem?.cost as number,
                    selectedTopTenItem?.qty as number,
                  ),
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="h-full overflow-y-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-semibold">Product</th>
                <th className="px-3 py-2 font-semibold text-right">Sales</th>
                <th className="px-3 py-2 font-semibold text-right">Qty</th>
                <th className="px-3 py-2 font-semibold text-right">Cost</th>
                <th className="px-3 py-2 font-semibold text-right">Profit</th>
              </tr>
            </thead>

            <tbody>
              {topTen.map((item) => {
                const active =
                  selectedTopTenItem?.product_code === item.product_code;

                return (
                  <tr
                    key={item.product_code}
                    onClick={() => handleSelect(item.product_code)}
                    className={`cursor-pointer border-t border-slate-100 transition-colors ${
                      active ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {item.product_description}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {item.product_code}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-slate-800">
                      {formatCurrency2(item.total_sales)}
                    </td>

                    <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-slate-800">
                      {formatBigNumber(item.qty, 0)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-slate-800">
                      {formatCurrency2(item.cost)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-slate-800">
                      {formatCurrency2(item.total_sales - item.cost)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopTenTablet;

const MetricTile = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-xl bg-bkg px-3 py-2 ring-1 ring-slate-200">
      <div className="text-[13px] uppercase tracking-wide text-content/60">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold tabular-nums text-content">
        {value}
      </div>
    </div>
  );
};
