import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";

const Sales = () => {
  return (
    <div
      data-testid="sales-page"
      className="w-full h-[calc(100vh-3rem)] p-4 grid grid-cols-[0.5fr_1.5fr] gap-4"
    >
      {/* col 1 */}
      <div className="grid grid-rows-[0.3fr_1.7fr]">
        <div className="bg-custom-white rounded-lg p-2 shadow-lg">
          <StorePicker />
          <DatePickers />
        </div>
      </div>

      {/* col 2 */}
      <div className="bg-custom-white rounded-lg p-4 shadow-lg">
        Sales Data Display Area
      </div>
    </div>
  );
};

export default Sales;
