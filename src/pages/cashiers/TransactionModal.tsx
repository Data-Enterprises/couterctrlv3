import { useAppSelector, useAppDispatch } from "../../hooks";
import { setTransModalOpen } from "../../features/cashierSlice";
import Modal from "../../components/Modal";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import Transaction from "./Transaction";

const TransactionModal = () => {
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((state) => state.cashier);

  return (
    <Modal
      isOpen={cashier.transModalOpen}
      modalClassName="bg-custom-white w-1/3 relative no-scrollbar max-h-[80vh] overflow-y-auto p-2 rounded-lg shadow-lg"
      onClose={() => dispatch(setTransModalOpen(false))}
    >
      {cashier.transactionDrillDown.length === 0 ? (
        <div className="h-[320px]">
          <LoadingIndicator message="Fetching transaction..." />
        </div>
      ) : (
        <div className="space-y-4">
          {cashier.transactionDrillDown.map((transaction, i) => (
            <Transaction key={i} trans={transaction} />
          ))}
        </div>
      )}
    </Modal>
  );
};

export default TransactionModal;
