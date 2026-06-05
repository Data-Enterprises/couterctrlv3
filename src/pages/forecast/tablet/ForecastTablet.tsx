import { useAppSelector } from "../../../hooks";
import { useForecastContext } from "../hooks";
import type { Store } from "../../../interfaces";
import type { Group } from "../../../features/groupSlice";

import SingleSelect from "../../../components/SingleSelect";
import DatePickers from "../../../components/datePickers/DatePickers";
import SelectedStoreList from "../../upc/components/SelectedStoreList";
import FileInput from "../controls/FileInput";
import FileGrid from "../grids/FileGrid";

const options = [
  { label: "Stores", id: 1 },
  { label: "Group", id: 2 },
];

interface ForecastTabletProps {
  handleSelectChange: (value: string | number) => void;
  filteredData: Store[] | Group[];
  handleSearch: () => void;
  handleSelectClick: (value: string | number) => void;
  handleTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddUpc: (upc: string) => void;
  handleRemoveUpc: (upc: string) => void;
  setFile: (file: File | null) => void;
}

const ForecastTablet = ({
  handleSelectChange,
  filteredData,
  handleSearch,
  handleSelectClick,
  handleTextChange,
  handleAddUpc,
  handleRemoveUpc,
  setFile,
}: ForecastTabletProps) => {
  const context = useForecastContext();
  const { upcs, upcText } = useAppSelector((state) => state.upcs);

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden p-3 flex justify-center items-center">
      <div className="space-y-4 w-1/2">
        <div className="bg-custom-white rounded-lg shadow-lg p-2">
          <div className="flex gap-2">
            <SingleSelect
              data={options}
              label="Store or Group"
              displayKey="label"
              valueKey="id"
              onSelect={handleSelectChange}
              defaultQuery="Stores"
              id={1}
              className="w-1/2"
              innerClass="py-1 text-[13px]"
            />
            {context.radioId === 1 ? (
              <SingleSelect
                label="Stores"
                data={filteredData as Store[]}
                displayKey={"store_name" as keyof Store}
                valueKey={"storeid" as keyof Store}
                onSelect={handleSelectClick}
                keepOpen={true}
                resetQuery={true}
                id={2}
                className="w-1/2"
                innerClass="py-1 text-[13px]"
              />
            ) : (
              <SingleSelect
                label="Groups"
                data={filteredData as Group[]}
                valueKey={"id" as keyof Group}
                displayKey={"group_name" as keyof Group}
                onSelect={handleSelectClick}
                resetQuery={true}
                id={2}
                className="w-1/2"
                innerClass="py-1 text-[13px]"
              />
            )}
          </div>
          <DatePickers showBtn={false} />
          <SelectedStoreList
            selectedStores={context.selectedStores}
            radioId={context.radioId}
            className=""
            context="large"
          />
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg px-2 text-[13px]">
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
          <div className={`bg-bkg shadow rounded-lg text-xs flex mb-2`}>
            <div
              className={`grid grid-cols-3 overflow-hidden overflow-y-scroll no-scrollbar`}
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
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>
        <div className="h-[100px] bg-red-200">
          <FileGrid />
        </div>
      </div>
    </div>
  );
};

export default ForecastTablet;
