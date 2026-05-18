import type { ColDef } from "ag-grid-community";
import Modal from "../../../components/Modal";
import { useState } from "react";
import { formatDate } from "../../../utils";
import { exportData } from "../../../utils/export";
import { useToast } from "../../../components/toasts/hooks/useToast";

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
      `${fileName}_${formatDate(new Date().toISOString())}.csv`
    );

    handleClose();
  };

  const handleClose = () => {
    setFileName("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <label htmlFor="filename" className="text-[12px] md:text-sm font-medium">File Name</label>
      <input
        data-testid="cashier-export-modal-filename-input"
        id="filename"
        type="text"
        className="basic-input py-1 text-[13px] md:text-sm md:py-1.5 focus:border w-full mb-2 md:mb-4 bg-custom-white"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
      />
      <div className="flex gap-4">
        <button
          data-testid="cashier-export-modal-export"
          className="btn-themeBlue px-0 text-[13px] py-1 md:py-1.5 md:text-sm w-full"
          onClick={handleExport}
        >
          Export
        </button>
        <button
          data-testid="cashier-export-modal-cancel"
          className="btn-themeOrange px-0 text-[13px] py-1 md:py-1.5 md:text-sm w-full"
          onClick={handleClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default ExportModal;
