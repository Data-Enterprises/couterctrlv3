import { useEffect } from "react";
import Modal from "../../../components/Modal";
import { useAppSelector } from "../../../hooks";
import ForecastSetupWizard, { type WizardProps } from "./ForecastSetupWizard";

interface ForecastSettingsModalProps extends WizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForecastSettingsModal = ({
  isOpen,
  onClose,
  ...wizardProps
}: ForecastSettingsModalProps) => {
  const { initialRowData, isLoading } = useAppSelector((s) => s.forecast);

  // Close the modal once a new search completes successfully
  useEffect(() => {
    if (isOpen && initialRowData.length > 0 && !isLoading) {
      onClose();
    }
  }, [initialRowData.length, isLoading]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      modalClassName="bg-custom-white w-[65%] max-w-3xl"
    >
      <div className="bg-custom-white rounded-xl overflow-hidden">
        <div className="bg-blue-500 text-custom-white text-[13px] font-medium px-4 py-2 flex items-center justify-between">
          <span>Forecast Settings</span>
          <button
            onClick={onClose}
            className="text-custom-white/70 hover:text-custom-white text-lg leading-none"
          >
            ×
          </button>
        </div>
        <ForecastSetupWizard {...wizardProps} />
      </div>
    </Modal>
  );
};

export default ForecastSettingsModal;
