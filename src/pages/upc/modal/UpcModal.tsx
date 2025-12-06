import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setFileName, reset } from "../../../features/upcModalSlice";

import Modal from "../../../components/Modal";
import TextInput from "../../../components/TextInput";
import ForecastRadios from "./ForecastRadios";
import PriceOptSelects from "./PriceOptSelects";
import TrendRadios from "./TrendRadios";

interface ForecastModalProps {
  handleExport: () => void;
}

const UpcModal = ({ handleExport }: ForecastModalProps) => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.upcModal);
  const onClose = () => dispatch(reset());
  const handleFileName = (e: string) => dispatch(setFileName(e));

  return (
    <Modal
      isOpen={state.openModal}
      onClose={onClose}
      className="pl-60 pb-40 select-none"
      modalClassName="bg-custom-white"
    >
      <div className="">
        <div className="w-full text-center font-medium mb-2">
          Export Data to .csv File
        </div>
        {state.type === "forecast" ? (
          <ForecastRadios />
        ) : state.type === "priceOpt" ? (
          <PriceOptSelects />
        ) : state.type === "trend" ? (
          <TrendRadios />
        ) : null}
        <TextInput
          isSimple={true}
          title="File Name"
          query={state.fileName}
          setText={handleFileName}
          name="csvFileName"
          type="text"
        />
        <div className="flex justify-center gap-3 mt-4">
          <button data-testid="upc-export-modal-submit-btn" className="btn-themeGreen w-1/2" onClick={handleExport}>
            Submit
          </button>
          <button className="btn-themeOrange w-1/2" onClick={onClose}>
            Cancel
          </button>
        </div>
        <div className="text-content/60 text-center text-sm translate-y-2">
          *file extension will be added automatically on submit
        </div>
      </div>
    </Modal>
  );
};

export default UpcModal;
