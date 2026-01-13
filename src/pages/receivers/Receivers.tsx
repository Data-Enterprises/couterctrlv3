import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getReceiversList } from "../../api/receivers";
import type { JsonError, ReceiverListResponse } from "../../interfaces";
import {
  reQuery,
  resetReceiverState,
  setIsFetchingList,
  setListGridData,
  setReceiversList,
  setStoreId,
} from "../../features/receiversSlice";

import DatePickers from "../../components/datePickers/DatePickers";
import SingleSelect from "../../components/SingleSelect";
import RecevierListFilters from "./ReceiverListFilters";
import ReceiversListGrid from "./ReceiversListGrid";
import ReceiverDetailsGrid from "./ReceiverDetailsGrid";

const Receivers = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { assignedStores } = useAppSelector((state) => state.user);
  const state = useAppSelector((state) => state.receivers);
  const { startDate, endDate } = useAppSelector((state) => state.search);

  const getReceivers = () => {
    if (!state.storeid) {
      toast.error("Please select a store");
      return;
    }
    dispatch(reQuery());
    dispatch(setIsFetchingList(true));
    getReceiversList(url, token, state.storeid, startDate, endDate)
      .then((resp) => {
        const j: ReceiverListResponse = resp.data;
        if (j.error == 0) {
          dispatch(setReceiversList(j.recievers));
          dispatch(setListGridData(j.recievers));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsFetchingList(false)));
  };

  const setSelectedStore = (storeid: string | number) => {
    dispatch(setStoreId(storeid as number));
  };

  return (
    <div className="w-full h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] p-4 overflow-hidden">
      <div className="w-full h-full grid grid-cols-[20%_80%] gap-4">
        <div className="select-none grid grid-rows-[32%_35%_29%] gap-4">
          <div className="bg-custom-white rounded-lg p-4 shadow-lg">
            <SingleSelect
              label={"Select Store"}
              data={assignedStores}
              displayKey={"store_name"}
              valueKey={"storeid"}
              className="mb-2"
              onSelect={setSelectedStore}
            />
            <DatePickers handleQuery={getReceivers} />
            <button
              className={`${
                state.list.length === 0 && "opacity-50 pointer-events-none"
              } btn-themeOrange w-full mt-2`}
              onClick={() => dispatch(resetReceiverState())}
            >
              Refresh
            </button>
          </div>
          <RecevierListFilters />
        </div>
        <div className="h-full grid grid-rows-[40%_58%] gap-4">
          <ReceiversListGrid />
          <ReceiverDetailsGrid />
        </div>
      </div>
    </div>
  );
};

export default Receivers;
