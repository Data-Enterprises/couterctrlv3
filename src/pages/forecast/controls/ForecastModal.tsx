import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setExportModalOpen,
  type ForecastOutlierRow,
} from "../../../features/forecastSlice";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { exportHeaders } from "..";
import { exportData } from "../../../utils/export";
import { useState } from "react";
import Modal from "../../../components/Modal";
import CheckBox from "../../../components/inputs/CheckBox";

interface ExportOption {
  initial: number;
  sim1: number;
  sim2: number;
  sim3: number;
  sim4: number;
}

const ForecastModal = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.forecast);

  const [option, setOption] = useState<ExportOption>({
    initial: 1,
    sim1: 0,
    sim2: 0,
    sim3: 0,
    sim4: 0,
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

    let data: ForecastOutlierRow[] = [];
    if (option.initial === 1) data = state.initialRowData;
    if (option.sim1 === 1) data = state.simOneRowData;
    if (option.sim2 === 1) data = state.simTwoRowData;
    if (option.sim3 === 1) data = state.simThreeRowData;
    if (option.sim4 === 1) data = state.simFourRowData;

    exportData(data, exportHeaders, `${title}.csv`);
    handleClose();
  };

  const handleChange = (selection: string) => {
    const test: ExportOption = {} as ExportOption;
    for (const key in option) {
      if (key === selection) {
        // Toggle the selected option
        test[key as keyof ExportOption] = 1
      } else {
        test[key as keyof ExportOption] = 0
      }
    }
    setOption(test);
  };

  const sims = Object.entries(state.simBtns).filter(([_, val]) => val === 1);
  const label = (option: string) => {
    switch (option) {
      case "sim1":
        return "Sim 1";
      case "sim2":
        return "Sim 2";
      case "sim3":
        return "Sim 3";
      case "sim4":
        return "Sim 4";
    }
  };

  return (
    <Modal
      isOpen={state.exportModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white w-1/4"
    >
      <div className="flex justify-center gap-4 select-none mb-2">
        {sims.length && (
          <CheckBox
            value={option.initial === 1}
            label="Initial"
            id={1}
            idExtension="all-history"
            onChange={() => handleChange("initial")}
            className="cursor-pointer"
          />
        )}
        {sims.length &&
          sims.map(([sim, _]) => (
            <CheckBox
              key={sim}
              value={option[sim as keyof ExportOption] === 1}
              label={label(sim)}
              id={2}
              idExtension={`${sim}-updated-history`}
              onChange={() => handleChange(sim)}
              className="cursor-pointer"
            />
          ))}
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
        <button
          data-testid="fcst-export-submit"
          className="btn-themeGreen w-1/2"
          onClick={handleExport}
        >
          Submit
        </button>
        <button
          data-testid="fcst-export-cancel"
          className="btn-themeOrange w-1/2"
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

export default ForecastModal;
