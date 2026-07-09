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
      className={`flex items-center gap-1 rounded px-1.5 min-w-0 flex-1 ${className}`}
      style={{
        background: "rgba(30,42,74,0.06)",
        boxShadow: "inset 0 1px 3px rgba(30,42,74,0.1)",
      }}
    >
      <MagnifyingGlassIcon className="w-3 h-3 text-content/40 flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent text-[10px] text-content placeholder:text-content/40 min-w-0 flex-1 py-0.5 border-0"
        style={{ outline: "none", WebkitAppearance: "none", boxShadow: "none" }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="flex-shrink-0 text-content/40 hover:text-content transition-colors"
        >
          <XMarkIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default TextFilter;
