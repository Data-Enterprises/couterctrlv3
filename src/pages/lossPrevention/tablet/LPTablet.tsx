import DatePickers from "../../../components/datePickers/DatePickers";
import StorePicker from "../../../components/storePicker/StorePicker";

interface LPTabletProps {
  getSaleTypes: () => void;
}

const LPTablet = ({ getSaleTypes }: LPTabletProps) => {

  return (
    <div
      data-testid="lp-tablet"
      className="min-h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] overflow-hidden overflow-y-auto no-scrollbar p-3 grid grid-cols-[25%_74%] gap-2"
    >
      <div>
        <div className="bg-custom-white p-2 rounded-lg shadow-lg space-y-1 md:space-y-0">
          <StorePicker />
          <DatePickers handleQuery={getSaleTypes} />
        </div>
      </div>
    </div>
  );
};

export default LPTablet;