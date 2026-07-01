import { useEffect } from "react";
import { useSubMarginCtx } from "../hooks";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import {
  type MobileSort,
  type SortOption,
} from "../../../features/subMarginSlice";
import { useSubMarginActions } from "../hooks/useSubMarginActions";
import { setError, setUpcCode } from "../../../features/itemScanSlice";

import type { JsonError } from "../../../interfaces";
import type { BarData, ItemRowMobile } from "../display/widgets";

import { getItemLookupSingleStore } from "../../../api/itemLookup";
import { reduceItemData } from ".";

import ItemCard from "./ItemCard";
import UpcScanner from "../../../components/scanner/UpcScanner";
import ItemCardSingle from "./ItemCardSingle";
import ItemHistoryStatic from "./ItemHistoryStatic";
import DayTotalsHeader from "./DayTotalsHeader";
import TotalsHeader from "./TotalsHeader";
import { WarningIcon } from "../../../components/toasts/Icons";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";

interface ItemsViewProps {
  barData: BarData[];
}

type Option = { label: string; value: SortOption };
const sortOptions: Option[] = [
  { label: "Sales", value: "total_sales" },
  { label: "COGS", value: "cogs" },
  { label: "GPM", value: "margin" },
  { label: "Qty", value: "qty" },
  { label: "Reset", value: "reset" },
];

const ItemsView = ({ barData }: ItemsViewProps) => {
  const toast = useToast();
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const scan = useAppSelector((state) => state.itemScan);

  const handleScanItem = (upc: string) => {
    dispatch(actions.setScannedItemHistory([]));
    dispatch(actions.setFetchingItemHistory(true));

    // Setting the upc search string here for SDM so when you press Close on ItemHistoryStatic,
    // it will set scan.upcCode to this code to maintain the filtered item list.
    // The clear function here will reset the same value along side scan.upcCode to reset the item list when you press Clear.
    dispatch(actions.setUpcSearch(upc));

    getItemLookupSingleStore(ctx.url, ctx.token, upc, ctx.searchValue)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(actions.setScannedItemHistory(j.history));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(actions.setFetchingItemHistory(false)));
  };

  const scanItem = (upc: string) => {
    handleScanItem(upc);
  };

  const resetFilteredItems = (isResetting: boolean = true) => {
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

    // sorting logic here
    if (!isResetting) {
      // sort here
      return;
    }

    dispatch(actions.setItemDataFilteredMobile(newData));
  };

  const clear = () => {
    resetFilteredItems();
    dispatch(actions.setScannedItemMobile(null));
    dispatch(actions.setScannedItemHistory([]));
    dispatch(setUpcCode(""));
    dispatch(actions.setUpcSearch(""));
    dispatch(setError(""));
  };

  // Testing to see if this is necessary => works
  const filterItemsByUpc = (upc: string) => {
    const dateComp = ctx.selectedWeekDay
      ? new Date(ctx.selectedWeekDay).toISOString().split("T")[0]
      : "";

    const filtered = ctx.margins.filter((margin) => {
      const matchesDate = dateComp
        ? margin.sale_date.split("T")[0] === dateComp
        : true;
      const matchesUpc = margin.product_code.includes(upc);
      return matchesDate && matchesUpc;
    });

    const reduced = reduceItemData(filtered);
    const newData = reduced.map((item) => ({
      ...item,
      margin: ((item.total_sales - item.cogs) / item.total_sales) * 100 || 0,
    }));

    dispatch(actions.setItemDataFilteredMobile(newData));
  };

  useEffect(() => {
    if (ctx.subDeptGridView === "item") {
      resetFilteredItems();
      dispatch(actions.resetMobileSort());
    }
  }, [ctx.selectedWeekDay]);

  const setSort = (option: SortOption) => {
    if (option === "reset") {
      dispatch(actions.resetMobileSort());
      resetFilteredItems();
      return;
    }

    dispatch(actions.setMobileSort({ option }));
  };

  const subDept = ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId);

  const handleUpcSearchText = (value: string) => {
    dispatch(setUpcSearch(value));
  };

  const activeSortStyle = (option: SortOption) => {
    return ctx.mSort[option].length > 0 ? "bg-orange-200 font-medium" : "bg-custom-white";
  };

  const renderIcon = (option: SortOption) => {
    if (ctx.mSort[option] === "asc") {
      return <ArrowUpIcon className="w-[13px] h-[13px] stroke-current" />;
    } else if (ctx.mSort[option] === "desc") {
      return <ArrowDownIcon className="w-[13px] h-[13px] stroke-current" />;
    }
    return null;
  };

  const itemListDisplay = () => {
    // light copy to avoid mutating state in sort function
    const result = [...ctx.filteredItemDataMobile];

    // Grabbing the individual options and their sort directions
    const props = Object.entries(ctx.mSort);
    const sortBy = props.filter((sort) => sort[1].length > 0)[0];

    // if the sortBy found is not an empty array, we are sorting
    if (sortBy) {
      const sortKey = sortBy[0] as keyof ItemRowMobile; // total_sales, cogs, margin, or qty
      const sortDirection = sortBy[1] as MobileSort; // determines the control flow in the sort method below for asc or desc
      return result.sort((a, b) => {
        if (sortDirection === "asc") {
          return a[sortKey] > b[sortKey] ? 1 : -1;
        } else {
          return a[sortKey] < b[sortKey] ? 1 : -1;
        }
      });
    }

    // Returns by default initially and when the sorting options are reset or toggled off
    return result;
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
          <div className="px-2 pt-2 grid grid-cols-5 gap-2">
            {sortOptions.map((option, i) => (
              <div
                key={i}
                className={`rounded-full py-0.5 text-center text-[12px] flex items-center justify-center ${activeSortStyle(option.value)}`}
                onClick={() => setSort(option.value as SortOption)}
              >
                <div>{option.label}</div>
                <div className="ml-1">{renderIcon(option.value)}</div>
              </div>
            ))}
          </div>
          {ctx.filteredItemDataMobile.length ? (
            <div className="grid m-2 max-h-[calc(100vh-19rem)] rounded-lg shadow-md overflow-y-auto">
              {itemListDisplay().map((item, i) => (
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
