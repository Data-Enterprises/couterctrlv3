import { useAppSelector } from "../../hooks";
import { useDispatch } from "react-redux";
import { setMode } from "../../features/itemLookupSlice";
import { formatCurrency2 } from "../../utils";

const ItemLookupHeader = () => {
  const {
    productCode,
    description,
    mode,
    totalStores,
    totalSales,
    totalQty,
    avgPrice,
    selectedStore,
    daysSold,
    itemLookupHistory,
  } = useAppSelector((state) => state.item);
  const dispatch = useDispatch();

  const findAverage = () => {
    if (itemLookupHistory.length === 0) return 0;
    const avg = itemLookupHistory.reduce((acc, item) => {
      if (item.price === avgPrice) {
        acc += 1;
      }
      return acc;
    }, 0);
    return avg;
  };

  return (
    <div className="mb-2 no-phone-select">
      <div className="text-sm">
        <div className="text-sm flex justify-between">
          <div className="no-phone-select font-medium">{productCode}</div>
          <div className="font-medium">{description}</div>
        </div>
        <div className="text-sm flex justify-between">
          <div className="flex gap-1">
            Total Sales:{" "}
            <div className="font-medium">{formatCurrency2(totalSales)}</div>
          </div>
          <div className="flex gap-1">
            Total Qty: <div className="font-medium">{totalQty}</div>
          </div>
        </div>
        <div className="text-sm mb-2 flex justify-between">
          <div className="flex gap-1">
            Price & Cnt:{" "}
            <div className="font-medium">{formatCurrency2(avgPrice)} - {findAverage()}</div>
          </div>
          {!selectedStore ? (
            <div className="flex gap-1">
              Total Stores: <div className="font-medium">{totalStores}</div>
            </div>
          ) : (
            <div className="flex gap-1">
              Days Sold: <div className="font-medium">{daysSold}</div>
            </div>
          )}
        </div>
      </div>
      <div className={`${selectedStore ? "hidden" : "grid grid-cols-3 gap-2"}`}>
        <button
          data-testid="lookup-header-sales"
          className={`${mode === "Sales" ? "btn-themeGreen" : "btn-themeBlue"} px-4`}
          onClick={() => dispatch(setMode("Sales"))}
        >
          Sales
        </button>
        <button
          data-testid="lookup-header-qty"
          className={`${mode === "Qty" ? "btn-themeGreen" : "btn-themeBlue"} px-4`}
          onClick={() => dispatch(setMode("Qty"))}
        >
          Qty
        </button>
        <button
          data-testid="lookup-header-price"
          className={`${mode === "Price" ? "btn-themeGreen" : "btn-themeBlue"} px-4`}
          onClick={() => dispatch(setMode("Price"))}
        >
          Price
        </button>
      </div>
    </div>
  );
};

export default ItemLookupHeader;
