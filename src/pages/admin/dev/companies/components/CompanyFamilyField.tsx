// Interfaces
import type { CompanyRecord } from "../interfaces";

// Components
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";

interface CompanyFamilyFieldProps {
  /** Companies that sit under this one; any means it heads a family. */
  members: CompanyRecord[];
  parentOptions: { label: string; value: string }[];
  parent: number | null;
  setParent: (id: number | null) => void;
}

/** The form's "Belongs to": the parent to sit under, or, for a company that
 *  heads a family, which companies sit under it. Families are one level deep. */
const CompanyFamilyField = ({
  members,
  parentOptions,
  parent,
  setParent,
}: CompanyFamilyFieldProps) => (
  <div className="col-span-2">
    <div className="text-[11px] font-medium text-content mb-1">Belongs to</div>
    {members.length > 0 ? (
      <p className="text-[11.5px] text-content/95 m-0">
        {members.length}{" "}
        {members.length === 1 ? "company belongs" : "companies belong"} under
        this one ({members.map((m) => m.name).join(", ")}), so it heads its
        family and can't belong under another.
      </p>
    ) : (
      <>
        <SelectFilter
          options={parentOptions}
          value={parent === null ? "" : String(parent)}
          onChange={(v) => setParent(v === "" ? null : Number(v))}
          placeholder="None — stands alone"
          searchable
          searchPlaceholder="Find a company…"
          className="w-full"
        />
        <p className="text-[10.5px] text-content/95 mt-1 m-0">
          Its managers and the parent's family administer each other's people.
          Houchens' companies belong under Houchens.
        </p>
      </>
    )}
  </div>
);

export default CompanyFamilyField;
