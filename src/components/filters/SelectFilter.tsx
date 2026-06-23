import { ChevronDownIcon } from "@heroicons/react/20/solid";

export interface SelectFilterOption {
  label: string;
  value: string;
}

interface SelectFilterProps {
  options: SelectFilterOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

const SelectFilter = ({ options, value, onChange, placeholder = "All", className = "" }: SelectFilterProps) => {
  return (
    <div className={`relative flex items-center flex-shrink-0 ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded pl-1.5 pr-5 py-0.5 text-[10px] text-content outline-none cursor-pointer border-0 w-full thin-scrollbar"
        style={{ background: "rgba(30,42,74,0.06)", boxShadow: "inset 0 1px 3px rgba(30,42,74,0.1)" }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDownIcon className="w-3 h-3 text-content/40 absolute right-1.5 pointer-events-none" />
    </div>
  );
};

export default SelectFilter;
