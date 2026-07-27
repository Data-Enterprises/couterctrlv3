import { useState } from "react";
import { useTicketsCtx } from "../hooks";
import SelectFilter from "../../../components/filters/SelectFilter";
import { MOCK_COMPANIES } from "../mockData";
import type { TicketConfig, Ticket } from "../interfaces";

interface NewConfigModalProps {
  isElevated: boolean;
  onClose: () => void;
  onCreate: (payload: Omit<TicketConfig, "id">) => void;
}

const NewConfigModal = ({ isElevated, onClose, onCreate }: NewConfigModalProps) => {
  const ctx = useTicketsCtx();
  const companyOptions = isElevated
    ? MOCK_COMPANIES
    : MOCK_COMPANIES.filter((c) => ctx.companies.some((uc) => uc.company === c.id));

  const [name, setName] = useState("");
  const [company, setCompany] = useState<number | "">(
    companyOptions.length === 1 ? companyOptions[0].id : "",
  );
  const [assigneeId, setAssigneeId] = useState<number | "">("");
  const [defaultPriority, setDefaultPriority] = useState<Ticket["priority"] | "">("");

  const canSubmit = name.trim() !== "" && (assigneeId !== "" || defaultPriority !== "");

  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreate({
      name: name.trim(),
      match: company === "" ? {} : { company },
      action: {
        ...(assigneeId !== "" ? { auto_assignee_id: assigneeId } : {}),
        ...(defaultPriority !== "" ? { default_priority: defaultPriority } : {}),
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div className="bg-custom-white rounded-xl p-5 w-[380px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-3">New rule</div>

        <div className="space-y-2.5 mb-4">
          <div>
            <label className="text-[11px] text-content/85 block mb-1">Rule name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
            />
          </div>
          <div>
            <label className="text-[11px] text-content/85 block mb-1">Company</label>
            <SelectFilter
              options={companyOptions.map((c) => ({ value: String(c.id), label: c.name }))}
              value={company === "" ? "" : String(company)}
              onChange={(v) => setCompany(v ? Number(v) : "")}
              placeholder={isElevated ? "Any company" : "Select…"}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-[11px] text-content/85 block mb-1">Auto-assign to</label>
            <SelectFilter
              options={ctx.staff.map((s) => ({ value: String(s.id), label: s.name }))}
              value={assigneeId === "" ? "" : String(assigneeId)}
              onChange={(v) => setAssigneeId(v ? Number(v) : "")}
              placeholder="No auto-assign"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-[11px] text-content/85 block mb-1">Default priority</label>
            <SelectFilter
              options={[
                { value: "low", label: "Low" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" },
              ]}
              value={defaultPriority}
              onChange={(v) => setDefaultPriority(v as Ticket["priority"] | "")}
              placeholder="No default"
              className="w-full"
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
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white ${
              canSubmit ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Create rule
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConfigModal;
