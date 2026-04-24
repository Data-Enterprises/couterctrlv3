import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks";
import { formatDateSimple, sameWeekDayLastYear } from "../../../utils";
import ComparisonCard from "./ComparisonCard";

const SalesWeeklyTotals = () => {
  const sales = useAppSelector((state) => state.sales);
  const [dateRange, setDateRange] = useState<string>("");

  useEffect(() => {
    const data =
      sales.selectedSalesPanel.storeid > 0
        ? [...sales.weeklySales].filter(
            (sale) => sale.storeid === sales.selectedSalesPanel.storeid,
          )
        : [...sales.weeklySales];

    const dates = Array.from(
      new Set(data.map((d) => d.sale_date.split("T")[0])),
    ).sort();

    setDateRange(
      `${formatDateSimple(dates[0])} - ${formatDateSimple(dates[dates.length - 1])}`,
    );
  }, [sales.selectedSalesPanel, sales.weeklySales]);

  if (!sales.weeklySales.length && !sales.hourlySales.length) return null;

  const aggCpn = (thisYear: boolean = true) => {
    const data = thisYear ? [...sales.subSales] : [...sales.subSalesWk3];
    const p = sales.selectedSalesPanel;
    if (data.length === 0) {
      return {
        digital_coupons: 0,
        elec_instore_coupons: 0,
        elect_store_coupons: 0,
        store_coupon: 0,
      };
    }

    const dateComp = thisYear
      ? p.sale_date
      : p.sale_date.length
        ? sameWeekDayLastYear(p.sale_date).date
        : "";

    const filtered = data.filter((sub) => {
      return p.sale_date.length
        ? sub.sale_date.split("T")[0] === dateComp
        : true;
    });

    // ned to use hourlySales to get avg_basket_size, total sales, total tax and subSales for total cpn dollars
    const totals = filtered.reduce(
      (acc, val) => {
        acc.digital_coupons += val.digital_coupons;
        acc.elec_instore_coupons += val.elec_instore_coupons;
        acc.elect_store_coupons += val.elec_store_coupons;
        acc.store_coupon += val.store_coupon;
        return acc;
      },
      {
        digital_coupons: 0,
        elec_instore_coupons: 0,
        elect_store_coupons: 0,
        store_coupon: 0,
      },
    );

    return totals;
  };

  const tyCpn = aggCpn(true);
  const lyCpn = aggCpn(false);

  const defaultTotals = {
    total_sales: 0,
    total_tax: 0,
    total_cpn_dollars: 0,
    basket_size_sales: 0,
    transactions: 0,
    avg_basket_amount: 0,
  };

  const aggTotals = (thisYear: boolean = true) => {
    const p = sales.selectedSalesPanel;
    const data = thisYear
      ? [...sales.hourlySales]
      : [...sales.hourlySalesLastYear];

    if (data.length === 0) return defaultTotals;

    const dateComp = thisYear
      ? p.sale_date
      : p.sale_date.length
        ? sameWeekDayLastYear(p.sale_date).date
        : "";

    const filtered = data.filter((hs) => {
      return p.sale_date.length
        ? hs.sale_date.split("T")[0] === dateComp
        : true;
    });

    const totals = filtered.reduce(
      (acc, val) => {
        acc.basket_size_sales += val.basket_size_sales;
        acc.total_tax += val.total_tax;
        acc.transactions += val.transactions;
        return acc;
      },
      { ...defaultTotals },
    );

    // all needed panels or just the selected panel sale date
    const formatSales = () => {
      const panels = thisYear ? sales.weeklySales : sales.weeklySalesLastYear;
      if (panels.length === 0) return 0;

      if (p.sale_date.length) {
        // find that sales panel => total sales - total tax => yyyy-mm-dd
        const panel = panels.find(
          (sp) => sp.sale_date.split("T")[0] === dateComp,
        );
        if (panel) {
          return panel.total_sales - panel.total_tax;
        }

        return 0;
      } else {
        // all panels
        return [...panels].reduce((acc, cur) => {
          acc += cur.total_sales - cur.total_tax;
          return acc;
        }, 0);
      }
    };

    totals.total_sales = formatSales();
    const basket = totals.total_sales / totals.transactions;
    totals.avg_basket_amount = !isNaN(basket) ? basket : 0;

    return totals;
  };

  const tyTotals = aggTotals(true);
  const lyTotals = aggTotals(false);

  return (
    <div className="rounded-2xl bg-custom-white p-2 shadow-lg ring-1 ring-slate-200/70">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-lg font-semibold">
            Weekly Totals
          </div>
          <div className="text-sm text-content/60">
            Metric comparisons for this year vs last year
          </div>
        </div>
        <div className="text-sm font-medium">{dateRange}</div>
      </div>

      <div className="mt-1 grid grid-cols-2 gap-3">
        <div className="h-[2px] rounded-full bg-gradient-to-r from-blue-300 to-transparent" />
        <div className="h-[2px] rounded-full bg-gradient-to-l from-blue-300 to-transparent" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <ComparisonCard
          title="Net Sales"
          ty={tyTotals.total_sales}
          ly={lyTotals.total_sales}
        />
        <ComparisonCard
          title="Transactions"
          ty={tyTotals.transactions}
          ly={lyTotals.transactions}
          formatAsCurrency={false}
        />
        <ComparisonCard
          title="Avg Basket Amount"
          ty={tyTotals.avg_basket_amount}
          ly={lyTotals.avg_basket_amount}
        />
        <ComparisonCard
          title="Total Tax"
          ty={tyTotals.total_tax}
          ly={lyTotals.total_tax}
        />
        <ComparisonCard
          title="Store Coupon"
          ty={tyCpn.store_coupon}
          ly={lyCpn.store_coupon}
        />
        <ComparisonCard
          title="Digital Coupons"
          ty={tyCpn.digital_coupons}
          ly={lyCpn.digital_coupons}
        />
        <ComparisonCard
          title="Elect Store Coupons"
          ty={tyCpn.elect_store_coupons}
          ly={lyCpn.elect_store_coupons}
        />
        <ComparisonCard
          title="Elec Instore Coupons"
          ty={tyCpn.elec_instore_coupons}
          ly={lyCpn.elec_instore_coupons}
        />
      </div>
    </div>
  );
};

export default SalesWeeklyTotals;
