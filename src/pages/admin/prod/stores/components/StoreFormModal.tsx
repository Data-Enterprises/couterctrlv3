// Hooks
import { useState } from "react";

// Interfaces
import type { Store } from "../../../../../interfaces";
import type { StoreForm } from "../interfaces";

// Components
import Input from "../../../../../components/inputs/Input";
import NewStoreFields from "./NewStoreFields";
import StoreFacts from "./StoreFacts";

interface StoreFormModalProps {
  initial: Store | null;
  companies: { value: string; label: string }[];
  existingNumbers: string[];
  existingIds: number[];
  saving: boolean;
  onSave: (form: StoreForm) => void;
  onClose: () => void;
}

/** The pop-up form to add a store (Store ID, Store number, name and company) or rename an existing one.
 *  Warns before a duplicate store ID or number is saved. */
const StoreFormModal = ({
  initial,
  companies,
  existingNumbers,
  existingIds,
  saving,
  onSave,
  onClose,
}: StoreFormModalProps) => {
  const isCreate = !initial;
  const [storeId, setStoreId] = useState<string>(
    initial ? String(initial.storeid) : "",
  );
  const [storeNumber, setStoreNumber] = useState<string>(
    initial?.store_number ?? "",
  );
  const [storeName, setStoreName] = useState<string>(initial?.store_name ?? "");
  const [company, setCompany] = useState<string>(
    initial ? String(initial.company) : "",
  );

  const trimmedId = storeId.trim();
  const parsedId = Number(trimmedId);
  /** The insert writes the ID as given, so it has to be a whole number. */
  const idInvalid =
    !!trimmedId &&
    (!/^\d+$/.test(trimmedId) || !Number.isSafeInteger(parsedId));
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
    <div className="cc-modal-backdrop z-50">
      <div className="bg-custom-white rounded-xl p-5 w-[440px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-3">
          {isCreate ? "New store" : `Rename ${initial.store_name}`}
        </div>

        {isCreate ? (
          <NewStoreFields
            storeId={storeId}
            setStoreId={setStoreId}
            idInvalid={idInvalid}
            idTaken={idTaken}
            storeNumber={storeNumber}
            setStoreNumber={setStoreNumber}
            numberTaken={numberTaken}
            storeName={storeName}
            setStoreName={setStoreName}
            companies={companies}
            company={company}
            setCompany={setCompany}
          />
        ) : (
          <div className="grid gap-3 mb-4">
            <StoreFacts store={initial} />

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
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-line_field text-content"
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
                ? "bg-brand_navy hover:bg-brand_navy_hover"
                : "bg-fill_track_strong cursor-not-allowed"
            }`}
          >
            {saving ? "Saving…" : isCreate ? "Create store" : "Save name"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreFormModal;
