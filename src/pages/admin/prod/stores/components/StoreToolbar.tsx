// Interfaces
import type { StatusFilter } from "../../../../../features/adminPageSlice";

// Components
import TextFilter from "../../../../../components/filters/TextFilter";
import SelectFilter from "../../../../../components/filters/SelectFilter";
import { PlusIcon } from "@heroicons/react/20/solid";

interface StoreToolbarProps {
  companyOptions: { value: string; label: string }[];
  companyFilter: string;
  onCompany: (value: string) => void;
  /** The endpoint reports which stores are closed, so the filter means something. */
  statusKnown: boolean;
  statusFilter: StatusFilter;
  onStatus: (value: StatusFilter) => void;
  search: string;
  onSearch: (value: string) => void;
  /** Creating a store is level 9 or support only on the backend. */
  canCreate: boolean;
  onNew: () => void;
}

/** The Stores filters (company, open or closed, search) and New store. */
const StoreToolbar = ({
  companyOptions,
  companyFilter,
  onCompany,
  statusKnown,
  statusFilter,
  onStatus,
  search,
  onSearch,
  canCreate,
  onNew,
}: StoreToolbarProps) => (
  <div className="flex items-center gap-2 mb-3">
    <SelectFilter
      options={companyOptions}
      value={companyFilter}
      onChange={onCompany}
      placeholder="All companies"
      className="w-[190px] flex-shrink-0"
    />
    {statusKnown && (
      <SelectFilter
        options={[
          { value: "open", label: "Open" },
          { value: "closed", label: "Closed" },
        ]}
        value={statusFilter === "all" ? "" : statusFilter}
        onChange={(v) => onStatus((v || "all") as StatusFilter)}
        placeholder="Open and closed"
        className="w-[150px] flex-shrink-0"
      />
    )}
    <TextFilter
      value={search}
      onChange={onSearch}
      placeholder="Search stores…"
      className="flex-1"
    />
    {canCreate && (
      <button
        onClick={onNew}
        className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy_hover flex-shrink-0"
      >
        <PlusIcon className="w-3.5 h-3.5" />
        New store
      </button>
    )}
  </div>
);

export default StoreToolbar;
