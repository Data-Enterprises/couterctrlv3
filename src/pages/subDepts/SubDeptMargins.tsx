import { useEffect } from "react";
import { useSubMarginCtx } from "./hooks";
import { useAppDispatch } from "../../hooks";

import SubMarginControls from "./controls/SubMarginControls";
import SubMarginDisplay from "./display/SubMarginDisplay";
import {
  resetSubMarginState,
  setLoadingMargins,
  setMargins,
  setSearchValue,
} from "../../features/subMarginSlice";

const SubDeptMargins = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Doing it this way because I want the state to reset when the date changes
    // but still make sure any selected store still stays selected
    const currentSearchValue = ctx.searchValue;
    dispatch(resetSubMarginState());
    dispatch(setSearchValue(currentSearchValue));
  }, [ctx.singleDate]);

  useEffect(() => {
    if (
      ctx.selectedWeek === 5 &&
      ctx.weekOneMargins.length &&
      ctx.weekTwoMargins.length &&
      ctx.weekThreeMargins.length &&
      ctx.weekFourMargins.length
    ) {
      const allMargins = [
        ...ctx.weekOneMargins,
        ...ctx.weekTwoMargins,
        ...ctx.weekThreeMargins,
        ...ctx.weekFourMargins,
      ];
      dispatch(setMargins(allMargins));
      dispatch(setLoadingMargins(false));
    } else if (ctx.selectedWeek === 1 && ctx.weekOneMargins.length) {
      dispatch(setMargins(ctx.weekOneMargins));
      dispatch(setLoadingMargins(false));
    } else if (ctx.selectedWeek === 2 && ctx.weekTwoMargins.length) {
      dispatch(setMargins(ctx.weekTwoMargins));
      dispatch(setLoadingMargins(false));
    } else if (ctx.selectedWeek === 3 && ctx.weekThreeMargins.length) {
      dispatch(setMargins(ctx.weekThreeMargins));
      dispatch(setLoadingMargins(false));
    } else if (ctx.selectedWeek === 4 && ctx.weekFourMargins.length) {
      dispatch(setMargins(ctx.weekFourMargins));
      dispatch(setLoadingMargins(false));
    }
  }, [
    ctx.selectedWeek,
    ctx.weekOneMargins,
    ctx.weekTwoMargins,
    ctx.weekThreeMargins,
    ctx.weekFourMargins,
  ]);

  return (
    <div className="h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] grid grid-cols-[20%_80%] gap-2 p-4">
      <SubMarginControls />
      {!ctx.loadingMargins && !ctx.margins.length ? null : <SubMarginDisplay />}
    </div>
  );
};

export default SubDeptMargins;
