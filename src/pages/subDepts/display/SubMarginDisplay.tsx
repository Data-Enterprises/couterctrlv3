import { useEffect } from "react";
import { useAppDispatch } from "../../../hooks";
import { useSubMarginCtx } from "../hooks";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { setLoadingMargins } from "../../../features/subMarginSlice";

const SubMarginDisplay = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (
      ctx.margins.length &&
      ctx.weekOneMargins.length &&
      ctx.weekTwoMargins.length &&
      ctx.weekThreeMargins.length &&
      ctx.weekFourMargins.length
    ) {
      // We have all the data we need to display the sub dept margin trends, so we can stop loading
      dispatch(setLoadingMargins(false));
    }
  }, [
    ctx.margins,
    ctx.weekOneMargins,
    ctx.weekTwoMargins,
    ctx.weekThreeMargins,
    ctx.weekFourMargins,
  ]);

  // if not loading and have no data => return null
  if (
    !ctx.loadingMargins &&
    !ctx.margins.length &&
    !ctx.weekOneMargins.length &&
    !ctx.weekTwoMargins.length &&
    !ctx.weekThreeMargins.length &&
    !ctx.weekFourMargins.length
  ) {
    return null;
  }

  if (ctx.loadingMargins) {
    return (
      <div className="relative">
        <LoadingIndicator
          message="Loading margins..."
          className="top-1/2 left-1/2"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-custom-white">Howdy</div>
      <div className="bg-custom-white">Howdy</div>
    </div>
  );
};

export default SubMarginDisplay;
