import { useAppSelector } from "../../../hooks";
import { subCols } from "../components";
import type { SubSale } from "../../../interfaces";
import { useState, useEffect } from "react";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { couponSalePct, netSalesPct } from "../../../functions";

const SubDeptRptGrid = () => {
  const { subSales, selectedSalesPanel } = useAppSelector(
    (state) => state.sales,
  );
  const [groupSubs, setGroupSubs] = useState<SubSale[]>([]);

  useEffect(() => {
    const grouped = () => {
      return [...subSales].reduce((acc: SubSale[], curr) => {
        const exists = acc.find(
          (d) => d.sub_department === curr.sub_department,
        );
        if (exists) {
          exists.total_sales += curr.total_sales - curr.total_tax;
          exists.net_sales += curr.net_sales;
          exists.qty += curr.qty;
          exists.digital_coupons += curr.digital_coupons;
          exists.elec_instore_coupons += curr.elec_instore_coupons;
          exists.elec_store_coupons += curr.elec_store_coupons;
          exists.store_coupon += curr.store_coupon;
          exists.weight += curr.weight;
          exists.total_tax += curr.total_tax;
        } else {
          acc.push({ ...curr });
        }
        return acc;
      }, []);
    };
    setGroupSubs(grouped());
  }, [subSales]);

  const getBg = (sale: SubSale) => {
    const salesMinusTax = sale.total_sales - sale.total_tax;
    const pct = parseFloat(
      netSalesPct(sale.net_sales, salesMinusTax).replace("%", ""),
    );
    return `text-right hover:bg-blue-200 cursor-pointer transition-all duration-200 ${
      pct >= 95
        ? "bg-emerald-200"
        : pct >= 90
          ? "bg-yellow-200"
          : "bg-orange-200"
    }`;
  };

  return (
    <div className="bg-custom-white rounded-lg h-full">
      <div className=" flex justify-between items-center">
        <span className="font-medium">
          {selectedSalesPanel.sale_date ? "Daily" : "Weekly"} Sub Department
          Sales
        </span>
      </div>
      <div className="h-full">
        <div className="bg-blue-500 text-white grid grid-cols-[1.3fr_1.1fr_1fr_0.8fr_0.8fr_1fr] py-0.5 rounded-t-lg">
          {subCols.map((col, i) => (
            <div key={i} className="px-2 border-r text-[15px] font-bold">
              {col.headerName}
            </div>
          ))}
        </div>
        <div className="text-sm">
          {groupSubs.map((sub, i) => (
            <div
              key={i}
              className="grid grid-cols-[1.3fr_1.1fr_1fr_0.8fr_0.8fr_1fr] odd:bg-blue-50 even:bg-blue-200 border-b border-white last:rounded-b-lg last:border-none"
            >
              <div className="px-2 text-[13px] py-0.5">
                {sub.sub_department_description}
              </div>
              <div className="px-2 text-[13px] py-0.5 text-right">
                {formatCurrency2(sub.total_sales - sub.total_tax)}
              </div>
              <div className="px-2 text-[13px] py-0.5 text-right">
                {formatCurrency2(sub.net_sales)}
              </div>
              <div className="px-2 text-[13px] py-0.5 text-right">
                {formatBigNumber(sub.qty)}
              </div>
              <div className="px-2 text-[13px] py-0.5 text-right">
                {couponSalePct(
                  [
                    sub.digital_coupons,
                    sub.elec_instore_coupons,
                    sub.elec_store_coupons,
                    sub.store_coupon,
                  ],
                  sub.total_sales,
                )}
              </div>
              <div
                className={`${getBg(sub)} px-2 text-[13px] py-0.5 text-right last:rounded-br-lg`}
              >
                {netSalesPct(sub.net_sales, sub.total_sales - sub.total_tax)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubDeptRptGrid;
