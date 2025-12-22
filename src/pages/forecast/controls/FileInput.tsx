import { useRef } from "react";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setUpcs } from "../../../features/upcUploadSlice";
import { useAppDispatch } from "../../../hooks";

interface FileInputProps {
  file: File | null;
  fileExt: string[];
  setFile: (file: File | null) => void;
  className?: string;
}

const FileInput = ({
  file,
  fileExt,
  setFile,
  className = "w-full",
}: FileInputProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!fileExt.some((ext) => event.target.files![0].name.endsWith(ext))) {
      toast.warn("Please select a valid CSV file");
    } else if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);

      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          dispatch(setUpcs([])); // Clear existing UPCs before adding new ones
          const data = processCSV(text);
          dispatch(setUpcs(data));
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
  );
};

export default FileInput;
