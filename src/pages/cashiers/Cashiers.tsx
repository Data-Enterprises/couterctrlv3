import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";

const Cashiers = () => {
  
  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full p-4 overflow-hidden">
      <div className="bg-custom-white p-2 w-1/5 rounded-lg shadow-lg">
        <StorePicker />
        <DatePickers />
      </div>
    </div>
  );
};

export default Cashiers;
