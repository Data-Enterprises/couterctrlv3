import { useAppSelector } from "../../hooks";
import { formatGoliathDate } from "../../utils";

export const useSubMarginCtx = () => {
  const { url, token } = useAppSelector((state) => state.app);
  const { type, startDate, endDate, lastGroup, lastStore } = useAppSelector(
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
  } = useAppSelector((state) => state.subMargin);

  return {
    endDate,
    filteredMargins,
    lastGroup,
    lastStore,
    loadingMargins,
    loadingSubDepts,
    margins,
    selectedSubDeptId,
    startDate,
    subDepts,
    subDeptFitlerText,
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
  return {
    start: formatGoliathDate(ctx.startDate),
    end: formatGoliathDate(ctx.endDate),
    // No matter what, useGroups and singleStore will always be the opposite of each other
    useGroups: ctx.type === "Group" ? 1 : 0,
    singleStore: ctx.type === "Store" ? 1 : 0,
    searchValue: ctx.type === "Group" ? ctx.lastGroup : ctx.lastStore,
  };
};
