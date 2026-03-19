import { useAppSelector, useAppDispatch } from "../../../hooks";

import Modal from "../../../components/Modal";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { resetCompareSubs } from "../../../features/salesSlice";

const SubsCompareModal = () => {
  const dispatch = useAppDispatch();
  const { compareSubsLeftCompare, compareSubsModalOpen } = useAppSelector(
    (state) => state.sales,
  );

  const handleClose = () => {
    dispatch(resetCompareSubs());
  };

  return (
    <Modal isOpen={compareSubsModalOpen} onClose={handleClose} modalClassName="bg-custom-white w-[30%] h-[70vh]">
      {compareSubsLeftCompare.length ? <div>Howdy</div> : <LoadingIndicator />}
    </Modal>
  );
};

export default SubsCompareModal;
