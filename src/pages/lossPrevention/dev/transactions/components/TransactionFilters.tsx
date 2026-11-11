// Hooks
import { useAppDispatch } from "../../../../../hooks";

// Redux
import { setSaleDateFilter } from "../../../../../features/dev/devLossPreventionSlice";

// Utils
import { colInputStyle as inputStyle, fmtDate, fmtThreshold } from "../utils";

// Interfaces
import type { ThresholdValue } from "../../../../../interfaces";

// Components
import ThresholdFilter from "../../../../../components-dev/filters/ThresholdFilter";
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";
import ColFilter from "./ColFilter";

interface TransactionFiltersProps {
  draftTransId: string;
  setDraftTransId: (v: string) => void;
  draftQty: ThresholdValue | null;
  setDraftQty: (v: ThresholdValue | null) => void;
  draftSales: ThresholdValue | null;
  setDraftSales: (v: ThresholdValue | null) => void;
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
  draftTransId,
  setDraftTransId,
  draftQty,
  setDraftQty,
  draftSales,
  setDraftSales,
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
  return (
    <div
      className="grid sticky top-0 z-10 bg-fill_muted border-b border-line_hair"
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
