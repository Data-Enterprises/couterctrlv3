// Components
import TextFilter from "../../../../../components-dev/filters/TextFilter";
import { PlusIcon } from "@heroicons/react/20/solid";

interface CompanyToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  onNew: () => void;
}

/** The Companies search box and the New company button. */
const CompanyToolbar = ({ search, setSearch, onNew }: CompanyToolbarProps) => (
  <div className="flex items-center gap-2 mb-3">
    <TextFilter
      value={search}
      onChange={setSearch}
      placeholder="Search companies…"
      className="flex-1"
    />
    <button
      onClick={onNew}
      className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy_hover flex-shrink-0"
    >
      <PlusIcon className="w-3.5 h-3.5" />
      New company
    </button>
  </div>
);

export default CompanyToolbar;
