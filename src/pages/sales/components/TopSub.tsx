import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  addDays,
  formatBigNumber,
  formatCurrency2,
  formatGoliathDate,
} from "../../../utils";
import { reduceSubs, type TopSub } from ".";
import { netSalesPct, promoLeakage, velocity } from "../../../functions";
import { setTopSubDept } from "../../../features/salesSlice";
import { FlagIcon, QuestionMarkCircleIcon } from "@heroicons/react/20/solid";

const tooltips = {
  pl: false,
  nsp: false,
};

interface Props {
  inReport?: boolean;
}

const TopSubDept = ({ inReport }: Props) => {
  const dispatch = useAppDispatch();
  const [tooltip, setTooltip] = useState<typeof tooltips>(tooltips);
  const [topSub, setTopSub] = useState<TopSub | null>(null);
  const [title, setTitle] = useState<string>("Top Sub Dept");
  const search = useAppSelector((state) => state.search);
  const { subSales, selectedSalesPanel, topSubDept, selectedSubDept } =
    useAppSelector((state) => state.sales);

  useEffect(() => {
    if (subSales.length === 0) {
      setTopSub(null);
      return;
    }

    let sub = null;
    // If a selected sub dept exists, use that
    if (selectedSubDept !== null) {
      sub = selectedSubDept;
      // else if no panel selected, use the reduced top sub from all stores
    } else if (!selectedSalesPanel.storeid) {
      const reduced = reduceSubs(subSales);
      sub = [...reduced].sort((a, b) => b.total_sales - a.total_sales)[0];
      // else use the top sub from the selected panel
    } else {
      sub = [...subSales]
        .filter((sub) => sub.storeid === selectedSalesPanel.storeid)
        .sort((a, b) => b.total_sales - a.total_sales)[0];
    }

    // Set the display SubDept
    setTopSub(sub);

    if (topSubDept && sub.sub_department === topSubDept.sub_department) {
      setTitle("Top Sub Dept");
    } else {
      setTitle("Selected Sub Dept");
    }

    // if data is loading, topSubDept is null here so we set it
    if (!topSubDept) {
      const newTopSub: TopSub = {
        sub_department: sub.sub_department,
        sub_department_description: sub.sub_department_description,
        total_sales: sub.total_sales,
        net_sales: sub.net_sales,
        qty: sub.qty,
        digital_coupons: sub.digital_coupons,
        elec_instore_coupons: sub.elec_instore_coupons,
        elec_store_coupons: sub.elec_store_coupons,
        store_coupon: sub.store_coupon,
        total_tax: sub.total_tax,
      };
      dispatch(setTopSubDept(newTopSub));
    }
  }, [subSales, selectedSalesPanel, selectedSubDept]);

  const reduceCpnAmt = () => {
    const amounts = [
      topSub?.digital_coupons,
      topSub?.elec_instore_coupons,
      topSub?.elec_store_coupons,
      topSub?.store_coupon,
    ];
    return amounts.reduce((acc: number, val) => {
      return acc + (val ? val : 0);
    }, 0);
  };

  const formatVelocity = (val: number) => {
    const p = selectedSalesPanel;
    const endDate = p.sale_date
      ? p.sale_date.split("T")[0]
      : formatGoliathDate(search.singleDate);

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
    }
  };

  const handleTooltip = (key: keyof typeof tooltips) => {
    setTooltip((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className={`${inReport ? "bg-custom-white border border-content/50" : "bg-custom-white shadow-lg"} rounded-lg text-sm`}
    >
      <div className="bg-blue-500 text-custom-white rounded-t-lg font-medium flex justify-between px-2 py-0.5">
        {title}
        {topSub && (
          <div className="font-semibold">
            {topSub.sub_department_description}
          </div>
        )}
      </div>
      {topSub ? (
        <div className="px-2 py-1 text-xs">
          <div className="font-medium border-b text-sm">Totals</div>
          <div className="grid grid-cols-4 gap-2 py-1">
            <div>
              <div className="text-sm text-content/60">Sales</div>
              <div className="font-medium">
                {formatCurrency2(topSub.total_sales - topSub.total_tax)}
              </div>
            </div>
            <div>
              <div className="text-sm text-content/60">Net</div>
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

          <div className="grid grid-cols-[45%_55%] gap-4">
            <div>
              <div className="font-medium border-b text-sm">Flags</div>
              <div className="grid grid-cols-2 gap-2 py-1">
                <div className="">
                  <div className="text-sm text-content/60 flex gap-1 items-center relative">
                    <div>Leak</div>
                    {!inReport && (
                      <QuestionMarkCircleIcon
                        data-testid="pl-tooltip-icon"
                        className="inline h-5 w-5 text-content/30 hover:text-blue-200 transition-all duration-100 cursor-default"
                        onMouseEnter={() => handleTooltip("pl")}
                        onMouseLeave={() => handleTooltip("pl")}
                      />
                    )}
                    <div
                      className={`${tooltip.pl ? "absolute" : "hidden"} text-content bg-orange-200 text-nowrap rounded-lg p-2 left-0 -translate-y-full mt-2 shadow shadow-content/50`}
                    >
                      Promo Leakage
                    </div>
                  </div>
                  <div className="font-medium flex gap-1 items-center">
                    <div>
                      {promoLeakage(
                        topSub.net_sales,
                        topSub.total_sales - topSub.total_tax,
                      )}
                    </div>
                    {renderIcon(
                      parseFloat(
                        promoLeakage(
                          topSub.net_sales,
                          topSub.total_sales - topSub.total_tax,
                        ).replace("%", ""),
                      ),
                      "pl",
                    )}
                  </div>
                </div>
                <div className="">
                  <div className="text-sm text-content/60 flex gap-1 items-center relative">
                    <div>NSP</div>
                    {!inReport && (
                      <QuestionMarkCircleIcon
                        data-testid="nsp-tooltip-icon"
                        className="inline h-5 w-5 text-content/30 hover:text-blue-200 transition-all duration-100 cursor-default"
                        onMouseEnter={() => handleTooltip("nsp")}
                        onMouseLeave={() => handleTooltip("nsp")}
                      />
                    )}
                    <div
                      className={`${tooltip.nsp ? "absolute" : "hidden"} text-content bg-orange-200 text-nowrap rounded-lg p-2 left-0 -translate-y-full mt-2 shadow shadow-content/50`}
                    >
                      Net Sales Percentage
                    </div>
                  </div>
                  <div className="font-medium flex gap-1 items-center">
                    <div>
                      {netSalesPct(
                        topSub.net_sales,
                        topSub.total_sales - topSub.total_tax,
                      )}
                    </div>
                    {renderIcon(
                      parseFloat(
                        netSalesPct(
                          topSub.net_sales,
                          topSub.total_sales - topSub.total_tax,
                        ),
                      ),
                      "nsp",
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium border-b text-sm">Velocity/day</div>
              <div className="grid grid-cols-2 gap-2 py-1">
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
                    {formatBigNumber(parseFloat(formatVelocity(topSub.qty)))}
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
