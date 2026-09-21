import { useState } from "react";

interface NewApiKeyModalProps {
  onClose: () => void;
  onCreate: (label: string) => void;
}

const NewApiKeyModal = ({ onClose, onCreate }: NewApiKeyModalProps) => {
  const [label, setLabel] = useState("");

  const canSubmit = label.trim() !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreate(label.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div className="bg-custom-white rounded-xl p-5 w-[320px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-3">New API key</div>

        <div className="mb-4">
          <label className="text-[11px] text-content/60 block mb-1">Label</label>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Monitoring alerts"
            className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
          />
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
            Create key
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewApiKeyModal;
