import {
  removeSingleUpc,
  setUpcs,
  setUpcText,
} from "../../../features/upcUploadSlice";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import FileInput from "../../forecast/controls/FileInput";

interface UpcSelectorProps {
  setFile: (file: File | null) => void;
  getData: () => void;
}

const UpcSelector = ({ setFile, getData }: UpcSelectorProps) => {
  const dispatch = useAppDispatch();
  const { upcs, upcText } = useAppSelector((state) => state.upcs);

  const handleAddUpc = (upc: string) => {
    if (upc === "") {
      dispatch(setUpcs([]));
      return;
    }
    const newUpcs = upc.split(",").map((u) => u.trim());
    dispatch(setUpcs(newUpcs));
  };

  const handleEnterDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddUpc(e.currentTarget.value);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setUpcText(e.currentTarget.value));
  };

  const handleRemoveUpc = (upc: string) => {
    dispatch(removeSingleUpc(upc));
  };

  return (
    <div className="w-full h-full flex justify-center items-center pt-28">
      <div className="bg-custom-white rounded-lg shadow-lg px-2 pb-2 w-1/3">
        <div className="bg-blue-500 text-custom-white -mx-2 py-0.5 px-4 rounded-t-lg font-medium flex justify-between">
          <div>
            UPCs <span className="text-sm">(comma separated)</span>
          </div>
          <div className={`${upcs.length === 0 && "hidden"}`}>
            {upcs.length}
          </div>
        </div>
        <input
          type="text"
          data-testid="forecast-upc-input"
          className="basic-input focus:border bg-custom-white py-1 mt-2"
          value={upcText}
          onChange={handleTextChange}
          onKeyDown={handleEnterDown}
        />
        <div className="flex py-2 gap-2">
          <button
            data-testid="forecast-add-upc-btn"
            className="btn-themeBlue py-1 border px-0 w-1/2"
            onClick={() => handleAddUpc(upcText)}
          >
            Add
          </button>
          <button
            data-testid="forecast-clear-upc-btn"
            className="btn-themeBlue py-1 border px-0 w-1/2"
            onClick={() => handleAddUpc("")}
          >
            Clear
          </button>
        </div>
        <div
          className={`bg-bkg min-h-32 max-h-32 shadow rounded-lg grid grid-cols-3 text-xs overflow-y-scroll no-scrollbar mb-2`}
        >
          {upcs.map((u, i) => (
            <div
              key={i}
              data-testid={`forecast-upc-item-${u}-${i}`}
              className="px-2 py-0.5 font-medium hover:text-blue-500  transition-all duration-200 cursor-pointer"
              onClick={() => handleRemoveUpc(u)}
            >
              {u}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FileInput
            page="forecast"
            fileExt={[".csv"]}
            setFile={setFile}
            className="w-full"
          />
          <button
            data-testid="forecast-search-btn"
            className="btn-themeBlue"
            onClick={getData}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpcSelector;
