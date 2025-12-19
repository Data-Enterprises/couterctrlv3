import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setExportModalOpen } from "../../../features/priceSimSlice";
import { exportData } from "../../../utils/export";
import { exportHeaders } from ".";
import Modal from "../../../components/Modal";
import { formatDate } from "../../../utils";

const PriceSimExportModal = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.priceSim);
  const [fileName, setFileName] = useState<string>("");
  const [warning, setWarning] = useState<boolean>(false);

  const handleClose = () => {
    dispatch(setExportModalOpen(false));
  };

  const handleExport = () => {
    if (fileName.trim() === "") {
      setWarning(true);
      return;
    }
    setWarning(false);
    // Export data here
    exportData(
      state.rowData,
      exportHeaders,
      `${fileName}_${formatDate(new Date().toISOString())}.csv`
    );
    handleClose();
  };

  return (
    <Modal
      isOpen={state.exportModalOpen}
      onClose={handleClose}
      modalClassName="bg-bkg w-1/4"
    >
      <div className="">
        <div className="w-full text-center font-medium mb-2">
          {warning
            ? "Please enter a valid file name."
            : `Exporting ${state.rowData.length} items into .csv file`}
        </div>
        <div>
          <label className="text-xs font-medium pl-0.5">File Name</label>
          <input
            className="basic-input w-full bg-custom-white focus:border"
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            onFocus={() => setWarning(false)}
          />
        </div>
        <div className="flex justify-center gap-3 mt-4">
          <button
            data-testid="upc-export-modal-submit-btn"
            className="btn-themeGreen w-1/2"
            onClick={handleExport}
          >
            Submit
          </button>
          <button className="btn-themeOrange w-1/2" onClick={handleClose}>
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

export default PriceSimExportModal;
