import { useAppSelector } from "../../hooks";
import { formatCurrency2 } from "../../utils";

const UniqueCashiersTable = () => {
  const { cashiers } = useAppSelector((state) => state.cashier);

  return (
    <div className="bg-custom-white mt-4 px-4 py-2.5 rounded-lg shadow-lg">
      {cashiers.map((c, i) => (
        <div>
          <div className="flex justify-between font-medium mb-1" key={i}>
            <div>{c.cashier_name}</div>
            <div>{c.cashier_number}</div>
          </div>
          <div>Transactions: {c.transaction_count}</div>
          <div>Total Sales: {formatCurrency2(c.total_sales)}</div>
        </div>
      ))}
    </div>
  );
};

export default UniqueCashiersTable;
