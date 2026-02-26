import type { SubDeptMargin } from "../../../interfaces";
import { formatDate } from "../../../utils";
import { useSubMarginCtx } from "../hooks";

interface WeeklyTrendsProps {
  data: SubDeptMargin[];
}

const WeekCard = ({ data }: WeeklyTrendsProps) => {
  const ctx = useSubMarginCtx();
  const title = ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId)?.desc;
  
  const dates = () => {
    const start = [...data].sort((a, b) => new Date(a.sale_date) < new Date(b.sale_date) ? -1 : 1)[0].sale_date;
    const end = [...data].sort((a, b) => new Date(b.sale_date) < new Date(a.sale_date) ? -1 : 1)[0].sale_date;
    return `${formatDate(start)} - ${formatDate(end)}`;
  };
    
  return (
    <div className="bg-custom-white rounded-lg shadow-lg text-sm">
      <div className="bg-blue-500 text-custom-white font-medium px-2 flex justify-between items-center rounded-t-lg py-0.5">
        <div>{dates()}</div>
        <div>{title}</div>
      </div>
      <div className="p-2"></div>
    </div>
  );
};

export default WeekCard;
