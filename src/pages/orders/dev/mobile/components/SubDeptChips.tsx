// Utils
import { MAX_CHIPS } from "../utils";

interface SubDeptChipsProps {
  subDepts: string[];
}

/** An order's sub departments as chips, the rest as +N. */
const SubDeptChips = ({ subDepts }: SubDeptChipsProps) => {
  const visible = subDepts.slice(0, MAX_CHIPS);
  const overflow = subDepts.slice(MAX_CHIPS);
  return (
    <div className="flex flex-wrap gap-1 items-center mt-1.5">
      {visible.map((sd) => (
        <span key={sd} className="text-[10px] bg-fill_muted text-content rounded px-1.5 py-0.5">{sd}</span>
      ))}
      {overflow.length > 0 && (
        <span className="text-[10px] font-semibold bg-brand_navy/[0.07] text-content rounded px-1.5 py-0.5">
          +{overflow.length} more
        </span>
      )}
    </div>
  );
};

export default SubDeptChips;
