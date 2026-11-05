// Interfaces
import type { GroupsTab } from "../interfaces";

const tabs: { id: GroupsTab; label: string }[] = [
    {
        id: "user",
        label: "User Groups"
    },
    {
        id: "shared",
        label: "Shared Groups"
    }
];

interface FormNavTabsProps {
    setTab: (tab: GroupsTab) => void;
    tab: GroupsTab;
}

const FormNavTabs = ({setTab, tab}: FormNavTabsProps) => {
    return (<div className="flex border-b border-gray-100 flex-shrink-0">
        {tabs.map(({ id, label }) => (
            <button
            key={id}
            onClick={() => setTab(id)}
            className={`text-[12px] font-semibold py-2.5 px-4 whitespace-nowrap border-b-2 transition-colors ${
                tab === id
                ? "border-brand_navy text-brand_navy"
                : "border-transparent text-content"
            }`}
            >
            {label}
            </button>
        ))}
        </div>
    )
};

export default FormNavTabs;