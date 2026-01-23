import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import {
  addDays,
  formatBigNumber,
  formatCurrency2,
  formatGoliathDate,
} from "../../../utils";
import { reduceSubs, type TopSub } from ".";
import { netSalesPct, promoLeakage, velocity } from "../../../functions";

import { FlagIcon } from "@heroicons/react/20/solid";

const TopSubDept = () => {
  const [topSub, setTopSub] = useState<TopSub | null>(null);
  const search = useAppSelector((state) => state.search);
  const { subSales, selectedSalesPanel } = useAppSelector(
    (state) => state.sales,
  );

  useEffect(() => {
    if (subSales.length === 0) {
      setTopSub(null);
      return;
    }
    let sub = null;
    if (!selectedSalesPanel.storeid) {
      const reduced = reduceSubs(subSales);
      sub = [...reduced].sort((a, b) => b.total_sales - a.total_sales)[0];
    } else {
      sub = [...subSales]
        .filter((sub) => sub.storeid === selectedSalesPanel.storeid)
        .sort((a, b) => b.total_sales - a.total_sales)[0];
    }
    setTopSub(sub);
  }, [subSales, selectedSalesPanel]);

  const reduceCpnAmt = () => {
    if (!topSub) return 0;
    const amounts = [
      topSub?.digital_coupons,
      topSub?.elec_instore_coupons,
      topSub?.elec_store_coupons,
      topSub?.store_coupon,
    ];
    return amounts.reduce((acc, val) => {
      return acc + (val ? val : 0);
    }, 0);
  };

  const formatVelocity = (val: number) => {
    const p = selectedSalesPanel;
    const endDate = p.sale_date
      ? p.sale_date.split("T")[0]
      : formatGoliathDate(search.endDate);

    const start = addDays(endDate, -6).toISOString().split("T")[0];
    const end = new Date(endDate).toISOString().split("T")[0];

    return velocity(val, start, end).toFixed(2);
  };

  const renderIcon = (val: number, type: string) => {
    let style = "h-4 w-4 ";
    if (type === "pl") {
      if (val < 2) {
        style += "text-emerald-500";
      } else if (val >= 2 && val < 5) {
        style += "text-yellow-500";
      } else {
        style += "text-orange-500";
      }
      return <FlagIcon className={style} />;
    } else if (type === "nsp") {
      if (val >= 95) {
        style += "text-emerald-500";
      } else if (val >= 90) {
        style += "text-yellow-500";
      } else {
        style += "text-orange-500";
      }
      return <FlagIcon className={style} />;
    } else {
      return null;
    }
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
      <div className="mx-2 border-b border-content/30 rounded-t-lg font-medium flex justify-between">
        Top Sub Dept
        {topSub && (
          <div className="font-semibold">
            {topSub.sub_department_description}
          </div>
        )}
      </div>
      {topSub ? (
        <div className="p-2 text-xs">
          <div className="font-medium border-b text-sm">Totals</div>
          <div className="flex justify-between py-1">
            <div>
              <div className="text-sm text-content/60">Revenue</div>
              <div className="font-medium">
                {formatCurrency2(topSub.total_sales)}
              </div>
            </div>
            <div>
              <div className="text-sm text-content/60">Net Sales</div>
              <div className="font-medium">
                {formatCurrency2(topSub.net_sales)}
              </div>
            </div>
            <div>
              <div className="text-sm text-content/60">Qty</div>
              <div className="font-medium">
                {formatBigNumber(topSub.qty, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-content/60">Coupons</div>
              <div className="font-medium">
                {formatCurrency2(reduceCpnAmt())}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[50%_45%] gap-4 mt-3">
            <div>
              <div className="font-medium border-b text-sm">Flags</div>
              <div className="flex justify-between py-1">
                <div>
                  <div className="text-sm text-content/60">Leak</div>
                  <div className="font-medium flex gap-1 items-center">
                    <div>
                      {promoLeakage(topSub.net_sales, topSub.total_sales)}
                    </div>
                    {renderIcon(
                      parseFloat(
                        promoLeakage(
                          topSub.net_sales,
                          topSub.total_sales,
                        ).replace("%", ""),
                      ),
                      "pl",
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-content/60">NSP</div>
                  <div className="font-medium flex gap-1 items-center">
                    <div>
                      {netSalesPct(topSub.net_sales, topSub.total_sales)}
                    </div>
                    {renderIcon(
                      parseFloat(
                        netSalesPct(topSub.net_sales, topSub.total_sales),
                      ),
                      "nsp",
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium border-b text-sm">Velocity/day</div>
              <div className="flex justify-between py-1">
                <div>
                  <div className="text-sm text-content/60">Sales</div>
                  <div className="font-medium">
                    {formatCurrency2(
                      parseInt(formatVelocity(topSub.total_sales)),
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-content/60">Qty</div>
                  <div className="font-medium">
                    {formatVelocity(topSub.qty)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TopSubDept;
