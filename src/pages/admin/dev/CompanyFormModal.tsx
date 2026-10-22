import { useState } from "react";
import Input from "../../../components-dev/inputs/Input";
import SelectFilter from "../../../components-dev/filters/SelectFilter";
import type { Company } from "../../../interfaces";
import { membersOf, parentChoices, type CompanyRecord } from "./companyFamily";

interface CompanyFormModalProps {
  initial: CompanyRecord | null;
  existingNames: string[];
  /** Every company, for the "Belongs to" list. */
  companies: CompanyRecord[];
  /** `parent` is the chosen parent's id, or null to stand alone. */
  onSave: (form: Company, parent: number | null) => void;
  onClose: () => void;
}

const blank: Company = {
  id: 0,
  address: "",
  city: "",
  contact_email: "",
  name: "",
  phone: "",
  state: "",
  zip: 0,
};

const CompanyFormModal = ({
  initial,
  existingNames,
  companies,
  onSave,
  onClose,
}: CompanyFormModalProps) => {
  const [form, setForm] = useState<Company>(initial ?? blank);
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

  const canSubmit =
    form.name !== "" &&
    form.address !== "" &&
    form.city !== "" &&
    form.contact_email !== "" &&
    form.state !== "" &&
    form.zip !== 0 &&
    form.phone !== "" &&
    !alreadyExists;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
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
              <div className="text-[10px] text-red-600 mt-1">
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
          {/* Which family it is in. Managers in a family administer each
              other's people, and `users/` shows them to each other, so this
              decides who sees whom. */}
          <div className="col-span-2">
            <div className="text-[11px] font-medium text-content mb-1">
              Belongs to
            </div>
            {isParent ? (
              <p className="text-[11.5px] text-content/85 m-0">
                {members.length} {members.length === 1 ? "company belongs" : "companies belong"}{" "}
                under this one ({members.map((m) => m.name).join(", ")}), so it
                heads its family and can't belong under another.
              </p>
            ) : (
              <>
                <SelectFilter
                  options={parentOptions}
                  value={parent === null ? "" : String(parent)}
                  onChange={(v) => setParent(v === "" ? null : Number(v))}
                  placeholder="None — stands alone"
                  searchable
                  searchPlaceholder="Find a company…"
                  className="w-full"
                />
                <p className="text-[10.5px] text-content/85 mt-1 m-0">
                  Its managers and the parent's family administer each other's
                  people. Houchens' companies belong under Houchens.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form, isParent ? null : parent)}
            disabled={!canSubmit}
            className={`text-[12px] font-medium px-3.5 py-1.5 rounded-md text-custom-white ${
              canSubmit
                ? "bg-brand_navy hover:bg-brand_navy/85"
                : "bg-gray-300 cursor-not-allowed"
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
