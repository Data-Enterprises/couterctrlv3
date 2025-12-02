import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../../hooks";
import {
  setOptDisplayMode,
  setSelectedOptItem,
  setSelectedUpcs,
} from "../../../features/upcSlice";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { UpcPriceOpt } from "../../../interfaces";

// Components
import MetricsCarousel from "./forecast/MetricsCarousel";
import MetricsContainer from "../components/MetricsCarousel";
import UpcControls from "../components/UpcControls";
import PriceOptBar from "../charts/PriceOptBar";
import PriceOptGrid from "../charts/PriceOptGrid";
import { exportData } from "../exportHeaders/utils";
import { reset } from "../../../features/upcModalSlice";
import { priceOptHeaders } from "../exportHeaders";
import UpcModal from "../modal/UpcModal";

const PriceOpt = () => {
  const toast = useToast();
  const dispatch = useDispatch();
  const upcState = useAppSelector((state) => state.upc);
  const modal = useAppSelector((state) => state.upcModal);
  const [filteredItems, setFilteredItems] = useState<UpcPriceOpt[]>(
    upcState.optBestPricesByUpc
  );

  useEffect(() => {
    if (!upcState.selectedUpcs) {
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

  const onSelect = (x: string[]) => {
    dispatch(setSelectedUpcs(""));
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

  // const handleDrillDown = (item: UpcPriceOpt) => {
  //   dispatch(setSelectedOptItem(item));
  //   dispatch(setOptDisplayMode("singleRow"));
  // };

  // const handleCopy = async (text: string) => {
  //   await navigator.clipboard.writeText(text);
  //   dispatch(setMenuPosition(null));
  // };

  // const handlers: Handlers = {
  //   copyUpc: () => handleCopy(upcState.clipboardText.upc),
  //   copyDesc: () => handleCopy(upcState.clipboardText.desc),
  //   selectUpc: () => {
  //     const item: UpcPriceOpt = upcState.optBestPrices.find(
  //       (u) => u.product_code === upcState.clipboardText.upc
  //     )!;
  //     handleDrillDown(item);
  //     dispatch(setMenuPosition(null));
  //   },
  // };

  return (
    <div className="h-full w-full grid grid-cols-[15%_85%] gap-4">
      <UpcControls />
      <UpcModal handleExport={handleExport} />
      <div className="gap-2 grid grid-cols-2 pt-[120px] relative mr-4">
        <div className="absolute w-full flex items-center justify-between">
          <MetricsCarousel className="w-full h-[115px]">
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
        </div>
        <PriceOptGrid
          rowData={upcState.optBestPricesByUpc}
          onSelectionChanged={onSelect}
          handleCellClick={handleCellClick}
        />
        <PriceOptBar type="Price" yKey="price" />
        <PriceOptBar type="Total Quantity" yKey="total_qty" />
        <PriceOptBar type="Total Revenue" yKey="total_revenue" />
      </div>
    </div>
  );
};

export default PriceOpt;
