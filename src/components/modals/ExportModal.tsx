import type { ColDef } from "ag-grid-community";
import Modal from "../../components/Modal";
import ResizableModalShell from "./ResizableModalShell";
import { useState } from "react";
import { formatDate } from "../../utils";
import { exportData } from "../../utils/export";
import { useToast } from "../../components/toasts/hooks/useToast";

interface ExportModalProps<T extends Record<string, any>> {
  isOpen: boolean;
  onClose: () => void;
  data: T[];
  columns: ColDef<T>[];
  /** Dev-only opt-in. This modal is shared with the legacy Orders, Sub Dept
   *  Margins, Coupons and Store Activity pages, so resizing has to be asked
   *  for rather than applied to every consumer. */
  resizable?: boolean;
}

const ExportModal = <T extends Record<string, any>>({
  isOpen,
  onClose,
  data,
  columns,
  resizable = false,
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
    );

    toast.success("Export successful");

    handleClose();
  };

  const handleClose = () => {
    setFileName("");
    onClose();
  };

  const body = (
    <>
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
    </>
  );

  if (!isOpen) return null;

  if (resizable) {
    return (
      <ResizableModalShell
        onClose={onClose}
        storageKey="export-modal:shared"
        defaultWidth={460}
        defaultHeight={340}
        minWidth={360}
        minHeight={260}
      >
        <div className="p-4 text-sm overflow-y-auto">{body}</div>
      </ResizableModalShell>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      modalClassName="bg-custom-white md:w-1/4 text-sm"
    >
      {body}
    </Modal>
  );
};

export default ExportModal;
