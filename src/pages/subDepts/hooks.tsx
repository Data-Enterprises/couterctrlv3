import { useEffect, useState } from "react";
import { setDates } from ".";
import { useAppSelector } from "../../hooks";

export const useSubMarginCtx = () => {
  const { url, token, isMobile } = useAppSelector((state) => state.app);
  const { type, singleDate, lastGroup, lastStore } = useAppSelector(
    (state) => state.search,
  );
  const {
    selectedSubDeptId,
    subDepts,
    margins,
    weekOneMargins,
    weekTwoMargins,
    weekThreeMargins,
    weekFourMargins,
    filteredMargins,
    subDeptFitlerText,
    loadingMargins,
    loadingSubDepts,
    selectedWeek,
    searchValue,
    selectedWeekDay,
    subDeptGridView,
    subDeptCost,
    filteredCostGridData,
    filteredItemGridData,
    pause,
    scannedUpc,
    itemGridData,
    scannedItemHistory,
    itemHistoryModalOpen,
    fetchingItemHistory,
    itemDataMobile,
    filteredItemDataMobile,
    processMobileItemData,
    scannedItemMobile,
    mobileMainView,
    viewDaily,
    searchedItemMobile,
    upcSearch,
    mSort,
  } = useAppSelector((state) => state.subMargin);

  const { assignedStores } = useAppSelector((state) => state.user);

  return {
    assignedStores,
    filteredMargins,
    isMobile,
    lastGroup,
    lastStore,
    loadingMargins,
    loadingSubDepts,
    margins,
    searchValue,
    selectedSubDeptId,
    selectedWeek,
    selectedWeekDay,
    singleDate,
    subDeptCost,
    subDepts,
    subDeptFitlerText,
    subDeptGridView,
    token,
    type,
    url,
    weekOneMargins,
    weekTwoMargins,
    weekThreeMargins,
    weekFourMargins,
    filteredCostGridData,
    filteredItemGridData,
    itemGridData,
    pause,
    scannedUpc,
    scannedItemHistory,
    itemHistoryModalOpen,
    fetchingItemHistory,
    itemDataMobile,
    filteredItemDataMobile,
    processMobileItemData,
    scannedItemMobile,
    mobileMainView,
    viewDaily,
    searchedItemMobile,
    upcSearch,
    mSort,
  };
};

export const useParams = () => {
  const ctx = useSubMarginCtx();
  const startDate = setDates(new Date(ctx.singleDate), 6);
  const endDate = setDates(new Date(ctx.singleDate));

  // This will revert once we can accept groups for the endpoints safely
  return {
    start: startDate,
    end: endDate,
    // No matter what, useGroups and singleStore will always be the opposite of each other
    // useGroups: ctx.type === "Group" ? 1 : 0,
    useGroups: 0,
    // singleStore: ctx.type === "Store" ? 1 : 0,
    singleStore: 1,
    // searchValue: ctx.type === "Group" ? ctx.lastGroup : ctx.lastStore,
    searchValue: ctx.searchValue, // aka the selected store from the current SingleSelect in SubMarginControls.tsx
  };
};

export const useHeight = () => {
  const [height, setHeight] = useState<string>("h-[89%]");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight > 826) {
        setHeight("h-[90.2%]");
      } else {
        setHeight("h-[88.9%]");
      }
    };

    handleResize(); // Call it once to set the initial height

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return height;
};
