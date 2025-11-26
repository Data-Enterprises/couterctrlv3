import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setFileName, setIndex } from "../../../features/upcSlice";
import { useAppSelector } from "../../../hooks";
import Buttons from "./components/Buttons";
import ModelSelect from "./components/ModeSelect";

interface UpcStepOneProps {
  className?: string;
  file: File | null;
  setFile: (file: File | null) => void;
}

const fileExtensions = [".csv"];

const StepOne = ({ className, file, setFile }: UpcStepOneProps) => {
  const dispatch = useDispatch();
  const { dataLoaded, selectedMode } = useAppSelector((state) => state.upc);
  const inputRef = useRef<HTMLInputElement | null>(null); // using this to allow the same file to be selected again
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!dataLoaded) handleReset();
  }, [dataLoaded]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (
      !fileExtensions.some((ext) => event.target.files![0].name.endsWith(ext))
    ) {
      setError(true);
      return;
    }
    if (event.target.files && event.target.files[0]) {
      if (!error) setError(false);
      setFile(event.target.files[0]);
      dispatch(setFileName(event.target.files[0].name));
    }
  };

  const handleReset = () => {
    dispatch(setFileName(""));
    setFile(null);
    setError(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const isReady = () => file !== null && selectedMode !== 0;

  return (
    <div className={`flex flex-col items-center py-2 gap-2 ${className}`}>
      <ModelSelect />
      <div className="w-full text-center text-sm text-content/70 mt-2">
        Select a CSV file containing your list of UPC codes
      </div>
      <div className="flex flex-col gap-4 w-3/4">
        <div className="flex flex-col gap-2 items-center w-full">
          <label className="btn-themeBlue w-full text-center">
            <div className="h-6">
              {file !== null ? file.name : "Select File"}
            </div>
            <input
              type="file"
              className="hidden"
              ref={inputRef}
              onChange={handleFileChange}
            />
          </label>
        </div>

        <Buttons
          isReady={isReady}
          handleNext={() => dispatch(setIndex(1))}
          handleBack={handleReset}
          btnText="Reset"
        />
      </div>
    </div>
  );
};

export default StepOne;
