import { useAppSelector, useAppDispatch } from "../../hooks";
import { useForecastContext } from "./hooks";
import { replaySim } from "../../api/forecast";
import {
  type SimListItem,
  type SimReplayItem,
  type SimReplayResp,
} from "../../interfaces";
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
  const [pastTotals, setPastTotals] = useState<{
    sales: number;
    qty: number;
    weight: number;
  }>({ sales: 0, qty: 0, weight: 0 });
  const [futureTotals, setFutureTotals] = useState<{
    sales: number;
    qty: number;
    weight: number;
  }>({ sales: 0, qty: 0, weight: 0 });

  useEffect(() => {
    return () => {
      dispatch(setReplayData({ past: [], future: [] }));
    };
  }, []);

  const reducedTotals = (data: SimReplayItem[]) => {
    return data.reduce((acc, item) => {
      return {
        sales: acc.sales + item.total_sales,
        qty: acc.qty + item.qty,
        weight: acc.weight + item.weight,
      };
    }, { sales: 0, qty: 0, weight: 0 });
  };

  const handleReplay = (simName: string | number) => {
    const replay = state.simList.find((sim) => sim.sim_name === simName);
    setSelectedReplay(replay!);

    replaySim(context.url, context.token, simName as string)
      .then((resp) => {
        const j: SimReplayResp = resp.data;
        if (j.error === 0) {
          dispatch(setReplayData({ past: j.past, future: j.future }));
          const pastTotals = reducedTotals(j.past);
          const futureTotals = reducedTotals(j.future);
          setPastTotals(pastTotals);
          setFutureTotals(futureTotals);
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
      modalClassName="w-2/3 bg-custom-white flex gap-4"
    >
      <div className="w-1/4 flex flex-col gap-4">
        <SingleSelect
          label="Replay Simulation"
          data={state.simList}
          displayKey="sim_name"
          valueKey="sim_name"
          onSelect={(val) => handleReplay(val)}
        />
        <div className={`p-2 bg-bkg rounded-lg shadow text-[15px] grid grid-cols-2 gap-2`}>
          <div className="flex justify-between col-span-2">
            <div className="font-medium">Replaying:</div>
            {selectedReplay.sim_name && <div>{selectedReplay.sim_name}</div>}
          </div>
          <div className="flex">
            <div className="font-medium">Start:</div>
            {selectedReplay.start_date && <div>{formatDate(selectedReplay.start_date)}</div>}
          </div>
          <div className="flex justify-end">
            <div className="font-medium">End:</div>
            <div>{formatDate(selectedReplay.end_date)}</div>
          </div>
        </div>
      </div>

      <div>
        <div>Howdy</div>
      </div>
    </Modal>
  );
};

export default ReplayModal;
