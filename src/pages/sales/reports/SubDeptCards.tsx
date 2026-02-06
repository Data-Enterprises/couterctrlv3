import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks";
import type { SubSale } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

const SubDeptCards = () => {
  const { subSales } = useAppSelector((state) => state.sales);
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

  const agg = (x: string) => {
    if (x === "coupons") {
      return groupSubs.reduce(
        (acc: number, curr) =>
          acc +
          (curr.digital_coupons +
            curr.elec_instore_coupons +
            curr.elec_store_coupons +
            curr.store_coupon),
        0,
      );
    }
    return groupSubs.reduce(
      (acc, curr) => acc + (curr[x as keyof SubSale] as number),
      0,
    );
  };
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="bg-bkg/50 border rounded-lg border-content/50 flex flex-col justify-center items-center">
        <div className="text-content/60">Total Sales</div>
        <div className="font-medium">{formatCurrency2(agg("total_sales"))}</div>
      </div>
      <div className="bg-bkg/50 border rounded-lg border-content/50 flex flex-col justify-center items-center">
        <div className="text-content/60">Net Sales</div>
        <div className="font-medium">{formatCurrency2(agg("net_sales"))}</div>
      </div>
      <div className="bg-bkg/50 border rounded-lg border-content/50 flex flex-col justify-center items-center">
        <div className="text-content/60">Quantity</div>
        <div className="font-medium">{formatBigNumber(agg("qty"), 0)}</div>
      </div>
      <div className="bg-bkg/50 border rounded-lg border-content/50 flex flex-col justify-center items-center">
        <div className="text-content/60">Coupons</div>
        <div className="font-medium">{formatCurrency2(agg("coupons"))}</div>
      </div>
    </div>
  );
};

export default SubDeptCards;
