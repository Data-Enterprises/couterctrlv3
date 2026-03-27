import { useAppSelector, useAppDispatch } from "../../hooks";
import { setTransModalOpen } from "../../features/lossPreventionSlice";
import Modal from "../../components/Modal";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import Transaction from "./Transaction";

const TransactionModal = () => {
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((state) => state.lossPrevention);

  return (
    <Modal
      isOpen={cashier.transModalOpen}
      modalClassName="bg-custom-white w-[45%] relative no-scrollbar max-h-[80vh] overflow-y-auto p-2 rounded-lg shadow-lg"
      onClose={() => dispatch(setTransModalOpen(false))}
    >
      {cashier.noRowsReturned && (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-center text-gray-500 mt-4">
            No transactions found
          </p>
        </div>
      )}
      {cashier.transactionDrillDown.length === 0 && !cashier.noRowsReturned ? (
        <div className="h-[320px]">
          <LoadingIndicator message="Fetching transaction..." />
        </div>
      ) : (
        <div data-testid="trans-modal" className="space-y-4">
          {cashier.transactionDrillDown.map((transaction, i) => (
            <Transaction key={i} trans={transaction} />
          ))}
        </div>
      )}
    </Modal>
  );
};

export default TransactionModal;
