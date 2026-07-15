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
  const { saleTypes, noSaleTypesFound } = useAppSelector((state) => state.lossPrevention);
  const [screen, setScreen] = useState<Screen>("stores");
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = () => {
    setScreen("stores");
    setShowSearch(false);
    dispatch(resetCashierSlice());
    getSaleTypes();
  };

  // Re-open the search card without clearing already-loaded data — the
  // SearchCard's "already loaded" shortcut lets the user jump straight back
  // instead of forcing a re-fetch if this was tapped by accident.
  const handleOpenSearch = () => {
    setShowSearch(true);
  };

  const hasData = saleTypes.length > 0;

  // Entry screen — full-page SearchCard until exception data has loaded
  if (saleTypes.length === 0 || showSearch) {
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
          onBack={hasData ? () => setShowSearch(false) : undefined}
          notice={
            noSaleTypesFound
              ? "No sale types came back for this search."
              : undefined
          }
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
            onOpenSearch={handleOpenSearch}
          />
        ) : screen === "cashiers" ? (
          <CashierListMobile
            onBack={() => setScreen("stores")}
            onSelectCashier={() => setScreen("transactions")}
          />
        ) : (
          <StoreListMobile
            onOpenSearch={handleOpenSearch}
            onStoreSelected={() => setScreen("cashiers")}
          />
        )}
      </div>
    </div>
  );
};

export default LpMobile;
