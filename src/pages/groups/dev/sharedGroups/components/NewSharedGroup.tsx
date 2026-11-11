// Hooks
import { useState } from "react";

// Utils
import { nameProblem } from "../utils";

interface NewSharedGroupProps {
  onCreate: (name: string) => Promise<void>;
  onCancel: () => void;
}

/** The "New shared group" form: a name field that shows what is wrong with the name as it is typed, with Cancel and Create. */
const NewSharedGroup = ({ onCreate, onCancel }: NewSharedGroupProps) => {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  // Only complain about a name once there's something typed.
  const problem = name.trim() ? nameProblem(name) : null;

  const submit = () => {
    if (creating || nameProblem(name)) return;
    setCreating(true);
    Promise.resolve(onCreate(name)).finally(() => setCreating(false));
  };

  return (
    <div className="max-w-[420px]">
      <div className="text-[16px] font-medium text-content mb-1">
        New shared group
      </div>
      <p className="text-[11px] text-content/95 mb-3">
        A user group you can share. Name it, pick its stores from the ones
        you're assigned to, then share it.
      </p>
      <label className="text-[11px] text-content/95 block mb-1">
        Group name
      </label>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        maxLength={100}
        placeholder="e.g. C-Store QSR"
        className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
      />
      <div
        className={`text-[11px] mt-1 min-h-[16px] ${problem ? "text-brand_danger" : "text-content/95"}`}
      >
        {problem ?? "Letters, numbers, spaces, _ and -."}
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onCancel}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-line_field text-content"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!!nameProblem(name) || creating}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default NewSharedGroup;