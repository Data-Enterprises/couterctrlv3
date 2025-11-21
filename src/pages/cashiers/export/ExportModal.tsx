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
      <div>Export Modal Content</div>
      <label htmlFor="filename">File Name</label>
      <input
        id="filename"
        type="text"
        className="basic-input focus:border w-full mb-4 bg-custom-white"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
      />
      <div className="flex gap-4">
        <button className="btn-themeBlue w-full" onClick={handleExport}>
          Export
        </button>
        <button className="btn-themeOrange w-full" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default ExportModal;
