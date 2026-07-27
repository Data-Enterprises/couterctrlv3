import { useState } from "react";
import type { TicketDoc } from "../interfaces";

interface NewDocModalProps {
  onClose: () => void;
  onCreate: (payload: Omit<TicketDoc, "id" | "updated_at">) => void;
}

const NewDocModal = ({ onClose, onCreate }: NewDocModalProps) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const canSubmit = title.trim() !== "" && body.trim() !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreate({ title: title.trim(), body: body.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div className="bg-custom-white rounded-xl p-5 w-[420px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-3">New doc</div>

        <div className="space-y-2.5 mb-4">
          <div>
            <label className="text-[11px] text-content/85 block mb-1">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
            />
          </div>
          <div>
            <label className="text-[11px] text-content/85 block mb-1">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
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
            Create doc
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewDocModal;
