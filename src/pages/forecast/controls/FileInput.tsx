import { useRef } from "react";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setUpcs } from "../../../features/upcUploadSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setFileName, setUploadedUpcs } from "../../../features/upcSlice";

interface FileInputProps {
  fileExt: string[];
  setFile: (file: File | null) => void;
  className?: string;
  labelClassName?: string;
  page: "upc" | "forecast";
}

const FileInput = ({
  fileExt,
  setFile,
  className = "w-full",
  labelClassName = "",
  page,
}: FileInputProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const context = useAppSelector((state) => state.upc);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!fileExt.some((ext) => event.target.files![0].name.endsWith(ext))) {
      toast.warn("Please select a valid CSV file");
    } else if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      dispatch(setFileName(event.target.files[0].name));

      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          const data = processCSV(text);
          if(page === "forecast") {
            dispatch(setUpcs(data));
          } else{
            dispatch(setUploadedUpcs(data));
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const processCSV = (str: string) => {
    const lines = str
      .trim()
      .split(/\r\n|\n/)
      .slice(1); // Split the text into lines and skip the header
    const upcs: string[] = [];
    lines.forEach((line) => {
      upcs.push(line);
    });

    return upcs;
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <label className={`btn-themeBlue w-full ${labelClassName} relative`}>
        <div className="absolute left-0 w-full text-center">{context.fileName ? context.fileName : "Select File"}</div>
        <input
          data-testid="upc-file-input"
          type="file"
          className="hidden"
          ref={inputRef}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default FileInput;
