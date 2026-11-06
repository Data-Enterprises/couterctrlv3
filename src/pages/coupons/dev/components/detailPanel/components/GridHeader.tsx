// Utils
import { fmtThreshold } from "../utils";

// Interfaces
import type { GridFilters } from "../interfaces";

// Components
import ThresholdFilter from "../../../../../../components-dev/filters/ThresholdFilter";
import SelectFilter from "../../../../../../components-dev/filters/SelectFilter";
import ColFilter from "./ColFilter";

interface Props {
  filters: GridFilters;
}

/** The grid's headings, four of them filters. */
const GridHeader = ({ filters }: Props) => {
  const {
    draftUpc,
    setDraftUpc,
    appliedUpc,
    setAppliedUpc,
    draftProduct,
    setDraftProduct,
    appliedProduct,
    setAppliedProduct,
    draftSubDept,
    setDraftSubDept,
    appliedSubDept,
    setAppliedSubDept,
    draftAmount,
    setDraftAmount,
    appliedAmount,
    setAppliedAmount,
    uniqueSubDeptOptions,
  } = filters;
  return (
    <tr className="sticky top-0 bg-gray-100 border-b border-gray-100 z-10">
      <th
        className="px-3 py-2 text-left w-32"
        style={{ overflow: "visible" }}
      >
        <ColFilter
          label="UPC"
          active={!!appliedUpc}
          appliedDisplay={appliedUpc}
          onApply={() => setAppliedUpc(draftUpc)}
          onClear={() => {
            setAppliedUpc("");
            setDraftUpc("");
          }}
        >
          <input
            autoFocus
            style={{
              width: "100%",
              fontSize: 11,
              border: "1px solid rgb(var(--color-brand-navy) / 0.15)",
              borderRadius: 4,
              padding: "4px 7px",
              outline: "none",
              color: "var(--color-text-primary)",
              background: "rgb(var(--color-brand-navy) / 0.03)",
            }}
            placeholder="Search UPC…"
            value={draftUpc}
            onChange={(e) => setDraftUpc(e.target.value)}
          />
        </ColFilter>
      </th>
      <th
        className="px-3 py-2 text-left"
        style={{ overflow: "visible" }}
      >
        <ColFilter
          label="Product"
          active={!!appliedProduct}
          appliedDisplay={appliedProduct}
          onApply={() => setAppliedProduct(draftProduct)}
          onClear={() => {
            setAppliedProduct("");
            setDraftProduct("");
          }}
        >
          <input
            autoFocus
            style={{
              width: "100%",
              fontSize: 11,
              border: "1px solid rgb(var(--color-brand-navy) / 0.15)",
              borderRadius: 4,
              padding: "4px 7px",
              outline: "none",
              color: "var(--color-text-primary)",
              background: "rgb(var(--color-brand-navy) / 0.03)",
            }}
            placeholder="Search product…"
            value={draftProduct}
            onChange={(e) =>
              setDraftProduct(e.target.value)
            }
          />
        </ColFilter>
      </th>
      <th
        className="px-3 py-2 text-left"
        style={{ overflow: "visible", width: "10.2%" }}
      >
        <ColFilter
          label="Sub dept"
          active={!!appliedSubDept}
          appliedDisplay={appliedSubDept}
          onApply={() => setAppliedSubDept(draftSubDept)}
          onClear={() => {
            setAppliedSubDept("");
            setDraftSubDept("");
          }}
        >
          <SelectFilter
            options={uniqueSubDeptOptions}
            value={draftSubDept}
            onChange={setDraftSubDept}
            placeholder="All sub depts"
            className="w-full"
          />
        </ColFilter>
      </th>
      <th
        className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content text-right whitespace-nowrap"
        style={{ width: "8%" }}
      >
        Trans
      </th>
      <th className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-content text-right w-12">
        Count
      </th>
      <th
        className="px-3 py-2 text-right w-24"
        style={{ overflow: "visible" }}
      >
        <ColFilter
          label="Total"
          active={!!appliedAmount}
          appliedDisplay={fmtThreshold(
            appliedAmount,
            "$",
          )}
          align="right"
          onApply={() => setAppliedAmount(draftAmount)}
          onClear={() => {
            setAppliedAmount(null);
            setDraftAmount(null);
          }}
        >
          <ThresholdFilter
            value={draftAmount}
            onChange={setDraftAmount}
            prefix="$"
            placeholder="Amount"
            showOp
            showClear
            stretch
            className="w-full"
          />
        </ColFilter>
      </th>
    </tr>
  );
};

export default GridHeader;
