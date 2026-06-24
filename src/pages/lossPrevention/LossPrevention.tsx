import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getSaleTypes } from "../../api/lossPrevention";
import { formatGoliathDate } from "../../utils";
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
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue =
      search.type === "Group" ? search.lastGroup : search.lastStore;
    getSaleTypes(
      context.url,
      context.token,
      formatGoliathDate(search.startDate),
      formatGoliathDate(search.endDate),
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
