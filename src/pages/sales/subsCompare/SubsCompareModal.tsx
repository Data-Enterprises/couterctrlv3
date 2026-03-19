import { useAppSelector, useAppDispatch } from "../../../hooks";

import Modal from "../../../components/Modal";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { resetCompareSubs } from "../../../features/salesSlice";
import CompareCard from "./CompareCard";

const SubsCompareModal = () => {
  const dispatch = useAppDispatch();
  const {
    compareSubsLeftCompare,
    compareSubsModalOpen,
    compareSubsRightCompare,
  } = useAppSelector((state) => state.sales);

  const handleClose = () => {
    dispatch(resetCompareSubs());
  };

  return (
    <Modal
      isOpen={compareSubsModalOpen}
      onClose={handleClose}
      modalClassName="bg-bkg w-[45%] min-h-[70vh] max-h-[70vh] overflow-hidden"
    >
      {compareSubsLeftCompare.length && compareSubsRightCompare.length ? (
        <div className="flex h-full max-h-[66.5vh] rounded-lg overflow-hidden overflow-y-auto no-scrollbar ">
          <div className="mr-2 text-sm rounded-lg w-1/2 space-y-2">
            {compareSubsLeftCompare.map((sub, i) => (
              <CompareCard
                key={i}
                data={sub}
                compareData={compareSubsRightCompare[i]}
              />
            ))}
          </div>
          <div className="ml-2 text-sm w-1/2 space-y-2">
            {compareSubsRightCompare.map((sub, i) => (
              <CompareCard
                key={i}
                data={sub}
                compareData={compareSubsLeftCompare[i]}
              />
            ))}
          </div>
        </div>
      ) : (
        <LoadingIndicator />
      )}
    </Modal>
  );
};

export default SubsCompareModal;
