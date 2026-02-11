import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import UpcControls from "../../components/UpcControls";
import SalesComparison from "../salesComp/SalesComparison";
import SalesCompGrid from "../salesComp/SalesCompGrid";
import SalesCompHeader from "../salesComp/SalesCompHeader";
import { useRowHeight } from "../../../hooks";
import UpcModal from "../../modal/UpcModal";
import { exportData } from "../../exportHeaders/utils";
import { tableHeaderUpc } from "../../exportHeaders";
import { reset } from "../../../../features/upcModalSlice";
import type { Handlers } from "../../../../interfaces";
import { setMenuPosition } from "../../../../features/ctxMenuSlice";
import CtxMenu from "../../../../components/CtxMenu";
import { options } from "../../utils";

const SalesComp = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const upcState = useAppSelector((state) => state.upc);
  const modal = useAppSelector((state) => state.upcModal);
  const ctx = useAppSelector((state) => state.ctxMenu);
  const { rows } = useRowHeight();

  const handleExport = () => {
    if (modal.fileName === "") {
      toast.warn("Please enter a file name");
      return;
    }

    exportData(upcState.salesComp, tableHeaderUpc, modal.fileName);
    dispatch(reset());
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    dispatch(setMenuPosition(null));
  };

  const handlers: Handlers = {
    copyUpc: () => handleCopy(ctx.clipboardText.upc),
    copyDesc: () => handleCopy(ctx.clipboardText.desc),
  };

  return (
    <div
      data-testid="upc-sales-comp"
      className="h-full w-full grid grid-cols-[14%_85%] gap-4 overflow-hidden"
    >
      <CtxMenu
        className="hover:bg-panel_active/70"
        options={options}
        handlers={handlers}
      />
      <UpcModal handleExport={handleExport} />
      <UpcControls />
      <div
        data-testid="sales-comp-main-grid"
        className={`w-full h-full grid ${rows} gap-4`}
      >
        <SalesCompHeader />
        <div className="grid grid-cols-[70%_29%] gap-4 mb-4">
          <SalesCompGrid />
          <SalesComparison />
        </div>
      </div>
    </div>
  );
};

export default SalesComp;
