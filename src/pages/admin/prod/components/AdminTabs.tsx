// Interfaces
import type { AdminForm } from "../../../../features/adminPageSlice";

interface AdminTabsProps {
  /** The tabs this user may open. */
  tabs: { id: AdminForm; label: string }[];
  active: AdminForm;
  onPick: (id: AdminForm) => void;
}

/** The row of Admin tabs, the open one underlined in navy. */
const AdminTabs = ({ tabs, active, onPick }: AdminTabsProps) => (
  <div className="flex border-b border-line_hair flex-shrink-0">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onPick(tab.id)}
        className={`text-[12px] font-semibold py-2.5 px-4 whitespace-nowrap border-b-2 transition-colors ${
          active === tab.id
            ? "border-brand_navy text-brand_navy"
            : "border-transparent text-content"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default AdminTabs;
