import { useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useTicketsCtx } from "../hooks";
import TextFilter from "../../../components/filters/TextFilter";
import IconButton from "../../../components/IconButton";
import { setTemplateSearchText, addTemplate, deleteTemplate } from "../ticketsSlice";
import NewTemplateModal from "./NewTemplateModal";

const TemplatesTab = () => {
  const ctx = useTicketsCtx();
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  const filtered = useMemo(() => {
    const q = ctx.templateSearchText.trim().toLowerCase();
    return q ? ctx.templates.filter((t) => t.name.toLowerCase().includes(q)) : ctx.templates;
  }, [ctx.templates, ctx.templateSearchText]);

  const handleDelete = (id: number) => {
    console.log("API call: DELETE ticketTemplates/delete", { id });
    ctx.dispatch(deleteTemplate(id));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4">
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 mb-3">
        <TextFilter
          value={ctx.templateSearchText}
          onChange={(v) => ctx.dispatch(setTemplateSearchText(v))}
          placeholder="Search templates…"
          className="flex-1"
        />
        <button
          onClick={() => setShowNewTemplate(true)}
          className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 flex-shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New template
        </button>
      </div>

      <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-[#1e2a4a]/15">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-2 px-3 py-2.5 even:bg-row_stripe">
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-content">{t.name}</div>
                <div className="text-[10.5px] text-content/85 mt-0.5 truncate">{t.body}</div>
              </div>
              <IconButton icon={TrashIcon} title="Delete template" variant="danger" onClick={() => handleDelete(t.id)} />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No templates found
            </div>
          )}
        </div>
      </div>

      {showNewTemplate && (
        <NewTemplateModal
          onClose={() => setShowNewTemplate(false)}
          onCreate={(payload) => {
            console.log("API call: POST ticketTemplates/create", payload);
            ctx.dispatch(addTemplate(payload));
          }}
        />
      )}
    </div>
  );
};

export default TemplatesTab;
