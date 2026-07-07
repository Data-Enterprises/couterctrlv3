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

  // Re-search from within results: clear loaded data to return to the entry card
  const handleNewSearch = () => {
    setScreen("stores");
    dispatch(resetCashierSlice());
  };

  // Entry screen — full-page SearchCard until exception data has loaded
  if (saleTypes.length === 0) {
    return (
      <div className="h-[calc(100dvh-3rem)] overflow-y-auto bg-custom-white">
        <SearchCard
          top
          title="Loss prevention"
          description="Select a store and date to view exception activity."
          buttonLabel="Load exceptions"
          singleDate
          onSearch={handleSearch}
          loading={false}
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-3rem)] overflow-hidden flex flex-col bg-custom-white">
      <div className="flex-1 overflow-hidden">
        {screen === "transactions" ? (
          <TransactionsMobile
            onBack={() => setScreen("cashiers")}
            onOpenSearch={handleNewSearch}
          />
        ) : screen === "cashiers" ? (
          <CashierListMobile
            onBack={() => setScreen("stores")}
            onSelectCashier={() => setScreen("transactions")}
          />
        ) : (
          <StoreListMobile
            onOpenSearch={handleNewSearch}
            onStoreSelected={() => setScreen("cashiers")}
          />
        )}
      </div>
    </div>
  );
};

export default LpMobile;
