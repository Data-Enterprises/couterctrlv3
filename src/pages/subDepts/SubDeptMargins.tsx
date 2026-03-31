import { useEffect } from "react";
import { useSubMarginCtx } from "./hooks";
import { useAppDispatch, useAppSelector } from "../../hooks";

import {
  handleWeekReset,
  resetFilters,
  setLoadingMargins,
  setMargins,
  setOpenCostExportModal,
  setOpenExportModal,
} from "../../features/subMarginSlice";

import SubMarginControls from "./controls/SubMarginControls";
import SubMarginDisplay from "./display/SubMarginDisplay";
import ItemFilterModal from "./display/modals/ItemFilterModal";
import ExportModal from "../../components/modals/ExportModal";
import { costCols, itemCols } from "./display/widgets";
import CtxMenu from "../../components/CtxMenu";
import { setMenuPosition } from "../../features/ctxMenuSlice";
import type { Handlers } from "../../interfaces";
import { smOptions } from "../upc/utils";
import SubDeptMobileView from "./mobile/SubDeptMobileView";

const SubDeptMargins = () => {
  const ctx = useSubMarginCtx();
  const context = useAppSelector((state) => state.ctxMenu);
  const dispatch = useAppDispatch();
  const sm = useAppSelector((state) => state.subMargin);

  useEffect(() => {
    dispatch(resetFilters());
  }, [sm.subDeptGridView]);

  useEffect(() => {
    if (sm.selectedWeek > 0) {
      // reset the filters when the week changes
      dispatch(resetFilters());
      dispatch(handleWeekReset());
    }
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
    dispatch(setOpenCostExportModal(false));
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    dispatch(setMenuPosition(null));
  };

  const handlers: Handlers = {
    copyUpc: () => handleCopy(context.smClipboardText.upc),
    copyAllUpcs: () => handleCopy(context.smClipboardText.allUpc),
  };

  if (ctx.isMobile) return <SubDeptMobileView />;

  return (
    <div className="h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] grid grid-cols-[18%_82%] gap-2 p-4">
      <CtxMenu handlers={handlers} options={smOptions} />
      <ExportModal
        isOpen={sm.openExportModal}
        columns={itemCols}
        data={sm.filteredItemGridData}
        onClose={handleClose}
      />
      <ExportModal
        isOpen={sm.openCostExportModal}
        columns={costCols}
        data={sm.filteredCostGridData}
        onClose={handleClose}
      />
      <ItemFilterModal />
      <SubMarginControls />
      {!ctx.loadingMargins && !ctx.margins.length ? null : <SubMarginDisplay />}
    </div>
  );
};

export default SubDeptMargins;
