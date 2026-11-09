// Utils
import { GROUP_TABS } from "../utils";

// Interfaces
import type { GroupTab } from "../../../interfaces";

interface GroupTabsProps {
  groupTab: GroupTab;
  onTab: (tab: GroupTab) => void;
}

/** Sub dept, Date, Cashier. */
const GroupTabs = ({ groupTab, onTab }: GroupTabsProps) => (
    <div data-help="tabs" className="flex items-center border-b border-gray-100 flex-shrink-0">
      {GROUP_TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onTab(t.key)}
          className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
            groupTab === t.key
              ? "border-brand_navy text-content"
              : "border-transparent text-content/50 hover:text-content/70"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
);

export default GroupTabs;
