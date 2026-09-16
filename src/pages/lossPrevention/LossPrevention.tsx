import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getSaleTypes } from "../../api/lossPrevention";
import { useApiContext } from "../hooks";
import EventPerfMobile from "../shared/eventPerf/EventPerfMobile";
import { fetchLpEvents, fetchLpReceipt } from "../shared/eventPerf/lpAdapter";
import { LP_MOBILE_INFO } from "./lpInfo";
import {
  resetCashierSlice,
  setSaleTypes,
  setNoSaleTypesFound,
  setLoadingSaleTypes,
} from "../../features/lossPreventionSlice";
import type { JsonError } from "../../interfaces";
import LPTablet from "./tablet/LPTablet";
import LPDesktop from "./desktop/LPDesktop";
import { isGroupSearch } from "../../features/searchSlice";

const LossPrevention = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const { assignedStores, selectedGroupStores } = useAppSelector(
    (state) => state.user,
  );
  const api = useApiContext();

  const getSaleTypesData = () => {
    // Deliberately NOT reset here. Wiping the slice up front leaves a window
    // where the panels are gone but loading has not flipped, and the page
    // drops to the entry card mid-search. Sales keeps its rows until the new
    // ones land; the reset now happens in the success branch below.
    const [sm, sd, sy] = search.singleDate.split("/").map(Number);
    const end = new Date(sy, sm - 1, sd);
    const start = new Date(sy, sm - 1, sd - 6);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const useGroups = isGroupSearch(search.type) ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = isGroupSearch(search.type)
      ? search.lastGroup
      : search.lastStore;

    // Group searches are the slow ones, and until this landed the card sat
    // inert while the call ran — no spinner, button still live, which reads as
    // a dead button rather than a pending request.
    dispatch(setLoadingSaleTypes(true));
    // Cleared on every search: leaving it set means a later failure shows
    // this notice describing the *previous* search alongside the error toast.
    dispatch(setNoSaleTypesFound(false));
    getSaleTypes(
      context.url,
      context.token,
      fmt(start),
      fmt(end),
      useGroups,
      searchValue,
      singleStore,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          // const saleTypes = [...j.sale_types, { sale_type: "Description" }];
          const saleTypes = j.sale_types.filter(
            (st: { sale_type: string }) => st.sale_type !== "Tender",
          );
          // Batched with setSaleTypes, so the old store's details and selected
          // sale type clear and the new types arrive in the same render — the
          // panels never blink through an empty state. Clearing
          // selectedSaleType is also what re-arms the auto-select effect.
          dispatch(resetCashierSlice());
          dispatch(setNoSaleTypesFound(saleTypes.length === 0));
          dispatch(setSaleTypes(saleTypes));
        } else {
          toast.warn(j.msg);
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching sale types: " + err.message),
      )
      .finally(() => dispatch(setLoadingSaleTypes(false)));
  };

  // Mobile shares one ungraded screen with Coupon Sales. It owns its own
  // fetch, so the sale-type preflight above never runs on this path.
  if (context.isMobile) {
    return (
      <EventPerfMobile
        pageKey="lossPrevention"
        start={api.lpStart}
        end={api.lpEnd}
        title="Loss prevention"
        description="Select a store or group and a week ending date."
        buttonLabel="Load exceptions"
        allLabel="All exceptions"
        measure="transactions"
        load={(start, end, onProgress) =>
          fetchLpEvents(
            {
              url: api.url,
              token: api.token,
              start,
              end,
              baseStart: api.lpBaseStart,
              baseEnd: api.lpBaseEnd,
              useGroups: api.useGroups,
              searchValue: api.searchValue,
              singleStore: api.singleStore,
              assignedStores,
              groupStores: selectedGroupStores,
            },
            onProgress,
          )
        }
        info={LP_MOBILE_INFO}
        loadReceipt={(saleId, day, storeid) =>
          fetchLpReceipt(
            { url: api.url, token: api.token },
            saleId,
            day,
            storeid,
          )
        }
      />
    );
  }

  if (context.isTablet) {
    return <LPTablet getSaleTypes={getSaleTypesData} />;
  }

  return <LPDesktop getSaleTypes={getSaleTypesData} />;
};

export default LossPrevention;
