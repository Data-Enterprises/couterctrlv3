// Utils
import { formatCurrency2 } from "../../../../../../utils";

// Interfaces
import type { GroupedSection } from "../interfaces";

interface SectionListProps {
  groupedSections: GroupedSection[];
  selectedSection: string | null;
  onSelect: (key: string | null) => void;
}

/** The left column: one card per group, with its total and count. */
const SectionList = ({ groupedSections, selectedSection, onSelect }: SectionListProps) => (
    <div
      className="flex flex-col border-r border-gray-100 flex-shrink-0"
      style={{ width: "26%" }}
    >
      {/* Section cards */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {groupedSections.map((section) => {
          const isSel = selectedSection === section.key;
          return (
            <button
              key={section.key}
              onClick={() =>
                onSelect(isSel ? null : section.key)
              }
              className={`w-full px-3 py-2 border-b border-gray-100 last:border-0 gap-2 text-left transition-colors ${isSel ? "bg-custom-white" : "hover:bg-gray-50"}`}
              style={
                isSel
                  ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" }
                  : undefined
              }
            >
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium flex-1 truncate text-content">
                  {section.label}
                </span>
                <div className="flex items-baseline gap-1.5 flex-shrink-0">
                  <span className="text-[12px] font-semibold text-content">
                    {formatCurrency2(section.total)}
                  </span>
                  <span className="text-[11px] text-content/95">
                    {section.count}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
);

export default SectionList;
