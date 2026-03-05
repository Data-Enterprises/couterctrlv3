import { useEffect } from "react";
import { useSubMarginCtx } from "./hooks";
import { useAppDispatch, useAppSelector } from "../../hooks";

import {
  setLoadingMargins,
  setMargins,
  setOpenExportModal,
} from "../../features/subMarginSlice";

import SubMarginControls from "./controls/SubMarginControls";
import SubMarginDisplay from "./display/SubMarginDisplay";
import ItemFilterModal from "./display/modals/ItemFilterModal";
import ExportModal from "../../components/modals/ExportModal";
import { itemCols } from "./display/widgets";

const SubDeptMargins = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const sm = useAppSelector((state) => state.subMargin);

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

  const handleClose = () => {
    dispatch(setOpenExportModal(false));
  };

  return (
    <div className="h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] grid grid-cols-[18%_82%] gap-2 p-4">
      <ExportModal
        isOpen={sm.openExportModal}
        columns={itemCols}
        data={sm.filteredItemGridData}
        onClose={handleClose}
      />
      <ItemFilterModal />
      <SubMarginControls />
      {!ctx.loadingMargins && !ctx.margins.length ? null : <SubMarginDisplay />}
    </div>
  );
};

export default SubDeptMargins;
