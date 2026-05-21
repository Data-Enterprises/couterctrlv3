import type { ColDef } from "ag-grid-community";
import Modal from "../../components/Modal";
import { useState } from "react";
import { formatDate } from "../../utils";
import { exportData } from "../../utils/export";
import { useToast } from "../../components/toasts/hooks/useToast";

interface ExportModalProps<T extends Record<string, any>> {
  isOpen: boolean;
  onClose: () => void;
  data: T[];
  columns: ColDef<T>[];
}

const ExportModal = <T extends Record<string, any>>({
  isOpen,
  onClose,
  data,
  columns,
}: ExportModalProps<T>) => {
  const toast = useToast();
  const [fileName, setFileName] = useState<string>("");

  const handleExport = () => {
    if (fileName.trim() === "") {
      toast.warn("Please enter a valid file name.");
      return;
    }

    exportData(
      data,
      columns,
      `${fileName}_${formatDate(new Date().toISOString())}.csv`,
    );

    toast.success("Export successful");

    handleClose();
  };

  const handleClose = () => {
    setFileName("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      modalClassName="bg-custom-white w-1/4 text-sm"
    >
      <label htmlFor="filename" className="underline">File Name</label>
      <input
        data-testid="export-modal-filename-input"
        id="filename"
        type="text"
        className="basic-input focus:border w-full mb-3 bg-custom-white text-sm py-1.5"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
      />
      <div className="flex gap-4">
        <button
          data-testid="export-modal-export"
          className="btn-themeGreen w-full text-[13.5px] py-1.5"
          onClick={handleExport}
        >
          Submit
        </button>
        <button
          data-testid="export-modal-cancel"
          className="btn-themeOrange w-full text-[13.5px] py-1.5"
          onClick={handleClose}
        >
          Cancel
        </button>
      </div>
      <div className="text-content/60 text-center text-sm translate-y-2">
        *file extension will be added automatically on submit
      </div>
    </Modal>
  );
};

export default ExportModal;
