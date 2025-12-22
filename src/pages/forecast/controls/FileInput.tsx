import { useRef } from "react";
import { useToast } from "../../../components/toasts/hooks/useToast";

interface FileInputProps {
  file: File | null;
  fileExt: string[];
  setFile: (file: File | null) => void;
  className?: string;
}

const FileInput = ({ file, fileExt, setFile, className = "w-full" }: FileInputProps) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!fileExt.some((ext) => event.target.files![0].name.endsWith(ext))) {
      toast.warn("Please select a valid CSV file");
    } else if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
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
