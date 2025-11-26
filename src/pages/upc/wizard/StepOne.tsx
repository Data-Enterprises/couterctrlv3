import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setFileName, setIndex } from "../../../features/upcSlice";
import { useAppSelector } from "../../../hooks";

interface UpcStepOneProps {
  className?: string;
  file: File | null;
  setFile: (file: File | null) => void;
}

const fileExtensions = [".csv"];

const StepOne = ({ className, file, setFile }: UpcStepOneProps) => {
  const dispatch = useDispatch();
  const { dataLoaded } = useAppSelector((state) => state.upc);
  const inputRef = useRef<HTMLInputElement | null>(null); // using this to allow the same file to be selected again
  const [error, setError] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("Select a file to upload before moving to the next step");

  useEffect(() => {
    if (!dataLoaded) handleReset();
  }, [dataLoaded]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!fileExtensions.some((ext) => event.target.files![0].name.endsWith(ext))) {
      setError(true);
      setMsg("Invalid file type. Please select a file ending in .csv");
      return;
    }
    if (event.target.files && event.target.files[0]) {
      if (!error) setError(false);
      setMsg("File Selected");
      setFile(event.target.files[0]);
      dispatch(setFileName(event.target.files[0].name));
    }
  };

  const handleReset = () => {
    dispatch(setFileName(""));
    setFile(null);
    setError(false);
    setMsg("Select a file to upload before moving to the next step");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={`flex flex-col items-center py-2 gap-4 ${className}`}>
      <div className="flex flex-col gap-2 items-center">
        <div className={`h-8 py-2 ${error ? "text-warning" : "text-content"} font-medium w-full text-center text-sm`}>
          {msg}
        </div>
        <label className="btn-themeBlue">
          File
          <input type="file" className="hidden" ref={inputRef} onChange={handleFileChange} />
        </label>
        <div className="h-6">{file !== null ? file.name : ""}</div>
      </div>
      <div className="flex gap-4 justify-center">
        <div
          className={`btn-themeBlue md:px-6 mt-1 md:mt-0 ${file !== null ? "" : "opacity-40 pointer-events-none"} `}
          onClick={handleReset}
        >
          Reset
        </div>
        <div
          className={`md:px-6 mt-1 md:mt-0 ${file !== null ? "btn-themeGreen" : "btn-themeOrange opacity-40 pointer-events-none"} `}
          onClick={() => dispatch(setIndex(1))}
        >
          Next
        </div>
      </div>
    </div>
  );
};

export default StepOne;
