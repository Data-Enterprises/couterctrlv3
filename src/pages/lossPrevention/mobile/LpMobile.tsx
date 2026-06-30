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
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  if (!saleTypes.length) {
    return (
      <SearchCard
        title="Loss prevention"
        description="Select a store and date to view exception activity."
        buttonLabel="Load exceptions"
        singleDate={true}
        onSearch={getSaleTypes}
        loading={false}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden flex flex-col bg-custom-white">
      {screen === "transactions" ? (
        <TransactionsMobile
          onBack={() => setScreen("cashiers")}
          onOpenSearch={() => setSearchModalOpen(true)}
        />
      ) : screen === "cashiers" ? (
        <CashierListMobile
          onBack={() => setScreen("stores")}
          onSelectCashier={() => setScreen("transactions")}
        />
      ) : (
        <StoreListMobile
          onOpenSearch={() => setSearchModalOpen(true)}
          onStoreSelected={() => setScreen("cashiers")}
        />
      )}

      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <SearchCard
              title="Loss prevention"
              description="Select a store or group and date range to view exception activity."
              buttonLabel="Load exceptions"
              onSearch={() => {
                setSearchModalOpen(false);
                setScreen("stores");
                dispatch(resetCashierSlice());
                getSaleTypes();
              }}
              loading={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LpMobile;
