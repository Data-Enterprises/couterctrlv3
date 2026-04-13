import { useMobileSalesCtx } from "./hooks";
import {
  setView,
  type SalesMobileView,
} from "../../../features/salesMobileSlice";

// The 3 main mobile view once the sales panels are fetched
import SalesView from "./salesView/SalesView";
import SubsView from "./subsView/SubsView";
import StoresView from "./storesView/StoresView";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";

const MainViewContainer = () => {
  const ctx = useMobileSalesCtx();

  const handleViewSelect = (view: SalesMobileView) => {
    ctx.dispatch(setView(view));
  };

  const renderView = () => {
    switch (ctx.view) {
      case "sales":
        return <SalesView />;
      case "subdept":
        return <SubsView />;
      default:
        return <StoresView />;
    }
  };

  // Wait for the initial data to be loaded from goliath
  if (
    !ctx.salesPanels.length ||
    !ctx.weeklySales.length ||
    !ctx.subSales.length
  )
    return (
      <div>
        <LoadingIndicator message="Loading sales" />
      </div>
    );

  return (
    <div className="p-2 min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden text-[13px]">
      <div className="grid grid-cols-4 gap-2">
        <button
          className={`${ctx.view === "main" ? "btn-themeGreen" : "btn-themeBlue"} py-1 px-0 text-[13px]`}
          onClick={() => handleViewSelect("main")}
        >
          Main
        </button>
        <button
          className={`${ctx.view === "stores" ? "btn-themeGreen" : "btn-themeBlue"} py-1 px-0 text-[13px]`}
          onClick={() => handleViewSelect("stores")}
        >
          Stores
        </button>
        <button
          className={`${ctx.view === "sales" ? "btn-themeGreen" : "btn-themeBlue"} py-1 px-0 text-[13px]`}
          onClick={() => handleViewSelect("sales")}
        >
          Sales
        </button>
        <button
          className={`${ctx.view === "subdept" ? "btn-themeGreen" : "btn-themeBlue"} py-1 px-0 text-[13px]`}
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
