import { useAppSelector } from "../../../hooks";
import DatePickers from "../../../components/datePickers/DatePickers";
import SingleSelect from "../../../components/SingleSelect";
import ReceiverSelect from "./ReceiverSelect";
import ReceiverDetailsMobile from "./ReceiverDetailsMobile";

interface ReceiversMobileViewProps {
  getReceivers: () => void;
  setSelectedStore: (id: string | number) => void;
}

const ReceiversMobileView = ({
  getReceivers,
  setSelectedStore,
}: ReceiversMobileViewProps) => {
  const { recMobileStage } = useAppSelector((state) => state.receivers);
  const { assignedStores } = useAppSelector((state) => state.user);

  if (recMobileStage === 1) {
    return (
      <div className="w-full h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] p-2 overflow-hidden">
        <div className="bg-custom-white rounded-lg p-2 shadow-lg">
          <SingleSelect
            label={"Select Store"}
            data={assignedStores}
            displayKey={"store_name"}
            valueKey={"storeid"}
            onSelect={setSelectedStore}
          />
          <DatePickers handleQuery={getReceivers} />
        </div>
      </div>
    );
  }

  if (recMobileStage === 2) return <ReceiverSelect />;
  if (recMobileStage === 3) return <ReceiverDetailsMobile />
};

export default ReceiversMobileView;
