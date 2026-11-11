// Hooks
import { useState } from "react";

// Components
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";

interface NewGroupModalProps {
  companies: { id: number; name: string }[];
  onCreate: (name: string, companyId: number) => void;
  onClose: () => void;
  /** A create is running: Create waits, so a double-click makes one group. */
  busy?: boolean;
}

/** The new base group form: a name and, where there is a choice, its company. */
const NewGroupModal = ({ companies, onCreate, onClose, busy = false }: NewGroupModalProps) => {
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");

  return (
    <div className="cc-modal-backdrop z-50">
      <div className="bg-custom-white rounded-xl p-5 w-[300px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-3">
          New base group
        </div>
        <div className="mb-2.5">
          <label className="text-[11px] text-content/95 block mb-1">
            Group name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Northeast"
            className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
          />
        </div>
        <div className="mb-4">
          <label className="text-[11px] text-content/95 block mb-1">
            Company
          </label>
          <SelectFilter
            options={companies.map((c) => ({
              label: c.name,
              value: String(c.id),
            }))}
            value={companyId}
            onChange={setCompanyId}
            placeholder="Choose a company"
            className="w-full"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-line_field text-content"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, Number(companyId))}
            disabled={busy}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewGroupModal;
