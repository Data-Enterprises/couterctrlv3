import { useState } from "react";
import Input from "../../../components/inputs/Input";
import type { Company } from "../../../interfaces";

interface CompanyFormModalProps {
  initial: Company | null;
  existingNames: string[];
  onSave: (form: Company) => void;
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
  onSave,
  onClose,
}: CompanyFormModalProps) => {
  const [form, setForm] = useState<Company>(initial ?? blank);
  const isCreate = !initial;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
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
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSubmit}
            className={`text-[12px] font-medium px-3.5 py-1.5 rounded-md text-custom-white ${
              canSubmit
                ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85"
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
