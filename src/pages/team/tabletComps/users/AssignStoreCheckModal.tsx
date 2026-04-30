import Modal from "../../../../components/Modal";

interface AssignStoreCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
const AssignStoreCheckModal = ({
  isOpen,
  onClose,
  onConfirm,
}: AssignStoreCheckModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      modalClassName="bg-custom-white w-full max-w-md md:max-w-lg p-5 md:p-6 rounded-2xl shadow-xl"
      allowClickOutside={false}
    >
      <div className="space-y-4 text-center">
        <div className="font-medium text-lg md:text-xl leading-6">
          Would you like to assign stores to this user now?
        </div>

        <div className="space-y-1 text-sm  text-content/60 leading-6">
          <p>
            Selecting yes will direct you to the available stores for
            assignment.
          </p>
          <p>Selecting no will create the user and reset the form.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
          <button
            className="btn-themeOrange min-h-11 md:min-h-12"
            onClick={onClose}
          >
            No
          </button>
          <button
            className="btn-themeBlue min-h-11 md:min-h-12"
            onClick={onConfirm}
          >
            Yes
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AssignStoreCheckModal;
