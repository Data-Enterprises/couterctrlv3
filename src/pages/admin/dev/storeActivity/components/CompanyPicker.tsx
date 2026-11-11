// Components
import type { Company } from "../../../../../interfaces";

interface CompanyPickerProps {
  companies: Company[];
  mode: "select" | "reference";
  selectedId?: number;
  collisionName?: string;
  onSelect?: (id: number) => void;
  helpAnchor?: string;
}

/** A side list of companies. In select mode a click picks one; in reference mode it is read-only and
 *  highlights a company whose name matches the one being typed. */
const CompanyPicker = ({
  companies,
  mode,
  selectedId,
  collisionName,
  onSelect,
  helpAnchor,
}: CompanyPickerProps) => {
  const collides = (name: string) =>
    !!collisionName &&
    collisionName.trim().length > 0 &&
    name.toLowerCase() === collisionName.trim().toLowerCase();

  return (
    <div
      data-help={helpAnchor}
      className="flex flex-col border-r border-line_hair flex-shrink-0"
      style={{ width: "220px" }}
    >
      <div className="px-3 py-2.5 border-b border-line_hair flex-shrink-0">
        <span className="text-[9px] font-bold uppercase tracking-wide text-content">
          {mode === "reference" ? "Existing companies" : "Companies"}
        </span>
      </div>
      <div className="max-h-60 overflow-y-auto thin-scrollbar">
        {companies.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[12px] text-content">
            No companies found
          </div>
        ) : (
          companies.map((c) => {
            const isSelected = mode === "select" && selectedId === c.id;
            const isCollision = mode === "reference" && collides(c.name);
            return (
              <button
                key={c.id}
                onClick={() => onSelect?.(c.id)}
                disabled={mode === "reference"}
                className={`w-full text-left px-3 py-2 border-b border-line_hair text-[12px] transition-colors ${
                  mode === "select"
                    ? "cursor-pointer hover:bg-gray-50"
                    : "cursor-default"
                } ${isCollision ? "bg-brand_danger_bg text-brand_danger" : "text-content"}`}
                style={
                  isSelected
                    ? {
                        boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)",
                        background: "white",
                      }
                    : undefined
                }
              >
                {c.name}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CompanyPicker;
