import { calculateCogs } from "..";
import { useSubMarginCtx } from "../hooks";
import { useAppDispatch } from "../../../hooks";
import { useEffect, useState } from "react";
import type { ItemRow } from "../display/widgets";
import {
  setFilteredItemGridData,
  setItemGridData,
} from "../../../features/subMarginSlice";
import MarginCard from "./MarginCard";

const ItemsView = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const [gridData, setGridData] = useState<ItemRow[]>([]);
  const [itemView, setItemView] = useState<"margin" | "cost">("margin");

  useEffect(() => {
    if (itemView === "margin") {
      const dateComp = ctx.selectedWeekDay
        ? new Date(ctx.selectedWeekDay).toISOString().split("T")[0]
        : "";

      const filtered = ctx.margins.filter((margin) => {
        return dateComp ? margin.sale_date.split("T")[0] === dateComp : true;
      });

      const reduced = filtered.reduce((acc: ItemRow[], margin) => {
        const found = acc.find(
          (item) => item.product_code === margin.product_code,
        );
        if (!found) {
          acc.push({
            sub_department_description: margin.sub_department_description,
            product_code: margin.product_code,
            product_description: margin.product_description,
            cogs: calculateCogs(
              margin.net_cost,
              margin.cost,
              margin.case_size,
              margin.qty,
              margin.weight,
            ),
            cost_fees: margin.cost_fees,
            total_sales: margin.total_sales - margin.total_tax,
            net_sales: margin.net_sales,
            total_tax: margin.total_tax,
            qty: margin.qty,
            margin: 0,
          });
        } else {
          found.cogs += calculateCogs(
            margin.net_cost,
            margin.cost,
            margin.case_size,
            margin.qty,
            margin.weight,
          );
          found.total_sales += margin.total_sales - margin.total_tax;
          found.net_sales += margin.net_sales;
          found.total_tax += margin.total_tax;
          found.qty += margin.qty;
        }
        return acc;
      }, []);

      const newData = reduced.map((item) => ({
        ...item,
        margin: ((item.total_sales - item.cogs) / item.total_sales) * 100 || 0,
      }));
      dispatch(setItemGridData(newData));
      dispatch(setFilteredItemGridData(newData));
      setGridData(newData);
    } else {
      // cost view
    }
  }, [ctx.selectedWeekDay, itemView]);

  const handleViewToggle = (option: "margin" | "cost") => {
    setItemView(option);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 px-2">
        <button
          className={`${itemView === "margin" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleViewToggle("margin")}
        >
          Margin
        </button>
        <button
          className={`${itemView === "cost" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleViewToggle("cost")}
        >
          Cost
        </button>
      </div>

      {itemView === "margin" ? (
        <div className="grid gap-2 p-2">
          {gridData.map((item, i) => (
            <MarginCard key={i} item={item} />
          ))}
        </div>
      ) : (
        <div>
          <div>Cost</div>
        </div>
      )}
    </div>
  );
};

export default ItemsView;
