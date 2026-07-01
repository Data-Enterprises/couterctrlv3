import { useAppSelector, useAppDispatch } from "../../../hooks";
import DatePickers from "../../../components/datePickers/DatePickers";
import SingleSelect from "../../../components/SingleSelect";
import { useReceiversState } from "../hooks/useReceiversState";
import { useReceiversActions } from "../hooks/useReceiversActions";
import ReceiverFilters from "./ReceiverFilters";
import ReceiversGrid from "./ReceiversGrid";
import ReceiverDetails from "./ReceiverDetails";

interface ReceiversTabletProps {
  getData: () => void;
}

const ReceiversTablet = ({ getData }: ReceiversTabletProps) => {
  const dispatch = useAppDispatch();
  const state = useReceiversState();
  const actions = useReceiversActions();
  const { assignedStores } = useAppSelector((state) => state.user);

  const setSelectedStore = (storeid: string | number) => {
    dispatch(actions.setStoreId(storeid as number));
  };

  const openExportModal = () => {
    dispatch(actions.setIsExportModalOpen(true));
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {/* Row One */}
      <div className="grid grid-cols-[25%_74%] gap-3">
        <div className="select-none space-y-4">
          <div className="bg-custom-white rounded-lg p-2 shadow-lg">
            <SingleSelect
              label={"Select Store"}
              data={assignedStores}
              displayKey={"store_name"}
              valueKey={"storeid"}
              onSelect={setSelectedStore}
              innerClass="text-[14px]"
            />
            <DatePickers handleQuery={getData} />
            <div className="flex flex-col gap-2">
              <button
                data-testid="rec-page-refresh-btn"
                className={`${
                  state.list.length === 0 && "opacity-50 pointer-events-none"
                } btn-themeOrange mt-2 px-0`}
                onClick={() => dispatch(actions.resetReceiverSlice())}
              >
                Refresh
              </button>
              <button
                data-testid="receivers-export-btn"
                className={`${
                  state.details.length === 0 && "opacity-50 pointer-events-none"
                } btn-themeGreen px-0`}
                onClick={openExportModal}
              >
                Export
              </button>
            </div>
          </div>
          <ReceiverFilters />
        </div>
        <div className="space-y-3">
          <ReceiversGrid />
        </div>
      </div>

      {/* Row Two */}
        <ReceiverDetails />
    </div>
  );
};

export default ReceiversTablet;
