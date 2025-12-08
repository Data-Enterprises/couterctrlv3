// Components
import { useRef, useState } from "react";
import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import Instructions from "./Instructions";
import { useToast } from "../../components/toasts/hooks/useToast";

const fileExtensions = [".csv"];

const Forecast = () => {
  const toast = useToast();
  // using this to allow the same file to be selected again
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (
      !fileExtensions.some((ext) => event.target.files![0].name.endsWith(ext))
    ) {
      toast.warn("Please select a valid CSV file");
    } else if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  return (
    <div data-testid="forecast-page" className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)]">
      <div className="grid grid-cols-[20%_80%] gap-4 min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] p-4 overflow-hidden">
        <div className="space-y-4">
          <div className="bg-custom-white rounded-lg shadow-lg p-4">
            <StorePicker />
            <DatePickers showBtn={false} />
            <div className="flex gap-2">
              <div className="flex flex-col gap-2 items-center w-1/2">
                <label className="btn-themeBlue w-full text-center">
                  <div className="h-6">
                    {file !== null ? file.name : "Select File"}
                  </div>
                  <input
                    data-testid="upc-file-input"
                    type="file"
                    className="hidden"
                    ref={inputRef}
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <button className="btn-themeBlue w-1/2">Search</button>
            </div>
          </div>
          <Instructions />
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg mr-4">widgets</div>
      </div>
    </div>
  );
};

export default Forecast;
