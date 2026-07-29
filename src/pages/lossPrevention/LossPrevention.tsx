import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getSaleTypes } from "../../api/lossPrevention";
import {
  resetCashierSlice,
  setSaleTypes,
  setNoSaleTypesFound,
  setLoadingSaleTypes,
} from "../../features/lossPreventionSlice";
import type { JsonError } from "../../interfaces";
import LPTablet from "./tablet/LPTablet";
import LpMobile from "./mobile/LpMobile";
import LPDesktop from "./desktop/LPDesktop";

const LossPrevention = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);

  const getSaleTypesData = () => {
    // Deliberately NOT reset here. Wiping the slice up front leaves a window
    // where the panels are gone but loading has not flipped, and the page
    // drops to the entry card mid-search. Sales keeps its rows until the new
    // ones land; the reset now happens in the success branch below.
    const [sm, sd, sy] = search.singleDate.split("/").map(Number);
    const end   = new Date(sy, sm - 1, sd);
    const start = new Date(sy, sm - 1, sd - 6);
    const fmt   = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue =
      search.type === "Group" ? search.lastGroup : search.lastStore;

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

  if (context.isMobile) {
    return <LpMobile getSaleTypes={getSaleTypesData} />;
  }

  if (context.isTablet) {
    return <LPTablet getSaleTypes={getSaleTypesData} />;
  }

  return <LPDesktop getSaleTypes={getSaleTypesData} />;
};

export default LossPrevention;
