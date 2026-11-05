import { SEV_CHIP } from "../utils/index";
import type { ItemSev } from "../interfaces/index";

interface SubDeptItemsOptionProps {
  checked: boolean;
  subDeptName?: string;
  sevs: Set<ItemSev>;
  onToggle: () => void;
  onToggleSev: (sev: ItemSev) => void;
}

const SubDeptItemsOption = ({
  checked,
  subDeptName,
  sevs,
  onToggle,
  onToggleSev,
}: SubDeptItemsOptionProps) => (
  <div className="flex items-start gap-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={onToggle}
      className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-[13px] font-medium text-content">Sub Dept Items</p>
        {subDeptName && (
          <span className="text-[10px] text-content italic truncate">
            {subDeptName}
          </span>
        )}
      </div>
      <p className="text-[11px] text-content mt-0.5 mb-1.5">
        Product-level items with severity grading (TY / LW / LY)
      </p>
      <div className="flex gap-1.5 flex-wrap">
        {SEV_CHIP.map(({ sev, label, activeClass }) => (
          <button
            key={sev}
            onClick={() => onToggleSev(sev)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
              sevs.has(sev)
                ? activeClass
                : "bg-custom-white border-gray-200 text-content"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default SubDeptItemsOption;
