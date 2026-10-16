import type { ReactNode } from "react";
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/20/solid";
import SingleSelect from "./SingleSelect";
import EntryCardLoading from "./loading/EntryCardLoading";
import type { Store } from "../interfaces";

interface SingleStoreSearchCardProps {
  title: string;
  description: string;
  buttonLabel?: string;
  /**
   * A second requirement, in the caller's words.
   *
   * Set while something other than the store is still missing: the button
   * goes disabled and says this instead of `buttonLabel`, the same way the
   * card already names a missing store. Undefined means nothing is in the
   * way.
   *
   * A label rather than a boolean, because "disabled" on its own is the
   * failure this card exists to avoid — a greyed button with no reason beside
   * it is a dead end the reader has to guess their way out of.
   */
  blockedLabel?: string;
  stores: Store[];
  selectedStoreId: number;
  onStoreSelect: (id: number) => void;
  onSearch: () => void;
  /**
   * Back to the results this card was opened over.
   *
   * Only meaningful when there are some: reaching this card by tapping the
   * search icon should be undoable, but arriving at it for the first time has
   * nothing behind it. Callers pass it conditionally, which is also what keeps
   * the control from appearing on a first visit.
   */
  onBack?: () => void;
  backLabel?: string;
  loading?: boolean;
  /** Optional: Item Lookup searches a UPC, not a date. */
  datePicker?: ReactNode;
  children?: ReactNode;
  notice?: string;
  /** Shown while the search runs. Worth naming what is being fetched. */
  loadingMessage?: string;
}

const SingleStoreSearchCard = ({
  title,
  description,
  blockedLabel,
  buttonLabel = "Search",
  stores,
  selectedStoreId,
  onStoreSelect,
  onSearch,
  loading = false,
  datePicker,
  children,
  notice,
  onBack,
  backLabel = "Back to results",
  loadingMessage = "Loading...",
}: SingleStoreSearchCardProps) => {
  const storeName =
    stores.find((s) => s.storeid === selectedStoreId)?.store_name ?? "";

  return (
    <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-content">{title}</h2>
        <p className="text-[12px] text-content/50 mt-1">{description}</p>
      </div>

      {/* Form stays mounted but unpainted while the search runs — holds the
          card's height, and the spinner replaces it rather than sitting over
          a form you can still half see. Matches SearchCard. */}
      <div className="relative flex flex-col gap-3">
        <div
          className="flex flex-col gap-3"
          style={loading ? { visibility: "hidden" } : undefined}
        >
          {notice && (
            <div className="px-2.5 py-2 rounded-lg bg-amber-50 text-[11.5px] text-amber-900 leading-snug">
              {notice}
            </div>
          )}

          <SingleSelect
            /* Three signals for one missing choice, on purpose: the button
             * names the step, this marks the field that owns it, and the
             * confirmation below appears once it is satisfied. The button
             * alone sits at the bottom of the card, which is the last place
             * someone looks when a form will not go.
             *
             * brand_danger, not severity_critical: this dresses a form, and
             * the severity tokens grade data. */
            label={
              selectedStoreId === 0 ? (
                <>
                  Select Store{" "}
                  <span className="font-semibold text-brand_danger">
                    — not selected
                  </span>
                </>
              ) : (
                "Select Store"
              )
            }
            data={stores}
            displayKey="store_name"
            valueKey="storeid"
            onSelect={(id) => onStoreSelect(Number(id))}
            defaultQuery={selectedStoreId > 0 ? storeName : ""}
            // The store is usually chosen before this card is ever seen — it
            // rides in on `last_store` — but `stores` is fetched, so on the
            // first render `storeName` is still "". SingleSelect seeds its
            // input from `defaultQuery` once, at mount, so without this the
            // field latched onto that empty string and stayed blank while the
            // "Searching ..." line underneath named the store correctly. Two
            // controls disagreeing about whether anything is selected reads as
            // a bug, because it is one.
            //
            // Safe to opt in here: the only things that move `defaultQuery`
            // are the store list arriving and the selection changing, and on
            // both the field should say what is selected.
            resetQuery
            innerClass="text-[13px] py-1"
            listClass="text-[13px]"
          />

          {/* Says the choice landed.
             *
             * The picker shows the store's name whether it was chosen or
             * merely defaulted in, so on its own it never confirms anything —
             * and the button's disabled label only speaks while the choice is
             * still missing. This is the other half of that: once a store is
             * in, it says so in its own words rather than leaving the reader
             * to infer it from a field that looked the same before. */}
          {selectedStoreId > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-row_selected px-2.5 py-2 text-[11.5px] leading-snug text-content">
              <CheckCircleIcon className="h-4 w-4 flex-none text-brand_navy" />
              <span className="min-w-0 truncate">
                Searching <span className="font-semibold">{storeName}</span>
              </span>
            </div>
          )}

          {datePicker}

          <button
            onClick={onSearch}
            disabled={selectedStoreId === 0 || !!blockedLabel || loading}
            className="w-full py-2 text-sm font-semibold text-custom-white rounded-lg bg-brand_navy hover:bg-brand_navy_hover transition-colors cursor-pointer select-none disabled:opacity-50"
          >
            {/* Names the missing step while it is disabled — see SearchCard.
                Always a store here; this card never takes a group.
                The store comes first: it is the one requirement every card
                has, and naming the caller's extra step while the store is
                also empty would point the reader at the second thing they
                need while the first is still missing. */}
            {selectedStoreId === 0
              ? "Select Store"
              : (blockedLabel ?? buttonLabel)}
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="flex w-full items-center justify-center gap-1.5 py-2.5 transition-colors"
              style={{ background: "rgb(var(--color-brand-navy) / 0.07)", borderRadius: 10 }}
            >
              <ArrowLeftIcon className="h-4 w-4 text-brand_navy" />
              <span className="text-[13px] font-semibold text-brand_navy underline underline-offset-2">
                {backLabel}
              </span>
            </button>
          )}

          {children}
        </div>

        {loading && (
          <EntryCardLoading message={loadingMessage} context={storeName} />
        )}
      </div>
    </div>
  );
};

export default SingleStoreSearchCard;
