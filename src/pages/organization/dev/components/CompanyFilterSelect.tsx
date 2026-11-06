import SelectFilter from "../../../../components-dev/filters/SelectFilter";

/**
 * "Any company", or one of them — the narrowing that all three assign tabs
 * share. Its own file so the hooks beside it in `companyFilter` stay
 * fast-refresh friendly.
 *
 * Renders nothing when there is nothing to choose between: a dropdown whose
 * only option is "Any" is a control that cannot do anything.
 */
const CompanyFilterSelect = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) => {
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
