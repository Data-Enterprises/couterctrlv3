import { calculateCogs } from "..";
import { useSubMarginCtx } from "../hooks";
import { useAppDispatch } from "../../../hooks";
import { useEffect, useState } from "react";
import type { ItemRow } from "../display/widgets";
import {
  setFilteredCostGridData,
  setFilteredItemGridData,
  setItemGridData,
  setSubDeptCost,
  setSubDeptGridView,
} from "../../../features/subMarginSlice";
import MarginCard from "./MarginCard";
import type { SubDeptCost } from "../../../interfaces";
import CostCard from "./CostCard";
import Input from "../../../components/inputs/Input";

const ItemsView = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const [searchText, setSearchText] = useState<string>("");
  const [refreshFiltered, setRefreshFiltered] = useState<boolean>(true);

  useEffect(() => {
    if (ctx.subDeptGridView === "item" && refreshFiltered) {
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

      const newData = reduced
        .map((item) => ({
          ...item,
          margin:
            ((item.total_sales - item.cogs) / item.total_sales) * 100 || 0,
        }))
        .filter((item) => item.product_code.includes(searchText));
      dispatch(setItemGridData(newData));
      dispatch(setFilteredItemGridData(newData));
      setRefreshFiltered(false);

    } else if (ctx.subDeptGridView === "cost" && refreshFiltered) {
      // cost view
      const formatDate = (dte: string) => {
        const split = dte.split("T")[0].split("-");
        return `${split[1]}/${split[2]}/${split[0]}`;
      };

      const costData: SubDeptCost[] = ctx.margins.reduce(
        (acc: SubDeptCost[], curr) => {
          const found = acc.find(
            (item) => item.product_code === curr.product_code,
          );
          if (!found) {
            acc.push({
              date: formatDate(curr.sale_date),
              product_code: curr.product_code,
              description: curr.product_description,
              calculated_cost: curr.calculated_cost,
              cost: curr.cost,
              qty: curr.qty,
              total_cost: calculateCogs(
                curr.net_cost,
                curr.cost,
                curr.case_size,
                curr.qty,
                curr.weight,
              ),
            });
          } else {
            found.qty += curr.qty;
            found.total_cost += calculateCogs(
              curr.net_cost,
              curr.cost,
              curr.case_size,
              curr.qty,
              curr.weight,
            );
          }
          return acc;
        },
        [],
      ).filter((item) => item.product_code.includes(searchText));

      dispatch(setSubDeptCost(costData));
      dispatch(setFilteredCostGridData(costData));
      setRefreshFiltered(false);
    }
  }, [ctx.selectedWeekDay, ctx.subDeptGridView, refreshFiltered]);

  const handleViewToggle = (option: "item" | "cost") => {
    dispatch(setSubDeptGridView(option));
    setRefreshFiltered(true);
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
  };

  const handleClear = () => {
    setSearchText("");
    setRefreshFiltered(true);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 px-2">
        <button
          className={`${ctx.subDeptGridView === "item" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleViewToggle("item")}
        >
          Unique Items
        </button>
        <button
          className={`${ctx.subDeptGridView === "cost" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleViewToggle("cost")}
        >
          Item Cost
        </button>
      </div>

      <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 p-2 items-end">
        <Input
          label="Full or Partial UPC"
          value={searchText}
          setValue={handleTextChange}
        />
        <button
          className="btn-themeGreen px-0 py-1.5"
          onClick={() => setRefreshFiltered(true)}
        >
          Search
        </button>
        <button
          className="btn-themeOrange px-0 py-1.5"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
      {ctx.subDeptGridView === "item" ? (
        <div className="grid gap-2 p-2 max-h-[calc(100vh-14.4rem)] overflow-y-auto">
          {ctx.filteredItemGridData.map((item, i) => (
            <MarginCard key={i} item={item} />
          ))}
        </div>
      ) : (
        <div className="grid gap-2 p-2 max-h-[calc(100vh-14.4rem)] overflow-y-auto">
          {ctx.filteredCostGridData.map((cost, i) => (
            <CostCard key={i} cost={cost} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ItemsView;
