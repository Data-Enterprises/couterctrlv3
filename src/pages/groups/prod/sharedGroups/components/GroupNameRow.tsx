// Hooks
import { useEffect, useRef, useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// Utils
import { nameProblem } from "../utils";

// Components
import IconButton from "../../../../../components/IconButton";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";

interface GroupNameRowProps {
  groupId: number;
  name: string;
  /** Saves a new name; resolves once the write has answered. */
  onRename: (name: string, done: () => void) => Promise<void>;
  onDelete: () => void;
}

/** The shared group's name, renamed in place with the pencil, and Delete. */
const GroupNameRow = ({
  groupId,
  name,
  onRename,
  onDelete,
}: GroupNameRowProps) => {
  const toast = useToast();
  const [editing, setEditing] = useState<boolean>(false);
  const [nameDraft, setNameDraft] = useState<string>(name);
  const saving = useRef(false);

  useEffect(() => {
    setEditing(false);
    setNameDraft(name);
  }, [groupId, name]);

  const cancelRename = () => {
    setNameDraft(name);
    setEditing(false);
  };

  const handleSave = () => {
    if (saving.current) return;
    const next = nameDraft.trim();
    if (next === name.trim()) {
      setEditing(false);
      return;
    }
    const problem = nameProblem(next);
    if (problem) {
      toast.error(problem);
      return;
    }
    saving.current = true;
    onRename(next, () => setEditing(false)).finally(() => {
      saving.current = false;
    });
  };

  return (
    <div className="flex items-center gap-1">
      {editing ? (
        <input
          autoFocus
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") cancelRename();
          }}
          maxLength={100}
          className="basic-input bg-custom-white py-0.5 px-2 text-[15px] font-medium"
        />
      ) : (
        <span className="text-[16px] font-medium text-content mr-1.5">
          {name}
        </span>
      )}
      {!editing && (
        <IconButton
          icon={PencilIcon}
          title="Rename"
          onClick={() => setEditing(true)}
        />
      )}
      <IconButton
        icon={TrashIcon}
        title="Delete shared group"
        variant="danger"
        onClick={onDelete}
      />
    </div>
  );
};

export default GroupNameRow;
