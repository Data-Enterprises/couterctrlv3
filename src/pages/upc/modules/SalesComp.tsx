import { useToast } from "../../../components/toasts/hooks/useToast";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import UpcControls from "../components/UpcControls";
import SalesComparison from "./salesComp/SalesComparison";
import SalesCompGrid from "./salesComp/SalesCompGrid";
import SalesCompHeader from "./salesComp/SalesCompHeader";
import { useRowHeight } from "../../hooks";
import UpcModal from "../modal/UpcModal";
import { exportData } from "../exportHeaders/utils";
import { tableHeaderUpc } from "../exportHeaders";
import { reset } from "../../../features/upcModalSlice";

const SalesComp = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const upcState = useAppSelector((state) => state.upc);
  const modal = useAppSelector((state) => state.upcModal);
  const { rows } = useRowHeight();

  const handleExport = () => {
    if (modal.fileName === "") {
      toast.warn("Please enter a file name");
      return;
    }

    exportData(upcState.salesComp, tableHeaderUpc, modal.fileName);
    dispatch(reset());
  };

  return (
    <div className="h-full w-full grid grid-cols-[13%_87%] gap-4">
      <UpcModal handleExport={handleExport} />
      <UpcControls />
      <div className={`w-full h-full grid ${rows} gap-4`}>
        <SalesCompHeader />
        <div className="grid grid-cols-[80%_19%] gap-4 mb-4">
          <SalesCompGrid />
          <SalesComparison />
        </div>
      </div>
    </div>
  );
};

export default SalesComp;
