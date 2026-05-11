import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { ColDef } from "ag-grid-community";
import { exportData } from "../../../utils/export";

import Modal from "../../../components/Modal";
import { setExportMissingStoresModalOpen } from "../../../features/adminSlice";
import Input from "../../../components/inputs/Input";
import { formatDate } from "../../../utils";

interface ExportModalProps<T extends Record<string, any>> {
  data: T[];
  columns: ColDef<T>[];
}

const ExportMissingStoresModal = <T extends Record<string, any>>({
  data,
  columns,
}: ExportModalProps<T>) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [fileName, setFileName] = useState<string>("");

  const { exportMissingStoresModalOpen } = useAppSelector(
    (state) => state.admin,
  );

  const handleClose = () => {
    setFileName("");
    dispatch(setExportMissingStoresModalOpen(false));
  };

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
    handleClose();
  };

  const handleFileNameChange = (value: string) => {
    setFileName(value);
  };

  return (
    <Modal
      isOpen={exportMissingStoresModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white w-1/2 xl:w-1/4"
      className=""
    >
      <div className="">
        <Input
          label="File Name"
          value={fileName}
          setValue={handleFileNameChange}
        />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <button data-testid="export-ms-submit-btn" className="btn-themeGreen" onClick={handleExport}>
            Export
          </button>
          <button className="btn-themeOrange" onClick={handleClose}>
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

export default ExportMissingStoresModal;
