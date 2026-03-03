import { useEffect } from "react";
import { useSubMarginCtx } from "./hooks";
import { useAppDispatch } from "../../hooks";

import SubMarginControls from "./controls/SubMarginControls";
import SubMarginDisplay from "./display/SubMarginDisplay";
import { resetSubMarginState } from "../../features/subMarginSlice";

const SubDeptMargins = () => {
  const ctx= useSubMarginCtx();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(resetSubMarginState());
  }, [ctx.singleDate]);

  return (
    <div className="h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] grid grid-cols-[20%_79%] gap-4 p-4">
      <SubMarginControls />
      <SubMarginDisplay />
    </div>
  );
};

export default SubDeptMargins;
