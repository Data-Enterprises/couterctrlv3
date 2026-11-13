// Utils
import { STATUSES, PRIORITIES } from "../utils";
import { STATUS_LABEL } from "../../../utils/ticketsUtils";

// Interfaces
import type { TicketStore } from "../../../../../../api/tickets";
import type { TicketFilters } from "../../../../../../features/dev/devTicketsSlice";

// Components
import MultiSelectFilter from "../../../../../../components-dev/filters/MultiSelectFilter";

interface InboxFiltersProps {
  filters: TicketFilters;
  onFilters: (next: Partial<TicketFilters>) => void;
  onClearFilters: () => void;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  storeOptions: TicketStore[];
  narrowed: boolean;
}

/** The queue's status, priority and (when there is more than one) store filters, with counts and a clear button once narrowed. */
const InboxFilters = ({
  filters,
  onFilters,
  onClearFilters,
  statusCounts,
  priorityCounts,
  storeOptions,
  narrowed,
}: InboxFiltersProps) => {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <MultiSelectFilter
          options={STATUSES.map((s) => ({
            value: s,
            label: `${STATUS_LABEL[s]} (${statusCounts[s] ?? 0})`,
          }))}
          values={filters.status}
          onChange={(values) => onFilters({ status: values })}
          placeholder="Any status"
          noun="statuses"
          className="flex-1"
        />
        <MultiSelectFilter
          options={PRIORITIES.map((p) => ({
            value: p.value,
            label: `${p.label} (${priorityCounts[p.value] ?? 0})`,
          }))}
          values={filters.priority}
          onChange={(values) => onFilters({ priority: values })}
          placeholder="Any priority"
          noun="priorities"
          className="flex-1"
        />
        {narrowed && (
          <button
            type="button"
            onClick={onClearFilters}
            aria-label="Clear narrowing"
            title="Clear narrowing"
            className="flex-none rounded px-1.5 py-0.5 text-[12px] font-semibold text-brand_navy_hover hover:bg-bkg"
          >
            ✕
          </button>
        )}
      </div>

      {storeOptions.length > 1 && (
        <MultiSelectFilter
          options={storeOptions.map((s) => ({
            value: String(s.storeid),
            label: `#${s.store_number} ${s.store_name}`,
          }))}
          values={filters.stores}
          onChange={(values) => onFilters({ stores: values })}
          placeholder="Any store"
          noun="stores"
          className="mt-2 w-full"
        />
      )}
    </>
  );
};

export default InboxFilters;
