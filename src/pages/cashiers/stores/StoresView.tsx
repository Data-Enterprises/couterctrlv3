import { useCashierCtx } from "..";

import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import StoreOverview from "./StoreOverview";

const StoresView = () => {
  const ctx = useCashierCtx();

  if (ctx.loadingStores) {
    return (
      <div className="relative h-[calc(100vh-5rem)]">
        <LoadingIndicator message="Loading stores..." />
      </div>
    );
  }

  return (
    <div className="min-h-full grid grid-cols-3 gap-2">
      {ctx.storeCards.map((card, i) => (
        <StoreOverview key={i} store={card} />
      ))}
    </div>
  );
};

export default StoresView;
