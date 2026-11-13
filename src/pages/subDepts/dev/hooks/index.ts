// Hooks
import { useEffect, useState } from "react";
import { shallowEqual } from "react-redux";
import { useAppSelector } from "../../../../hooks";

// Redux
import * as subMarginActions from "../../../../features/dev/devSubMarginSlice";

// Utils
import { setDates } from "../../../../utils/dates";

/** The Sub Dept Margins slice, read where it is used. */
export const useSubMarginState = () =>
  useAppSelector((state) => state.dev.subMargin, shallowEqual);

/**
 * Sub Dept Margins' action creators.
 *
 * Used to hand back the legacy slice's actions whenever `devMode` was off,
 * back when that meant the legacy page was on screen. Sub Dept Margins has no
 * legacy page any more, and the legacy slice is gone with it.
 */
export const useSubMarginActions = () => subMarginActions;

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
    weekOneMarginsLY,
    weekTwoMarginsLY,
    weekThreeMarginsLY,
    weekFourMarginsLY,
    weekFourMarginsLW,
    filteredMargins,
    subDeptFitlerText,
    loadingMargins,
    loadingSubDepts,
    selectedWeek,
    searchValue,
    searchedDate,
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
  } = useSubMarginState();

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
    // The week on screen: the searched date, else the picker before a search.
    weekDate: searchedDate ?? singleDate,
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
    weekOneMarginsLY,
    weekTwoMarginsLY,
    weekThreeMarginsLY,
    weekFourMarginsLY,
    weekFourMarginsLW,
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

/** The search's parameters for the week ending `date` (MM/DD/YYYY). */
export const useParams = () => {
  const ctx = useSubMarginCtx();
  return (date: string) => paramsFor(date, ctx.searchValue);
};

const paramsFor = (date: string, searchValue: number) => {
  const startDate = setDates(new Date(date), 6);
  const endDate = setDates(new Date(date));

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
    searchValue, // aka the selected store from the current SingleSelect in SubMarginControls.tsx
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
