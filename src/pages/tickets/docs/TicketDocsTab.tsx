import { useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useTicketsCtx } from "../hooks";
import TextFilter from "../../../components/filters/TextFilter";
import IconButton from "../../../components/IconButton";
import { setDocSearchText, addDoc, deleteDoc } from "../ticketsSlice";
import NewDocModal from "./NewDocModal";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const TicketDocsTab = () => {
  const ctx = useTicketsCtx();
  const [showNewDoc, setShowNewDoc] = useState(false);

  const filtered = useMemo(() => {
    const q = ctx.docSearchText.trim().toLowerCase();
    return q ? ctx.docs.filter((d) => d.title.toLowerCase().includes(q)) : ctx.docs;
  }, [ctx.docs, ctx.docSearchText]);

  const handleDelete = (id: number) => {
    console.log("API call: DELETE ticketDocs/delete", { id });
    ctx.dispatch(deleteDoc(id));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4">
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 mb-3">
        <TextFilter
          value={ctx.docSearchText}
          onChange={(v) => ctx.dispatch(setDocSearchText(v))}
          placeholder="Search docs…"
          className="flex-1"
        />
        <button
          onClick={() => setShowNewDoc(true)}
          className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 flex-shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New doc
        </button>
      </div>

      <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-[1fr_16%_10%] px-3 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0">
          <div>Title</div>
          <div>Updated</div>
          <div></div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-[#1e2a4a]/15">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-[1fr_16%_10%] px-3 py-2 text-[12px] items-center text-content even:bg-row_stripe"
            >
              <div className="truncate font-medium">{d.title}</div>
              <div className="text-content/85">{formatDate(d.updated_at)}</div>
              <div className="flex justify-end">
                <IconButton icon={TrashIcon} title="Delete doc" variant="danger" onClick={() => handleDelete(d.id)} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No docs found
            </div>
          )}
        </div>
      </div>

      {showNewDoc && (
        <NewDocModal
          onClose={() => setShowNewDoc(false)}
          onCreate={(payload) => {
            console.log("API call: POST ticketDocs/create", payload);
            ctx.dispatch(addDoc(payload));
          }}
        />
      )}
    </div>
  );
};

export default TicketDocsTab;
