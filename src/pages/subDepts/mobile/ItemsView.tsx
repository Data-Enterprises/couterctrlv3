import { useSubMarginCtx } from "../hooks";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useEffect } from "react";
import {
  setFetchingItemHistory,
  setItemDataFilteredMobile,
  setScannedItemHistory,
  setScannedItemMobile,
  setUpcSearch,
} from "../../../features/subMarginSlice";
import type { JsonError } from "../../../interfaces";
import { getItemLookupSingleStore } from "../../../api/itemLookup";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setError, setUpcCode } from "../../../features/itemScanSlice";
import { reduceItemData } from ".";

import ItemCard from "./ItemCard";
import UpcScanner from "../../../components/scanner/UpcScanner";
import ItemCardSingle from "./ItemCardSingle";
import ItemHistoryStatic from "./ItemHistoryStatic";
import type { BarData } from "../display/widgets";
import DayTotalsHeader from "./DayTotalsHeader";
import TotalsHeader from "./TotalsHeader";
import { WarningIcon } from "../../../components/toasts/Icons";

interface ItemsViewProps {
  barData: BarData[];
}

const ItemsView = ({ barData }: ItemsViewProps) => {
  const toast = useToast();
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const scan = useAppSelector((state) => state.itemScan);

  const handleScanItem = (upc: string) => {
    dispatch(setScannedItemHistory([]));
    dispatch(setFetchingItemHistory(true));

    // Setting the upc search string here for SDM so when you press Close on ItemHistoryStatic, 
    // it will set scan.upcCode to this code to maintain the filtered item list.
    // The clear function here will reset the same value along side scan.upcCode to reset the item list when you press Clear.
    dispatch(setUpcSearch(upc));
    
    getItemLookupSingleStore(ctx.url, ctx.token, upc, ctx.searchValue)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setScannedItemHistory(j.history));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setFetchingItemHistory(false)));
  };

  const scanItem = (upc: string) => {
    handleScanItem(upc);
  };

  const resetFilteredItems = () => {
    const dateComp = ctx.selectedWeekDay
      ? new Date(ctx.selectedWeekDay).toISOString().split("T")[0]
      : "";

    const filtered = ctx.margins.filter((margin) => {
      const matchesDate = dateComp
        ? margin.sale_date.split("T")[0] === dateComp
        : true;
      return matchesDate;
    });

    const reduced = reduceItemData(filtered);
    const newData = reduced.map((item) => ({
      ...item,
      margin: ((item.total_sales - item.cogs) / item.total_sales) * 100 || 0,
    }));

    dispatch(setItemDataFilteredMobile(newData));
  };

  const clear = () => {
    resetFilteredItems();
    dispatch(setScannedItemMobile(null));
    dispatch(setScannedItemHistory([]));
    dispatch(setUpcCode(""));
    dispatch(setUpcSearch(""));
    dispatch(setError(""));
  };

  // Testing to see if this is necessary => works
  const filterItemsByUpc = (upc: string) => {
    const filtered = ctx.itemDataMobile.filter((item) =>
      item.product_code.includes(upc),
    );
    dispatch(setItemDataFilteredMobile(filtered));
  };

  useEffect(() => {
    if (ctx.subDeptGridView === "item") {
      resetFilteredItems();
    }
  }, [ctx.selectedWeekDay]);

  const subDept = ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId);

  const handleUpcSearchText = (value: string) => {
    dispatch(setUpcSearch(value));
  };

  return (
    <div className="text-[13.5px]">
      {/* put the day's or the full date range totals here */}
      <div className="px-2">
        {ctx.selectedWeekDay.length ? (
          <DayTotalsHeader
            barData={barData.filter((bd) => bd.date === ctx.selectedWeekDay)[0]}
          />
        ) : (
          <TotalsHeader barData={barData} />
        )}
      </div>
      <UpcScanner
        containerClassName="px-2"
        handleScan={scanItem}
        onClear={clear}
        isFiltering={true}
        handleFilter={filterItemsByUpc}
        totalItems={ctx.filteredItemDataMobile.length}
        setUpcSearch={handleUpcSearchText}
      />
      {!ctx.scannedItemMobile ? (
        <div>
          {ctx.filteredItemDataMobile.length ? (
            <div className="grid m-2 max-h-[calc(100vh-17rem)] rounded-lg shadow-md overflow-y-auto">
              {ctx.filteredItemDataMobile.map((item, i) => (
                <ItemCard key={i} item={item} handleClick={handleScanItem} />
              ))}
            </div>
          ) : (
            <div className="w-full mt-4 flex flex-col items-center justify-center text-content/60 font-medium">
              <div className="text-center p-2 rounded-lg shadow-lg bg-custom-white flex flex-col items-center gap-1">
                <WarningIcon height={60} width={60} fill="rgb(249 115 22)" />
                <div className="text-orange-500">
                  No items found with UPC containing
                </div>
                <div>"{scan.upcCode}"</div>
                <div>Sub Dept: {subDept!.desc}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="m-2 rounded-lg">
          <ItemCardSingle item={ctx.scannedItemMobile} />
          <div className="grid grid-cols-2 h-0.5">
            <div className="bg-gradient-to-r from-blue-200 to-custom-white"></div>
            <div className="bg-gradient-to-l from-blue-200 to-custom-white"></div>
          </div>
          <ItemHistoryStatic />
        </div>
      )}
    </div>
  );
};

export default ItemsView;
