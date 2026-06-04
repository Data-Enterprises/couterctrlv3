import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setUpcs } from "../../../features/upcUploadSlice";
import { setAdListData, type AdListRow } from "../../../features/adListSlice";
import { useAppDispatch } from "../../../hooks";

const num = (v: unknown): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};
const str = (v: unknown): string => (v == null ? "" : String(v).trim());

const AdListInput = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("Select AD List (.xlsx)");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.warn("Please select an Excel (.xlsx) file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

        const rows: AdListRow[] = json.map((r) => {
          const adCount = Math.max(num(r["Ad Count"]), 1);
          const adRetail = num(r["Ad Retail"]);
          return {
            upc: str(r["UPC"]),
            pageName: str(r["Page Name"]),
            featureDescription: str(r["Feature Description"]),
            pack: str(r["Pack"]),
            size: str(r["Size"]),
            cost: num(r["COST"]),
            costPlusFrt: num(r["COST+FRT"]),
            amap: num(r["AMAP"]),
            eba: num(r["EBA"]),
            dsdOI: num(r["DSD OI"]),
            edlcBB: num(r["EDLC BB"]),
            netUnitCost: num(r["Net Unit Cost"]),
            adCount,
            adRetail,
            unitAdRetail: adRetail / adCount,
            regularRetail: num(r["Regular Retail"]),
            mvmt: num(r["Mvmt"]),
            grossProfit: num(r["Gross Profit"]),
            featureNotes: str(r["Feature Notes"]),
            tprDates: str(r["TPR Dates"]),
          };
        }).filter((r) => r.upc !== "");

        const upcs = rows.map((r) => r.upc);
        dispatch(setAdListData({ rows, fileName: file.name }));
        dispatch(setUpcs(upcs));
        setLabel(`${file.name} — ${rows.length} items`);
      } catch {
        toast.error("Failed to parse AD list file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500 text-center">
        Upload the weekly AD list Excel file. UPCs will be extracted and Ad Retail prices will be
        pre-loaded as forecast prices.
      </p>
      <label className="btn-themeBlue text-[13px] h-10 w-full relative cursor-pointer">
        <div className="absolute left-0 w-full text-center truncate px-2">{label}</div>
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
