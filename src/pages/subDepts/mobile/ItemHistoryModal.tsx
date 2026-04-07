import Modal from "../../../components/Modal";
import { useState, useEffect } from "react";
import { setItemHistoryModalOpen } from "../../../features/subMarginSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { useSubMarginCtx } from "../hooks";

const ItemHistoryModal = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const { upcCode } = useAppSelector((state) => state.itemScan);

  const [desc, setDesc] = useState<string>("");
  const [store, setStore] = useState<string>("");
  const [storeNum, setStoreNum] = useState<string>("");
  const [cat, setCat] = useState<string>("");

  const handleClose = () => {
    dispatch(setItemHistoryModalOpen(false));
  };

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  useEffect(() => {
    if (ctx.scannedItemHistory.length) {
      setDesc(ctx.scannedItemHistory[0].product_description);
      setStore(ctx.scannedItemHistory[0].store_name);
      setStoreNum(ctx.scannedItemHistory[0].store_number);
      setCat(ctx.scannedItemHistory[0].category_description);
    }
  }, [ctx.scannedItemHistory]);

  if (!ctx.scannedItemHistory.length) return null;

  return (
    <Modal
      isOpen={ctx.itemHistoryModalOpen}
      onClose={handleClose}
      className="-ml-12 px-2 text-sm"
    >
      <div className="flex justify-between font-medium">
        <div>{store}</div>
        <div>Store: {storeNum}</div>
      </div>
      <div className="font-medium mb-4">
        <div>{upcCode}</div>
        <div>{desc}</div>
        <div>{cat}</div>
      </div>
      <div className="space-y-2 max-h-[78vh] overflow-y-auto">
        {ctx.scannedItemHistory.map((h, i) => (
          <div key={i} className="bg-custom-white rounded-lg shadow-md">
            <div className="font-medium text-custom-white bg-blue-500 rounded-t-lg py-0.5 px-2">
              {formatDate(h.sale_date)}
            </div>
            <div className="grid grid-cols-5 gap-y-2 text-[13.5px] p-2">
              {/* <div className="col-span-5">
                <div className="text-content/60">Category</div>
                <div className="font-medium">{h.category_description}</div>
              </div> */}
              <div>
                <div className="text-content/60">Price</div>
                <div className="font-medium">{formatCurrency2(h.price)}</div>
              </div>
              <div>
                <div className="text-content/60">Sales</div>
                <div className="font-medium">
                  {formatCurrency2(h.total_sales)}
                </div>
              </div>
              <div>
                <div className="text-content/60">Qty</div>
                <div className="font-medium">{formatBigNumber(h.qty, 0)}</div>
              </div>
              <div>
                <div className="text-content/60">C Cost</div>
                <div className="font-medium">{formatCurrency2(h.casecost)}</div>
              </div>
              <div>
                <div className="text-content/60">E Cost</div>
                <div className="font-medium">
                  {formatCurrency2(h.extended_cost)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div>
        <button
          className="btn-themeOrange px-0 w-full mt-4"
          onClick={handleClose}
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default ItemHistoryModal;
