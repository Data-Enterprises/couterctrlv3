import { useSalesState } from "../hooks/useSalesState";
import { useState, useEffect } from "react";
import { useAppDispatch } from "../../../hooks";
import type { TopSub } from "../components";
import type { SubGridRow } from "../../../interfaces";
import { subDeptKeyMode, subDeptKeyOf } from "../../../utils/subDeptIdentity";

/** SubGridRow plus the bucket key it was grouped under — the id, or the
 *  description at companies that don't number their departments. */
type SubGridRowKeyed = SubGridRow & { subDeptKey: string };
import { useSalesActions } from "../hooks/useSalesActions";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import { couponSalePct } from "../../../functions";

const SubDeptGridTablet = () => {
  const dispatch = useAppDispatch();
  const actions = useSalesActions();
  const { subSales, selectedSubDept, subSalesWk3 } = useSalesState();
  const [groupSubs, setGroupSubs] = useState<SubGridRowKeyed[]>([]);
  // Also needed in render: the "Dept 12" caption is noise when every id is 0.
  const mode = subDeptKeyMode(subSales);

  useEffect(() => {
    if (groupSubs.length) {
      const topSub = groupSubs[0];
      const selected: TopSub = {
        sub_department: topSub.sub_department,
        sub_department_description: topSub.sub_department_description,
        total_sales: topSub.total_sales - topSub.total_tax,
        net_sales: topSub.net_sales,
        qty: topSub.qty,
        digital_coupons: topSub.digital_coupons,
        elec_instore_coupons: topSub.elec_instore_coupons,
        elec_store_coupons: topSub.elec_store_coupons,
        store_coupon: topSub.store_coupon,
        total_tax: topSub.total_tax,
      };
      dispatch(actions.setSelectedSubDept(selected));
    }
  }, [groupSubs]);

  useEffect(() => {
    // Identity comes from the period on screen; last year is bucketed the same
    // way so its totals land on the matching row. See utils/subDeptIdentity.
    const getLastYrSales = (key: string) => {
      return subSalesWk3
        .filter((s) => subDeptKeyOf(s, mode) === key)
        .reduce(
          (acc: number, curr) => (acc += curr.total_sales - curr.total_tax),
          0,
        );
    };

    const grouped = () => {
      return [...subSales].reduce((acc: SubGridRowKeyed[], curr) => {
        const key = subDeptKeyOf(curr, mode);
        const exists = acc.find((d) => d.subDeptKey === key);
        if (exists) {
          exists.total_sales += curr.total_sales;
          exists.net_sales += curr.net_sales;
          exists.qty += curr.qty;
          exists.digital_coupons += curr.digital_coupons;
          exists.elec_instore_coupons += curr.elec_instore_coupons;
          exists.elec_store_coupons += curr.elec_store_coupons;
          exists.store_coupon += curr.store_coupon;
          exists.weight += curr.weight;
          exists.total_tax += curr.total_tax;
        } else {
          const lastYrSales = getLastYrSales(key);
          acc.push({ ...curr, subDeptKey: key, lastYrSales });
        }
        return acc;
      }, []);
    };

    setGroupSubs(grouped());
  }, [subSales, subSalesWk3]);

  const handleSelect = (subDept: string | number) => {
    const d = groupSubs.find((s) => s.subDeptKey === String(subDept));
    if (!d) return;
    if (!d) return;

    const selected: TopSub = {
      sub_department: d.sub_department,
      sub_department_description: d.sub_department_description,
      total_sales: d.total_sales,
      net_sales: d.net_sales,
      qty: d.qty,
      digital_coupons: d.digital_coupons,
      elec_instore_coupons: d.elec_instore_coupons,
      elec_store_coupons: d.elec_store_coupons,
      store_coupon: d.store_coupon,
      total_tax: d.total_tax,
    };
    dispatch(actions.setSelectedSubDept(selected));
  };

  return (
    <div className="rounded-2xl shadow-lg h-[325px]">
      <div className="h-full overflow-y-auto rounded-xl border border-slate-200 bg-custom-white">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-custom-white">
            <tr className="text-sm tracking-wide text-content/60">
              <th className="px-3 py-2 font-semibold">Sub Dept</th>
              <th className="px-3 py-2 font-semibold text-right">Sales</th>
              <th className="px-3 py-2 font-semibold text-right">Net</th>
              <th className="px-3 py-2 font-semibold text-right">Qty</th>
              <th className="px-3 py-2 font-semibold text-right">Cpn%</th>
            </tr>
          </thead>

          <tbody>
            {groupSubs.map((row) => {
              const active =
                selectedSubDept != null &&
                subDeptKeyOf(selectedSubDept, mode) === row.subDeptKey;

              return (
                <tr
                  key={row.subDeptKey}
                  onClick={() => handleSelect(row.subDeptKey)}
                  className={`cursor-pointer border-t border-content/60 transition-colors ${
                    active ? "bg-blue-200/50" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-content">
                        {row.sub_department_description}
                      </span>
                      {mode === "id" && (
                        <span className="text-[11px] text-content/60">
                          Dept {row.sub_department}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-content">
                    {formatCurrency2(row.total_sales - row.total_tax)}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-content">
                    {formatCurrency2(row.net_sales)}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-content">
                    {formatBigNumber(row.qty, 0)}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-content">
                    {couponSalePct(
                      [
                        row.digital_coupons,
                        row.elec_instore_coupons,
                        row.elec_store_coupons,
                        row.store_coupon,
                      ],
                      row.total_sales,
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubDeptGridTablet;
