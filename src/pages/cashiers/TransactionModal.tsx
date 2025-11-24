import { useAppSelector, useAppDispatch } from "../../hooks";
import { setTransModalOpen } from "../../features/cashierSlice";
import Modal from "../../components/Modal";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import Transaction from "./Transaction";
// import Carousel from "../../components/Carousel";

const TransactionModal = () => {
  const dispatch = useAppDispatch();
  const { transactionDrillDown, transModalOpen } = useAppSelector(
    (state) => state.cashier
  );

  return (
    <Modal
      isOpen={transModalOpen}
      modalClassName="bg-custom-white w-1/3 relative no-scrollbar h-[80vh] overflow-y-auto p-2 rounded-lg shadow-lg"
      onClose={() => dispatch(setTransModalOpen(false))}
    >
      {transactionDrillDown.length === 0 ? (
        <div className="h-[320px]">
          <LoadingIndicator message="Fetching transaction..." />
        </div>
      ) : (
        // <Carousel className="max-h-[660px]">
        //   {transactionDrillDown.map((transaction, i) => (
        //     <Transaction key={i} trans={transaction} />
        //   ))}
        // </Carousel>
        <div className="space-y-4">
          {transactionDrillDown.map((transaction, i) => (
            <Transaction key={i} trans={transaction} />
          ))}
        </div>
      )}
    </Modal>
  );
};

export default TransactionModal;
