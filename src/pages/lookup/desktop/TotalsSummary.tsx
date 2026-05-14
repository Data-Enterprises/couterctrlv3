import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2, formatDate } from "../../../utils";

const TotalsSummary = () => {
  const [cat, setCat] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalQty, setTotalQty] = useState<number>(0);
  const [totalExtendedCost, setTotalExtendedCost] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const item = useAppSelector((state) => state.item);

  useEffect(() => {
    if (item.itemLookupHistory.length) {
      setDesc(item.itemLookupHistory[0].product_description);
      setCat(item.itemLookupHistory[0].category_description);
      const start = formatDate(item.itemLookupHistory[0].sale_date);
      setStartDate(start);
      const end = formatDate(
        item.itemLookupHistory[item.itemLookupHistory.length - 1].sale_date,
      );
      setEndDate(end);

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
    }
  }, [item.itemLookupHistory]);

  const isReady =
    item.itemLookupHistory.length > 0 &&
    totalSales !== 0 &&
    totalQty !== 0 &&
    totalExtendedCost !== 0;

  if (!isReady) return null;

  return (
    <div className="bg-custom-white rounded-xl shadow-lg border border-content/10 p-2">
      {/* Header metadata */}
      <div className="leading-tight">
        <div className="text-[13px] flex justify-between items-center text-content/60">
          <div className="font-medium text-content">Dates:</div>
          <div>
            {startDate} – {endDate}
          </div>
        </div>
        <div className="text-[13px] flex justify-between items-center text-content/60">
          <div className="font-medium text-content">UPC:</div>
          <div>{item.itemLookupHistory[0].product_code}</div>
        </div>
        <div className="text-[13px] flex justify-between items-center text-content/60">
          <div className="font-medium text-content">Desc:</div>
          <div>{desc}</div>
        </div>
        <div className="text-[13px] flex justify-between items-center text-content/60">
          <div className="font-medium text-content">Cat:</div>
          <div className="  text-nowrap truncate">{cat}</div>
        </div>
      </div>

      {/* Divider */}
      <div className="grid grid-cols-2 my-1">
        <div className="h-[1.5px] bg-gradient-to-r from-content/60 to-custom-white" />
        <div className="h-[1.5px] bg-gradient-to-l from-content/60 to-custom-white" />
      </div>

      {/* Totals section */}
      <div>
        <div className="text-[13px] font-semibold text-content text-center mb-1">
          Totals Summary
        </div>
        <div className="grid md:grid-cols-3 w-full gap-2">
          <div className="bg-content/5 rounded-md shadow-md px-2 py-1">
            <div className="text-content/60 text-[11px]">
              Sales:
            </div>
            <div className="font-semibold text-[12px]">
              {formatCurrency2(totalSales)}
            </div>
          </div>
          <div className="bg-content/5 rounded-md shadow-md px-2 py-1">
            <div className="text-content/60 text-[11px]">
              Qty:
            </div>
            <div className="font-semibold text-[12px]">
              {formatBigNumber(totalQty, 0)}
            </div>
          </div>
          <div className="bg-content/5 rounded-md shadow-md px-2 py-1">
            <div className="text-content/60 text-[11px]">
              Ext Cost:
            </div>
            <div className="font-semibold text-[12px]">
              {formatCurrency2(totalExtendedCost)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalsSummary;
