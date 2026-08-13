import {
  setFilteredAvailableOrders,
  setFilteredOrders,
  setOrderFilters,
  setSubKeysFilter,
  setTypeFilterArr,
} from "../../../features/ordersLegacySlice";
import { useOrdersCtx } from "../hooks";
import { subDeptKeyMode, subDeptKeyOf } from "../../../utils/subDeptIdentity";

const OrdersGridFilters = () => {
  const ctx = useOrdersCtx();

  const count = (type: string) => {
    return ctx.availableOrders.reduce((acc, o) => {
      if (o.order_type.toLowerCase() === type.toLowerCase()) {
        return acc + 1;
      }
      return acc;
    }, 0);
  };

  const handleOrderTypeBtnClick = (type: string) => {
    const current = [...ctx.typeFilterArr];
    let result = [];
    if (current.includes(type)) {
      result = current.filter((t) => t !== type);
    } else {
      result = [...current, type];
    }
    ctx.dispatch(setTypeFilterArr(result));

    const setFilters = [...ctx.orderFilters].filter((f) =>
      ctx.typeFilterArr.includes(f.order_type),
    );
    ctx.dispatch(setOrderFilters(setFilters));

    if (result.length === 0) {
      ctx.dispatch(setFilteredAvailableOrders(ctx.availableOrders));
      ctx.dispatch(setFilteredOrders(ctx.allOrders));
    } else {
      const filtered = [...ctx.availableOrders].filter((o) =>
        result.includes(o.order_type),
      );

      const allFiltered = [...ctx.allOrders].filter((o) =>
        result.includes(o.order_type),
      );

      ctx.dispatch(setSubKeysFilter([]));
      ctx.dispatch(setFilteredOrders(allFiltered));
      ctx.dispatch(setFilteredAvailableOrders(filtered));
    }
  };

  // const currentOrders = () => {
  //   const result = [...ctx.filteredOrders].filter((o) => {
  //     const statusCheck = o.status
  //       .toLowerCase()
  //       .includes(ctx.orderStatusFilter);
  //     const subIdCheck =
  //       ctx.subKeysFilter.length === 0 ||
  //       ctx.subKeysFilter.includes(o.sub_department);
  //     return statusCheck && subIdCheck;
  //   });
  //   return result;
  // };

  const currentCount = (key: string) => {
    const result = [...ctx.filteredOrders].filter((o) => {
      const statusCheck = o.status
        .toLowerCase()
        .includes(ctx.orderStatusFilter);
      const subIdCheck = subKey(o) === key;
      return statusCheck && subIdCheck;
    });
    return result.length;
  };

  // The department a row belongs to. Keyed by id where the company numbers its
  // departments, by description where it doesn't — taken from allOrders so it
  // matches the chips, which are built from the same set.
  const subMode = subDeptKeyMode(ctx.allOrders);
  const subKey = (o: { sub_department: number; sub_department_description: string }) =>
    subDeptKeyOf(o, subMode);

  // "All" is its own action rather than a magic key — 0 used to mean it, which
  // is both a real department id and the only id every row has at a company
  // that doesn't number them.
  const clearSubFilter = () => ctx.dispatch(setSubKeysFilter([]));

  const hadleSubIdClick = (key: string) => {
    const current = ctx.subKeysFilter;
    ctx.dispatch(
      setSubKeysFilter(
        current.includes(key)
          ? current.filter((k) => k !== key)
          : [...current, key],
      ),
    );
  };

  return (
    <div className="bg-custom-white p-2 rounded-lg shadow-lg max-h-[calc(100vh-425px)] flex flex-col relative w-full">
      {/* Order Types */}
      <div>
        <div>Order Types</div>
        <div className="grid grid-cols-4 gap-2">
          {ctx.availableOrderTypes.map((t, i) => (
            <div
              key={i}
              className={`${ctx.typeFilterArr.includes(t) ? "bg-orange-200" : ""} mb-1 text-[11.5px] text-center shadow-md rounded-full bg-bkg cursor-pointer hover:bg-orange-200 transition-all duration-200`}
              onClick={() => handleOrderTypeBtnClick(t)}
            >
              {t} {count(t)}
            </div>
          ))}
        </div>
      </div>

      {/* Date Filters */}
      <div>
        <div>Dates</div>
      </div>

      {/* Store Filters */}
      <div>
        <div>Stores</div>
      </div>

      {/* Sub Depts */}
      <div>
      <div>Sub Departments</div>
      <div className="flex gap-1 flex-wrap">
        {ctx.uniqueSubs.map((s, i) => (
          <div
            key={i}
            className={`flex gap-1 rounded-full border border-content/40 shadow px-2 cursor-pointer hover:shadow-inner ${ctx.subKeysFilter.includes(s.key) ? "bg-orange-200" : "bg-custom-white"} transition-all duration-200`}
            onClick={() => hadleSubIdClick(s.key)}
          >
            <div>{s.desc}</div>
            <div className="font-medium">{currentCount(s.key)}</div>
          </div>
        ))}
        <div
          className={`flex gap-1 rounded-full border border-content/40 shadow px-2 ${ctx.subKeysFilter.length === 0 ? "bg-orange-200" : "bg-custom-white"} cursor-pointer hover:shadow-inner transition-all duration-200`}
          onClick={clearSubFilter}
        >
          <div>All</div>
          <div className="font-medium">{ctx.filteredOrders.length}</div>
        </div>
      </div>
      </div>
      {/* <div className="flex-1 overflow-y-auto no-scrollbar">
                {ctx.filteredAvailableOrders.map((ao, i) => (
                  <div
                    key={i}
                    className={`${activeFilter(ao)} py-0.5 hover:bg-orange-200 transition-all duration-200 cursor-pointer px-2 grid grid-cols-[1.6fr_1.1fr_0.9fr_0.9fr] gap-2 text-[11px]`}
                    onClick={() => handleRowClick(ao)}
                  >
                    <div>{formatDate(ao.order_date)}</div>
                    <div>{ao.order_type}</div>
                    <div>{ao.record_count}</div>
                    <div>{ao.storenumber}</div>
                  </div>
                ))}
              </div> */}

      <div className="mt-auto pt-2">
        <button
          className="btn-themeBlue py-1.5 text-[13px] w-full"
          onClick={() => {
            ctx.dispatch(setOrderFilters([]));
            ctx.dispatch(setTypeFilterArr([]));
            ctx.dispatch(setFilteredAvailableOrders(ctx.availableOrders));
            ctx.dispatch(setFilteredOrders(ctx.allOrders));
            ctx.dispatch(setSubKeysFilter([]));
          }}
        >
          All Orders
        </button>
      </div>
    </div>
  );
};

export default OrdersGridFilters;
