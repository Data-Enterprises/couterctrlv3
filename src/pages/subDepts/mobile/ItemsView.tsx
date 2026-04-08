import { useSubMarginCtx } from "../hooks";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useEffect, useState } from "react";
import {
  setFetchingItemHistory,
  setItemDataFilteredMobile,
  setItemHistoryModalOpen,
  setScannedItemHistory,
} from "../../../features/subMarginSlice";
import type { JsonError } from "../../../interfaces";
import { getItemLookupSingleStore } from "../../../api/itemLookup";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setError, setUpcCode } from "../../../features/itemScanSlice";
import { reduceItemData } from ".";

import MarginCard from "./MarginCard";
import UpcScanner from "../../../components/scanner/UpcScanner";

interface ItemsViewProps {
  startDate: string;
  endDate: string;
}

const ItemsView = ({ startDate, endDate }: ItemsViewProps) => {
  const toast = useToast();
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const scan = useAppSelector((state) => state.itemScan);
  const [refreshFiltered, setRefreshFiltered] = useState<boolean>(true);

  const handleScanItem = (upc: string) => {
    dispatch(setScannedItemHistory([]));
    dispatch(setFetchingItemHistory(true));
    dispatch(setItemHistoryModalOpen(true));
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

  const clear = () => {
    dispatch(setUpcCode(""));
    dispatch(setError(""));
  };

  useEffect(() => {
    if (ctx.subDeptGridView === "item" && refreshFiltered) {
      const dateComp = ctx.selectedWeekDay
        ? new Date(ctx.selectedWeekDay).toISOString().split("T")[0]
        : "";

      const filtered = ctx.margins.filter((margin) => {
        return dateComp ? margin.sale_date.split("T")[0] === dateComp : true;
      });

      const reduced = reduceItemData(filtered);
      const newData = reduced.map((item) => ({
        ...item,
        margin: ((item.total_sales - item.cogs) / item.total_sales) * 100 || 0,
      }));

      dispatch(setItemDataFilteredMobile(newData));
      setRefreshFiltered(false);
    }
  }, [ctx.selectedWeekDay, refreshFiltered]);

  const dateRange = ctx.selectedWeekDay
    ? ctx.selectedWeekDay
    : `${startDate} - ${endDate}`;

  return (
    <div className="text-[13.5px]">
      <div className="px-2 flex justify-between font-medium">
        <div>{dateRange}</div>
        <div>{ctx.filteredItemDataMobile.length} Items</div>
      </div>
      <UpcScanner
        containerClassName="px-2"
        handleScan={scanItem}
        onClear={clear}
      />
      <div className="grid m-2 max-h-[calc(100vh-13rem)] rounded-lg shadow-md overflow-y-auto">
        {ctx.filteredItemDataMobile.map((item, i) => (
          <MarginCard key={i} item={item} handleClick={handleScanItem} />
        ))}
      </div>
    </div>
  );
};

export default ItemsView;
