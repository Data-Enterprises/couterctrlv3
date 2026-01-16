import { useAppSelector, useAppDispatch } from "../../hooks";
import { useForecastContext } from "./hooks";
import { replaySim } from "../../api/forecast";
import { type SimListItem, type SimReplayResp } from "../../interfaces";
import { useToast } from "../../components/toasts/hooks/useToast";

import Modal from "../../components/Modal";
import SingleSelect from "../../components/SingleSelect";
import { setReplayData } from "../../features/forecastSlice";
import { useEffect, useState } from "react";
// import { formatDate } from "../../utils";

interface ReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReplayModal = ({ isOpen, onClose }: ReplayModalProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useForecastContext();
  const state = useAppSelector((state) => state.forecast);
  const [selectedReplay, setSelectedReplay] = useState<SimListItem>({
    sim_name: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    return () => {
      dispatch(setReplayData({ past: [], future: [] }));
    };
  }, []);

  const handleReplay = (simName: string | number) => {
    const replay = state.simList.find((sim) => sim.sim_name === simName);
    setSelectedReplay(replay!);

    replaySim(context.url, context.token, simName as string)
      .then((resp) => {
        const j: SimReplayResp = resp.data;
        if (j.error === 0) {
          dispatch(setReplayData({ past: j.past, future: j.future }));
        }
      })
      .catch((err) =>
        toast.error("Error replaying simulation: " + err.message)
      );
  };

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("-");
    const day = parseInt(split[2]);
    const month = parseInt(split[1]);
    const year = parseInt(split[0]);
    return `${month}/${day}/${year}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      modalClassName="w-1/2 bg-custom-white"
    >
      <div className="w-1/4">
        <SingleSelect
          label="Replay Simulation"
          data={state.simList}
          displayKey="sim_name"
          valueKey="sim_name"
          onSelect={(val) => handleReplay(val)}
        />
        <div>
          <div className="flex justify-between">
            <div>Simulation:</div>
            <div>{selectedReplay.sim_name}</div>
          </div>
          <div className="flex justify-between">
            <div>Start Date:</div>
            <div>{formatDate(selectedReplay.start_date)}</div>
          </div>
          <div className="flex justify-between">
            <div>End Date:</div>
            <div>{formatDate(selectedReplay.end_date)}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReplayModal;
