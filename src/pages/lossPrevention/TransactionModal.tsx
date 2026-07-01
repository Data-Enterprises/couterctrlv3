import { useAppSelector, useAppDispatch } from "../../hooks";
import { useLPState } from "./hooks/useLPState";
import { useLPActions } from "./hooks/useLPActions";
import Modal from "../../components/Modal";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import Transaction from "./Transaction";

const TransactionModal = () => {
  const dispatch = useAppDispatch();
  const lp = useLPState();
  const actions = useLPActions();
  const {isMobile, isTablet} = useAppSelector((state) => state.app);

  return (
    <Modal
      isOpen={lp.transModalOpen}
      className={`${isMobile ? "-ml-12 px-2" : ''}`}
      modalClassName={`bg-custom-white ${isMobile ? "w-[90%] ml-12 translate-x-2" : isTablet ? "w-[80%]" : "w-[38%]"} relative no-scrollbar max-h-[80vh] overflow-y-auto p-2 rounded-lg shadow-lg`}
      onClose={() => dispatch(actions.setTransModalOpen(false))}
    >
      {lp.noRowsReturned && (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-center text-gray-500 mt-4">
            No transactions found
          </p>
        </div>
      )}
      {lp.transactionDrillDown.length === 0 && !lp.noRowsReturned ? (
        <div className="h-[320px]">
          <LoadingIndicator message="Fetching transaction..." />
        </div>
      ) : (
        <div data-testid="trans-modal" className="space-y-4">
          {lp.transactionDrillDown.map((transaction, i) => (
            <Transaction key={i} trans={transaction} />
          ))}
        </div>
      )}
    </Modal>
  );
};

export default TransactionModal;
