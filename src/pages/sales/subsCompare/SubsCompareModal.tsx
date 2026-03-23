import { useAppSelector, useAppDispatch } from "../../../hooks";

import Modal from "../../../components/Modal";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { resetCompareSubs } from "../../../features/salesSlice";
import CompareCard from "./CompareCard";
import CompareSummary from "./CompareSummary";

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
      modalClassName="bg-bkg w-[70%] grid grid-cols-[1fr_2fr] gap-4 min-h-[96vh] max-h-[96vh]"
    >
      <CompareSummary />
      {compareSubsLeftCompare.length && compareSubsRightCompare.length ? (
        <div className="flex h-full rounded-lg max-h-[92.3vh] overflow-hidden overflow-y-auto no-scrollbar">
          <div className="mr-2 text-sm rounded-lg w-1/2 space-y-2">
            {compareSubsLeftCompare.map((sub, i) => (
              <CompareCard
                key={i}
                data={sub}
                compareData={compareSubsRightCompare[i]}
                side="left"
              />
            ))}
          </div>
          <div className="ml-2 text-sm w-1/2 space-y-2">
            {compareSubsRightCompare.map((sub, i) => (
              <CompareCard
                key={i}
                data={sub}
                compareData={compareSubsLeftCompare[i]}
                side="right"
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
