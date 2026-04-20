import { useMobileSalesCtx } from "../hooks";
import SalesViewHourly from "./SalesViewHourly";
import SalesViewTopTen from "./SalesViewTopTen";
import SalesViewWeekly from "./SalesViewWeekly";

/**
 * THE SCROLL FLOW:
 *
 * General overview => Granular
 * weekly => hourly => top ten
 */
const SalesView = () => {
  const ctx = useMobileSalesCtx();

  const displayName = () => {
    if (ctx.selectedStore.store_name.length > 0)
      return ctx.selectedStore.store_name;

    if (ctx.type === "Group") {
      const group = ctx.groups.find((g) => g.id === ctx.searchValue);
      if (group) return group.group_name;
    } else {
      const store = ctx.assignedStores.find(
        (s) => s.storeid === ctx.searchValue,
      );
      if (store) return store.store_name;
    }

    return "";
  };

  return (
    <div className="p-2 space-y-2 min-h-[calc(100vh-102px)] max-h-[calc(100vh-102px)] overflow-y-scroll">
      <SalesViewWeekly displayName={displayName()} />
      <SalesViewHourly displayName={displayName()} />
      <SalesViewTopTen displayName={displayName()} />
    </div>
  );
};

export default SalesView;
