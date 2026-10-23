import { useState } from "react";
import Input from "../../../components-dev/inputs/Input";
import SelectFilter from "../../../components-dev/filters/SelectFilter";
import type { Store } from "../../../interfaces";

/**
 * New store, or a rename of one that exists.
 *
 * The same modal serves both, as CompanyFormModal does — but the two are not
 * symmetrical, and the form says so. Creating takes an ID, a number, a name
 * and a company; editing takes the NAME only, because `stores/change_store_name` is
 * the only edit the backend offers. The number and company are shown on an
 * edit so the reader knows which store they have, and are plainly not fields.
 */

export interface StoreForm {
  storeid: number;
  store_number: string;
  store_name: string;
  company: number;
}

interface Props {
  /** Null to create. */
  initial: Store | null;
  companies: { value: string; label: string }[];
  /** Every number already on file, lower-cased by the caller. */
  existingNumbers: string[];
  /** Every storeid already on file. */
  existingIds: number[];
  saving: boolean;
  onSave: (form: StoreForm) => void;
  onClose: () => void;
}

const StoreFormModal = ({
  initial,
  companies,
  existingNumbers,
  existingIds,
  saving,
  onSave,
  onClose,
}: Props) => {
  const isCreate = !initial;
  const [storeId, setStoreId] = useState(
    initial ? String(initial.storeid) : "",
  );
  const [storeNumber, setStoreNumber] = useState(initial?.store_number ?? "");
  const [storeName, setStoreName] = useState(initial?.store_name ?? "");
  const [company, setCompany] = useState(
    initial ? String(initial.company) : "",
  );

  const trimmedId = storeId.trim();
  const parsedId = Number(trimmedId);
  /** The insert writes the ID as given, so it has to be a whole number. */
  const idInvalid =
    !!trimmedId && (!/^\d+$/.test(trimmedId) || !Number.isSafeInteger(parsedId));
  /** storeid is the key every other table joins on; a duplicate fails the
   *  insert anyway, but this says why before the round trip. */
  const idTaken =
    isCreate && !!trimmedId && !idInvalid && existingIds.includes(parsedId);
  const trimmedNumber = storeNumber.trim();
  const trimmedName = storeName.trim();

  /** The one mistake worth catching before the insert. The column has no
   *  constraint the UI can rely on, and two stores sharing a number breaks
   *  every per-store scope in the app — sales, orders and receiving all key
   *  on it. */
  const numberTaken =
    isCreate &&
    !!trimmedNumber &&
    existingNumbers.includes(trimmedNumber.toLowerCase());

  const canSubmit = isCreate
    ? !!trimmedId &&
      !idInvalid &&
      !idTaken &&
      !!trimmedNumber &&
      !!trimmedName &&
      !!company &&
      !numberTaken &&
      !saving
    : !!trimmedName &&
      trimmedName.toLowerCase() !== (initial?.store_name ?? "").toLowerCase() &&
      !saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-custom-white rounded-xl p-5 w-[440px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-3">
          {isCreate ? "New store" : `Rename ${initial.store_name}`}
        </div>

        {isCreate ? (
          <div className="grid gap-3 mb-4">
            <div>
              <Input
                label="Store ID"
                value={storeId}
                setValue={setStoreId}
                className="py-1.5 text-[13px]"
              />
              {idInvalid && (
                <div className="text-[12px] text-brand_danger mt-1 leading-snug">
                  Store ID must be a whole number.
                </div>
              )}
              {idTaken && (
                <div className="text-[12px] text-brand_danger mt-1 leading-snug">
                  Store ID {trimmedId} is already in use.
                </div>
              )}
            </div>

            <div>
              <Input
                label="Store number"
                value={storeNumber}
                setValue={setStoreNumber}
                className="py-1.5 text-[13px]"
              />
              {numberTaken && (
                <div className="text-[12px] text-brand_danger mt-1 leading-snug">
                  {trimmedNumber} is already in use. Store numbers scope sales,
                  orders and receiving — two stores cannot share one.
                </div>
              )}
            </div>

            <Input
              label="Store name"
              value={storeName}
              setValue={setStoreName}
              className="py-1.5 text-[13px]"
            />

            {/* Input draws its own label, so this matches it rather than
                introducing a second label treatment in one column. */}
            <div>
              <div className="flex justify-between text-[11px] md:text-[13px] items-end pr-1.5 leading-tight">
                <label className="font-medium pl-0.5">Company</label>
              </div>
              <SelectFilter
                options={companies}
                value={company}
                onChange={setCompany}
                placeholder="Pick a company"
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 mb-4">
            {/* Context, not fields: the backend offers no way to change
                either, and an input that cannot be saved is worse than text. */}
            <div className="rounded-md bg-bkg px-3 py-2 flex items-baseline gap-3">
              <span className="text-[12px] text-content/85">
                ID{" "}
                <span className="font-semibold text-content">
                  {initial.storeid}
                </span>
              </span>
              <span className="text-[12px] text-content/85">
                Number{" "}
                <span className="font-semibold text-content">
                  {initial.store_number}
                </span>
              </span>
              <span className="text-[12px] text-content/85 truncate">
                Company{" "}
                <span className="font-semibold text-content">
                  {initial.company_name}
                </span>
              </span>
            </div>

            <Input
              label="Store name"
              value={storeName}
              setValue={setStoreName}
              className="py-1.5 text-[13px]"
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                storeid: parsedId,
                store_number: trimmedNumber,
                store_name: trimmedName,
                company: Number(company),
              })
            }
            disabled={!canSubmit}
            className={`text-[12px] font-medium px-3.5 py-1.5 rounded-md text-custom-white ${
              canSubmit
                ? "bg-brand_navy hover:bg-brand_navy/85"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {saving
              ? "Saving…"
              : isCreate
                ? "Create store"
                : "Save name"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreFormModal;
