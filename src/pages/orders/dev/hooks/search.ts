// Hooks
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useOrdersCtx } from ".";

// Redux
import {
  setAllOrders,
  setLoadingAllOrders,
  clearOrdersFilters,
  setUniqueSubs,
  type UniqueSub,
} from "../../../../features/dev/devOrdersSlice";
import { setSelectedGroupStores } from "../../../../features/userSlice";
import { isGroupSearch } from "../../../../features/searchSlice";

// API
import { getAllOrders } from "../../../../api/orders";
import { getStoresAssignedToUserGroup } from "../../../../api/groups";

// Utils
import { formatGoliathDate } from "../../../../utils";
import { getCogs, getERet } from "../utils";
import { reasonOf } from "../../../../utils/serverError";

// Interfaces
import type {
  AllOrderResp,
  Store,
  UpdateFileResp,
} from "../../../../interfaces";
import type { OrderDraft } from "../interfaces";

/**
 * The search: a group's active stores (or the one store), then every line in
 * the range in one call, each line's retail, cost and margin derived the way
 * the old per-order fetch did. A new search drops the drafts and the receipt.
 */
export const useOrdersSearch = (
  setNotice: (notice: string | undefined) => void,
  setDraft: (next: OrderDraft | null) => void,
  setReceipt: (receipt: UpdateFileResp | null) => void,
) => {
  const ctx = useOrdersCtx();
  const toast = useToast();

  const handleSearch = () => {
    if (isGroupSearch(ctx.type)) {
      getStoresAssignedToUserGroup(
        ctx.url,
        ctx.token,
        ctx.userid,
        ctx.lastGroup,
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            // `active` rides the group response, not Store itself.
            const activeStores = (
              j.stores as (Store & { active?: boolean })[]
            ).filter((s) => s.active);
            ctx.dispatch(setSelectedGroupStores(activeStores));
            fetchAllLines(activeStores.map((s: Store) => s.storeid));
          } else {
            toast.warn(j.msg);
          }
        })
        .catch((err) => toast.error(reasonOf(err)));
    } else {
      fetchAllLines([ctx.lastStore]);
    }
  };

  /**
   * Every line item in the range, in one call.
   *
   * No order type and no single date: the whole point is that the panel
   * decides those afterwards, out of what actually came back.
   */
  const fetchAllLines = (storeids: number[]) => {
    setNotice(undefined);
    setDraft(null);
    setReceipt(null);
    ctx.dispatch(clearOrdersFilters());
    ctx.dispatch(setAllOrders([]));
    ctx.dispatch(setLoadingAllOrders(true));

    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);

    getAllOrders(ctx.url, ctx.token, start, end, storeids)
      .then((resp) => {
        const j: AllOrderResp = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg);
          return;
        }
        if (j.orders.length === 0) {
          setNotice("No orders came back for this search.");
          return;
        }

        // Same per-line derivation the old per-order fetch did, so a line
        // means the same thing it always did.
        const lines = j.orders.map((o) => {
          const base_cost = o.base_cost ?? 0;
          const net_cost = o.net_cost ?? 0;
          const weight = o.weight ?? 0;
          const casesize = o.casesize ?? 0;
          const e_ret = getERet(
            o.qty,
            weight,
            o.active_retail_price,
            o.scalable,
          );
          const cogs = getCogs(base_cost, o.qty, o.scalable, weight, casesize);
          return {
            ...o,
            e_ret,
            base_cost,
            net_cost,
            weight,
            casesize,
            cogs,
            rev: e_ret - cogs,
          };
        });

        const uniqueSubs = lines.reduce((acc: UniqueSub[], o) => {
          const found = acc.find((a) => a.subId === o.sub_department);
          if (found) found.count += 1;
          else
            acc.push({
              desc: o.sub_department_description ?? "null",
              subId: o.sub_department,
              count: 1,
            });
          return acc;
        }, []);

        ctx.dispatch(setUniqueSubs(uniqueSubs));
        ctx.dispatch(setAllOrders(lines));
      })
      .catch((err) => toast.error(reasonOf(err)))
      .finally(() => ctx.dispatch(setLoadingAllOrders(false)));
  };

  return { handleSearch };
};
