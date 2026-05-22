import type { SubDeptCost } from "../../../interfaces";
import { useAppDispatch } from "../../../hooks";
import { useSubMarginCtx } from "../hooks";
import {
  setSubDeptCost,
  setSubDeptGridView,
} from "../../../features/subMarginSlice";
import { calculateCogs } from "..";

import { QuestionMarkCircleIcon } from "@heroicons/react/16/solid";
import { useState } from "react";

interface MarginKpiProps {
  data: string;
  title: string;
}

const SubDeptMarginKpi = ({ data, title }: MarginKpiProps) => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const handleCostClick = () => {
    if (ctx.selectedWeek === 5) return;

    if (title === "Cost") {
      const formatDate = (dte: string) => {
        const split = dte.split("T")[0].split("-");
        return `${split[1]}/${split[2]}/${split[0]}`;
      };

      const margins: SubDeptCost[] = ctx.margins.reduce(
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
      );

      dispatch(setSubDeptCost(margins));
      dispatch(
        setSubDeptGridView(ctx.subDeptGridView === "cost" ? "item" : "cost"),
      );
    }
    if (title === "Unique Items") {
      dispatch(setSubDeptGridView("item"));
    }
  };

  const highlightStyle = () => {
    if (
      title === "Cost" &&
      ctx.subDeptGridView === "cost" &&
      !ctx.isTablet &&
      ctx.selectedWeek < 5
    ) {
      return "bg-orange-200";
    }
    if (
      title === "Unique Items" &&
      ctx.subDeptGridView === "item" &&
      !ctx.isTablet &&
      ctx.selectedWeek < 5
    ) {
      return "bg-orange-200";
    }
    return "";
  };

  const hoverStyle = () => {
    if (
      (title === "Cost" || title === "Unique Items") &&
      ctx.selectedWeek < 5
    ) {
      return "hover:bg-blue-200 cursor-pointer transition-all duration-200";
    }
  };

  const renderTooltip = () => {
    const tooltipStr =
      title === "Cost"
        ? "Shows the cost data for all items sold"
        : "Shows data for the unique items sold";
    if (
      (title === "Cost" || title === "Unique Items") &&
      !ctx.isTablet &&
      ctx.selectedWeek < 5
    ) {
      return (
        <div className="absolute right-1 top-0.5 flex gap-1 items-center">
          <div
            className={`${showTooltip ? "opacity-100" : "opacity-0"} bg-custom-white p-1 rounded-lg shadow-md text-nowrap border border-content/50 font-normal text-xs transition-opacity duration-300`}
            style={{
              zIndex: 1200,
            }}
          >
            {tooltipStr}
          </div>
          <QuestionMarkCircleIcon
            className="w-5 h-5 text-content/30 hover:text-blue-500 transition-all duration-300"
            onMouseOver={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          />
        </div>
      );
    }

    return null;
  };

  const layout = ctx.isTablet ? "w-full py-3" : "w-1/6 py-4"

  return (
    <div
      className={`relative text-[13.5px] ${layout} flex flex-col gap-1 justify-center items-center bg-custom-white rounded-lg shadow-lg ${highlightStyle()} ${hoverStyle()}`}
      onClick={handleCostClick}
    >
      <div className="text-content/50">{title}</div>
      <div>{data}</div>
      {renderTooltip()}
    </div>
  );
};

export default SubDeptMarginKpi;
