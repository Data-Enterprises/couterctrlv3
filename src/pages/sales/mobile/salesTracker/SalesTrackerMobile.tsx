import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import { useMobileSalesCtx } from "../hooks";
import SalesTrackerDays from "./SalesTrackerDays";
import SalesTrackerPeriods from "./SalesTrackerPeriods";
import SalesTrackerWeeks from "./SalesTrackerWeeks";

const SalesTrackerMobile = () => {
  const ctx = useMobileSalesCtx();

  if (ctx.loadingLYTrackerMobile || ctx.loadingTYTrackerMobile) {
    return (
      <div className="relative min-h-[calc(100vh-88px)] max-h-[calc(100vh-88px)] overflow-hidden">
        <LoadingIndicator message="Loading tracker data" />
      </div>
    );
  }

  const renderTrackerView = () => {
    switch (ctx.salesTrackerView) {
      case "weeks":
        return <SalesTrackerWeeks />;
      case "days":
        return <SalesTrackerDays />;
      default:
        return <SalesTrackerPeriods />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-88px)] max-h-[calc(100vh-88px)] overflow-hidden text-[12px]">
      {renderTrackerView()}
    </div>
  );
};

export default SalesTrackerMobile;
