// Hooks
import { useMemo, useState, type ReactNode } from "react";

// API
import type { TicketStoreOption } from "../../../../api/tickets";

// Utils
import { groupByCompany, matchesStoreQuery } from "../utils";

// Components
import Checkbox from "../../../../components-dev/Checkbox";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface Props {
  options: TicketStoreOption[] | null;
  picked: number[];
  onPicked: (next: number[]) => void;
  notAbout: boolean;
  onNotAbout: (next: boolean) => void;
  searchable: boolean;
  loadError?: string | null;
  extra?: ReactNode;
}

/**
 * A checklist rather than a dropdown: a ticket can be about several stores,
 * and the answer has to be visible while the rest of the form is filled in.
 * Grouped by company when the list spans more than one, because two companies
 * can both have a store 5. Closed stores sit last in their company and can
 * still be ticked. Each company folds independently.
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
  const [folded, setFolded] = useState<Map<string, boolean>>(new Map());
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

  const companyKey = (company: number | null) => String(company ?? "none");
  const isOpen = (company: number | null, stores: TicketStoreOption[]) => {
    if (!several || query.trim()) return true;
    const set = folded.get(companyKey(company));
    return set === undefined
      ? stores.some((o) => picked.includes(o.storeid))
      : !set;
  };
  const setOpen = (company: number | null, open: boolean) =>
    setFolded((m) => new Map(m).set(companyKey(company), !open));

  const toggle = (storeid: number, on: boolean) => {
    onPicked(on ? [...picked, storeid] : picked.filter((id) => id !== storeid));
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
            {groups.map((g) => {
              const open = isOpen(g.company, g.stores);
              const ticked = g.stores.filter((o) =>
                picked.includes(o.storeid),
              ).length;
              const name = g.company_name || "No company";
              return (
                <div
                  key={companyKey(g.company)}
                  className="flex flex-col gap-1 py-0.5"
                >
                  {several && (
                    <button
                      type="button"
                      onClick={() => setOpen(g.company, !open)}
                      aria-expanded={open}
                      className="-mx-1 flex items-center gap-1 rounded px-1 pt-1 text-left hover:bg-row_selected"
                    >
                      <ChevronRightIcon
                        className={`h-4 w-4 shrink-0 text-content/85 transition-transform ${open ? "rotate-90" : ""}`}
                        aria-hidden
                      />
                      <span className="text-[13px] font-semibold text-content">
                        {name}
                      </span>
                      <span className="text-[12px] text-content/85">
                        · {g.stores.length}{" "}
                        {g.stores.length === 1 ? "store" : "stores"}
                        {ticked > 0 && (
                          <span className="font-semibold text-content">
                            {" "}
                            · {ticked} ticked
                          </span>
                        )}
                      </span>
                    </button>
                  )}
                  {open &&
                    g.stores.map((o) => (
                      <Checkbox
                        key={o.storeid}
                        checked={picked.includes(o.storeid)}
                        onChange={(on) => toggle(o.storeid, on)}
                        label={
                          <span className="min-w-0 truncate text-[12.5px] text-content">
                            {o.store_name || `Store ${o.store_number}`}
                            {o.deactivated && (
                              <span className="text-content/85"> (closed)</span>
                            )}
                          </span>
                        }
                      />
                    ))}
                </div>
              );
            })}
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
