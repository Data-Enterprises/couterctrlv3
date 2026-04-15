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
  const {
    salesViewHourly,
    salesViewTopTen,
    salesViewWeekly,
    selectedStore,
    groups,
    assignedStores,
    searchValue,
    type,
  } = useMobileSalesCtx();

  const displayName = () => {
    if (selectedStore.store_name.length > 0) return selectedStore.store_name;

    if (type === "Group") {
      const group = groups.find((g) => g.id === searchValue);
      if (group) return group.group_name;
    } else {
      const store = assignedStores.find((s) => s.storeid === searchValue);
      if (store) return store.store_name;
    }

    return "";
  };

  return (
    <div className="p-2 space-y-2">
      <div className="bg-custom-white rounded-lg shadow-md px-2 py-0.5">
        <div className="flex justify-between font-medium">
          <div>Weekly Sales</div>
          <div>{displayName()}</div>
        </div>
        <div className="grid grid-cols-2 mb-1">
          <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
          <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
        </div>
        <SalesViewWeekly weekly={[...salesViewWeekly]} />
      </div>
      <div className="bg-custom-white rounded-lg shadow-md px-2 py-0.5">
        <SalesViewHourly hourly={salesViewHourly} />
      </div>
      <div className="bg-custom-white rounded-lg shadow-md px-2 py-0.5">
        <SalesViewTopTen topTen={salesViewTopTen} />
      </div>
    </div>
  );
};

export default SalesView;
