import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setTransModalOpen } from "../../../features/cashiersSlice";
import Modal from "../../../components/Modal";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import Transaction from "./Transaction";

const TransactionModal = () => {
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((state) => state.cashier);

  return (
    <Modal
      isOpen={cashier.transModalOpen}
      modalClassName="bg-custom-white w-[40%] relative no-scrollbar max-h-[80vh] overflow-y-auto p-2 rounded-lg shadow-lg"
      onClose={() => dispatch(setTransModalOpen(false))}
    >
      {cashier.noTransactions && (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-center text-gray-500 mt-4">
            No transactions found
          </p>
        </div>
      )}
      {cashier.transDrillDown.length === 0 && !cashier.noTransactions ? (
        <div className="h-[320px]">
          <LoadingIndicator message="Fetching transaction..." />
        </div>
      ) : (
        <div data-testid="trans-modal" className="space-y-4">
          {cashier.transDrillDown.map((transaction, i) => (
            <Transaction key={i} trans={transaction} />
          ))}
        </div>
      )}
    </Modal>
  );
};

export default TransactionModal;
