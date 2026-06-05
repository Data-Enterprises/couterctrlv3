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
  totalsLine?: string;
}

const ExportModal = <T extends Record<string, any>>({
  isOpen,
  onClose,
  data,
  columns,
  totalsLine = "",
}: ExportModalProps<T>) => {
  const toast = useToast();
  const [fileName, setFileName] = useState<string>("");

  const handleExport = () => {
    if (fileName.trim() === "") {
      toast.warn("Please enter a valid file name.");
      return;
    }

    const exportCols = columns
      .filter(
        (col): col is ColDef<T> & { headerName: string } =>
          typeof col.headerName === "string",
      )
      .map((col) => ({ headerName: col.headerName, field: col.field ?? "" }));

    exportData(
      data,
      exportCols,
      `${fileName}_${formatDate(new Date().toISOString())}.csv`,
      totalsLine
    );

    handleClose();
  };

  const handleClose = () => {
    setFileName("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <label htmlFor="filename">File Name</label>
      <input
        data-testid="receivers-filename-input"
        id="filename"
        type="text"
        className="basic-input focus:border w-full mb-4 bg-custom-white"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
      />
      <div className="flex gap-4">
        <button
          data-testid="receivers-data-export"
          className="btn-themeGreen w-full"
          onClick={handleExport}
        >
          Submit
        </button>
        <button
          data-testid="cashier-export-modal-cancel"
          className="btn-themeOrange w-full"
          onClick={handleClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default ExportModal;
