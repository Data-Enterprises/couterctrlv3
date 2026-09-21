import { useEffect, useState } from "react";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getSharedGroupTemplates } from "../../../../api/sharedGroups";
import type {
  SharedGroupStore,
  SharedGroupTemplate,
  SharedGroupTemplatesResp,
} from "../../../../interfaces";
import SelectFilter from "../../../../components-dev/filters/SelectFilter";
import AssignPanel from "../../../../components-dev/AssignPanel";
import { errorText, storeLabel, useSharedGroupsCtx } from "./hooks";

interface Props {
  companies: { id: number; name: string }[];
  onCreate: (name: string, companyId: number, storeids: number[]) => void;
  onClose: () => void;
}

/**
 * Name, company, and at least one store. A base group can be used as a
 * starting point — its name and stores are copied in, and nothing links the
 * two afterwards: editing the shared group never touches the base group.
 */
const NewSharedGroupModal = ({ companies, onCreate, onClose }: Props) => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState<SharedGroupTemplate[]>([]);
  const [chosen, setChosen] = useState<SharedGroupStore[]>([]);

  const company = Number(companyId);

  // A new company means new templates and a new store list; nothing chosen
  // under the old one can carry over.
  useEffect(() => {
    setTemplates([]);
    setTemplateId("");
    setChosen([]);
    if (!company) return;
    getSharedGroupTemplates(ctx.url, ctx.token, company)
      .then((resp) => {
        const j: SharedGroupTemplatesResp = resp.data;
        if (j.error === 0) setTemplates(j.templates);
        else toast.error(j.msg || "Could not load base groups");
      })
      .catch((err) => toast.error(errorText(err)));
  }, [company]);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.find((x) => String(x.id) === id);
    if (!t) return;
    setChosen(t.stores);
    if (!name.trim()) setName(t.name);
  };

  const all = company ? ctx.companyStores(company, chosen) : [];
  const chosenIds = new Set(chosen.map((s) => s.storeid));
  const byId = new Map(all.map((s) => [s.storeid, s]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div className="bg-custom-white rounded-xl p-5 w-[640px] max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-1">
          New shared group
        </div>
        <p className="text-[11.5px] text-content/70 mb-3">
          A search filter for the users you share it with. It doesn't give
          anyone access to a store.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[11px] text-content/60 block mb-1">Company</label>
            <SelectFilter
              options={companies.map((c) => ({ label: c.name, value: String(c.id) }))}
              value={companyId}
              onChange={setCompanyId}
              placeholder="Choose a company"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-[11px] text-content/60 block mb-1">
              Start from a base group (optional)
            </label>
            <SelectFilter
              options={templates.map((t) => ({
                label: `${t.name} (${t.stores.length})`,
                value: String(t.id),
              }))}
              value={templateId}
              onChange={applyTemplate}
              placeholder={company ? "None" : "Choose a company first"}
              className="w-full"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-[11px] text-content/60 block mb-1">Group name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Northeast produce"
            className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
          />
        </div>

        {company ? (
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
                ...ids.map((id) => byId.get(id)).filter((s): s is SharedGroupStore => !!s),
              ])
            }
            onUnassign={(ids) =>
              setChosen((prev) => prev.filter((s) => !ids.includes(s.storeid)))
            }
          />
        ) : (
          <div className="text-[12px] text-content/60 py-6 text-center">
            Choose a company to pick its stores.
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, company, chosen.map((s) => s.storeid))}
            disabled={!company || chosen.length === 0 || !name.trim()}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSharedGroupModal;
