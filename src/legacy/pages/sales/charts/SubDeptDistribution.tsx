import { useMemo, useState, useEffect } from "react";
import { useSalesState } from "../hooks/useSalesState";
import { formatBigNumber } from "../../../utils";
import type { SubSale } from "../../../interfaces";

type GroupedRow = {
  sub_department: number;
  sub_department_description: string;
  net: number;
};

const SubDeptDistribution = () => {
  const { subSales, selectedSalesPanel } = useSalesState();

  const rows = useMemo(() => {
    const grouped = [...subSales].reduce((acc: GroupedRow[], curr: SubSale) => {
      const exists = acc.find((d) => d.sub_department === curr.sub_department);
      if (exists) {
        exists.net += curr.total_sales - curr.total_tax;
      } else {
        acc.push({
          sub_department: curr.sub_department,
          sub_department_description: curr.sub_department_description,
          net: curr.total_sales - curr.total_tax,
        });
      }
      return acc;
    }, []);

    return grouped.sort((a, b) => b.net - a.net);
  }, [subSales]);

  const grandTotal = useMemo(
    () => rows.reduce((sum, r) => sum + r.net, 0),
    [rows],
  );

  const [maxH, setMaxH] = useState<string>(
    window.innerWidth <= 1536 ? "max-h-[335px]" : "max-h-[457px]",
  );

  useEffect(() => {
    const handleResize = () => {
      setMaxH(window.innerWidth <= 1536 ? "max-h-[335px]" : "max-h-[457px]");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  console.log(maxH)

  return (
    <div className={`bg-custom-white rounded-lg shadow-lg pb-2 pt-1 flex flex-col overflow-hidden ${maxH}`}>
      <div className="px-2 flex justify-between items-center text-sm shrink-0">
        <span className="font-medium">
          {selectedSalesPanel.sale_date ? "Daily" : "Weekly"} Sub Department
          Distribution
        </span>
        <span className="text-xs text-gray-400">
          {grandTotal > 0 ? `$${formatBigNumber(grandTotal, 0)} total` : ""}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-2 mt-1">
        {rows.map((row) => {
          const pct = grandTotal > 0 ? (row.net / grandTotal) * 100 : 0;
          return (
            <div
              key={row.sub_department}
              className="flex items-center gap-2 py-[3px]"
            >
              <span className="w-28 text-[11px] text-gray-600 truncate shrink-0">
                {row.sub_department_description}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-[14px] overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-[width] duration-700 ease-in-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] font-medium w-14 text-right shrink-0">
                ${formatBigNumber(row.net, 0)}
              </span>
              <span className="text-[11px] text-gray-400 w-10 text-right shrink-0">
                {pct.toFixed(2)}%
              </span>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="text-xs text-gray-400 text-center mt-4">No data</div>
        )}
      </div>
    </div>
  );
};

export default SubDeptDistribution;
