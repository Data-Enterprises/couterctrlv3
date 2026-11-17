// Utils
import { ALL_STORES } from "../utils";

// Interfaces
import type { Store } from "../../../../../interfaces";

// Components
import TextFilter from "../../../../../components-dev/filters/TextFilter";
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";
import Field from "./Field";

interface SubExclToolbarProps {
  companyOptions: { value: string; label: string }[];
  companyId: string;
  onCompany: (value: string) => void;
  /** The picked company's stores, for the Store select. */
  companyStores: Store[];
  storeKey: string;
  onStore: (value: string) => void;
  search: string;
  onSearch: (value: string) => void;
  hashOnly: boolean;
  onHashOnly: () => void;
  /** Likely-hash departments not yet excluded everywhere. */
  suggestedLeft: number;
}

/** The filters over the departments: company (when there is more than one),
 *  store, a search, and the Likely hash toggle. */
const SubExclToolbar = ({
  companyOptions,
  companyId,
  onCompany,
  companyStores,
  storeKey,
  onStore,
  search,
  onSearch,
  hashOnly,
  onHashOnly,
  suggestedLeft,
}: SubExclToolbarProps) => (
  <div className="flex items-end gap-2 mb-2 flex-shrink-0">
    {companyOptions.length > 1 && (
      <Field label="Company">
        <SelectFilter
          plain
          value={companyId}
          onChange={onCompany}
          options={companyOptions}
          searchable={companyOptions.length > 8}
        />
      </Field>
    )}
    <Field label="Store">
      <SelectFilter
        plain
        value={storeKey}
        onChange={onStore}
        options={[
          {
            value: ALL_STORES,
            label: `All ${companyStores.length} stores`,
          },
          ...companyStores.map((s) => ({
            value: String(s.storeid),
            label: s.store_name,
          })),
        ]}
        searchable={companyStores.length > 8}
      />
    </Field>
    <TextFilter
      value={search}
      onChange={onSearch}
      placeholder="Search departments…"
      className="flex-1"
    />
    <button
      onClick={onHashOnly}
      title="Lottery, money orders, stamps and the like"
      className={`text-[11.5px] font-medium px-3 py-1.5 rounded-md flex-shrink-0 border transition-colors ${
        hashOnly
          ? "bg-brand_navy border-brand_navy text-custom-white"
          : "bg-custom-white border-line_field text-content hover:bg-fill_soft"
      }`}
    >
      Likely hash{suggestedLeft > 0 ? ` (${suggestedLeft})` : ""}
    </button>
  </div>
);

export default SubExclToolbar;
