// Hooks
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useForecastCtx } from "../../hooks";

// Redux
import {
  addUpcs,
  setUpcText,
  setUploadedAdList,
} from "../../../../../features/forecastDevSlice";

// Utils
import { isAdListFile, parseAdListWorkbook } from "../../utils/adListParse";
import { parseUpcs } from "../../utils";

/** The ways UPCs get into the search: typed and added, a CSV, or an AD list
 *  workbook whose prices then stand in as the forecast price. */
export const useUpcInput = () => {
  const toast = useToast();
  const { dispatch, upcText } = useForecastCtx();

  const handleParseText = () => {
    const parsed = parseUpcs(upcText);
    if (!parsed.length) {
      toast.warn("No valid UPCs found");
      return;
    }
    dispatch(addUpcs(parsed));
    dispatch(setUpcText(""));
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseUpcs(ev.target?.result as string);
      if (parsed.length) {
        dispatch(addUpcs(parsed));
        toast.success(`Added ${parsed.length} UPCs from file`);
      } else {
        toast.warn("No valid UPCs found in file");
      }
    };
    reader.readAsText(file);
    // Cleared so picking the same file twice still fires a change event.
    e.target.value = "";
  };

  const handleAdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAdListFile(file.name)) {
      toast.warn("Please select an Excel (.xlsx) file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseAdListWorkbook(ev.target!.result as ArrayBuffer);
        if (!rows.length) {
          toast.warn("No UPCs found in that AD list");
          return;
        }
        dispatch(setUploadedAdList({ rows, fileName: file.name }));
        toast.success(`Added ${rows.length} UPCs from the AD list`);
      } catch {
        toast.error("Failed to parse AD list file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return { handleParseText, handleCsvUpload, handleAdUpload };
};
