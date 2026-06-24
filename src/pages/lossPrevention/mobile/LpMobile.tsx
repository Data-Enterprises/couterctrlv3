import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { resetCashierSlice, setViewTransactionsMobile } from "../../../features/lossPreventionSlice";
import SearchCard from "../../../components/SearchCard";
import StoreListMobile from "./StoreListMobile";
import TransactionsMobile from "./TransactionsMobile";

interface Props {
  getSaleTypes: () => void;
}

const LpMobile = ({ getSaleTypes }: Props) => {
  const dispatch = useAppDispatch();
  const { saleTypes, viewTransactionsMobile } = useAppSelector((state) => state.lossPrevention);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  if (!saleTypes.length) {
    return (
      <SearchCard
        title="Loss prevention"
        description="Select a store or group and date range to view exception activity."
        buttonLabel="Load exceptions"
        onSearch={getSaleTypes}
        loading={false}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden flex flex-col bg-custom-white">
      {viewTransactionsMobile ? (
        <TransactionsMobile
          onBack={() => dispatch(setViewTransactionsMobile(false))}
          onOpenSearch={() => setSearchModalOpen(true)}
        />
      ) : (
        <StoreListMobile
          onBack={() => dispatch(resetCashierSlice())}
          onOpenSearch={() => setSearchModalOpen(true)}
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
              onSearch={() => { setSearchModalOpen(false); dispatch(resetCashierSlice()); getSaleTypes(); }}
              loading={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LpMobile;
