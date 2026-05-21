import { useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

const ItemDailyTablet = () => {
  const { itemLookupHistory, itemsLoaded, selectedStore } = useAppSelector(
    (state) => state.item,
  );
  const { assignedStores } = useAppSelector((state) => state.user);
  const { startDate, endDate } = useAppSelector((state) => state.search);

  if (!itemsLoaded) {
    return (
      <div className="bg-custom-white h-[130.2px] flex justify-center items-center text-content/60 font-medium rounded-lg shadow-md text-sm mt-2">
        <div>Please search for an item to view its daily data</div>
      </div>
    );
  }

  const totalSales = itemLookupHistory.reduce(
    (acc, curr) => acc + curr.total_sales,
    0,
  );
  const totalQty = itemLookupHistory.reduce((acc, curr) => acc + curr.qty, 0);
  const totalExtCost = itemLookupHistory.reduce(
    (acc, curr) => acc + curr.extended_cost,
    0,
  );

  const upc = itemLookupHistory[0]?.product_code || "";
  const cat = itemLookupHistory[0]?.category_description || "";
  const storeName =
    assignedStores.find((s) => s.storeid === selectedStore)?.store_name || "";
  const desc = itemLookupHistory[0]?.product_description || "";

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

return (
  <div className="text-[13px] md:text-sm">
    {/* Top summary */}
    <div className="bg-custom-white p-3 md:p-4 rounded-xl shadow-lg">
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between font-medium">
        <div>
          {startDate} - {endDate}
        </div>
        <div className="md:text-right">{storeName}</div>
      </div>

      <div className="mt-1 grid grid-cols-1 gap-x-3 gap-y-0.5 font-medium text-[13px] leading-tight">
        <div className="flex gap-1">
          <span>UPC:</span>
          <span className="break-all">{upc}</span>
        </div>
        <div className="flex gap-1">
          <span>Desc:</span>
          <span className="break-words">{desc}</span>
        </div>
        <div className="flex gap-1">
          <span>Category:</span>
          <span className="break-words">{cat}</span>
        </div>
      </div>

      <div className="mt-3 w-full md:w-[75%]">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-2">
          <div className="leading-tight p-2 rounded-xl bg-bkg/75">
            <div className="text-content/60 font-medium">Total Sales:</div>
            <div>{formatCurrency2(totalSales)}</div>
          </div>
          <div className="leading-tight p-2 rounded-xl bg-bkg/75">
            <div className="text-content/60 font-medium">Total Qty:</div>
            <div>{formatBigNumber(totalQty, 0)}</div>
          </div>
          <div className="leading-tight p-2 rounded-xl bg-bkg/75">
            <div className="text-content/60 font-medium">Ext Cost:</div>
            <div>{formatCurrency2(totalExtCost)}</div>
          </div>
        </div>
      </div>
    </div>

    {/* History list */}
    <div className="rounded-b-lg shadow-md max-h-[calc(100vh-18rem)] overflow-y-auto mt-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12.5px]">
        {itemLookupHistory.map((item, i) => (
          <div
            key={i}
            className="bg-custom-white rounded-lg border border-content/10 shadow-sm p-2"
          >
            <div className="font-medium mb-2 text-[13px]">{formatDate(item.sale_date)}</div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="leading-tight p-2 rounded-xl bg-bkg/75">
                <div className="text-content/60 font-medium">Sales:</div>
                <div>{formatCurrency2(item.total_sales)}</div>
              </div>
              <div className="leading-tight p-2 rounded-xl bg-bkg/75">
                <div className="text-content/60 font-medium">Qty:</div>
                <div>{formatBigNumber(item.qty, 0)}</div>
              </div>
              <div className="leading-tight p-2 rounded-xl bg-bkg/75">
                <div className="text-content/60 font-medium">Price:</div>
                <div>{formatCurrency2(item.price)}</div>
              </div>
              <div className="leading-tight p-2 rounded-xl bg-bkg/75">
                <div className="text-content/60 font-medium">C Cost:</div>
                <div>{formatCurrency2(item.casecost)}</div>
              </div>
              <div className="leading-tight p-2 rounded-xl bg-bkg/75">
                <div className="text-content/60 font-medium">Ext Cost:</div>
                <div>{formatCurrency2(item.extended_cost)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
};

export default ItemDailyTablet;
