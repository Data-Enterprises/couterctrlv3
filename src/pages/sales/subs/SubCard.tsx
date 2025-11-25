import type { SubSale } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

interface SubCardProps {
  sub: SubSale;
}
const SubCard = ({ sub }: SubCardProps) => {
  return (
    <div className="rounded-lg shadow-md shadow-content/30 py-2 text-sm">
      {/* Header */}
      <div className="flex justify-between mx-3 border-b border-content/20 font-medium">
        <div>{sub.store_name}</div>
        <div>{sub.sub_department_description}</div>
      </div>

      {/* Body */}
      <div className="mx-3 border-b border-content/20 my-2 grid grid-cols-2">
        <div className="flex gap-1">
          <div>Net Sales:</div>
          <div>{formatCurrency2(sub.net_sales)}</div>
        </div>
        {/* odd */}
        <div className="flex gap-1 justify-end">
          <div>Qty:</div>
          <div>{formatBigNumber(sub.qty).split(".")[0]}</div>
        </div>
        <div className="flex gap-1">
          <div>Total Sales:</div>
          <div>{formatCurrency2(sub.total_sales)}</div>
        </div>
        {/* odd */}
        <div className="flex gap-1 justify-end">
          <div>Weight:</div>
          <div>{formatBigNumber(sub.weight).split(".")[0]}</div>
        </div>
      </div>

      {/* Footer */}
    </div>
  );
};

export default SubCard;
