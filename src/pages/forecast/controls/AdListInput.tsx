import { useRef, useState } from "react";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setUpcs } from "../../../features/upcUploadSlice";
import { setAdListData } from "../../../features/adListSlice";
import { useAppDispatch } from "../../../hooks";
import { isAdListFile, parseAdListWorkbook } from "../adListParse";

const AdListInput = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("Select AD List (.xlsx)");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAdListFile(file.name)) {
      toast.warn("Please select an Excel (.xlsx) file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseAdListWorkbook(ev.target!.result as ArrayBuffer);
        const upcs = rows.map((r) => r.upc);
        dispatch(setAdListData({ rows, fileName: file.name }));
        dispatch(setUpcs(upcs));
        setLabel(`${file.name}`);
      } catch {
        toast.error("Failed to parse AD list file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500 text-center">
        Upload the weekly AD list Excel file. UPCs will be extracted and Ad
        Retail prices will be pre-loaded as forecast prices.
      </p>
      <label className="btn-themeBlue text-[13px] h-10 w-full relative cursor-pointer">
        <div className="absolute left-0 w-full text-center truncate px-2">
          {label}
        </div>
        <input
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          ref={inputRef}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default AdListInput;
