import Modal from "../../../components/Modal";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setSearchString } from "../../../features/lossPreventionSlice";

interface DescModalProps {
  open: boolean;
  onClose: () => void;
  handleSubmit: (description: string) => void;
}

const DescModal = ({ open, onClose, handleSubmit }: DescModalProps) => {
  const cashier = useAppSelector((state) => state.lossPrevention);
  const dispatch = useAppDispatch();

  const handleClose = () => {
    onClose();
  };

  const onSubmit = () => {
    handleSubmit(cashier.searchString);
  };

  return (
    <Modal isOpen={open} onClose={handleClose}>
      <div>
        <label htmlFor="desc-input" className="font-medium text-sm pl-0.5">
          What are you looking for?
        </label>
        <input
          data-testid="desc-input"
          id="desc-input"
          className="basic-input focus:border bg-custom-white"
          value={cashier.searchString}
          onChange={(e) => dispatch(setSearchString(e.target.value))}
        />
      </div>
      <div className="flex mt-4 gap-2">
        <button
          data-testid="desc-submit-btn"
          className="btn-themeBlue w-1/2"
          onClick={onSubmit}
        >
          Submit
        </button>
        <button className="btn-themeOrange w-1/2" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default DescModal;
