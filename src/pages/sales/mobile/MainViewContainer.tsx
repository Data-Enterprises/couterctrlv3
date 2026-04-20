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
import {
  DocumentCurrencyDollarIcon,
  ShoppingCartIcon,
} from "@heroicons/react/20/solid";
import { BuildingStorefrontIcon } from "@heroicons/react/24/solid";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

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

  const activeStyle = (view: SalesMobileView) => {
    return ctx.view === view ? "text-orange-500" : "text-content/60";
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden text-[13px]">
      <div className="flex justify-items-center bg-custom-white shadow-md py-2 text-[12px]">
        <div
          className="border-r w-1/4 flex justify-center gap-2 items-center transition-all"
          onClick={() => handleViewSelect("main")}
        >
          <ArrowUturnLeftIcon
            className={`h-6 w-6 transition-all duration-200 ${activeStyle("main")}`}
          />
          Go Back
        </div>
        <div
          className="border-r w-1/4 flex justify-center gap-2 items-center transition-all"
          onClick={() => handleViewSelect("stores")}
        >
          <BuildingStorefrontIcon
            className={`h-6 w-6 transition-all duration-200 ${activeStyle("stores")}`}
          />
          Stores
        </div>
        <div
          className="border-r w-1/4 flex justify-center gap-2 items-center transition-all"
          onClick={() => handleViewSelect("sales")}
        >
          <DocumentCurrencyDollarIcon
            className={`h-6 w-6 transition-all duration-200 ${activeStyle("sales")}`}
          />
          Sales
        </div>
        <div
          className="w-1/4 flex justify-center gap-2 items-center"
          onClick={() => handleViewSelect("subdept")}
        >
          <ShoppingCartIcon
            className={`h-6 w-6 transition-all duration-200 ${activeStyle("subdept")}`}
          />
          Subs
        </div>
        {/* <button
          className={`${ctx.view === "main" ? "btn-themeGreen" : "btn-themeBlue"} py-1 px-0 text-[13px]`}
          onClick={() => handleViewSelect("main")}
        >
          Go Back
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
        </button> */}
      </div>
      {renderView()}
    </div>
  );
};

export default MainViewContainer;
