import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../../hooks";
import {
  setOptDisplayMode,
  setSelectedOptItem,
} from "../../../features/upcSlice";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { UpcPriceOpt } from "../../../interfaces";

// Components
import MetricsCarousel from "./forecast/MetricsCarousel";
import MetricsContainer from "../components/MetricsContainer";
import UpcControls from "../components/UpcControls";
import PriceOptBar from "../charts/PriceOptBar";
import PriceOptGrid from "../charts/PriceOptGrid";
import { exportData } from "../exportHeaders/utils";
import { reset } from "../../../features/upcModalSlice";
import { priceOptHeaders } from "../exportHeaders";
import UpcModal from "../modal/UpcModal";
import UpcPrices from "../components/UpcPrices";

const PriceOpt = () => {
  const toast = useToast();
  const dispatch = useDispatch();
  const upcState = useAppSelector((state) => state.upc);
  const modal = useAppSelector((state) => state.upcModal);
  const [filteredItems, setFilteredItems] = useState<UpcPriceOpt[]>(
    upcState.optBestPricesByUpc
  );

  useEffect(() => {
    if (!upcState.selectedUpcs.length) {
      setFilteredItems(upcState.optBestPricesByUpc);
    } else {
      const filtered = upcState.optBestPricesByUpc.filter((item) =>
        upcState.selectedUpcs.includes(item.product_code)
      );
      setFilteredItems(filtered);
    }
  }, [upcState.selectedUpcs]);

  const handleExport = () => {
    if (!modal.fileName) {
      toast.warn("Please enter a file name...");
      return;
    } else if (
      !upcState.selectedUpcs.length &&
      modal.priceOptOption.list === "selected"
    ) {
      toast.warn("Please select at least one upc to export...");
      return;
    } else if (!modal.priceOptOption.list && !modal.priceOptOption.data) {
      toast.warn("Please select the list and data for the export...");
      return;
    } else if (!modal.priceOptOption.list) {
      toast.warn("Please select the list for the export...");
      return;
    } else if (!modal.priceOptOption.data) {
      toast.warn("Please select the data for the export...");
      return;
    }

    const data =
      modal.priceOptOption.data === "allData"
        ? upcState.optBestPrices
        : upcState.optBestPricesByUpc;
    const upcs = upcState.selectedUpcs;
    const dataToExport =
      modal.priceOptOption.list === "selected"
        ? data.filter((item) => upcs.includes(item.product_code))
        : data;

    exportData(dataToExport, priceOptHeaders, modal.fileName);
    dispatch(reset());
  };

  const handleCellClick = (item: UpcPriceOpt) => {
    if (
      upcState.selectedOptItem &&
      upcState.selectedOptItem.product_code === item.product_code
    ) {
      dispatch(setSelectedOptItem({} as UpcPriceOpt));
      dispatch(setOptDisplayMode("multiRow"));
    } else {
      dispatch(setSelectedOptItem(item));
      dispatch(setOptDisplayMode("singleRow"));
    }
  };

  return (
    <div data-testid="upc-price" className="h-full w-full grid grid-cols-[14%_85%] gap-4 overflow-hidden">
      <UpcControls />
      <UpcModal handleExport={handleExport} />
      <div className="h-full grid grid-rows-[14%_86%] mr-4">
        <MetricsCarousel className="w-full h-[95%]">
          <MetricsContainer
            data={filteredItems}
            metricKey="price"
            type="Price"
          />
          <MetricsContainer
            data={filteredItems}
            metricKey="total_qty"
            type="Qty"
          />
          <MetricsContainer
            data={filteredItems}
            metricKey="total_revenue"
            type="Rev"
          />
        </MetricsCarousel>
        <div className="grid grid-cols-2 gap-4">
          <PriceOptGrid
            rowData={upcState.optBestPricesByUpc}
            handleCellClick={handleCellClick}
          />
          {/* <PriceOptBar type="Price" yKey="price" /> */}
          <UpcPrices />
          <PriceOptBar type="Total Quantity" yKey="total_qty" />
          <PriceOptBar type="Total Revenue" yKey="total_revenue" />
        </div>
      </div>
    </div>
  );
};

export default PriceOpt;
