import { useEffect, useState } from "react";
import { useForecastContext } from "./hooks";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

// Components
import Input from "../../components/inputs/Input";
import Modal from "../../components/Modal";
import { getSavedSims, saveSim } from "../../api/forecast";
import type { JsonError, SimListResp } from "../../interfaces";
import type { SaveSimRow } from ".";
import { formatGoliathDate } from "../../utils";
import { setSelectedSim, setSimList, setSimRowData, setSimTitle, type SimBtns } from "../../features/forecastSlice";

interface SaveSimModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SaveSimModal = ({ isOpen, onClose }: SaveSimModalProps) => {
  const toast = useToast();
  const state = useAppSelector((state) => state.forecast);
  const dispatch = useAppDispatch();
  const context = useForecastContext();
  const [simName, setSimName] = useState<string>("");

  // on load, fetch saved sims for this user and populate dropdown
  useEffect(() => {
    fetchSims();
  }, []);

  const fetchSims = () => {
    getSavedSims(context.url, context.token)
      .then((resp) => {
        const j: SimListResp = resp.data;
        if (j.error === 0 && j.records.length > 0) {
          dispatch(setSimList(j.records));
        } else {
          toast.info(
            "No saved simulations found. Save simulations for future access."
          );
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleSave = () => {
    if (!simName) {
      toast.warn("Please enter a name for the simulation");
      return;
    }

    const simToSave: SaveSimRow[] = [...state.rowData].map((row) => {
      return {
        upc: row.upc,
        description: row.description,
        qtySold: row.qtySold,
        daysActive: row.daysActive,
        daysAtPrice: row.daysAtPrice,
        adFcst: row.adFcst,
        fcstPrice: row.fcstPrice,
        fcstTotal: row.fcstTotal,
        forecastWindow: row.forecastWindow,
        adDays: row.adDays,
        markdownDollars: row.markdownDollars,
      };
    });

    const start = formatGoliathDate(context.startDate);
    const end = formatGoliathDate(context.endDate);
    saveSim(
      context.url,
      context.token,
      simName,
      start,
      end,
      context.storeids,
      simToSave
    )
      .then((resp) => {
        const j = resp.data;
        if (j.success) {
          toast.success("Simulation saved successfully");
          // handleClose();
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => fetchSims());

    const sim1 = state.simBtns.sim1;
    const sim2 = state.simBtns.sim2;
    const sim3 = state.simBtns.sim3;
    const sim4 = state.simBtns.sim4;
    let key = "";
    // if no sims have been saved, save to sim1
    if (sim1 === 0) {
      // save to sim1
      key = "sim1";
    } else if (sim2 === 0) {
      // save to sim2
      key = "sim2";
    } else if (sim3 === 0) {
      // save to sim3
      key = "sim3";
    } else if (sim4 === 0) {
      // save to sim4
      key = "sim4";
    }

    // When saving, we set the selected sim to the one we just saved to
    // now we can update the sim row data until we reload
    // or select another existing simulator
    dispatch(setSelectedSim(key as keyof SimBtns));
    dispatch(setSimTitle({ sim: key as keyof SimBtns, title: simName }));
    dispatch(
      setSimRowData({
        sim: key as keyof SimBtns,
        rows: state.rowData,
      })
    );

    handleClose();
  };

  const handleClose = () => {
    setSimName("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white w-[350px]"
    >
      <Input value={simName} setValue={setSimName} label="Simulation Name" />
      <div className="flex gap-2 mt-2">
        <button className="btn-themeBlue w-1/2" onClick={handleSave}>
          Submit
        </button>
        <button className="btn-themeOrange w-1/2" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default SaveSimModal;
