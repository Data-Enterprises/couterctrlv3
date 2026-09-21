import { useEffect, useState } from "react";
import type {
  SharedGroupStore,
  SharedGroupTemplate,
} from "../../../../interfaces";
import AssignPanel from "../../../../components-dev/AssignPanel";
import SelectFilter from "../../../../components-dev/filters/SelectFilter";
import { storeLabel, storesFor } from "./hooks";

interface Props {
  companies: { id: number; name: string }[];
  /** Every store in those companies, from /shared_groups/stores. */
  allStores: SharedGroupStore[];
  /** The base group it starts from, if one was picked. A copy: nothing links
   *  the two afterwards, and editing the shared group never touches it. */
  template: SharedGroupTemplate | null;
  onCreate: (company: number, name: string, storeids: number[]) => void;
  onCancel: () => void;
}

/**
 * The right side while a shared group is being made: a company, a name and at
 * least one store. A template brings its own company; a blank one asks for it,
 * because a shared group's stores must all be in one company.
 */
const CreateSharedGroupPanel = ({
  companies,
  allStores,
  template,
  onCreate,
  onCancel,
}: Props) => {
  const [companyId, setCompanyId] = useState(
    template ? String(template.company) : companies.length === 1 ? String(companies[0].id) : "",
  );
  const [name, setName] = useState(template?.name ?? "");
  const [chosen, setChosen] = useState<SharedGroupStore[]>(template?.stores ?? []);
  const company = Number(companyId);

  // Picking another template (or "New" with none) starts the form again.
  useEffect(() => {
    setCompanyId(
      template ? String(template.company) : companies.length === 1 ? String(companies[0].id) : "",
    );
    setName(template?.name ?? "");
    setChosen(template?.stores ?? []);
  }, [template?.id]);

  const changeCompany = (id: string) => {
    setCompanyId(id);
    setChosen([]); // stores from another company can't come along
  };

  const all = company ? storesFor(allStores, company, chosen) : [];
  const chosenIds = new Set(chosen.map((s) => s.storeid));
  const byId = new Map(all.map((s) => [s.storeid, s]));
  const companyName = companies.find((c) => c.id === company)?.name ?? "";

  return (
    <div>
      <div className="text-[16px] font-medium text-content">New shared group</div>
      <div className="text-[11.5px] text-content/85 mb-3">
        {template
          ? `${template.company_name ?? companyName} · started from base group ${template.name}`
          : "Blank"}
      </div>
      <p className="text-[11px] text-content/60 mb-3">
        A search filter for the users you share it with. It doesn't give anyone
        access to a store.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3 max-w-[560px]">
        <div>
          <label className="text-[11px] text-content/60 block mb-1">Company</label>
          {template ? (
            <div className="py-1.5 text-[12px] text-content">
              {template.company_name ?? companyName}
            </div>
          ) : (
            <SelectFilter
              options={companies.map((c) => ({ label: c.name, value: String(c.id) }))}
              value={companyId}
              onChange={changeCompany}
              placeholder="Choose a company"
              className="w-full"
            />
          )}
        </div>
        <div>
          <label className="text-[11px] text-content/60 block mb-1">Group name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Northeast produce"
            className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
          />
        </div>
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
              ...ids
                .map((id) => byId.get(id))
                .filter((s): s is SharedGroupStore => !!s),
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
          onClick={onCancel}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
        >
          Cancel
        </button>
        <button
          onClick={() => onCreate(company, name, chosen.map((s) => s.storeid))}
          disabled={!company || chosen.length === 0 || !name.trim()}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-50"
        >
          Create shared group
        </button>
      </div>
    </div>
  );
};

export default CreateSharedGroupPanel;
