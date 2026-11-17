// Hooks
import { useState } from "react";

// Utils
import { membersOf, parentChoices, blankCompany, canSubmit } from "../utils";

// Interfaces
import type { Company } from "../../../../../interfaces";
import type { CompanyRecord } from "../interfaces";

// Components
import Input from "../../../../../components-dev/inputs/Input";
import CompanyFamilyField from "./CompanyFamilyField";

interface CompanyFormModalProps {
  initial: CompanyRecord | null;
  existingNames: string[];
  /** Every company the current user manages. */
  companies: CompanyRecord[];
  /** `parent` is the chosen parent's id, or null to stand alone. */
  onSave: (form: Company, parent: number | null) => void;
  onClose: () => void;
}

/** The pop-up form to add or edit a company: name, address, phone, contact email and an optional parent
 *  company (or none, to stand alone). */
const CompanyFormModal = ({
  initial,
  existingNames,
  companies,
  onSave,
  onClose,
}: CompanyFormModalProps) => {
  const [form, setForm] = useState<Company>(initial ?? blankCompany);
  const isCreate = !initial;
  const [parent, setParent] = useState<number | null>(
    initial?.parent_company_id ?? null,
  );

  // Families are one level deep; see companyFamily for both rules.
  const parentOptions = parentChoices(companies, initial?.id);
  const members = membersOf(companies, initial?.id);
  const isParent = members.length > 0;

  const set = (key: keyof Company) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: key === "zip" ? Number(val) : val }));

  const alreadyExists =
    isCreate &&
    form.name.trim() !== "" &&
    existingNames.some((n) => n.toLowerCase() === form.name.toLowerCase());

  const ok = canSubmit(form) && !alreadyExists;

  return (
    <div className="cc-modal-backdrop z-50">
      <div className="bg-custom-white rounded-xl p-5 w-[440px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-3">
          {isCreate ? "New company" : `Edit ${initial.name}`}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="relative">
            <Input
              label="Name"
              value={form.name}
              setValue={set("name")}
              className="py-1.5 text-[13px]"
            />
            {alreadyExists && (
              <div className="text-[10px] text-brand_danger mt-1">
                Company name already exists
              </div>
            )}
          </div>
          <Input
            label="Address"
            value={form.address}
            setValue={set("address")}
            className="py-1.5 text-[13px]"
          />
          <Input
            label="City"
            value={form.city}
            setValue={set("city")}
            className="py-1.5 text-[13px]"
          />
          <Input
            label="State"
            value={form.state}
            setValue={set("state")}
            className="py-1.5 text-[13px]"
          />
          <Input
            label="Zip"
            value={form.zip === 0 ? "" : form.zip.toString()}
            setValue={set("zip")}
            className="py-1.5 text-[13px]"
          />
          <Input
            label="Phone"
            value={form.phone}
            setValue={set("phone")}
            className="py-1.5 text-[13px]"
          />
          <div className="col-span-2">
            <Input
              label="Contact email"
              value={form.contact_email}
              setValue={set("contact_email")}
              className="py-1.5 text-[13px]"
            />
          </div>

          <CompanyFamilyField
            members={members}
            parentOptions={parentOptions}
            parent={parent}
            setParent={setParent}
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
            onClick={() => onSave(form, isParent ? null : parent)}
            disabled={!ok}
            className={`text-[12px] font-medium px-3.5 py-1.5 rounded-md text-custom-white ${
              ok
                ? "bg-brand_navy hover:bg-brand_navy_hover"
                : "bg-fill_track_strong cursor-not-allowed"
            }`}
          >
            {isCreate ? "Create company" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyFormModal;
