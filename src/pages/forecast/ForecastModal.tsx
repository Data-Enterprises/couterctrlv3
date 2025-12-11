import { useAppSelector, useAppDispatch } from "../../hooks";
import { setExportModalOpen } from "../../features/forecastSlice";
import { useToast } from "../../components/toasts/hooks/useToast";
import { exportHeaders } from ".";
import { exportData } from "../../utils/export";
import { useState } from "react";
import Modal from "../../components/Modal";
import CheckBox from "../../components/inputs/CheckBox";

interface ExportOption {
  all: number;
  updated: number;
}

const ForecastModal = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.forecast);

  const [option, setOption] = useState<ExportOption>({
    all: 1,
    updated: 0,
  });
  const [title, setTitle] = useState<string>("");
  const handleClose = () => {
    dispatch(setExportModalOpen(false));
  };

  const handleExport = () => {
    if (!title) {
      toast.warn("Please enter a file name");
      return;
    }

    const data =
      option.all === 1 ? state.historyData : state.lastUpdatedHistory;

    exportData(data, exportHeaders, `${title}.csv`);
    handleClose();
  };

  const handleChange = (selection: number) => {
    const test = {
      all: selection === 1 ? 1 : 0,
      updated: selection === 1 ? 0 : 1,
    };
    setOption(test);
  };

  return (
    <Modal
      isOpen={state.exportModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white w-1/4"
    >
      <div className={`${state.lastUpdatedHistory.length ? "flex justify-center gap-8 select-none" : "hidden"}`}>
        <CheckBox
          value={option.all === 1}
          label="Full History"
          id={1}
          idExtension="all-history"
          onChange={() => handleChange(1)}
          className="cursor-pointer"
        />
        <CheckBox
          value={option.updated === 1}
          label="Updated History"
          id={2}
          idExtension="updated-history"
          onChange={() => handleChange(2)}
          className="cursor-pointer"
        />
      </div>
      <div>
        <label className="font-medium text-sm pl-0.5" htmlFor="filename">
          File Name (.csv)
        </label>
        <input
          id="filename"
          data-testid="fcst-export-filename"
          type="text"
          className="basic-input focus:border bg-custom-white"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button data-testid="fcst-export-submit" className="btn-themeGreen w-1/2" onClick={handleExport}>
          Submit
        </button>
        <button data-testid="fcst-export-cancel" className="btn-themeOrange w-1/2" onClick={handleClose}>
          Cancel
        </button>
      </div>
      <div className="text-content/60 text-center text-sm translate-y-2">
        *file extension will be added automatically on submit
      </div>
    </Modal>
  );
};

export default ForecastModal;
