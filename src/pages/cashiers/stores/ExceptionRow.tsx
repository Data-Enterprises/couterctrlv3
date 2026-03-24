import { useCashierCtx } from "..";
import { useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  getCashierTable,
  getTransactionList,
} from "../../../api/lossPrevention";
import type { ExceptionType, JsonError } from "../../../interfaces";
import {
  formatBigNumber,
  formatCurrency2,
  formatGoliathDate,
} from "../../../utils";
import { setDataView, setTransList } from "../../../features/cashiersSlice";

interface ExceptionInnerCardProps {
  type: ExceptionType;
  col2: number;
  col3: number;
  col4: number;
  col5: number;
  bgColor?: string;
  storeid: number;
  cashierNumber?: number;
}

const ExceptionRow = ({
  type,
  col2,
  col3,
  col4,
  col5,
  bgColor = "bg-custom-white",
  storeid,
  cashierNumber = 0,
}: ExceptionInnerCardProps) => {
  const ctx = useCashierCtx();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const handleTransactionCall = () => {
    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);
    getCashierTable(ctx.url, ctx.token, start, end, 0, storeid, 1, [type], 1)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const trans = [...j.transactions];
          const uniqueSaleIds = Array.from(
            new Set(trans.map((item) => item.sale_id)),
          );

          getTransactionList(ctx.url, ctx.token, uniqueSaleIds, 1, type)
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                const filtered = [...j.transactions].filter((trans) => {
                  return cashierNumber ? trans.cashier_number === cashierNumber : true;
                })
                dispatch(setTransList(filtered));
                dispatch(setDataView("transactions"));
              }
            })
            .catch((err: JsonError) => toast.error(err.message));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div
      className={`grid grid-cols-[26%_24%_18%_15%_19%] text-[12.5px] py-0.5 ${bgColor} hover:bg-orange-200 transtion-all duration-200`}
      onClick={handleTransactionCall}
    >
      <div className="font-medium text-content/60">{type}</div>
      <div className="font-medium">{formatCurrency2(col2)}</div>
      <div className="font-medium">{formatBigNumber(col3, 0)}</div>
      <div className="font-medium">{formatBigNumber(col4, 0)}</div>
      <div className="font-medium">{formatBigNumber(col5, 2)}%</div>
    </div>
  );
};

export default ExceptionRow;
