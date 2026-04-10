import { useMobileSalesCtx } from "./hooks";
import {
  setView,
  type SalesMobileView,
} from "../../../features/salesMobileSlice";

import SalesView from "./salesView/SalesView";
import SubsView from "./subsView/SubsView";

const MainViewContainer = () => {
  const ctx = useMobileSalesCtx();

  const handleViewSelect = (view: SalesMobileView) => {
    ctx.dispatch(setView(view));
  };

  const renderView = () => {
    switch (ctx.view) {
      case "subdept":
        return <SubsView />;
      default:
        return <SalesView />;
    }
  };

  return (
    <div className="p-2 min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden text-[13px]">
      <div className="grid grid-cols-3 gap-2">
        <button
          className="btn-themeBlue py-1 px-0 text-[13px]"
          onClick={() => handleViewSelect("main")}
        >
          Main
        </button>
        <button
          className="btn-themeBlue py-1 px-0 text-[13px]"
          onClick={() => handleViewSelect("sales")}
        >
          Sales
        </button>
        <button
          className="btn-themeBlue py-1 px-0 text-[13px]"
          onClick={() => handleViewSelect("subdept")}
        >
          Subs
        </button>
      </div>
      {renderView()}
    </div>
  );
};

export default MainViewContainer;
