// Interfaces
import type { Company } from "../../../../../interfaces";

interface CompanyPickerProps {
  companies: Company[];
  selectedId: number;
  onSelect: (id: number) => void;
  helpAnchor?: string;
}

/** A side list of companies; a click picks one. */
const CompanyPicker = ({
  companies,
  selectedId,
  onSelect,
  helpAnchor,
}: CompanyPickerProps) => (
  <div
    data-help={helpAnchor}
    className="flex flex-col border-r border-line_hair flex-shrink-0"
    style={{ width: "220px" }}
  >
    <div className="px-3 py-2.5 border-b border-line_hair flex-shrink-0">
      <span className="text-[9px] cc-caps-strong">Companies</span>
    </div>
    <div className="max-h-60 overflow-y-auto thin-scrollbar">
      {companies.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-[12px] text-content">
          No companies found
        </div>
      ) : (
        companies.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="w-full text-left px-3 py-2 border-b border-line_hair text-[12px] transition-colors cursor-pointer hover:bg-fill_soft text-content"
            style={
              selectedId === c.id
                ? {
                    boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)",
                    background: "white",
                  }
                : undefined
            }
          >
            {c.name}
          </button>
        ))
      )}
    </div>
  </div>
);

export default CompanyPicker;
