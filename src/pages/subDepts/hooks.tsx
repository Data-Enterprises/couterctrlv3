import { setDates } from ".";
import { useAppSelector } from "../../hooks";

export const useSubMarginCtx = () => {
  const { url, token } = useAppSelector((state) => state.app);
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
  } = useAppSelector((state) => state.subMargin);

  const { assignedStores } = useAppSelector((state) => state.user);

  return {
    assignedStores,
    filteredMargins,
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
