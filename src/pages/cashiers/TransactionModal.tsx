import { useAppSelector, useAppDispatch } from "../../hooks";
import Modal from "../../components/Modal";
import type { TransDrillDown } from "../../interfaces";
import { formatCurrency2 } from "../../utils";
import { setTransModalOpen } from "../../features/cashierSlice";
import Print from "../../svgs/Print";

const TransactionModal = () => {
  const dispatch = useAppDispatch();
  const { cashierTransDrillDown, transModalOpen } = useAppSelector(
    (state) => state.cashier
  );

  const splitDate = (dateStr: string) => {
    return dateStr.split("T")[0] + " " + dateStr.split("T")[1];
  };

  const formatTime = (start: string, end: string) => {
    const str1 =
      start.slice(0, 2) + ":" + start.slice(2, 4) + ":" + start.slice(4);
    const str2 = end.slice(0, 2) + ":" + end.slice(2, 4) + ":" + end.slice(4);
    return str1 + " - " + str2;
  };

  const renderStamps = (item: TransDrillDown) => {
    const stamps = [];
    if (item.fs > 0) stamps.push("FS");
    if (item.fsa > 0) stamps.push("FSA");
    if (item.wic > 0) stamps.push("WIC");
    return stamps.join(" ");
  };

  const extractSaleId = (saleId: string) => {
    return saleId.split("-")[1];
  };

  const handleClick = () => {
    console.log("clicked");
  };

  return (
    <Modal
      isOpen={transModalOpen}
      modalClassName="bg-custom-white w-1/3 relative"
      onClose={() => dispatch(setTransModalOpen(false))}
    >
      <Print
        className="absolute right-6 top-6 hover:stroke-blue-500 transition-all duration-200"
        size={25}
        onClick={handleClick}
      />
      {cashierTransDrillDown.length === 0 ? (
        <div>No Data</div>
      ) : (
        <div className="border border-blue-500 p-2 rounded-lg">
          <div className="pb-2 border-b border-content">
            <div className="flex gap-1">
              <div className="font-medium">Store Name:</div>
              <div>{cashierTransDrillDown[0].store_name}</div>
            </div>
            <div className="flex gap-1">
              <div className="font-medium">Sale ID:</div>
              <div>{extractSaleId(cashierTransDrillDown[0].sale_id)}</div>
            </div>
            <div className="flex gap-1">
              <div className="font-medium">Date:</div>
              <div>{splitDate(cashierTransDrillDown[0].sale_date)}</div>
            </div>
            <div className="flex gap-1">
              <div className="font-medium">Cashier:</div>
              <div>
                {cashierTransDrillDown[0].cashier_number}:
                {cashierTransDrillDown[0].cashier_name}
              </div>
            </div>
            <div className="flex gap-1">
              <div className="font-medium">Time:</div>
              <div>
                {formatTime(
                  cashierTransDrillDown[0].sale_start_time,
                  cashierTransDrillDown[0].sale_end_time
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <div className="font-medium">Terminal:</div>
              <div>{cashierTransDrillDown[0].terminal}</div>
            </div>
          </div>
          <div>
            <div className="my-2 text-lg font-medium">Line Items</div>
            {/* Line Items */}
            {cashierTransDrillDown.map((item, i) => {
              return (
                <div
                  key={i}
                  className="grid grid-cols-[18%_40%_5%_10%_12%_1fr] gap-1 text-[13px] mt-1.5"
                >
                  <div>{item.product_code}</div>
                  <div>{item.product_description}</div>
                  <div>0</div>
                  <div>{item.net_sales}</div>
                  <div>{renderStamps(item)}</div>
                  <div>{item.sale_type}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-2">
            <div className="flex gap-1">
              <div>Net Sales:</div>
              <div>
                {formatCurrency2(
                  cashierTransDrillDown[cashierTransDrillDown.length - 1]
                    .net_sales
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <div>Total Sales:</div>
              <div>
                {formatCurrency2(
                  cashierTransDrillDown[cashierTransDrillDown.length - 1]
                    .total_sales
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TransactionModal;
