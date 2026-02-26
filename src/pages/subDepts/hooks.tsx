import { useAppSelector } from "../../hooks";

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
    subDeptFitlerText
  } = useAppSelector((state) => state.subMargin);

  return {
    endDate,
    filteredMargins,
    lastGroup,
    lastStore,
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
