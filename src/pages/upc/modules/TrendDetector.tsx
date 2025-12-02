import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { UpcTrend } from "../../../interfaces";
import { useToast } from "../../../components/toasts/hooks/useToast";

// Components
import UpcControls from "../components/UpcControls";
import MetricsCarousel from "./forecast/MetricsCarousel";
import TopBottomTrends from "../components/TopBottomTrends";
import TrendCardsList from "./trend/TrendCardsList";
import TrendGroupBar from "../charts/TrendGroupBar";
import TrendModal from "./trend/TrendModal";

const TrendDetector = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const state = useAppSelector((state) => state.upc);
  const [selectedTrends, setSelectedTrends] = useState<UpcTrend[]>([]);

  useEffect(() => {
    if (state.selectedUpcs.length === 0) {
      setSelectedTrends([]);
    } else {
      setSelectedTrends(
        state.upcTrends.filter((item) =>
          state.selectedUpcs.includes(item.product_code)
        )
      );
    }
  }, [state.upcTrends, state.selectedUpcs]);

  // const handleExport = () => {
  //   if (!modal.fileName) {
  //     toast.warn("Please enter a file name...");
  //     return;
  //   }

  //   const data: UpcTrend[] = modal.trendOption.all
  //     ? state.upcTrends
  //     : modal.trendOption.top
  //     ? state.topFiveTrends
  //     : state.bottomFiveTrends;

  //   exportData(data, trendHeaders, modal.fileName);
  //   dispatch(reset());
  // };

  return (
    <div className="h-full w-full grid grid-cols-[12%_88%] gap-4">
      <TrendModal />
      {/* <UpcModal handleExport={handleExport} /> */}
      <UpcControls />
      <div className="gap-2 grid grid-rows-[62%_38%] -mt-3 relative pt-[133px] mr-4">
        <div className="absolute w-full" style={{ zIndex: 0 }}>
          <MetricsCarousel className="h-[130px]">
            <TopBottomTrends type="Top" />
            <TopBottomTrends type="Bottom" />
          </MetricsCarousel>
        </div>
        <div className="grid gap-2 h-full">
          {selectedTrends.length ? (
            <TrendGroupBar data={selectedTrends} type="Selected" />
          ) : (
            <div className="bg-custom-white rounded-lg shadow-lg flex justify-center items-center text-content/70">
              <div>Select UPCs to see their trends here.</div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 h-full">
          {state.selectedUpcs.length ? (
            <TrendCardsList />
          ) : (
            <div className="flex justify-center items-center text-content/70">
              <div>Select UPCs to view their metric cards</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendDetector;
