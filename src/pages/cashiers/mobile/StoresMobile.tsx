import { useCashierCtx } from "..";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useAppDispatch } from "../../../hooks";
import { WarningIcon } from "../../../components/toasts/Icons";
import { reQueryStepOne, setDataView } from "../../../features/cashiersSlice";
import StoreOverviewMobile from "./StoreOverviewMobile";

const StoresMobile = () => {
  const ctx = useCashierCtx();
  const dispatch = useAppDispatch();
  const toast = useToast();

  console.log(ctx, dispatch, toast);

  // Loading the data
  if (ctx.loadingStores) return <LoadingIndicator message="Loading stores" />;

  // No store data found => reset
  if (ctx.noStoresFound) {
    return (
      <div className="h-[calc(100vh-3rem)] w-full flex items-center justify-center">
        <div className="bg-custom-white rounded-lg shadow-md p-2 grid justify-items-center gap-2">
          <WarningIcon fill="#f97316" height={120} width={120} />
          <div className="font-medium text-content/60">
            No stores found in this date range
          </div>
          <button
            className="btn-themeOrange w-full"
            onClick={() => ctx.dispatch(setDataView(""))}
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, we're good to go
  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full overflow-hidden">
      <div className="grid grid-cols-2 gap-2">
        <button
          className="btn-themeBlue px-0"
          onClick={() => ctx.dispatch(reQueryStepOne())}
        >
          Refresh
        </button>
        <button
          className={`btn-themeBlue px-0 ${ctx.cashierCards.length === 0 ? "opacity-50 pointer-events-none" : ""}`}
          onClick={() => ctx.dispatch(setDataView("cashiers"))}
        >
          Cashiers
        </button>
      </div>

      <div className="grid py-2 max-h-[calc(100vh-7rem)] overflow-y-auto gap-2">
        {ctx.storeCards.map((card, i) => (
          <StoreOverviewMobile key={i} store={card} />
        ))}
      </div>
    </div>
  );
};

export default StoresMobile;
