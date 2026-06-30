import { useSalesState } from "../hooks/useSalesState";
import { useAppDispatch } from "../../../hooks";

import Modal from "../../../components/Modal";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { useSalesActions } from "../hooks/useSalesActions";
import CompareCard from "./CompareCard";
import CompareSummary from "./CompareSummary";

const SubsCompareModal = () => {
  const dispatch = useAppDispatch();
  const actions = useSalesActions();
  const {
    compareSubsLeftCompare,
    compareSubsModalOpen,
    compareSubsRightCompare,
  } = useSalesState();

  const handleClose = () => {
    dispatch(actions.resetCompareSubs());
  };

  return (
    <Modal
      isOpen={compareSubsModalOpen}
      onClose={handleClose}
      modalClassName="bg-bkg w-[80%] grid grid-cols-[40%_59%] gap-4 min-h-[83vh] max-h-[100vh]"
    >
      <CompareSummary />
      {compareSubsLeftCompare.length && compareSubsRightCompare.length ? (
        <div className="flex h-full rounded-lg max-h-[95vh] overflow-hidden overflow-y-auto no-scrollbar">
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
