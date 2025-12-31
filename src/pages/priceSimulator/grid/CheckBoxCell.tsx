import type { ICellRendererParams } from "ag-grid-community";
import { useAppDispatch } from "../../../hooks";
import { setCalcNow } from "../../../features/forecastSlice";

const CalcNowCheckbox = ({ value, data }: ICellRendererParams) => {
  const dispatch = useAppDispatch();
  const checked = value === 1;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent direct user interaction
    e.preventDefault();
    const upc = data.upc;
    const calcNow = data.calcNow === 1 ? 0 : 1;
    dispatch(setCalcNow({ upc, calcNow }));
  };

  return (
    <label className="flex items-center cursor-pointer select-none">
      <input
        type="checkbox"
        data-testid={`calc-now-checkbox-${data.upc}`}
        checked={checked}
        onChange={handleChange}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
      />
    </label>
  );
};
export default CalcNowCheckbox;
