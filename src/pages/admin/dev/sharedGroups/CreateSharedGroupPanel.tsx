import { useEffect, useState } from "react";
import type {
  SharedGroupStore,
  SharedGroupTemplate,
} from "../../../../interfaces";
import AssignPanel from "../../../../components-dev/AssignPanel";
import { storeLabel, useSharedGroupsCtx } from "./hooks";

interface Props {
  company: number;
  companyName: string;
  /** The base group it starts from, if one was picked. A copy: nothing links
   *  the two afterwards, and editing the shared group never touches it. */
  template: SharedGroupTemplate | null;
  onCreate: (name: string, storeids: number[]) => void;
  onCancel: () => void;
}

/**
 * The right side while a shared group is being made: a name and at least one
 * store, optionally started from a base group on the left.
 */
const CreateSharedGroupPanel = ({
  company,
  companyName,
  template,
  onCreate,
  onCancel,
}: Props) => {
  const ctx = useSharedGroupsCtx();
  const [name, setName] = useState(template?.name ?? "");
  const [chosen, setChosen] = useState<SharedGroupStore[]>(template?.stores ?? []);

  // Picking another template (or "New" with none) starts the form again.
  useEffect(() => {
    setName(template?.name ?? "");
    setChosen(template?.stores ?? []);
  }, [template?.id, company]);

  const all = ctx.companyStores(company, chosen);
  const chosenIds = new Set(chosen.map((s) => s.storeid));
  const byId = new Map(all.map((s) => [s.storeid, s]));

  return (
    <div>
      <div className="text-[16px] font-medium text-content">New shared group</div>
      <div className="text-[11.5px] text-content/85 mb-3">
        {companyName}
        {template ? ` · started from base group ${template.name}` : ""}
      </div>
      <p className="text-[11px] text-content/60 mb-3">
        A search filter for the users you share it with. It doesn't give anyone
        access to a store.
      </p>

      <div className="mb-3 max-w-[360px]">
        <label className="text-[11px] text-content/60 block mb-1">Group name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Northeast produce"
          className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
        />
      </div>

      <AssignPanel
        leftTitle="Stores"
        rightTitle="In the group"
        leftItems={all
          .filter((s) => !chosenIds.has(s.storeid))
          .map((s) => ({ id: s.storeid, label: storeLabel(s) }))}
        rightItems={chosen.map((s) => ({ id: s.storeid, label: storeLabel(s) }))}
        onAssign={(ids) =>
          setChosen((prev) => [
            ...prev,
            ...ids
              .map((id) => byId.get(id))
              .filter((s): s is SharedGroupStore => !!s),
          ])
        }
        onUnassign={(ids) =>
          setChosen((prev) => prev.filter((s) => !ids.includes(s.storeid)))
        }
      />

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
        >
          Cancel
        </button>
        <button
          onClick={() => onCreate(name, chosen.map((s) => s.storeid))}
          disabled={chosen.length === 0 || !name.trim()}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-50"
        >
          Create shared group
        </button>
      </div>
    </div>
  );
};

export default CreateSharedGroupPanel;
