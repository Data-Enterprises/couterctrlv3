import type { SubDeptCost } from "../../../interfaces";
import { useAppDispatch } from "../../../hooks";
import { useSubMarginCtx } from "../hooks";
import {
  setSubDeptCost,
  setSubDeptGridView,
} from "../../../features/subMarginSlice";
interface MarginKpiProps {
  data: string;
  title: string;
}

const SubDeptMarginKpi = ({ data, title }: MarginKpiProps) => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();

  const handleCostClick = () => {
    if (title === "Cost") {
      const margins: SubDeptCost[] = ctx.margins.reduce((acc: SubDeptCost[], curr) => {
        const found = acc.find((item) => item.product_code === curr.product_code);
        if (!found) {
          acc.push({
            product_code: curr.product_code,
            description: curr.product_description,
            calculated_cost: curr.calculated_cost,
            cost: curr.cost,
            qty: curr.qty,
            total_cost: curr.calculated_cost * curr.qty,
          });
        } else {
          found.qty += curr.qty;
          found.total_cost += curr.calculated_cost * curr.qty;

        }
        return acc;
      }, []);
      dispatch(setSubDeptCost(margins));
      dispatch(setSubDeptGridView("cost"));
    }
    if (title === "Unique Items") {
      dispatch(setSubDeptGridView("item"));
    }
  };

  const highlightStyle = () => {
    if (title === "Cost" && ctx.subDeptGridView === "cost") {
      return "bg-orange-200";
    }
    if (title === "Unique Items" && ctx.subDeptGridView === "item") {
      return "bg-orange-200";
    }
    return "";
  };

  return (
    <div
      className={`w-1/6 flex flex-col gap-1 justify-center items-center bg-custom-white px-2 py-4 rounded-lg shadow-lg ${highlightStyle()}`}
      onClick={handleCostClick}
    >
      <div className="text-content/50">{title}</div>
      <div>{data}</div>
    </div>
  );
};

export default SubDeptMarginKpi;
