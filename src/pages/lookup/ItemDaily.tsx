import { useAppSelector } from "../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../utils";

const ItemDaily = () => {
  const { itemLookupHistory, itemsLoaded, selectedStore } = useAppSelector(
    (state) => state.item,
  );
  const { assignedStores } = useAppSelector((state) => state.user);
  const { startDate, endDate } = useAppSelector((state) => state.search);

  if (!itemsLoaded) {
    return (
      <div className="bg-custom-white h-[100px] flex justify-center items-center text-content/60 font-medium rounded-lg shadow-md text-[13px] md:text-sm md:mt-2">
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
    <div className="text-[13px]">
      {/* Totals, desc, upc, etc */}
      <div className="bg-custom-white p-2 rounded-t-lg shadow-md">
        <div className="flex gap-1 justify-between font-medium">
          <div>
            {startDate} - {endDate}
          </div>
          <div>{storeName}</div>
        </div>
        <div className="flex gap-1 font-medium">
          <div>UPC:</div>
          <div className="font-medium">{upc}</div>
        </div>
        <div className="flex gap-1 font-medium">
          <div>Desc:</div>
          <div className="font-medium">{desc}</div>
        </div>
        <div className="flex gap-1 font-medium">
          <div>Category:</div>
          <div className="font-medium">{cat}</div>
        </div>

        <div className="w-[75%] grid grid-cols-3 mt-2">
          <div className="font-medium col-span-3 text-[13.5px]">
            Totals Summary
          </div>
          <div>
            <div className="text-content/60 font-medium">Total Sales:</div>
            <div>{formatCurrency2(totalSales)}</div>
          </div>
          <div>
            <div className="text-content/60 font-medium">Total Qty:</div>
            <div>{formatBigNumber(totalQty, 0)}</div>
          </div>
          <div>
            <div className="text-content/60 font-medium">Ext Cost:</div>
            <div>{formatCurrency2(totalExtCost)}</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div className={`rounded-lg shadow-md max-h-[calc(100vh-18rem)] overflow-y-auto`}>
        {itemLookupHistory.map((item, i) => (
          <div
            key={i}
            className="odd:bg-custom-white even:bg-blue-200/50 last:rounded-b-lg px-2 py-0.5"
          >
            <div className="font-medium">{formatDate(item.sale_date)}</div>
            <div className="grid grid-cols-5">
              <div>
                <div className="text-content/60 font-medium">Sales:</div>
                <div>{formatCurrency2(item.total_sales)}</div>
              </div>
              <div>
                <div className="text-content/60 font-medium">Qty:</div>
                <div>{formatBigNumber(item.qty, 0)}</div>
              </div>
              <div>
                <div className="text-content/60 font-medium">Price:</div>
                <div>{formatCurrency2(item.price)}</div>
              </div>
              <div>
                <div className="text-content/60 font-medium">C Cost:</div>
                <div>{formatCurrency2(item.casecost)}</div>
              </div>
              <div>
                <div className="text-content/60 font-medium">Ext Cost:</div>
                <div>{formatCurrency2(item.extended_cost)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemDaily;
