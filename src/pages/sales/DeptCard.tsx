import type { DepartmentSale } from "../../interfaces";
import { formatCurrency2 } from "../../utils";

interface DeptCardProps {
  dept: DepartmentSale;
}

const DeptCard = ({ dept }: DeptCardProps) => {
  return (
    <div className="rounded lg shadow-lg mx-2 border text-sm">
      <div className="font-medium text-center px-2 border-b border-content/30">
        {dept.sub_department_description}
      </div>
      <div className="grid grid-cols-2 place-items-center text-center px-2">
        <div>
          <div>Sales</div>
          <div>{formatCurrency2(dept.sales)}</div>
        </div>
        <div>
          <div>Qty</div>
          <div>{dept.qty}</div>
        </div>
      </div>
    </div>
  );
};

export default DeptCard;
