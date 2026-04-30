import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import { useMobileSalesCtx } from "../hooks";

const SalesTrackerMobile = () => {
  const ctx = useMobileSalesCtx();

  if (ctx.loadingLYTrackerMobile|| ctx.loadingTYTrackerMobile) {
    return (
      <div className="relative">
        <LoadingIndicator message="Loading tracker data" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-88px)] max-h-[calc(100vh-88px)] overflow-hidden text-[12px]">
      <div>Sales Tracker Mobile</div>
    </div>
  )
};

export default SalesTrackerMobile;