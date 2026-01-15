import { useState, useEffect } from "react";
import type { ItemLookup } from "../../features/itemLookupSlice";
import { useAppSelector } from "../../hooks";
import { formatCurrency2 } from "../../utils";

const TopStoreLookup = () => {
  const { topStoreSales, topStoreQty, highestPriceStore, mode } =
    useAppSelector((state) => state.item);
  const [item, setItem] = useState<ItemLookup>(topStoreSales!);

  useEffect(() => {
    if (mode === "Sales") {
      setItem(topStoreSales!);
    } else if (mode === "Qty") {
      setItem(topStoreQty!);
    } else if (mode === "Price") {
      setItem(highestPriceStore!);
    }
  }, [mode, topStoreSales, topStoreQty, highestPriceStore]);

  return (
    <div className="text-sm mb-4">
      {/* Details */}
      <div className="bg-custom-white shadow-md rounded-lg mb-2">
        <div className="font-medium bg-blue-500 text-custom-white rounded-t-lg py-0.5 px-2 flex justify-between">
          <div>Highest {mode}</div>
          <div>
            {item.store_name} ({item.store_number})
          </div>
        </div>
        <div className="pl-2 lg:py-1.5 py-0.5 flex gap-2">
          <div className="font-medium">Category:</div>
          <div>{item.category_description}</div>
        </div>
      </div>
      {/* cost columns */}
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div className="bg-custom-white shadow-md rounded-lg">
          <div className="font-medium bg-blue-500 text-custom-white rounded-t-lg py-0.5 pl-2">
            Case cost:
          </div>
          <div className="pl-2 lg:py-1.5 py-1">
            ${item.casecost ? item.casecost.toFixed(2) : "N/A"}
          </div>
        </div>
        <div className="bg-custom-white shadow-md rounded-lg">
          <div className="font-medium bg-blue-500 text-custom-white rounded-t-lg py-0.5 pl-2">
            Extended cost:
          </div>
          <div className="pl-2 lg:py-1.5 py-1">
            ${item.extended_cost ? item.extended_cost.toFixed(2) : "N/A"}
          </div>
        </div>
      </div>

      {/* Totals qty/sales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-custom-white shadow-md rounded-lg">
          <div className="font-medium bg-blue-500 text-custom-white rounded-t-lg py-0.5 pl-2">
            Price:
          </div>
          <div className="pl-2 lg:py-1.5 py-1">{formatCurrency2(item.price)}</div>
        </div>
        <div className="bg-custom-white shadow-md rounded-lg">
          <div className="font-medium bg-blue-500 text-custom-white rounded-t-lg py-0.5 pl-2">
            Qty:
          </div>
          <div className="pl-2 lg:py-1.5 py-1">{item.qty}</div>
        </div>
        <div className="bg-custom-white shadow-md rounded-lg">
          <div className="font-medium bg-blue-500 text-custom-white rounded-t-lg py-0.5 pl-2">
            Sales:
          </div>
          <div className="pl-2 lg:py-1.5 py-1">{formatCurrency2(item.total_sales)}</div>
        </div>
      </div>
    </div>
  );
};

export default TopStoreLookup;
