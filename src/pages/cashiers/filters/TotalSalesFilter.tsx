import { useAppSelector } from "../../../hooks";

interface TotalSalesFilterProps {
  threshold: number;
  handleSelection: (value: string) => void;
  setThreshold: (value: number) => void;
}
const TotalSalesFilter = ({
  handleSelection,
  setThreshold,
  threshold,
}: TotalSalesFilterProps) => {
  const { cashierTableThreshComp } = useAppSelector((state) => state.cashier);
  return (
    <div>
      <div className="flex justify-center gap-4 mt-1">
        <div className="flex gap-2 items-center">
          <label>Greater than</label>
          <input
            type="checkbox"
            className="rounded focus:ring-0 focus:outline-none"
            checked={cashierTableThreshComp.lt}
            onChange={() => handleSelection("lt")}
          />
        </div>
        <div className="flex gap-2 items-center">
          <label>Less than</label>
          <input
            type="checkbox"
            className="rounded focus:ring-0 focus:outline-none"
            checked={cashierTableThreshComp.gt}
            onChange={() => handleSelection("gt")}
          />
        </div>
      </div>
      <input
        className="basic-input focus:border my-4 bg-custom-white"
        type="number"
        value={threshold}
        onChange={(e) => setThreshold(Number(e.currentTarget.value))}
      />
    </div>
  );
};

export default TotalSalesFilter;
