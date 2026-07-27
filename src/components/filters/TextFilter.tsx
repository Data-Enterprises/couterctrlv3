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
  return (
    <div
      className={`flex items-center gap-1 rounded px-1.5 min-w-0 flex-1 bg-custom-white border border-[#1e2a4a]/75 shadow-[0_1px_2px_rgba(30,42,74,0.08)] hover:border-[#1e2a4a]/50 focus-within:border-[#1e2a4a]/60 focus-within:shadow-[0_1px_4px_rgba(30,42,74,0.18)] transition-colors ${className}`}
    >
      <MagnifyingGlassIcon className="w-3 h-3 text-[#1e2a4a]/75 flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent text-[12px] text-content placeholder:text-content/75 min-w-0 flex-1 py-0.5 border-0"
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
