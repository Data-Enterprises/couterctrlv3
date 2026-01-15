import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getReceiversList } from "../../api/receivers";
import type { JsonError, ReceiverListResponse } from "../../interfaces";
import {
  reQuery,
  resetReceiverState,
  setIsExportModalOpen,
  setIsFetchingList,
  setListGridData,
  setNoReceivers,
  setReceiverDetails,
  setReceiversList,
  setStoreId,
} from "../../features/receiversSlice";

import DatePickers from "../../components/datePickers/DatePickers";
import SingleSelect from "../../components/SingleSelect";
import RecevierListFilters from "./ReceiverListFilters";
import ReceiversListGrid from "./ReceiversListGrid";
import ReceiverDetailsGrid from "./ReceiverDetailsGrid";
import FiltersModal from "./filters/FiltersModal";
import ExportModal from "./ExportModal";
import { detailCols } from ".";
import { useEffect, useState } from "react";

const Receivers = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.receivers);
  const { url, token } = useAppSelector((state) => state.app);
  const { assignedStores } = useAppSelector((state) => state.user);
  const { startDate, endDate } = useAppSelector((state) => state.search);
  const [totalsLine, setTotalsLine] = useState<string>("");

  useEffect(() => {
    if (state.totals.length > 0) {
      const { cases, units, ucost, ext_cost, retail, ext_retail } =
        state.totals[0];
      setTotalsLine(
        `,,Totals,${cases},${units},${ucost},${ext_cost},${retail},${ext_retail}`
      );
    }
  }, [state.totals]);

  useEffect(() => {
    if (state.listGridData.length === 0) {
      dispatch(setReceiverDetails([]));
    }
  },[state.listGridData]);

  const getReceivers = () => {
    if (!state.storeid) {
      toast.warn("Please select a store");
      return;
    }
    dispatch(reQuery());
    dispatch(setIsFetchingList(true));
    getReceiversList(url, token, state.storeid, startDate, endDate)
      .then((resp) => {
        const j: ReceiverListResponse = resp.data;
        if (j.error == 0 && j.recievers.length > 0) {
          dispatch(setReceiversList(j.recievers));
          dispatch(setListGridData(j.recievers));
        } else {
          dispatch(setNoReceivers(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsFetchingList(false)));
  };

  const setSelectedStore = (storeid: string | number) => {
    dispatch(setStoreId(storeid as number));
  };

  const openExportModal = () => {
    dispatch(setIsExportModalOpen(true));
  };

  return (
    <div className="w-full h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] p-4 overflow-hidden">
      <FiltersModal />
      <ExportModal
        isOpen={state.isExportModalOpen}
        onClose={() => dispatch(setIsExportModalOpen(false))}
        data={state.details}
        columns={detailCols}
        totalsLine={totalsLine}
      />
      <div className="w-full h-full grid grid-cols-[20%_80%] gap-4">
        <div className="select-none space-y-4">
          <div className="bg-custom-white rounded-lg p-4 shadow-lg">
            <SingleSelect
              label={"Select Store"}
              data={assignedStores}
              displayKey={"store_name"}
              valueKey={"storeid"}
              onSelect={setSelectedStore}
            />
            <DatePickers handleQuery={getReceivers} />
            <div className="flex gap-2">
              <button
                data-testid="rec-page-refresh-btn"
                className={`${
                  state.list.length === 0 && "opacity-50 pointer-events-none"
                } btn-themeOrange w-full mt-2`}
                onClick={() => dispatch(resetReceiverState())}
              >
                Refresh
              </button>
              <button
                data-testid="receivers-export-btn"
                className={`${
                  state.details.length === 0 && "opacity-50 pointer-events-none"
                } btn-themeGreen w-full mt-2`}
                onClick={openExportModal}
              >
                Export
              </button>
            </div>
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
