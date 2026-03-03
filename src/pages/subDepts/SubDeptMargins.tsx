import { useEffect } from "react";
import { useSubMarginCtx } from "./hooks";
import { useAppDispatch } from "../../hooks";

import SubMarginControls from "./controls/SubMarginControls";
import SubMarginDisplay from "./display/SubMarginDisplay";
import { resetSubMarginState, setMargins } from "../../features/subMarginSlice";

const SubDeptMargins = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(resetSubMarginState());
  }, [ctx.singleDate]);

  useEffect(() => {
    if (ctx.selectedWeek === 1 && ctx.weekOneMargins.length) {
      dispatch(setMargins(ctx.weekOneMargins));
    } else if (ctx.selectedWeek === 2 && ctx.weekTwoMargins.length) {
      dispatch(setMargins(ctx.weekTwoMargins));
    } else if (ctx.selectedWeek === 3 && ctx.weekThreeMargins.length) {
      dispatch(setMargins(ctx.weekThreeMargins));
    } else if (ctx.selectedWeek === 4 && ctx.weekFourMargins.length) {
      dispatch(setMargins(ctx.weekFourMargins));
    } else if (ctx.selectedWeek === 5) {
      const allMargins = [
        ...ctx.weekOneMargins,
        ...ctx.weekTwoMargins,
        ...ctx.weekThreeMargins,
        ...ctx.weekFourMargins,
      ];
      dispatch(setMargins(allMargins));
    }
  }, [
    ctx.selectedWeek,
    ctx.weekOneMargins,
    ctx.weekTwoMargins,
    ctx.weekThreeMargins,
    ctx.weekFourMargins,
  ]);

  return (
    <div className="h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] grid grid-cols-[20%_79%] gap-4 p-4">
      <SubMarginControls />
      <SubMarginDisplay />
    </div>
  );
};

export default SubDeptMargins;
