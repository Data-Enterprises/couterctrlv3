import { useSubMarginCtx } from "../hooks";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useEffect, useState } from "react";
import {
  setFetchingItemHistory,
  setFilteredCostGridData,
  setFilteredItemGridData,
  setItemGridData,
  setItemHistoryModalOpen,
  setScannedItemHistory,
  setSubDeptCost,
  setSubDeptGridView,
} from "../../../features/subMarginSlice";
import type { JsonError, SubDeptCost } from "../../../interfaces";
import { getItemLookupSingleStore } from "../../../api/itemLookup";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setError, setUpcCode } from "../../../features/itemScanSlice";
import { reduceCostData, reduceItemData } from ".";

import MarginCard from "./MarginCard";
import CostCard from "./CostCard";
import ItemHistoryModal from "./ItemHistoryModal";
import UpcScanner from "../../../components/scanner/UpcScanner";

const ItemsView = () => {
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

      dispatch(setItemGridData(newData));
      dispatch(setFilteredItemGridData(newData));
      setRefreshFiltered(false);
    } else if (ctx.subDeptGridView === "cost" && refreshFiltered) {
      // cost view
      const costData: SubDeptCost[] = reduceCostData(ctx.margins);

      dispatch(setSubDeptCost(costData));
      dispatch(setFilteredCostGridData(costData));
      setRefreshFiltered(false);
    }
  }, [ctx.selectedWeekDay, ctx.subDeptGridView, refreshFiltered]);

  const handleViewToggle = (option: "item" | "cost") => {
    dispatch(setSubDeptGridView(option));
    setRefreshFiltered(true);
  };

  return (
    <div>
      <ItemHistoryModal />
      <div className="grid grid-cols-2 gap-2 px-2">
        <button
          className={`${ctx.subDeptGridView === "item" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleViewToggle("item")}
        >
          Unique Items
        </button>
        <button
          className={`${ctx.subDeptGridView === "cost" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleViewToggle("cost")}
        >
          Item Cost
        </button>
      </div>
      <UpcScanner
        containerClassName="px-2"
        handleScan={scanItem}
        onClear={clear}
      />
      {ctx.subDeptGridView === "item" ? (
        <div className="grid gap-2 p-2 max-h-[calc(100vh-14.4rem)] overflow-y-auto">
          {ctx.filteredItemGridData.map((item, i) => (
            <MarginCard key={i} item={item} handleClick={handleScanItem} />
          ))}
        </div>
      ) : (
        <div className="grid gap-2 p-2 max-h-[calc(100vh-14.4rem)] overflow-y-auto">
          {ctx.filteredCostGridData.map((cost, i) => (
            <CostCard key={i} cost={cost} handleClick={handleScanItem} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ItemsView;
