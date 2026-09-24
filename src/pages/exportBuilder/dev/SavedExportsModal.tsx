import { useEffect, useState } from "react";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import Modal from "../../../components-dev/Modal";
import ConfirmDelete from "../../../components-dev/ConfirmDelete";
import TextField from "../../../components-dev/inputs/TextField";
import { useExportBuilderCtx } from "./hooks";
import { describePayload, toPayload } from "./savedExports";
import { openSaved } from "../../../features/dev/devExportBuilderSlice";

const when = (iso: string) => {
  const at = new Date(iso);
  return Number.isNaN(at.getTime())
    ? ""
    : at.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/**
 * Configurations someone set up once and wants again.
 *
 * They live in a file in S3 keyed to the user, not in this page, so the shrink
 * report set up on Monday is still there on Friday and on another machine.
 * What is saved is the question — the columns, the grouping, the filters —
 * and never the dates: a saved export is loaded onto whichever range is open,
 * because September's report is October's report with October's dates.
 *
 * Loading one intersects it with what the open range actually holds, and says
 * what it could not honour. A report that quietly stopped covering two of its
 * five stores is worse than one that says so.
 */
const SavedExportsModal = () => {
  const ctx = useExportBuilderCtx();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  // The list is read once a session, when someone first opens this.
  useEffect(() => {
    if (!ctx.savedLoaded && !ctx.savedBusy) ctx.loadSaved();
  }, []);

  const current = ctx.saved.find((s) => s.id === ctx.savedCurrentId);
  const close = () => ctx.dispatch(openSaved(false));

  const saveNew = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    ctx.saveCurrent(trimmed, null, note.trim() || null);
    setName("");
    setNote("");
  };

  return (
    <Modal
      isOpen
      onClose={close}
      modalClassName="bg-card_bg w-[720px] max-w-[94vw] max-h-[82vh]"
    >
      <div className="flex flex-col gap-3 p-4 min-h-0">
        <div className="flex items-baseline gap-3 flex-shrink-0">
          <h2 className="text-[15px] font-semibold">Saved exports</h2>
          <span className="text-[11.5px] text-content/85">
            yours, on any machine · a build made from one carries its name
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={close}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white transition-colors"
          >
            Close
          </button>
        </div>

        {ctx.savedError && (
          <div className="flex-shrink-0 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[12px] text-amber-900">
            {ctx.savedError}
          </div>
        )}

        {ctx.savedNotes.length > 0 && (
          <div className="flex-shrink-0 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <div className="text-[12px] font-semibold text-amber-900">
              The open range could not honour all of it
            </div>
            {ctx.savedNotes.map((note, i) => (
              <div key={i} className="text-[11.5px] text-amber-900/85 mt-0.5">
                · {note}
              </div>
            ))}
          </div>
        )}

        {/* Saving what is on screen, which is the reason most people open this */}
        <div className="flex-shrink-0 border border-brand_line rounded-lg p-3 bg-custom-white flex flex-col gap-2">
          <div className="text-[12.5px] font-semibold">
            Save the configuration on screen
          </div>
          <div className="text-[11.5px] text-content/85">
            {describePayload(toPayload(ctx.config))}
          </div>
          <div className="flex items-end gap-2">
            <TextField
              label="Name"
              value={name}
              placeholder="Shrink by vendor"
              onChange={setName}
              className="w-[200px]"
            />
            <TextField
              label={
                <span className="text-[11px] font-normal text-content/85">
                  Description
                </span>
              }
              value={note}
              placeholder="What it answers"
              onChange={setNote}
              className="flex-1 min-w-0"
            />
            <button
              type="button"
              onClick={saveNew}
              disabled={!name.trim() || ctx.savedBusy}
              className="bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white text-[12.5px] font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </button>
            {current && (
              <button
                type="button"
                onClick={() =>
                  ctx.saveCurrent(
                    current.name,
                    current.id,
                    note.trim() || current.description,
                  )
                }
                disabled={ctx.savedBusy}
                title={`Replace "${current.name}" with what is on screen`}
                className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
              >
                Update "{current.name}"
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar flex flex-col gap-2">
          {ctx.saved.map((saved) => (
            <div
              key={saved.id}
              className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 ${
                saved.id === ctx.savedCurrentId
                  ? "border-brand_line_2 bg-filter_active"
                  : "border-brand_line bg-card_bg"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-custom-white border border-brand_line flex items-center justify-center flex-shrink-0">
                <BookmarkIcon className="w-4 h-4 text-content/85" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">
                  {saved.name}
                </div>
                <div className="text-[11.5px] text-content/85 truncate">
                  {describePayload(saved.payload)}
                </div>
                <div className="text-[11px] text-content/85 mt-0.5">
                  saved {when(saved.updated_at || saved.created_at)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  ctx.applySaved(saved);
                  setName(saved.name);
                  setNote(saved.description ?? "");
                  close();
                }}
                className="bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white text-[12.5px] font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                Load
              </button>
              <button
                type="button"
                onClick={() => setDeleting(saved.id)}
                disabled={ctx.savedBusy}
                aria-label={`Delete ${saved.name}`}
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          ))}

          {ctx.savedLoaded && ctx.saved.length === 0 && (
            <div className="py-6 text-center">
              <div className="text-[13px] font-semibold">Nothing saved yet</div>
              <div className="text-[12.5px] text-content/85 mt-1.5 max-w-[46ch] mx-auto">
                Save the configuration above and it comes back on any machine,
                onto whatever range you have open.
              </div>
            </div>
          )}

          {!ctx.savedLoaded && ctx.savedBusy && (
            <div className="py-6 text-center text-[12.5px] text-content/85">
              Reading your saved exports...
            </div>
          )}
        </div>
      </div>

      {deleting !== null && (
        <ConfirmDelete
          what={ctx.saved.find((s) => s.id === deleting)?.name ?? "this one"}
          kind="configuration"
          detail="Builds made from it keep its name and stay in Previous builds."
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            ctx.deleteSaved(deleting);
            setDeleting(null);
          }}
        />
      )}
    </Modal>
  );
};

export default SavedExportsModal;
