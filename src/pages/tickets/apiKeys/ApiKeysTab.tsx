import { useState } from "react";
import { PlusIcon } from "@heroicons/react/20/solid";
import { useTicketsCtx } from "../hooks";
import { addApiKey, revokeApiKey } from "../ticketsSlice";
import NewApiKeyModal from "./NewApiKeyModal";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

// Rendered only for elevated users — Tickets.tsx never mounts this component
// for anyone else, so no access check is repeated here.
const ApiKeysTab = () => {
  const ctx = useTicketsCtx();
  const [showNewKey, setShowNewKey] = useState(false);

  const handleRevoke = (id: number) => {
    console.log("API call: POST ticketApiKeys/revoke", { id });
    ctx.dispatch(revokeApiKey(id));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4">
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mb-3">
        <span className="text-[10.5px] text-content/85 px-1">
          Only visible to the top two user levels.
        </span>
        <button
          onClick={() => setShowNewKey(true)}
          className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 flex-shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New key
        </button>
      </div>

      <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-[26%_22%_18%_20%_14%] px-3 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0">
          <div>Label</div>
          <div>Key</div>
          <div>Created</div>
          <div>Last used</div>
          <div></div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-[#1e2a4a]/15">
          {ctx.apiKeys.map((k) => (
            <div
              key={k.id}
              className={`grid grid-cols-[26%_22%_18%_20%_14%] px-3 py-2 text-[12px] items-center even:bg-row_stripe ${
                k.revoked ? "text-content/40" : "text-content"
              }`}
            >
              <div className="truncate font-medium">{k.label}</div>
              <div className="truncate font-mono text-[11px]">{k.key_prefix}…</div>
              <div className="text-content/60">{formatDate(k.created_at)}</div>
              <div className="text-content/60">{k.last_used_at ? formatDate(k.last_used_at) : "Never"}</div>
              <div className="flex justify-end">
                {k.revoked ? (
                  <span className="text-[10.5px] text-content/40">Revoked</span>
                ) : (
                  <button
                    onClick={() => handleRevoke(k.id)}
                    className="text-[10.5px] font-medium text-red-600"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
          {ctx.apiKeys.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No API keys
            </div>
          )}
        </div>
      </div>

      {showNewKey && (
        <NewApiKeyModal
          onClose={() => setShowNewKey(false)}
          onCreate={(label) => {
            console.log("API call: POST ticketApiKeys/create", { label });
            ctx.dispatch(addApiKey({ label }));
          }}
        />
      )}
    </div>
  );
};

export default ApiKeysTab;
