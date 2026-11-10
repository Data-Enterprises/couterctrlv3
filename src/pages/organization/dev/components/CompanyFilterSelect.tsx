// Components
import SelectFilter from "../../../../components-dev/filters/SelectFilter";

interface CompanyFilterSelectProps {
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}

/**
 * "Any company", or one of them: the filter all three assign tabs share.
 * Renders nothing when there is only "Any" to pick.
 */
const CompanyFilterSelect = ({ value, onChange, options }: CompanyFilterSelectProps) => {
  if (options.length === 0) return null;
  return (
    <div className="w-[170px]">
      <SelectFilter
        value={value}
        onChange={onChange}
        options={options}
        placeholder="Any company"
        searchable={options.length > 8}
      />
    </div>
  );
};

export default CompanyFilterSelect;
