import { formatDate } from ".";
import type {
  CouponItem,
  JsonError,
  TransactionListItem,
} from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import { useAppDispatch } from "../../../hooks";
import { useCouponContext } from "..";
import { getCashierTransaction } from "../../../api/lossPrevention";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setTransactionDrillDown,
  setTransModalOpen,
  // setTransModalOpen,
} from "../../../features/lossPreventionSlice";

interface CpnCardProps {
  c: CouponItem;
}

const CpnCard = ({ c }: CpnCardProps) => {
  const dispatch = useAppDispatch();
  const context = useCouponContext();
  const toast = useToast();
  const handleCardClick = () => {
    const saleId = c.sale_id;
    const saleDate = c.sale_date.split("T")[0];
    const storeid = c.storeid;

    const term = c.terminal;
    const splitDate = saleDate.split("-");
    const joinedSaleId = `${storeid}-${saleId}-${term}-${parseInt(splitDate[1])}-${parseInt(splitDate[2])}-${splitDate[0]}`;

    dispatch(setTransactionDrillDown([]));
    dispatch(setTransModalOpen(true));
    getCashierTransaction(
      context.url,
      context.token,
      saleDate,
      joinedSaleId,
      storeid,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions: TransactionListItem[] = [...j.transaction].map(
            (item) => ({
              ...item,
              transaction_id: item.sale_id.split("-")[1],
              qty: item.qty ? item.qty : 0,
            }),
          );
          const reducedTransactions: TransactionListItem[] =
            transactions.reduce((acc: TransactionListItem[], curr) => {
              const found = acc.find(
                (item) =>
                  item.storeid === curr.storeid &&
                  item.sale_type === curr.sale_type &&
                  item.product_code === curr.product_code &&
                  item.product_description === curr.product_description,
              );
              if (found) {
                found.qty! += curr.qty!;
                found.total_sales += curr.total_sales;
                found.net_sales += curr.net_sales;
              } else {
                acc.push({ ...curr, qty: curr.qty });
              }
              return acc;
            }, []);
          dispatch(setTransactionDrillDown([reducedTransactions]));
        }
      })
      .catch((err: JsonError) => {
        dispatch(setTransModalOpen(false));
        toast.error("Error fetching transactions: " + err.message);
      });
  };

  return (
    <div
      className="bg-custom-white rounded-lg shadow-md p-2"
      onClick={() => handleCardClick()}
    >
      <div className="flex justify-between">
        <div className="font-medium">{formatDate(c.sale_date)}</div>
        <div className="flex gap-1">
          <div className="text-content/60">Cashier:</div>
          <div className="font-medium">{c.cashier_name}</div>
        </div>
      </div>
      <div className="text-content/60">
        <div>{c.product_code}</div>
        <div>{c.product_description}</div>
      </div>
      <div className="grid grid-cols-3 text-[13.5px]">
        <div className="flex gap-1">
          <div className="text-content/60">Type:</div>
          <div className="font-medium">{c.coupon_type}</div>
        </div>
        <div className="flex gap-1">
          <div className="text-content/60">Dept:</div>
          <div className="font-medium">{c.sub_department_description}</div>
        </div>
        <div className="flex gap-1">
          <div className="text-content/60">Amount:</div>
          <div className="font-medium">{formatCurrency2(c.coupon_amount)}</div>
        </div>
        <div className="flex gap-1">
          <div className="text-content/60">Trans #:</div>
          <div className="font-medium">{c.sale_id}</div>
        </div>
        <div className="flex gap-1 col-span-2">
          <div className="text-content/60">Cust ID:</div>
          <div className="font-medium">
            {c.customer_id.split(">")[0] || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CpnCard;
