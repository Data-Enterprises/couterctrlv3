// Hooks
import { useState } from "react";

/** The "New group" pop-up: a name field with Cancel and Create buttons. */
const NewGroupModal = ({
  onCreate,
  onClose,
}: {
  onCreate: (name: string) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-custom-white rounded-xl p-5 w-[300px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-3">
          New group
        </div>
        <div className="mb-4">
          <label className="text-[11px] text-content/95 block mb-1">
            Group name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. West Coast"
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
            onClick={() => onCreate(name)}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewGroupModal;