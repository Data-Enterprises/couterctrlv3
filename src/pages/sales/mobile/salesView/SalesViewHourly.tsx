import { useMobileSalesCtx } from "../hooks";

interface SalesViewHourlyProps {
  displayName: string;
}

interface HourlySaleDate {
  hour: number;
  sale_date: string;
  total_sales: number;
  qty: number;
  transactions: number;
  avg_tranasction_amount: number;
}

const SalesViewHourly = ({ displayName }: SalesViewHourlyProps) => {
  const ctx = useMobileSalesCtx();

  const test = () => {
    return;
    const result = [...ctx.salesViewHourly].reduce(
      (acc: HourlySaleDate[], curr) => {
        const found = acc.find(
          (item) =>
            item.hour === curr.hour && item.sale_date === curr.sale_date,
        );
        if (found) {
          curr.total_sales += found.total_sales - found.total_sales;
          curr.qty += found.qty - found.qty;
          // curr.
        } else {
          const sales = curr.total_sales - curr.total_tax;
          acc.push({
            hour: curr.hour,
            sale_date: curr.sale_date,
            total_sales: sales,
            qty: curr.qty,
            transactions: curr.transactions,
            avg_tranasction_amount: 0,
          });
        }
        return acc;
      },
      [],
    );
    console.log(result);
  };

  test();

  return (
    <div className="bg-custom-white rounded-lg shadow-md px-2 py-0.5">
      <div className="flex justify-between font-medium">
        <div>Hourly Sales</div>
        <div>{displayName}</div>
      </div>
      <div className="grid grid-cols-2 mb-1">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      {ctx.hourlyKey === "sale_date" ? (
        <div>
          <div>{ctx.hourlyKey}</div>
        </div>
      ) : (
        <div>
          <div></div>
        </div>
      )}
      <div>
        <div>Sales View - Hourly</div>
      </div>
    </div>
  );
};

export default SalesViewHourly;
