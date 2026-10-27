import { useMemo, useState, type ReactNode } from "react";
import Checkbox from "../../../components-dev/Checkbox";
import type { TicketStoreOption } from "../../../api/tickets";
import { groupByCompany, matchesStoreQuery } from "./ticketStores";

interface Props {
  /** Null while the list is on its way. */
  options: TicketStoreOption[] | null;
  picked: number[];
  onPicked: (next: number[]) => void;
  /** The explicit "Not about a store", which excludes every tick. */
  notAbout: boolean;
  onNotAbout: (next: boolean) => void;
  /** A tech's list is every store on the system; nobody scrolls 423. */
  searchable: boolean;
  /** Why the list could not be read, shown in place of it. */
  loadError?: string | null;
  /** A line under the list: a hint, or a "show all" for a narrowed list. */
  extra?: ReactNode;
}

/**
 * Which stores a ticket is about.
 *
 * A checklist rather than a dropdown: a ticket can be about several stores,
 * and the answer has to be visible while the rest of the form is filled in.
 * One answer is required, so "Not about a store" is a choice of its own
 * rather than what an empty list means. Leaving it empty by accident would
 * otherwise read exactly like saying so.
 *
 * Grouped by company when the list spans more than one, because two companies
 * can both have a store 5. Closed stores sit last in their company and can
 * still be ticked.
 */
const StoreChecklist = ({
  options,
  picked,
  onPicked,
  notAbout,
  onNotAbout,
  searchable,
  loadError,
  extra,
}: Props) => {
  const [query, setQuery] = useState("");
  const groups = useMemo(
    () =>
      groupByCompany(
        (options ?? []).filter((o) => matchesStoreQuery(o, query)),
      ),
    [options, query],
  );
  const several = useMemo(
    () => new Set((options ?? []).map((o) => o.company)).size > 1,
    [options],
  );

  const toggle = (storeid: number, on: boolean) => {
    onPicked(
      on ? [...picked, storeid] : picked.filter((id) => id !== storeid),
    );
    if (on && notAbout) onNotAbout(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium">
        Which stores{" "}
        <span className="font-normal text-content/85">
          — tick at least one, or say it isn't about a store
        </span>
      </span>

      {loadError ? (
        <p className="m-0 rounded-lg border border-severity_watch_text/25 bg-severity_watch_bg px-3 py-2 text-[12px] text-severity_watch_text">
          {loadError}
        </p>
      ) : (
        <>
          {searchable && (
            <>
              <label htmlFor="ticket-store-search" className="sr-only">
                Find a store
              </label>
              <input
                id="ticket-store-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a store by number, name or company"
                className="w-full rounded-lg border border-brand_line bg-custom-white px-3 py-1.5 text-[12.5px]"
              />
            </>
          )}

          <div
            className={`max-h-[200px] overflow-y-auto thin-scrollbar rounded-lg border border-brand_line bg-custom-white px-3 py-2 ${
              notAbout ? "opacity-60" : ""
            }`}
          >
            {options === null && (
              <p className="m-0 text-[12px] text-content/85">
                Reading your stores...
              </p>
            )}
            {options !== null && groups.length === 0 && (
              <p className="m-0 text-[12px] text-content/85">
                {query ? "No store matches that." : "No stores to pick from."}
              </p>
            )}
            {groups.map((g) => (
              <div key={g.company} className="flex flex-col gap-1 py-0.5">
                {several && (
                  <div className="pt-1 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                    {g.company_name}
                  </div>
                )}
                {g.stores.map((o) => (
                  <Checkbox
                    key={o.storeid}
                    checked={picked.includes(o.storeid)}
                    onChange={(on) => toggle(o.storeid, on)}
                    label={
                      <span className="min-w-0 truncate text-[12.5px] text-content">
                        <span className="font-mono text-[11.5px]">
                          #{o.store_number}
                        </span>{" "}
                        {o.store_name}
                        {o.deactivated && (
                          <span className="text-content/85"> (closed)</span>
                        )}
                      </span>
                    }
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              checked={notAbout}
              onChange={(on) => {
                onNotAbout(on);
                if (on) onPicked([]);
              }}
              label={
                <span className="text-[12.5px] text-content">
                  Not about a store
                </span>
              }
            />
            <div className="flex-1" />
            {picked.length > 0 && (
              <span className="text-[11.5px] tabular-nums text-content/85">
                {picked.length} picked
              </span>
            )}
          </div>
        </>
      )}

      {extra}
    </div>
  );
};

export default StoreChecklist;
