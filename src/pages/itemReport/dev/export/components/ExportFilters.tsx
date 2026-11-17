// Interfaces
import type { MultiSelectOption } from "../../../../../components-dev/filters/interfaces";
import type { FilterKind } from "../interfaces";

// Components
import MultiSelectFilter from "../../../../../components-dev/filters/MultiSelectFilter";

interface ExportFiltersProps {
  /** Custom mode shows every filter; a preset shows only the ones it declares. */
  custom: boolean;
  presetFilters: FilterKind[];
  actionOpts: MultiSelectOption[];
  actionPick: string[];
  onActionPick: (values: string[]) => void;
  vendorOpts: MultiSelectOption[];
  vendorPick: string[];
  onVendorPick: (values: string[]) => void;
  deptOpts: MultiSelectOption[];
  deptPick: string[];
  onDeptPick: (values: string[]) => void;
}

/** The narrowing row shared by both modes: actions (custom only), vendors and
 *  departments. A vendor packet has no use for a department picker, and an
 *  unexplained control is one more thing to get wrong. */
const ExportFilters = ({
  custom,
  presetFilters,
  actionOpts,
  actionPick,
  onActionPick,
  vendorOpts,
  vendorPick,
  onVendorPick,
  deptOpts,
  deptPick,
  onDeptPick,
}: ExportFiltersProps) => (
  <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
    {custom && (
      <>
        <span className="text-[11px] text-content">Actions</span>
        <MultiSelectFilter
          options={actionOpts}
          values={actionPick}
          onChange={onActionPick}
          placeholder="All actions"
          noun="actions"
          className="w-[180px]"
        />
      </>
    )}
    {(custom || presetFilters.includes("vendor")) && (
      <>
        <span className="text-[11px] text-content">Vendors</span>
        <MultiSelectFilter
          options={vendorOpts}
          values={vendorPick}
          onChange={onVendorPick}
          placeholder="All vendors"
          noun="vendors"
          className="w-[200px]"
        />
      </>
    )}
    {(custom || presetFilters.includes("dept")) && (
      <>
        <span className="text-[11px] text-content">Departments</span>
        <MultiSelectFilter
          options={deptOpts}
          values={deptPick}
          onChange={onDeptPick}
          placeholder="All departments"
          noun="departments"
          className="w-[200px]"
        />
      </>
    )}
  </div>
);

export default ExportFilters;
