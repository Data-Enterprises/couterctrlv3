import { useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setFileName, setIndex } from "../../../features/upcSlice";
import { modes } from ".";
import RadioBox from "../../../components/inputs/RadioBox";

interface StepOneProps {
  className?: string;
  file: File | null;
  setFile: (file: File | null) => void;
}

const fileExtensions = [".csv"];

const StepOne = ({
  className = "h-[280px] w-[450px]",
  file,
  setFile,
}: StepOneProps) => {
  const dispatch = useAppDispatch();
  const upc = useAppSelector((state) => state.upc);
  const user = useAppSelector((state) => state.user);
  const inputRef = useRef<HTMLInputElement | null>(null); // using this to allow the same file to be selected again
  const [error, setError] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>(
    "Select a file to upload before moving to the next step"
  );

  const handleReset = () => {};
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files === null) return;
    if (
      !fileExtensions.some((ext) => event.target.files![0].name.endsWith(ext))
    ) {
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

  const handleModeSelect = (mode: number) => {
    console.log(mode);
    // dispatch(setDuration(5000));
    // dispatch(setSelectedModes(mode));
  };

  return (
    <div className={`flex flex-col items-center py-2 gap-4 ${className}`}>
      <div className="flex flex-col gap-2 items-center">
        <div
          className={`h-8 py-2 ${
            error ? "text-warning" : "text-content"
          } font-medium w-full text-center text-sm`}
        >
          {msg}
        </div>
        <label className="btn-themeBlue">
          File
          <input
            type="file"
            className="hidden"
            ref={inputRef}
            onChange={handleFileChange}
          />
        </label>
        <div className="h-4">{file !== null ? file.name : ""}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full pl-9">
        {modes.map((mode, i) => (
          <div
            key={mode.mode}
            className="flex gap-0.5 items-center"
            onClick={() => handleModeSelect(mode.mode)}
          >
            <RadioBox
              label={
                mode.label +
                `${mode.mode > 2 && user.role !== 9 ? " - Coming soon" : ""}`
              }
              value={upc.selectedMode === mode.mode}
              onChange={() => {}}
              id={mode.mode}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-4 justify-center">
        <div
          className={`btn-themeBlue md:px-6 mt-1 md:mt-0 ${
            file !== null ? "" : "opacity-40 pointer-events-none"
          } `}
          onClick={handleReset}
        >
          Reset
        </div>
        <div
          className={`md:px-6 mt-1 md:mt-0 ${
            file !== null && upc.selectedMode !== 0
              ? "btn-themeGreen"
              : "btn-themeOrange opacity-40 pointer-events-none"
          } `}
          onClick={() => dispatch(setIndex(1))}
        >
          Next
        </div>
      </div>
    </div>
  );
};

export default StepOne;
