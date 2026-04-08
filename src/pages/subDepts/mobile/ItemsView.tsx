import { useSubMarginCtx } from "../hooks";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useEffect } from "react";
import {
  setFetchingItemHistory,
  setItemDataFilteredMobile,
  setScannedItemHistory,
  setScannedItemMobile,
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
    // dispatch(setItemHistoryModalOpen(true));
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

  const scanItem = () => {
    handleScanItem(scan.upcCode);
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
    dispatch(setError(""));
  };

  // Testing to see if this is necessary => works
  const filterItemsByUpc = () => {
    const filtered = ctx.itemDataMobile.filter((item) =>
      item.product_code.includes(scan.upcCode),
    );
    dispatch(setItemDataFilteredMobile(filtered));
  };

  useEffect(() => {
    if (ctx.subDeptGridView === "item") {
      resetFilteredItems();
    }
  }, [ctx.selectedWeekDay]);

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
      />
      {!ctx.scannedItemMobile ? (
        <div className="grid m-2 max-h-[calc(100vh-17rem)] rounded-lg shadow-md overflow-y-auto">
          {ctx.filteredItemDataMobile.map((item, i) => (
            <ItemCard key={i} item={item} handleClick={handleScanItem} />
          ))}
        </div>
      ) : (
        <div className="m-2 max-h-[calc(100vh-17rem)] overflow-y-auto rounded-lg">
          <ItemCardSingle item={ctx.scannedItemMobile} />
          <ItemHistoryStatic />
        </div>
      )}
    </div>
  );
};

export default ItemsView;
