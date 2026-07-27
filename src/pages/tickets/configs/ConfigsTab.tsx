import { useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useTicketsCtx } from "../hooks";
import TextFilter from "../../../components/filters/TextFilter";
import IconButton from "../../../components/IconButton";
import { setConfigSearchText, addConfig, deleteConfig } from "../ticketsSlice";
import { MOCK_COMPANIES } from "../mockData";
import NewConfigModal from "./NewConfigModal";

interface ConfigsTabProps {
  isElevated: boolean;
}

const ConfigsTab = ({ isElevated }: ConfigsTabProps) => {
  const ctx = useTicketsCtx();
  const [showNewConfig, setShowNewConfig] = useState(false);

  const companyName = (id?: number) =>
    id === undefined ? "Any company" : MOCK_COMPANIES.find((c) => c.id === id)?.name ?? "Unknown";
  const actionLabel = (config: (typeof ctx.configs)[number]) => {
    const parts: string[] = [];
    if (config.action.auto_assignee_id) {
      const staffMember = ctx.staff.find((s) => s.id === config.action.auto_assignee_id);
      parts.push(`Assign to ${staffMember?.name ?? "—"}`);
    }
    if (config.action.default_priority) {
      parts.push(`Priority = ${config.action.default_priority}`);
    }
    return parts.length ? parts.join(", ") : "No action set";
  };

  const scoped = useMemo(() => {
    const inScope = isElevated
      ? ctx.configs
      : ctx.configs.filter((c) => ctx.companies.some((uc) => uc.company === c.match.company));
    const q = ctx.configSearchText.trim().toLowerCase();
    return q ? inScope.filter((c) => c.name.toLowerCase().includes(q)) : inScope;
  }, [ctx.configs, ctx.companies, ctx.configSearchText, isElevated]);

  const handleDelete = (id: number) => {
    console.log("API call: DELETE ticketConfigs/delete", { id });
    ctx.dispatch(deleteConfig(id));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4">
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 mb-3">
        <TextFilter
          value={ctx.configSearchText}
          onChange={(v) => ctx.dispatch(setConfigSearchText(v))}
          placeholder="Search rules…"
          className="flex-1"
        />
        <button
          onClick={() => setShowNewConfig(true)}
          className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 flex-shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New rule
        </button>
      </div>

      <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-[26%_32%_28%_14%] px-3 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0">
          <div>Rule name</div>
          <div>Matches</div>
          <div>Action</div>
          <div></div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-[#1e2a4a]/15">
          {scoped.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[26%_32%_28%_14%] px-3 py-2 text-[12px] items-center text-content even:bg-row_stripe"
            >
              <div className="truncate font-medium">{c.name}</div>
              <div className="truncate text-content/85">Company = {companyName(c.match.company)}</div>
              <div className="truncate text-content/85">{actionLabel(c)}</div>
              <div className="flex justify-end">
                <IconButton icon={TrashIcon} title="Delete rule" variant="danger" onClick={() => handleDelete(c.id)} />
              </div>
            </div>
          ))}
          {scoped.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No rules found
            </div>
          )}
        </div>
      </div>

      {!isElevated && (
        <div className="text-[10.5px] text-content/85 mt-2">
          New rules are limited to your own assigned companies.
        </div>
      )}

      {showNewConfig && (
        <NewConfigModal
          isElevated={isElevated}
          onClose={() => setShowNewConfig(false)}
          onCreate={(payload) => {
            console.log("API call: POST ticketConfigs/create", payload);
            ctx.dispatch(addConfig(payload));
          }}
        />
      )}
    </div>
  );
};

export default ConfigsTab;
