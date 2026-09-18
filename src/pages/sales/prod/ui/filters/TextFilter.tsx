import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/20/solid";

interface TextFilterProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

const TextFilter = ({
  value,
  onChange,
  placeholder = "Filter…",
  className = "",
}: TextFilterProps) => {
  // A filter that's actually filtering has to look different from an empty
  // one — otherwise a shortened list reads as "no data" rather than "you
  // typed something".
  //
  // Signalled with the filter_active tokens plus a ring. Deliberately its own
  // token rather than row_selected: that one is the neutral row highlight, and
  // an applied filter needs to shout louder than a selected row does.
  const isActive = value.trim().length > 0;

  return (
    <div
      className={`flex items-center gap-1 rounded px-1.5 min-w-0 flex-1 border shadow-[0_1px_2px_rgba(30,42,74,0.08)] focus-within:border-[#1e2a4a] focus-within:shadow-[0_1px_4px_rgba(30,42,74,0.18)] transition-colors ${
        isActive
          ? "bg-filter_active border-filter_active_border ring-2 ring-filter_active_border/30 shadow-sm"
          : "bg-custom-white border-[#1e2a4a]/75 hover:border-[#1e2a4a]/50"
      } ${className}`}
    >
      <MagnifyingGlassIcon
        className={`w-3 h-3 flex-shrink-0 ${isActive ? "text-filter_active_border" : "text-[#1e2a4a]/75"}`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-transparent text-[12px] text-content placeholder:text-content/75 min-w-0 flex-1 py-0.5 border-0 ${isActive ? "font-medium" : ""}`}
        style={{ outline: "none", WebkitAppearance: "none", boxShadow: "none" }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="flex-shrink-0 text-content/85 hover:text-content transition-colors"
        >
          <XMarkIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default TextFilter;
