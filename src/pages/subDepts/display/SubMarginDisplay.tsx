import { useSubMarginCtx } from "../hooks";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import KpiContainer from "./KpiContainer";
import DailyCards from "./individualWeek/DailyCards";

const SubMarginDisplay = () => {
  const ctx = useSubMarginCtx();

  if (ctx.loadingMargins) {
    return (
      <div className="absolute top-1/2 left-1/2">
        <LoadingIndicator
          message="Loading margins..."
          className="top-1/2 left-1/2 ml-28"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <KpiContainer />
      <div className="grid grid-cols-[27%_73%]">
        <DailyCards />
      </div>
    </div>
  );
};

export default SubMarginDisplay;
