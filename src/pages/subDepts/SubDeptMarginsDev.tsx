import { useEffect, useState } from "react";
import { useSubMarginCtx } from "./hooks";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useSubMarginActions } from "./hooks/useSubMarginActions";
import { useSubMarginState } from "./hooks/useSubMarginState";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getSubDepts } from "../../api/subMargins";
import { useParams } from "./hooks";
import type { JsonError, SubDept, SubSalesJsonResp } from "../../interfaces";

import SmDevLeftColumn from "./display/dev/SmDevLeftColumn";
import SmDevRightPanel from "./display/dev/SmDevRightPanel";
import SmDevSearchOverlay from "./display/dev/SmDevSearchOverlay";
import SmDevEntryCard from "./display/dev/SmDevEntryCard";
import ItemFilterModal from "./display/modals/ItemFilterModal";
import ExportModal from "../../components/modals/ExportModal";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { costCols, itemCols } from "./display/widgets";
import CtxMenu from "../../components/CtxMenu";
import { setMenuPosition } from "../../features/ctxMenuSlice";
import type { Handlers } from "../../interfaces";
import { smOptions } from "../upc/utils";

const SubDeptMarginsDev = () => {
  const ctx = useSubMarginCtx();
  const context = useAppSelector((state) => state.ctxMenu);
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const sm = useSubMarginState();
  const toast = useToast();
  const params = useParams();
  const [searchOpen, setSearchOpen] = useState(false);

  // Fetch lives here — passed as prop to SearchCard and re-search overlay
  const handleSearch = () => {
    dispatch(actions.requerySubDeptMargins());
    dispatch(actions.setLoadingSubDepts(true));
    getSubDepts(
      ctx.url,
      ctx.token,
      params.start,
      params.end,
      params.useGroups,
      params.searchValue,
      params.singleStore,
    )
      .then((resp) => {
        const j: SubSalesJsonResp = resp.data;
        if (j.error === 0) {
          const subDepts = j.subs
            .reduce((acc: SubDept[], curr) => {
              if (!acc.some((s) => s.id === curr.sub_department)) {
                acc.push({
                  id: curr.sub_department,
                  desc: curr.sub_department_description,
                });
              }
              return acc;
            }, [])
            .sort((a, b) => a.id - b.id);
          dispatch(actions.setSubDepts(subDepts));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(actions.setLoadingSubDepts(false)));
  };

  useEffect(() => {
    dispatch(actions.resetFilters());
  }, [sm.subDeptGridView]);

  useEffect(() => {
    if (sm.selectedWeek > 0) {
      dispatch(actions.resetFilters());
      dispatch(actions.handleWeekReset());
    }
    if (
      ctx.selectedWeek === 5 &&
      ctx.weekOneMargins.length &&
      ctx.weekTwoMargins.length &&
      ctx.weekThreeMargins.length &&
      ctx.weekFourMargins.length
    ) {
      dispatch(
        actions.setMargins([
          ...ctx.weekOneMargins,
          ...ctx.weekTwoMargins,
          ...ctx.weekThreeMargins,
          ...ctx.weekFourMargins,
        ]),
      );
      dispatch(actions.setLoadingMargins(false));
    } else if (ctx.selectedWeek === 1 && ctx.weekOneMargins.length) {
      dispatch(actions.setMargins(ctx.weekOneMargins));
      dispatch(actions.setLoadingMargins(false));
    } else if (ctx.selectedWeek === 2 && ctx.weekTwoMargins.length) {
      dispatch(actions.setMargins(ctx.weekTwoMargins));
      dispatch(actions.setLoadingMargins(false));
    } else if (ctx.selectedWeek === 3 && ctx.weekThreeMargins.length) {
      dispatch(actions.setMargins(ctx.weekThreeMargins));
      dispatch(actions.setLoadingMargins(false));
    } else if (ctx.selectedWeek === 4 && ctx.weekFourMargins.length) {
      dispatch(actions.setMargins(ctx.weekFourMargins));
      dispatch(actions.setLoadingMargins(false));
    }
  }, [
    ctx.selectedWeek,
    ctx.weekOneMargins,
    ctx.weekTwoMargins,
    ctx.weekThreeMargins,
    ctx.weekFourMargins,
  ]);

  const handleClose = () => {
    dispatch(actions.setOpenExportModal(false));
    dispatch(actions.setOpenCostExportModal(false));
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    dispatch(setMenuPosition(null));
  };

  const handlers: Handlers = {
    copyUpc: () => handleCopy(context.smClipboardText.upc),
    copyAllUpcs: () => handleCopy(context.smClipboardText.allUpc),
  };

  // Gate: no sub depts + not loading → full-page SearchCard
  if (ctx.subDepts.length === 0 && !ctx.loadingSubDepts) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)]">
        <CtxMenu handlers={handlers} options={smOptions} />
        <SmDevEntryCard onSearch={handleSearch} />
      </div>
    );
  }

  // Loading sub depts → full-page spinner
  if (ctx.loadingSubDepts) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <CtxMenu handlers={handlers} options={smOptions} />
        <LoadingIndicator message="Loading sub departments..." />
      </div>
    );
  }

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
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

      {searchOpen && (
        <SmDevSearchOverlay
          onSearch={() => { setSearchOpen(false); handleSearch(); }}
          onClose={() => setSearchOpen(false)}
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <SmDevLeftColumn onSearchOpen={() => setSearchOpen(true)} />
        <SmDevRightPanel />
      </div>
    </div>
  );
};

export default SubDeptMarginsDev;
