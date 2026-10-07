import { useEffect, useMemo, useState } from "react";
import { useAdminPageCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getUserStores } from "../../../api/user";
import {
  createNewStore,
  deactivateStore,
  reactivateStore,
} from "../../../api/admin";
import type { JsonError, Store } from "../../../interfaces";
import Input from "../../../components-dev/inputs/Input";
import SelectFilter from "../../../components-dev/filters/SelectFilter";
import TextFilter from "../../../components-dev/filters/TextFilter";

/**
 * Creating a store, and taking one in or out of service.
 *
 * Owner and up: the whole dev Admin page is behind ADMIN_MIN_LEVEL, so there
 * is no second gate here — one gate that can be found beats two that can
 * disagree.
 *
 * Stores are fetched into local state rather than read from `state.user`'s
 * assigned/unassigned lists: those back the signed-in user's own nav and
 * permissions, and a page that creates and deactivates records should not be
 * editing the list its own chrome is drawn from. `NewStoreName` does the same
 * for the same reason.
 */

/**
 * Nothing the frontend fetches says whether a store is already deactivated.
 *
 * `Store` carries no `deactivated_at`, and the activity figures on the other
 * tab count days with sales, which is a different question — a store can be
 * perfectly active and have posted nothing all week.
 *
 * So this screen does not claim to know. Both actions are offered, both are
 * idempotent on the server (one stamps `deactivated_at`, the other nulls it),
 * and the page says what it cannot tell you rather than guessing and being
 * wrong half the time.
 */
const STATE_UNKNOWN =
  "The store record carries no status the frontend can read, so both actions are safe to repeat.";

type Pending = "create" | "deactivate" | "reactivate" | null;

const StoreRecords = () => {
  const toast = useToast();
  const context = useAdminPageCtx();

  const [stores, setStores] = useState<Store[] | null>(null);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [selected, setSelected] = useState<Store | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const [newNumber, setNewNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");

  /** The backend can return a null store_name or store_number despite the
   *  type claiming string — the same guard NewStoreName needs, or the search
   *  below throws on a null `toLowerCase`. */
  const validOnly = (list: Store[]) =>
    list.filter((s) => s.store_number !== null && s.store_name !== null);

  const fetchStores = () => {
    getUserStores(context.url, context.token, context.userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "Error fetching stores");
          return;
        }
        setStores([
          ...validOnly(j.assigned_stores ?? []),
          // Below level 9 the unassigned half is other operators' stores, so
          // it is not offered — the same scoping NewStoreName applies.
          ...(context.canSeeAllStores ? validOnly(j.unassigned_stores ?? []) : []),
        ]);
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  useEffect(fetchStores, []);

  const filtered = useMemo(() => {
    if (!stores) return [];
    const q = search.trim().toLowerCase();
    return stores.filter((s) => {
      const byCompany = companyFilter ? s.company === Number(companyFilter) : true;
      const bySearch = q
        ? s.store_name.toLowerCase().includes(q) ||
          s.store_number.toLowerCase().includes(q)
        : true;
      return byCompany && bySearch;
    });
  }, [stores, search, companyFilter]);

  const trimmedNumber = newNumber.trim();
  const trimmedName = newName.trim();

  /** A store number already on file is the one mistake worth catching before
   *  the insert: the column has no constraint the UI can rely on, and two
   *  stores sharing a number breaks every per-store scope in the app. */
  const numberTaken =
    !!trimmedNumber &&
    (stores ?? []).some(
      (s) => s.store_number.toLowerCase() === trimmedNumber.toLowerCase(),
    );

  const canCreate =
    !!trimmedNumber && !!trimmedName && !!newCompany && !numberTaken && !pending;

  const handleCreate = () => {
    setPending("create");
    createNewStore(
      context.url,
      context.token,
      trimmedNumber,
      trimmedName,
      Number(newCompany),
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "The store could not be created");
          return;
        }
        toast.success(`${trimmedName} created`);
        setNewNumber("");
        setNewName("");
        setNewCompany("");
        fetchStores();
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setPending(null));
  };

  const changeStatus = (next: "deactivate" | "reactivate") => {
    if (!selected) return;
    setPending(next);
    const call = next === "deactivate" ? deactivateStore : reactivateStore;
    call(context.url, context.token, selected.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "The store could not be updated");
          return;
        }
        toast.success(
          `${selected.store_name} ${
            next === "deactivate" ? "taken out of service" : "put back in service"
          }`,
        );
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setPending(null));
  };

  const companyOptions = context.companies.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  return (
    <div className="flex-1 flex min-h-0 w-full">

      {/* Left: pick a store to take in or out of service. */}
      <div className="w-[320px] border-r border-gray-100 flex-shrink-0 flex flex-col min-h-0 p-3">
        <SelectFilter
          options={companyOptions}
          value={companyFilter}
          onChange={setCompanyFilter}
          placeholder="All companies"
          className="w-full mb-2"
        />
        {/* In a row of its own: TextFilter's root is flex-1, which means
            width in the toolbar it was built for and height in a column —
            without this it grows to fill the panel. */}
        <div className="flex mb-2">
          <TextFilter
            value={search}
            onChange={setSearch}
            placeholder="Search number or name…"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-auto thin-scrollbar border border-gray-200 rounded">
          {filtered.map((s) => {
            const on =
              selected?.storeid === s.storeid &&
              selected?.store_number === s.store_number;
            return (
              <button
                key={`${s.storeid}__${s.store_number}`}
                onClick={() => setSelected(on ? null : s)}
                className={`w-full text-left px-2.5 py-2 border-b border-gray-100 last:border-b-0 transition-colors ${
                  on
                    ? "bg-row_selected border-row_selected_border"
                    : "hover:bg-gray-50"
                }`}
              >
                {/* The name already carries the number - "043 - PLF ATHENS
                    TN" - so printing both reads "43 - 043 - PLF ATHENS TN".
                    NewStoreName shows the name alone for the same reason. */}
                <div className="text-[12.5px] font-medium text-content truncate">
                  {s.store_name}
                </div>
                <div className="text-[11px] text-content/85 truncate">
                  {s.company_name}
                </div>
              </button>
            );
          })}

          {stores !== null && filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-[12px] text-content/85">
              No stores match.
            </div>
          )}
          {stores === null && (
            <div className="px-3 py-6 text-center text-[12px] text-content/85">
              Loading stores…
            </div>
          )}
        </div>
      </div>

      {/* Right: the two jobs, stacked. */}
      <div className="flex-1 min-w-0 overflow-auto thin-scrollbar p-4 flex flex-col gap-3.5">

        <section>
          <h3 className="text-[13px] font-bold text-content">Add a store</h3>
          <p className="text-[11.5px] text-content/85 mt-0.5 mb-2">
            Creates the store record. Assigning it to users and groups is done
            in User Management.
          </p>

          <div className="grid gap-2 max-w-[420px]">
            <div className="grid gap-1">
              <Input
                value={newNumber}
                setValue={setNewNumber}
                label="Store number"
              />
              {numberTaken && (
                <span className="text-[11px] font-semibold text-brand_danger">
                  {trimmedNumber} is already in use. Store numbers scope sales,
                  orders and receiving — two stores cannot share one.
                </span>
              )}
            </div>

            <Input
              value={newName}
              setValue={setNewName}
              label="Store name"
            />

            {/* Input draws its own label, so this one is written to match
                it rather than in the uppercase caption style used elsewhere
                on the page - three fields in a column should not have two
                label treatments between them. */}
            <div>
              <div className="flex justify-between text-[11px] md:text-[13px] items-end pr-1.5 leading-tight">
                <label className="font-medium pl-0.5">Company</label>
              </div>
              <SelectFilter
                options={companyOptions}
                value={newCompany}
                onChange={setNewCompany}
                placeholder="Pick a company"
                className="w-full"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="justify-self-start mt-0.5 px-3.5 py-1.5 rounded-md bg-brand_navy hover:bg-brand_navy_hover disabled:opacity-40 disabled:hover:bg-brand_navy text-custom-white text-[12.5px] font-semibold transition-colors"
            >
              {pending === "create" ? "Creating…" : "Create store"}
            </button>
          </div>
        </section>

        <section className="border-t border-gray-100 pt-3">
          <h3 className="text-[13px] font-bold text-content">In or out of service</h3>
          <p className="text-[11.5px] text-content/85 mt-0.5 mb-2 max-w-[560px]">
            {STATE_UNKNOWN}
          </p>

          {!selected ? (
            <p className="text-[12px] text-content/85">
              Pick a store on the left.
            </p>
          ) : (
            <div className="max-w-[420px]">
              <div className="rounded-md bg-bkg px-2.5 py-1.5 flex items-baseline gap-2">
                <span className="text-[12.5px] font-semibold text-content truncate">
                  {selected.store_name}
                </span>
                <span className="text-[11px] text-content/85 truncate">
                  {selected.company_name}
                </span>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => changeStatus("deactivate")}
                  disabled={!!pending}
                  className="px-3.5 py-1.5 rounded-md bg-brand_danger_bg border border-brand_danger_line text-brand_danger text-[12.5px] font-semibold disabled:opacity-40 hover:brightness-95 transition-[filter]"
                >
                  {pending === "deactivate" ? "Working…" : "Take out of service"}
                </button>
                <button
                  onClick={() => changeStatus("reactivate")}
                  disabled={!!pending}
                  className="px-3.5 py-1.5 rounded-md bg-custom-white border border-brand_line text-content text-[12.5px] font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  {pending === "reactivate" ? "Working…" : "Put back in service"}
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default StoreRecords;
