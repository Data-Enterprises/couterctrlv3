// Hooks
import { useState } from "react";
import { useAppDispatch } from "../../../../../hooks";

// Redux
import { setSaleDateFilter } from "../../../../../features/dev/devLossPreventionSlice";

// Utils
import { colInputStyle as inputStyle, fmtDate, fmtThreshold } from "../utils";

// Interfaces
import type { ThresholdValue } from "../../../../../components-dev/filters/ThresholdFilter";

// Components
import ThresholdFilter from "../../../../../components-dev/filters/ThresholdFilter";
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";
import ColFilter from "./ColFilter";

interface TransactionFiltersProps {
  appliedTransId: string;
  setAppliedTransId: (v: string) => void;
  appliedQty: ThresholdValue | null;
  setAppliedQty: (v: ThresholdValue | null) => void;
  appliedSales: ThresholdValue | null;
  setAppliedSales: (v: ThresholdValue | null) => void;
  saleDateFilter: string;
  uniqueDates: { label: string; value: string }[];
}

/** The transaction list's column filters: ID, date, quantity and total. */
const TransactionFilters = ({
  appliedTransId,
  setAppliedTransId,
  appliedQty,
  setAppliedQty,
  appliedSales,
  setAppliedSales,
  saleDateFilter,
  uniqueDates,
}: TransactionFiltersProps) => {
  const dispatch = useAppDispatch();
  // What is typed in each box, applied only on Apply.
  const [draftTransId, setDraftTransId] = useState("");
  const [draftQty, setDraftQty] = useState<ThresholdValue | null>(null);
  const [draftSales, setDraftSales] = useState<ThresholdValue | null>(null);
  return (
    <div
      className="grid sticky top-0 z-10 bg-gray-100 border-b border-gray-100"
      style={{
        gridTemplateColumns: "1fr 0.7fr 0.45fr 0.6fr",
      }}
    >
      <div className="px-3 py-2">
        <ColFilter
          label="Trans ID"
          active={!!appliedTransId}
          appliedDisplay={appliedTransId}
          onApply={() => setAppliedTransId(draftTransId)}
          onClear={() => {
            setAppliedTransId("");
            setDraftTransId("");
          }}
        >
          <input
            autoFocus
            style={inputStyle}
            placeholder="Search ID…"
            value={draftTransId}
            onChange={(e) =>
              setDraftTransId(e.target.value)
            }
          />
        </ColFilter>
      </div>
      <div className="px-3 py-2">
        <ColFilter
          label="Date"
          active={!!saleDateFilter}
          appliedDisplay={
            saleDateFilter
              ? fmtDate(saleDateFilter)
              : undefined
          }
          onApply={() => {}}
          onClear={() => dispatch(setSaleDateFilter(""))}
        >
          <SelectFilter
            options={uniqueDates}
            value={saleDateFilter}
            onChange={(v) => dispatch(setSaleDateFilter(v))}
            placeholder="All dates"
            className="w-full"
          />
        </ColFilter>
      </div>
      <div className="px-3 py-2 flex justify-end">
        <ColFilter
          label="Qty"
          active={!!appliedQty}
          appliedDisplay={fmtThreshold(appliedQty)}
          align="right"
          onApply={() => setAppliedQty(draftQty)}
          onClear={() => {
            setAppliedQty(null);
            setDraftQty(null);
          }}
        >
          <ThresholdFilter
            value={draftQty}
            onChange={setDraftQty}
            placeholder="Qty"
            showOp
            showClear
            stretch
            className="w-full"
          />
        </ColFilter>
      </div>
      <div className="px-3 py-2 flex justify-end">
        <ColFilter
          label="Total"
          active={!!appliedSales}
          appliedDisplay={fmtThreshold(appliedSales, "$")}
          align="right"
          onApply={() => setAppliedSales(draftSales)}
          onClear={() => {
            setAppliedSales(null);
            setDraftSales(null);
          }}
        >
          <ThresholdFilter
            value={draftSales}
            onChange={setDraftSales}
            prefix="$"
            placeholder="Sales"
            showOp
            showClear
            stretch
            className="w-full"
          />
        </ColFilter>
      </div>
    </div>
  );
};

export default TransactionFilters;
