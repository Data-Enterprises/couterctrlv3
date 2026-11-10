// Interfaces
import type { Show } from "../interfaces";

interface GroupTypeTabsProps {
  show: Show;
  setShow: (id: Show) => void;
  count: Record<Show, number>;
}

/** The All / Mine / Shared tabs above the group list, each with its count. */
const GroupTypeTabs = ({ show, setShow, count }: GroupTypeTabsProps) => {
  return (
    <div
      role="tablist"
      aria-label="Which groups"
      className="flex gap-1 px-2.5 py-2 border-b border-gray-100"
    >
      {(["all", "mine", "shared"] as const).map((id) => (
        <button
          key={id}
          role="tab"
          aria-selected={show === id}
          onClick={() => setShow(id)}
          className={`flex-1 text-[11px] font-semibold py-1 rounded-md capitalize transition-colors ${
            show === id
              ? "bg-brand_navy text-custom-white"
              : "text-content hover:bg-gray-100"
          }`}
        >
          {id} <span className="tabular-nums opacity-70">{count[id]}</span>
        </button>
      ))}
    </div>
  );
};

export default GroupTypeTabs;
