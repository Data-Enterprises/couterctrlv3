import { useEffect, useState } from "react";
import {
  setViewHistory,
  type ItemLookupHistory,
} from "../../features/itemLookupSlice";
import { formatBigNumber, formatCurrency2 } from "../../utils";
import { useAppSelector, useAppDispatch } from "../../hooks";

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

const ItemHIstory = () => {
  const item = useAppSelector((state) => state.item);
  const { startDate, endDate } = useAppSelector((state) => state.search);
  const dispatch = useAppDispatch();
  const [desc, setDesc] = useState<string>("");
  const [cat, setCat] = useState<string>("");
  const [groupedByPrice, setGroupedByPrice] = useState<GroupedData[]>([]);
  const [groupedByCost, setGroupedByCost] = useState<GroupedData[]>([]);
  const [groupedByQty, setGroupedByQty] = useState<QtyGrouped[]>([]);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalQty, setTotalQty] = useState<number>(0);
  const [totalExtendedCost, setTotalExtendedCost] = useState<number>(0);
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
    if (item.itemLookupHistory.length && item.viewHistory) {
      setDesc(item.itemLookupHistory[0].product_description);
      setCat(item.itemLookupHistory[0].category_description);

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
      const ttlExtendedCost = item.itemLookupHistory.reduce(
        (acc, curr) => acc + curr.extended_cost,
        0,
      );
      setTotalSales(ttlSales);
      setTotalQty(ttlQty);
      setTotalExtendedCost(ttlExtendedCost);

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
  }, [item.itemLookupHistory, item.viewHistory]);

  const handleGoBack = () => {
    dispatch(setViewHistory(false));
  };

  return (
    <div className="bg-custom-white p-2 rounded-lg shadow-md text-[13px]">
      <div className={`max-h-[calc(100vh-21rem)] overflow-y-auto`}>
        <div className="mb-1 pb-1 ">
          {/* Summary */}
          <div className="font-medium">{startDate} - {endDate}</div>
          <div className="font-medium">Desc: {desc}</div>
          <div className="font-medium mb-2 text-nowrap truncate">
            Category: {cat}
          </div>

          <div className="font-medium text-[14px]">Totals Summary</div>
          <div className="grid grid-cols-3  w-[75%]">
            <div>
              <div className="font-medium text-content/60">Total Sales:</div>
              <div className="">{formatCurrency2(totalSales)}</div>
            </div>
            <div>
              <div className="font-medium text-content/60">Total Qty:</div>
              <div className="">{formatBigNumber(totalQty, 0)}</div>
            </div>
            <div>
              <div className="font-medium text-content/60">Ext Cost:</div>
              <div className="">{formatCurrency2(totalExtendedCost)}</div>
            </div>
          </div>
        </div>

        {/* Sales */}
        <div className=" mb-1 py-1">
          <div className="font-medium text-[14px]">Sales</div>
          <div className="grid grid-cols-3  w-[75%]">
            <div>
              <div className="font-medium text-content/60">Min Sales:</div>
              <div className="">{formatCurrency2(minSales)}</div>
            </div>
            <div>
              <div className="font-medium text-content/60">Max Sales:</div>
              <div className="">{formatCurrency2(maxSales)}</div>
            </div>
            <div>
              <div className="font-medium text-content/60">Sales Range:</div>
              <div className="">{formatCurrency2(maxSales - minSales)}</div>
            </div>
            <div className="">
              <div className="font-medium text-content/60">Median</div>
              <div className="">{formatCurrency2(salesMedian)}</div>
            </div>
            <div className="">
              <div className="font-medium text-content/60">Average</div>
              <div className="">{formatCurrency2(salesAvg)}</div>
            </div>
            <div className="">
              <div className="font-medium text-content/60">Most Freq.</div>
              <div className="">{formatCurrency2(salesMode)}</div>
            </div>
          </div>
        </div>

        {/* Quantities */}
        <div className="font-medium text-[14px]">Quantities</div>
        <div className="grid grid-cols-3  w-[75%] mb-1 pb-1">
          <div>
            <div className="font-medium text-content/60">Min Qty:</div>
            <div className="">{formatBigNumber(minQty, 0)}</div>
          </div>
          <div>
            <div className="font-medium text-content/60">Max Qty:</div>
            <div className="">{formatBigNumber(maxQty, 0)}</div>
          </div>
          <div>
            <div className="font-medium text-content/60">Qty Range:</div>
            <div className="">{formatBigNumber(maxQty - minQty, 0)}</div>
          </div>
          <div className="">
            <div className="font-medium text-content/60">Median</div>
            <div className="">{formatBigNumber(qtyMedian, 0)}</div>
          </div>
          <div className="">
            <div className="font-medium text-content/60">Average</div>
            <div className="">{formatBigNumber(qtyAvg, 2)}</div>
          </div>
          <div className="">
            <div className="font-medium text-content/60">Most Freq.</div>
            <div className="">{formatBigNumber(qtyMode, 0)}</div>
          </div>
        </div>

        {/* Price points */}
        <div className=" mb-1 py-1 w-[80%]">
          <div className="font-medium text-[14px]">
            Prices - {groupedByPrice.length}
          </div>
          <div className="grid grid-cols-5  text-content/60 font-medium">
            <div>Price</div>
            <div>Sales</div>
            <div>Qty</div>
            <div>Cost</div>
            <div>Ext Cost</div>
          </div>
          {groupedByPrice.map((g, i) => (
            <div key={i} className="">
              <div className="grid grid-cols-5  border-b border-content/25 last:border-none">
                <div>{formatCurrency2(g.price)}</div>
                <div>{formatCurrency2(g.total_sales)}</div>
                <div>{formatBigNumber(g.qty, 0)}</div>
                <div>{formatCurrency2(g.casecost)}</div>
                <div>{formatCurrency2(g.extended_cost)}</div>
              </div>
            </div>
          ))}
        </div>

        {/*Cost points */}
        <div className=" mb-1 py-1 w-[80%]">
          <div className="font-medium text-[14px]">
            Case Costs - {groupedByCost.length}
          </div>
          <div className="grid grid-cols-5  text-content/60 font-medium">
            <div>Cost</div>
            <div>Sales</div>
            <div>Qty</div>
            <div>Price</div>
            <div>Ext Cost</div>
          </div>
          {groupedByCost.map((g, i) => (
            <div key={i}>
              <div className="grid grid-cols-5  border-b border-content/25 last:border-none">
                <div>{formatCurrency2(g.casecost)}</div>
                <div>{formatCurrency2(g.total_sales)}</div>
                <div>{formatBigNumber(g.qty, 0)}</div>
                <div>{formatCurrency2(g.price)}</div>
                <div>{formatCurrency2(g.extended_cost)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Unique Quantities */}
        <div className="mb-1 py-1 w-[80%]">
          <div className="font-medium text-[14px]">
            Unique Qty - {groupedByQty.length}
          </div>
          <div className="grid grid-cols-5  text-content/60 font-medium">
            <div>Qty</div>
            <div>Sales</div>
            <div>Price</div>
            <div>C Cost</div>
            <div>Ext Cost</div>
          </div>
          {groupedByQty.map((g, i) => {
            return (
              <div
                key={i}
                className="border-b border-content/20 last:border-none"
              >
                {g.items.map((item, j) => (
                  <div key={j} className="grid grid-cols-5  py-0.5">
                    <div>{j === 0 ? formatBigNumber(item.qty, 0) : ""}</div>
                    <div>{formatCurrency2(item.total_sales)}</div>
                    <div>{formatCurrency2(item.price)}</div>
                    <div>{formatCurrency2(item.casecost)}</div>
                    <div>{formatCurrency2(item.extended_cost)}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div
        className="btn-themeOrange w-full px-0 text-center"
        onClick={handleGoBack}
      >
        Go Back
      </div>
    </div>
  );
};

export default ItemHIstory;
