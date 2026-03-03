import { useEffect } from "react";
import { useAppDispatch } from "../../../hooks";
import { useSubMarginCtx } from "../hooks";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { setLoadingMargins } from "../../../features/subMarginSlice";
import KpiContainer from "./KpiContainer";
import WeeklyTrends from "./WeeklyTrends";

const SubMarginDisplay = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (ctx.margins.length) {
      // We have all the data we need to display the sub dept margin trends, so we can stop loading
      dispatch(setLoadingMargins(false));
    }
  }, [ctx.margins]);

  return (
    <div className="relative">
      <div className="flex gap-4">
        {ctx.selectedSubDeptId > 0 && <WeeklyTrends />}
        
        {!ctx.loadingMargins &&
        !ctx.margins.length ? null : ctx.loadingMargins &&
          !ctx.margins.length ? (
          <div className="absolute top-1/2 left-1/2">
            <LoadingIndicator
              message="Loading margins..."
              className="top-1/2 left-1/2"
            />
          </div>
        ) : <KpiContainer />}
      </div>
      <div className="bg-white"></div>
    </div>
  );
};

export default SubMarginDisplay;
