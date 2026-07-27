import { useState } from "react";
import { useTicketsCtx } from "../hooks";
import { createTicket } from "../ticketsSlice";
import { MOCK_COMPANIES } from "../mockData";
import SelectFilter from "../../../components/filters/SelectFilter";
import type { Ticket } from "../interfaces";

interface NewTicketModalProps {
  isElevated: boolean;
  onClose: () => void;
}

const NewTicketModal = ({ isElevated, onClose }: NewTicketModalProps) => {
  const ctx = useTicketsCtx();
  const companyOptions = isElevated
    ? MOCK_COMPANIES
    : MOCK_COMPANIES.filter((c) =>
        ctx.companies.some((uc) => uc.company === c.id),
      );

  const [subject, setSubject] = useState("");
  const [company, setCompany] = useState<number | "">(
    companyOptions.length === 1 ? companyOptions[0].id : "",
  );
  const [product, setProduct] = useState("CounterControl");
  const [priority, setPriority] = useState<Ticket["priority"]>("normal");
  const [body, setBody] = useState("");

  const canSubmit = subject.trim() !== "" && company !== "" && body.trim() !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    const companyName = companyOptions.find((c) => c.id === company)?.name ?? "";
    console.log("API call: POST tickets/create", {
      subject,
      company,
      product,
      priority,
      opened_by: ctx.userid,
      body,
    });
    ctx.dispatch(
      createTicket({
        subject: subject.trim(),
        company: company as number,
        company_name: companyName,
        product,
        priority,
        opened_by: ctx.userid,
        body: body.trim(),
      }),
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div className="bg-custom-white rounded-xl p-5 w-[420px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-3">New ticket</div>

        <div className="space-y-2.5 mb-4">
          <div>
            <label className="text-[11px] text-content/85 block mb-1">Subject</label>
            <input
              autoFocus
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-content/85 block mb-1">Company</label>
              <SelectFilter
                options={companyOptions.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
                value={company === "" ? "" : String(company)}
                onChange={(v) => setCompany(v ? Number(v) : "")}
                placeholder="Select…"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[11px] text-content/85 block mb-1">Priority</label>
              <SelectFilter
                options={[
                  { value: "low", label: "Low" },
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "High" },
                ]}
                value={priority}
                onChange={(v) => setPriority(v as Ticket["priority"])}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-content/85 block mb-1">Product</label>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
            />
          </div>
          <div>
            <label className="text-[11px] text-content/85 block mb-1">Description</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full text-[12px] text-content border border-gray-200 rounded-md p-2 resize-none"
              style={{ outline: "none" }}
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
            Create ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTicketModal;
