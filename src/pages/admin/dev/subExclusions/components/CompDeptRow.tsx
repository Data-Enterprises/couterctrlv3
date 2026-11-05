// Utils
import {
  deptState,
  differingNumbers,
  COLS,
  coverageText,
  prettyDate,
} from "../utils";

// Interfaces
import type { CompanyDeptRow, ExclusionWrite } from "../interfaces";
import Checkbox from "@/components-dev/Checkbox";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import DeptAtStoreRow from "./DeptAtStoreRow";

interface CompDeptRowProps {
  row: CompanyDeptRow;
  open: string | null;
  setOpen: (next: string | null) => void;
  toggleRow: (row: CompanyDeptRow, next: boolean) => void;
  saving: boolean;
  send: (writes: ExclusionWrite[], label: string, want: boolean) => void;
}

const CompDeptRow = ({
  row,
  open,
  setOpen,
  toggleRow,
  saving,
  send,
}: CompDeptRowProps) => {
  const state = deptState(row);
  const varies = differingNumbers(row);
  const expanded = open === row.key;
  return (
    <div>
      <div
        className={`grid ${COLS} px-3 py-2 text-[12px] items-center text-content even:bg-row_stripe hover:bg-gray-50`}
      >
        <Checkbox
          checked={state === "all"}
          disabled={saving}
          ariaLabel={`Exclude ${row.label} from net sales`}
          onChange={(next) => toggleRow(row, next)}
        />
        <div className="truncate font-semibold" title={row.label}>
          {row.label}
          {row.hashHint && state === "none" && (
            <span className="ml-1.5 text-[10px] font-semibold text-severity_watch_text">
              likely hash
            </span>
          )}
        </div>
        <div className="truncate tabular-nums text-content/85">
          {varies.length > 0 ? (
            <span title={varies.join(" · ")}>varies</span>
          ) : (
            `#${row.at[0]?.sub_department}`
          )}
        </div>
        <div className="truncate">
          <span
            className={
              state === "some"
                ? "font-semibold text-severity_watch_text"
                : "text-content/85"
            }
          >
            {coverageText(row)}
          </span>
        </div>
        <div className="truncate tabular-nums text-content/85">
          {prettyDate(row.lastRung)}
        </div>
        <div className="flex justify-end">
          {row.at.length + row.absent.length > 1 && (
            <button
              onClick={() => setOpen(expanded ? null : row.key)}
              aria-label={`${expanded ? "Hide" : "Show"} stores for ${row.label}`}
              className="w-5 h-5 flex items-center justify-center rounded text-content/85 hover:bg-gray-100"
            >
              <ChevronRightIcon
                className={`w-4 h-4 transition-transform ${
                  expanded ? "rotate-90" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="bg-bkg px-3 py-2 animate-nb-drop motion-reduce:animate-none">
          {row.at.map((a) => (
            <DeptAtStoreRow
              key={`${a.storeid}__${a.sub_department}`}
              a={a}
              row={row}
              send={send}
              saving={saving}
            />
          ))}
          {row.absent.length > 0 && (
            <p className="text-[11px] text-content/85 pt-1.5 leading-snug">
              Not rung in this window at{" "}
              <span className="font-semibold text-content">
                {row.absent.map((s) => s.store_number).join(", ")}
              </span>
              . Nothing to exclude there — widen the window if the department is
              seasonal.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CompDeptRow;
