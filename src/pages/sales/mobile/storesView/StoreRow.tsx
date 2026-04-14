import type { WeeklySale } from "../../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../../utils";
interface StoreRowProps {
  panel: WeeklySale;
}

const StoreRow = ({ panel }: StoreRowProps) => {
  const dow = new Date(panel.sale_date).toLocaleDateString("en-US", {
    weekday: "short",
  });

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };
  const dateStr = `${dow}, ${formatDate(panel.sale_date)}`;

  const formatWeight = (weight: number) => {
    const formatted = new Intl.NumberFormat("en-us", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(weight);

    return formatted;
  };

  return (
    <div className="odd:bg-custom-white even:bg-blue-200/50 px-2 py-0.5">
      <div className="font-medium">{dateStr}</div>
      <div className="grid grid-cols-4">
        <div>
          <div className="text-content/60">Sales</div>
          <div className="font-medium">{formatCurrency2(panel.total_sales - panel.total_tax)}</div>
        </div>
        <div>
          <div className="text-content/60">Tax</div>
          <div className="font-medium">{formatCurrency2(panel.total_tax)}</div>
        </div>

        <div>
          <div className="text-content/60">Qty</div>
          <div className="font-medium">{formatBigNumber(panel.qty, 0)}</div>
        </div>

        <div>
          <div className="text-content/60">Weight</div>
          <div className="font-medium">{formatWeight(panel.weight)}</div>
        </div>
      </div>
    </div>
  );
};

export default StoreRow;
