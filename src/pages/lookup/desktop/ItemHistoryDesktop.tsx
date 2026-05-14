import { useEffect, useState } from "react";
import { type ItemLookupHistory } from "../../../features/itemLookupSlice";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { useAppSelector } from "../../../hooks";

type GroupedData = {
  price: number;
  total_sales: number;
  qty: number;
  casecost: number;
  extended_cost: number;
};

type QtyGrouped = {
  qty: number;
  items: ItemLookupHistory[];
};

const ItemHistoryDesktop = () => {
  const item = useAppSelector((state) => state.item);
  const [groupedByPrice, setGroupedByPrice] = useState<GroupedData[]>([]);
  const [groupedByCost, setGroupedByCost] = useState<GroupedData[]>([]);
  const [groupedByQty, setGroupedByQty] = useState<QtyGrouped[]>([]);
  const [minQty, setMinQty] = useState<number>(0);
  const [maxQty, setMaxQty] = useState<number>(0);
  const [minSales, setMinSales] = useState<number>(0);
  const [maxSales, setMaxSales] = useState<number>(0);
  const [qtyMode, setQtyMode] = useState<number>(0);
  const [salesMode, setSalesMode] = useState<number>(0);
  const [qtyMedian, setQtyMedian] = useState<number>(0);
  const [salesMedian, setSalesMedian] = useState<number>(0);
  const [salesAvg, setSalesAvg] = useState<number>(0);
  const [qtyAvg, setQtyAvg] = useState<number>(0);

  useEffect(() => {
    if (item.itemLookupHistory.length) {
      const pricesGrouped = item.itemLookupHistory.reduce(
        (acc: GroupedData[], curr) => {
          const found = acc.find(
            (a) => formatCurrency2(a.price) === formatCurrency2(curr.price),
          );
          if (found) {
            found.total_sales += curr.total_sales;
            found.qty += curr.qty;
            found.extended_cost += curr.extended_cost;
          } else {
            acc.push({
              price: curr.price,
              total_sales: curr.total_sales,
              qty: curr.qty,
              casecost: curr.casecost,
              extended_cost: curr.extended_cost,
            });
          }
          return acc;
        },
        [],
      );

      const costsGrouped = item.itemLookupHistory.reduce(
        (acc: GroupedData[], curr) => {
          const found = acc.find(
            (a) =>
              formatCurrency2(a.casecost) === formatCurrency2(curr.casecost),
          );
          if (found) {
            found.total_sales += curr.total_sales;
            found.qty += curr.qty;
            found.extended_cost += curr.extended_cost;
          } else {
            acc.push({
              price: curr.price,
              total_sales: curr.total_sales,
              qty: curr.qty,
              casecost: curr.casecost,
              extended_cost: curr.extended_cost,
            });
          }
          return acc;
        },
        [],
      );

      setGroupedByPrice(pricesGrouped);
      setGroupedByCost(costsGrouped);

      const ttlSales = item.itemLookupHistory.reduce(
        (acc, curr) => acc + curr.total_sales,
        0,
      );
      const ttlQty = item.itemLookupHistory.reduce(
        (acc, curr) => acc + curr.qty,
        0,
      );

      const qtySorted = [...item.itemLookupHistory].sort(
        (a, b) => a.qty - b.qty,
      );
      const salesSorted = [...item.itemLookupHistory].sort(
        (a, b) => a.total_sales - b.total_sales,
      );
      const minQuantity = qtySorted[0].qty;
      const maxQuantity = qtySorted[qtySorted.length - 1].qty;
      const minTotalSales = salesSorted[0].total_sales;
      const maxTotalSales = salesSorted[salesSorted.length - 1].total_sales;

      setMinQty(minQuantity);
      setMaxQty(maxQuantity);
      setMinSales(minTotalSales);
      setMaxSales(maxTotalSales);

      const medianQty =
        qtySorted.length % 2 === 0
          ? (qtySorted[qtySorted.length / 2 - 1].qty +
              qtySorted[qtySorted.length / 2].qty) /
            2
          : qtySorted[Math.floor(qtySorted.length / 2)].qty;
      const medianSales =
        salesSorted.length % 2 === 0
          ? (salesSorted[salesSorted.length / 2 - 1].total_sales +
              salesSorted[salesSorted.length / 2].total_sales) /
            2
          : salesSorted[Math.floor(salesSorted.length / 2)].total_sales;

      const qtyMode = qtySorted.reduce((acc: any, curr) => {
        if (!acc[curr.qty]) {
          acc[curr.qty] = 1;
        } else {
          acc[curr.qty]++;
        }
        return acc;
      }, {});

      setQtyMedian(medianQty);
      setSalesMedian(medianSales);

      let mode = 0;
      let qty = 0;
      for (const key in qtyMode) {
        if (qtyMode[key] > qty) {
          mode = Number(key);
          qty = qtyMode[key];
        }
      }

      setQtyMode(mode);

      const salesMode = salesSorted.reduce((acc: any, curr) => {
        if (!acc[curr.total_sales]) {
          acc[curr.total_sales] = 1;
        } else {
          acc[curr.total_sales] += 1;
        }
        return acc;
      }, {});

      mode = 0;
      let frequency = 0;
      for (const key in salesMode) {
        if (salesMode[key] > frequency) {
          mode = Number(key);
          frequency = salesMode[key];
        }
      }
      setSalesMode(mode);

      const avgSales = ttlSales / item.itemLookupHistory.length;
      const avgQty = ttlQty / item.itemLookupHistory.length;
      setSalesAvg(avgSales);
      setQtyAvg(avgQty);

      const qtyGrouped = item.itemLookupHistory
        .reduce((acc: QtyGrouped[], curr) => {
          const found = acc.find((a: QtyGrouped) => a.qty === curr.qty);

          if (found) {
            found.items.push(curr);
          } else {
            acc.push({
              qty: curr.qty,
              items: [curr],
            });
          }

          return acc;
        }, [])
        .sort((a, b) => b.qty - a.qty);

      setGroupedByQty(qtyGrouped);
    }
  }, [item.itemLookupHistory]);

  if (!item.itemsLoaded) return null;

  return (
    <div className="text-[12px] select-none">
      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
        <div className="h-[175px] bg-custom-white px-2 pb-2 pt-0.5 rounded-lg shadow-md">
          <div className="font-semibold text-[12px] text-content">Sales</div>
          <div className="grid grid-cols-2 h-[1.5px] mt-0.5 mb-1.5">
            <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
            <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-content/5 shadow-md px-2 py-0.5">
              <div className="text-content/60 font-medium text-[12px]">
                Min Sales:
              </div>
              <div className="font-semibold text-[12px]">
                {formatCurrency2(minSales)}
              </div>
            </div>
            <div className="rounded-md bg-content/5 shadow-md px-2 py-0.5">
              <div className="text-content/60 font-medium text-[12px]">
                Max Sales:
              </div>
              <div className="font-semibold text-[12px]">
                {formatCurrency2(maxSales)}
              </div>
            </div>
            <div className="rounded-md bg-content/5 shadow-md px-2 py-0.5">
              <div className="text-content/60 font-medium text-[12px]">
                Sales Range:
              </div>
              <div className="font-semibold text-[12px]">
                {formatCurrency2(maxSales - minSales)}
              </div>
            </div>
            <div className="rounded-md bg-content/5 shadow-md px-2 py-0.5">
              <div className="text-content/60 font-medium text-[12px]">
                Median
              </div>
              <div className="font-semibold text-[12px]">
                {formatCurrency2(salesMedian)}
              </div>
            </div>
            <div className="rounded-md bg-content/5 shadow-md px-2 py-0.5">
              <div className="text-content/60 font-medium text-[12px]">
                Average
              </div>
              <div className="font-semibold text-[12px]">
                {formatCurrency2(salesAvg)}
              </div>
            </div>
            <div className="rounded-md bg-content/5 shadow-md px-2 py-0.5">
              <div className="text-content/60 font-medium text-[12px]">
                Most Freq.
              </div>
              <div className="font-semibold text-[12px]">
                {formatCurrency2(salesMode)}
              </div>
            </div>
          </div>
        </div>

        <div className="h-[175px] bg-custom-white px-2 pb-2 pt-0.5 rounded-lg shadow-md">
          <div className="font-semibold text-[12px] text-content">
            Quantities
          </div>
          <div className="grid grid-cols-2 h-[1.5px] mt-0.5 mb-1.5">
            <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
            <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-content/5 shadow-md px-2 py-0.5">
              <div className="text-content/60 font-medium text-[12px]">
                Min Qty:
              </div>
              <div className="font-semibold text-[12px]">
                {formatBigNumber(minQty, 0)}
              </div>
            </div>
            <div className="rounded-md bg-content/5 shadow-md px-2 py-0.5">
              <div className="text-content/60 font-medium text-[12px]">
                Max Qty:
              </div>
              <div className="font-semibold text-[12px]">
                {formatBigNumber(maxQty, 0)}
              </div>
            </div>
            <div className="rounded-md bg-content/5 shadow-md px-2 py-0.5">
              <div className="text-content/60 font-medium text-[12px]">
                Qty Range:
              </div>
              <div className="font-semibold text-[12px]">
                {formatBigNumber(maxQty - minQty, 0)}
              </div>
            </div>
            <div className="rounded-md bg-content/5 shadow-md px-2 py-0.5">
              <div className="text-content/60 font-medium text-[12px]">
                Median
              </div>
              <div className="font-semibold text-[12px]">
                {formatBigNumber(qtyMedian, 0)}
              </div>
            </div>
            <div className="rounded-md bg-content/5 shadow-md px-2 py-0.5">
              <div className="text-content/60 font-medium text-[12px]">
                Average
              </div>
              <div className="font-semibold text-[12px]">
                {formatBigNumber(qtyAvg, 2)}
              </div>
            </div>
            <div className="rounded-md bg-content/5 shadow-md px-2 py-0.5">
              <div className="text-content/60 font-medium text-[12px]">
                Most Freq.
              </div>
              <div className="font-semibold text-[12px]">
                {formatBigNumber(qtyMode, 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-2 p-2 bg-custom-white/75 rounded-lg shadow-md max-h-[calc(100vh-255px)] overflow-y-auto no-scrollbar">
          {/* Price and Cost points */}
          <div className="grid gap-2">
            {/* Price points */}
            <div className="bg-custom-white px-2 pb-2 pt-0.5 rounded-lg shadow-md">
              <div className="font-semibold text-[12px] text-content">
                Unique Prices - {groupedByPrice.length}
              </div>
              <div className="">
                <div className="grid grid-cols-5 text-content/60 font-medium text-[12px] border-b border-content/60">
                  <div>Price</div>
                  <div>Sales</div>
                  <div>Qty</div>
                  <div>Cost</div>
                  <div>E Cost</div>
                </div>
                {groupedByPrice.map((g, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-5 border-b border-content/25 last:border-none py-0.5"
                  >
                    <div className="text-[12px]">
                      {formatCurrency2(g.price)}
                    </div>
                    <div className="text-[12px]">
                      {formatCurrency2(g.total_sales)}
                    </div>
                    <div className="text-[12px]">
                      {formatBigNumber(g.qty, 0)}
                    </div>
                    <div className="text-[12px]">
                      {formatCurrency2(g.casecost)}
                    </div>
                    <div className="text-[12px]">
                      {formatCurrency2(g.extended_cost)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost points */}
            <div className="bg-custom-white px-2 pb-2 pt-0.5 rounded-lg shadow-md">
              <div className="font-medium text-[12px] text-content">
                Unique Case Costs - {groupedByCost.length}
              </div>
              <div className="">
                <div className="grid grid-cols-5 text-content/60 font-medium text-[12px] border-b border-content/60">
                  <div>Cost</div>
                  <div>Sales</div>
                  <div>Qty</div>
                  <div>Price</div>
                  <div>E Cost</div>
                </div>
                {groupedByCost.map((g, i) => (
                  <div key={i} className="grid grid-cols-5 py-0.5">
                    <div className="text-[12px]">
                      {formatCurrency2(g.casecost)}
                    </div>
                    <div className="text-[12px]">
                      {formatCurrency2(g.total_sales)}
                    </div>
                    <div className="text-[12px]">
                      {formatBigNumber(g.qty, 0)}
                    </div>
                    <div className="text-[12px]">
                      {formatCurrency2(g.price)}
                    </div>
                    <div className="text-[12px]">
                      {formatCurrency2(g.extended_cost)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unique Quantities */}
          <div className="bg-custom-white px-2 pb-2 pt-0.5 rounded-lg shadow-md">
            <div className="font-semibold text-[12px] text-content">
              Unique Qty - {groupedByQty.length}
            </div>
            <div className="">
              <div className="grid grid-cols-5 text-content/60 font-medium text-[12px] border-b border-content/60">
                <div>Qty</div>
                <div>Sales</div>
                <div>Price</div>
                <div>C Cost</div>
                <div>E Cost</div>
              </div>
              {groupedByQty.map((g, i) => (
                <div
                  key={i}
                  className="border-b border-content/20 last:border-none"
                >
                  {g.items.map((item, j) => (
                    <div key={j} className="grid grid-cols-5 py-0.5">
                      <div className="text-[12px]">
                        {j === 0 ? formatBigNumber(item.qty, 0) : ""}
                      </div>
                      <div className="text-[12px]">
                        {formatCurrency2(item.total_sales)}
                      </div>
                      <div className="text-[12px]">
                        {formatCurrency2(item.price)}
                      </div>
                      <div className="text-[12px]">
                        {formatCurrency2(item.casecost)}
                      </div>
                      <div className="text-[12px]">
                        {formatCurrency2(item.extended_cost)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemHistoryDesktop;
