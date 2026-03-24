import { useCashierCtx } from ".";
import { setDataView } from "../../features/cashiersSlice";

const ViewToggle = () => {
  const ctx = useCashierCtx();

  const activeStyle = (view: string) => {
    if (ctx.dataView === view) {
      return "bg-orange-200";
    }
    return "";
  };

  const handleToggle = (view: "stores" | "cashiers" | "transactions") => {
    ctx.dispatch(setDataView(view));
  };

  if (!ctx.transList.length && !ctx.storeCards.length && !ctx.cashierCards.length) {
    return null;
  }

  return (
    <div className="select-none">
      <div className="bg-blue-500 text-custom-white font-medium rounded-t-lg py-0.5 px-2">
        Select View
      </div>
      <div className="grid gap-2 p-2 bg-custom-white rounded-b-lg shadow-lg">
        <button
          className={`${!ctx.storeCards.length && "hidden"} ${activeStyle("stores")} py-1 rounded-lg shadow-md transition-all duration-200 hover:shadow-inner`}
          onClick={() => handleToggle("stores")}
        >
          Stores
        </button>
        <button
          className={`${!ctx.cashierCards.length && "hidden"} ${activeStyle("cashiers")} py-1 rounded-lg shadow-md transition-all duration-200 hover:shadow-inner`}
          onClick={() => handleToggle("cashiers")}
        >
          Cashiers
        </button>
        <button
          className={`${!ctx.transList.length && "hidden"} ${activeStyle("transactions")} py-1 rounded-lg shadow-md transition-all duration-200 hover:shadow-inner`}
          onClick={() => handleToggle("transactions")}
        >
          Transactions
        </button>
      </div>
    </div>
  );
};

export default ViewToggle;
