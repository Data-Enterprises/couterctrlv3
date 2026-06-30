import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getSaleTypes } from "../../api/lossPrevention";
import { resetCashierSlice, setSaleTypes } from "../../features/lossPreventionSlice";
import type { JsonError } from "../../interfaces";
import LPTablet from "./tablet/LPTablet";
import LpMobile from "./mobile/LpMobile";
import LPDesktop from "./desktop/LPDesktop";

const LossPrevention = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const cashier = useAppSelector((state) => state.lossPrevention);

  const getSaleTypesData = () => {
    if (cashier.saleTypes.length > 0) {
      dispatch(resetCashierSlice());
    }
    const [sm, sd, sy] = search.singleDate.split("/").map(Number);
    const end   = new Date(sy, sm - 1, sd);
    const start = new Date(sy, sm - 1, sd - 6);
    const fmt   = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue =
      search.type === "Group" ? search.lastGroup : search.lastStore;
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
          const saleTypes = j.sale_types;
          dispatch(setSaleTypes(saleTypes));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching sale types: " + err.message),
      );
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
