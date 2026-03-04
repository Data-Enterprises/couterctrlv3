import { gpm } from "../../../../functions";
import { formatBigNumber, formatCurrency2 } from "../../../../utils";
import { useSubMarginCtx } from "../../hooks";

interface DailyCardProps {
  date: string;
}

const DailyCard = ({ date }: DailyCardProps) => {
  const ctx = useSubMarginCtx();

  const dateMargins = ctx.margins.filter(
    (margin) => margin.sale_date.split("T")[0] === date,
  );

  const totalSales = dateMargins.reduce(
    (acc, margin) => acc + (margin.total_sales - margin.total_tax),
    0,
  );
  const netSales = dateMargins.reduce(
    (acc, margin) => acc + margin.net_sales,
    0,
  );
  const qty = dateMargins.reduce((acc, margin) => acc + margin.qty, 0);
  const tax = dateMargins.reduce((acc, margin) => acc + margin.total_tax, 0);
  const cogs = formatCurrency2(
    dateMargins.reduce((acc, curr) => acc + curr.calculated_cost * curr.qty, 0),
  );

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("-");
    return `${Number(split[1])}/${Number(split[2])}/${split[0]}`;
  };

  const getGpm = () => {
    return gpm(totalSales, parseFloat(cogs.replace(/[^0-9.-]+/g, "")));
  };

  const vendors = Array.from(
    new Set(dateMargins.map((margin) => margin.vendor_name)),
  ).length;

  const items = formatBigNumber(
    Array.from(new Set(dateMargins.map((margin) => margin.product_code)))
      .length,
    0,
  );

  return (
    <div className="bg-custom-white rounded-lg shadow-lg text-sm">
      <div className="bg-blue-500 text-custom-white rounded-t-lg font-medium py-0.5 px-2">
        {formatDate(date)}
      </div>
      <div className="p-2">
        {/* Top */}
        <div className="grid grid-cols-4 gap-2">
          <div>
            <div className="text-content/60">Sales</div>
            <div className="font-medium text-xs">
              {formatCurrency2(totalSales)}
            </div>
          </div>
          <div>
            <div className="text-content/60">Net</div>
            <div className="font-medium text-xs">
              {formatCurrency2(netSales)}
            </div>
          </div>
          <div>
            <div className="text-content/60">Qty</div>
            <div className="font-medium text-xs">{formatBigNumber(qty, 0)}</div>
          </div>
          <div>
            <div className="text-content/60">Tax</div>
            <div className="font-medium text-xs">{formatCurrency2(tax)}</div>
          </div>
        </div>

        {/* Bottom */}
        <div className="grid grid-cols-4 gap-2 mt-1">
          <div>
            <div className="text-content/60">Margin</div>
            <div className="font-medium text-xs">{getGpm()}</div>
          </div>
          <div>
            <div className="text-content/60">COGS</div>
            <div className="font-medium text-xs">{cogs}</div>
          </div>
          <div>
            <div className="text-content/60">Upcs</div>
            <div className="font-medium text-xs">{items}</div>
          </div>
          <div>
            <div className="text-content/60">Vendors</div>
            <div className="font-medium text-xs">{vendors}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyCard;
