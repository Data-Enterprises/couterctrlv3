import { useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useAppSelector } from "../../../hooks";
import { resetCashierSlice } from "../../../features/lossPreventionSlice";
import SearchCard from "../../../components/SearchCard";
import StoreListMobile from "./StoreListMobile";
import CashierListMobile from "./CashierListMobile";
import TransactionsMobile from "./TransactionsMobile";

type Screen = "stores" | "cashiers" | "transactions";

interface Props {
  getSaleTypes: () => void;
}

const LpMobile = ({ getSaleTypes }: Props) => {
  const dispatch = useAppDispatch();
  const { saleTypes } = useAppSelector((state) => state.lossPrevention);
  const [screen, setScreen] = useState<Screen>("stores");

  const handleSearch = () => {
    setScreen("stores");
    dispatch(resetCashierSlice());
    getSaleTypes();
  };

  return (
    <div className="h-[calc(100dvh-3rem)] overflow-hidden flex flex-col bg-custom-white">
      <SearchCard
        top
        title="Loss prevention"
        description="Select a store and date to view exception activity."
        buttonLabel="Load exceptions"
        singleDate
        onSearch={handleSearch}
        loading={false}
      />
      {saleTypes.length > 0 && (
        <div className="flex-1 overflow-hidden">
          {screen === "transactions" ? (
            <TransactionsMobile
              onBack={() => setScreen("cashiers")}
              onOpenSearch={() => {}}
            />
          ) : screen === "cashiers" ? (
            <CashierListMobile
              onBack={() => setScreen("stores")}
              onSelectCashier={() => setScreen("transactions")}
            />
          ) : (
            <StoreListMobile
              onOpenSearch={() => {}}
              onStoreSelected={() => setScreen("cashiers")}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default LpMobile;
