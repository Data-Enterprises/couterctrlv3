import { useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  setFileName,
  setIndex,
  setSelectedMode,
} from "../../../features/upcSlice";
import { useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import Buttons from "./components/Buttons";
import ModelSelect from "./components/ModeSelect";

interface UpcStepOneProps {
  className?: string;
  file: File | null;
  setFile: (file: File | null) => void;
}

const fileExtensions = [".csv"];

const StepOne = ({ className, file, setFile }: UpcStepOneProps) => {
  const toast = useToast();
  const dispatch = useDispatch();
  const { dataLoaded, selectedMode } = useAppSelector((state) => state.upc);

  // using this to allow the same file to be selected again
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!dataLoaded) handleReset();
  }, [dataLoaded]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (
      !fileExtensions.some((ext) => event.target.files![0].name.endsWith(ext))
    ) {
      toast.warn("Please select a valid CSV file");
    } else if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      dispatch(setFileName(event.target.files[0].name));
    }
  };

  const handleReset = () => {
    dispatch(setFileName(""));
    dispatch(setSelectedMode(0));
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const isReady = () => file !== null && selectedMode !== 0;
  return (
    <div className={`flex flex-col items-center py-2 gap-2 ${className}`}>
      <ModelSelect />

      <div className="w-full text-center text-sm text-content/70 mt-2">
        Select a CSV file containing a list of UPC codes
      </div>
      <div className="flex flex-col gap-2 items-center w-3/4">
        <label className="btn-themeBlue w-full text-center">
          <div className="h-6">{file !== null ? file.name : "Select File"}</div>
          <input
            data-testid="upc-file-input"
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
        slide={1}
      />
    </div>
  );
};

export default StepOne;
