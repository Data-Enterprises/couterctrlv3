interface TotalSalesFilterProps {
  threshold: number;
  handleSelection: (value: string) => void;
  setThreshold: (value: number) => void;
  threshComp: { gt: boolean; lt: boolean };
}
const TotalSalesFilter = ({
  handleSelection,
  setThreshold,
  threshold,
  threshComp,
}: TotalSalesFilterProps) => {
  return (
    <div>
      <div className="flex justify-center gap-4 mt-1">
        <div className="flex gap-2 items-center">
          <label>Greater than</label>
          <input
            type="checkbox"
            data-testid="cashier-table-filter-ts-gt-checkbox"
            className="rounded focus:ring-0 focus:outline-none"
            checked={threshComp.gt}
            onChange={() => handleSelection("gt")}
          />
        </div>
        <div className="flex gap-2 items-center">
          <label>Less than</label>
          <input
            type="checkbox"
            data-testid="cashier-table-filter-ts-lt-checkbox"
            className="rounded focus:ring-0 focus:outline-none"
            checked={threshComp.lt}
            onChange={() => handleSelection("lt")}
          />
        </div>
      </div>
      <input
        data-testid="cashier-table-filter-total-sales-input"
        className="basic-input focus:border my-4 bg-custom-white"
        type="text"
        value={threshold}
        onChange={(e) => setThreshold(Number(e.currentTarget.value))}
      />
    </div>
  );
};

export default TotalSalesFilter;
