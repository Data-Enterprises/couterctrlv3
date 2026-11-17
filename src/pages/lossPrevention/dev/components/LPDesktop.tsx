// Hooks
import { useState } from "react";
import { useLossPreventionCtx } from "../hooks";
import { useLPDesktop } from "../hooks/desktop";

// Components
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import SearchCard from "../../../../components-dev/SearchCard";
import SearchPopup from "../../../../components-dev/SearchPopup";
import LPTransactionPanel from "../transactions/LPTransactionPanel";
import LPStorePanel from "./LPStorePanel";

interface LPDesktopProps {
  getSaleTypes: () => void;
}

/** The desktop Loss Prevention page: the search card until exception types load, then the
 *  graded store list on the left and the picked store's cashiers and transactions on the
 *  right. Owns the fetches for an exception type, a single day and a store's transactions. */
const LPDesktop = ({ getSaleTypes }: LPDesktopProps) => {
  const cashier = useLossPreventionCtx();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const {
    loading,
    handleSaleTypeSelect,
    handleDaySelect,
    handleStoreSelect,
    handleTransactionClick,
    handleShowAll,
  } = useLPDesktop();

  // Checked before the entry card, matching Sales / Sub Dept Margins / Coupon
  // Sales: the Performance pages drop the card entirely for a full-page
  // indicator while their first fetch runs. On failure loadingSaleTypes goes
  // false with saleTypes still empty, so this falls straight back to the card.
  if (cashier.loadingSaleTypes) {
    return (
      <div className="w-full h-[calc(100vh-3rem)] relative">
        <LoadingIndicator message="Loading exception types..." />
      </div>
    );
  }

  if (!cashier.saleTypes.length) {
    return (
      <div className="h-[calc(100vh-3rem)] overflow-hidden flex items-center justify-center bg-bkg">
        <div className="w-full max-w-sm mx-4">
          <SearchCard
            title="Loss Prevention"
            description="Select a store and date to find exception activity."
            buttonLabel="Load exceptions"
            singleDate={true}
            onSearch={getSaleTypes}
            loading={cashier.loadingSaleTypes}
            loadingMessage="Finding exception types..."
            notice={
              cashier.noSaleTypesFound
                ? "No sale types came back for this search."
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-4">
      <LPStorePanel
        loading={loading}
        onDaySelect={handleDaySelect}
        onSaleTypeSelect={handleSaleTypeSelect}
        onStoreSelect={handleStoreSelect}
        onOpenSearch={() => setSearchModalOpen(true)}
      />
      <LPTransactionPanel
        onTransactionClick={handleTransactionClick}
        onShowAll={handleShowAll}
      />
      {searchModalOpen && (
        <SearchPopup onClose={() => setSearchModalOpen(false)}>
          <SearchCard
            title="Loss Prevention"
            description="Select a store and date to find exception activity."
            buttonLabel="Load exceptions"
            singleDate={true}
            onSearch={() => {
              setSearchModalOpen(false);
              getSaleTypes();
            }}
            loading={false}
          />
        </SearchPopup>
      )}
    </div>
  );
};

export default LPDesktop;
