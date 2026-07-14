import type { Company } from "../../../interfaces";

interface CompanyPickerProps {
  companies: Company[];
  mode: "select" | "reference";
  selectedId?: number;
  collisionName?: string;
  onSelect?: (id: number) => void;
}

const CompanyPicker = ({ companies, mode, selectedId, collisionName, onSelect }: CompanyPickerProps) => {
  const collides = (name: string) =>
    !!collisionName && collisionName.trim().length > 0 && name.toLowerCase() === collisionName.trim().toLowerCase();

  return (
    <div className="flex flex-col border-r border-gray-100 flex-shrink-0" style={{ width: "220px" }}>
      <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
        <span className="text-[9px] font-bold uppercase tracking-wide text-content">
          {mode === "reference" ? "Existing companies" : "Companies"}
        </span>
      </div>
      <div className="max-h-60 overflow-y-auto thin-scrollbar">
        {companies.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[12px] text-content">No companies found</div>
        ) : (
          companies.map((c) => {
            const isSelected = mode === "select" && selectedId === c.id;
            const isCollision = mode === "reference" && collides(c.name);
            return (
              <button
                key={c.id}
                onClick={() => onSelect?.(c.id)}
                disabled={mode === "reference"}
                className={`w-full text-left px-3 py-2 border-b border-gray-100 text-[12px] transition-colors ${
                  mode === "select" ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
                } ${isCollision ? "bg-red-50 text-red-800" : "text-content"}`}
                style={isSelected ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)", background: "white" } : undefined}
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
