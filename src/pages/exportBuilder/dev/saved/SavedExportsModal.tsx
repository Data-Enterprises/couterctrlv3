// Hooks
import { useEffect, useState } from "react";
import { useExportBuilderCtx } from "../hooks";

// Redux
import { openSaved } from "../../../../features/dev/devExportBuilderSlice";

// Utils
import { describePayload, toPayload } from "../utils/savedExports";

// Components
import Modal from "../../../../components-dev/Modal";
import ConfirmDelete from "../../../../components-dev/ConfirmDelete";
import SavedExportsHeader from "./components/SavedExportsHeader";
import SaveCurrentCard from "./components/SaveCurrentCard";
import SavedExportRow from "./components/SavedExportRow";
import NoSavedExports from "./components/NoSavedExports";

/**
 * Configurations someone set up once and wants again. They live in S3, keyed
 * to the user, so they follow them to another machine. What is saved is the
 * question and never the dates: one loads onto whichever range is open, and
 * says what that range could not honour.
 */
const SavedExportsModal = () => {
  const ctx = useExportBuilderCtx();
  const [name, setName] = useState<string>("");
  const [note, setNote] = useState<string>("");
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
      modalClassName="bg-card_bg w-[720px] max-w-[94vw] max-h-[82vh] flex flex-col"
    >
      <div className="flex flex-1 flex-col gap-3 p-4 min-h-0">
        <SavedExportsHeader onClose={close} />

        {ctx.savedError && (
          <div className="flex-shrink-0 bg-severity_watch_bg border border-severity_watch_text/20 rounded-lg px-3 py-2 text-[12px] text-severity_watch_text">
            {ctx.savedError}
          </div>
        )}

        <SaveCurrentCard
          summary={describePayload(
            toPayload(ctx.config, ctx.source),
            ctx.source,
          )}
          name={name}
          setName={setName}
          note={note}
          setNote={setNote}
          busy={ctx.savedBusy}
          current={current}
          onSave={saveNew}
          onUpdate={(cur) =>
            ctx.saveCurrent(cur.name, cur.id, note.trim() || cur.description)
          }
        />

        <div className="cc-scroll flex flex-col gap-2">
          {ctx.saved.map((saved) => (
            <SavedExportRow
              key={saved.id}
              saved={saved}
              summary={describePayload(saved.payload, ctx.source)}
              isCurrent={saved.id === ctx.savedCurrentId}
              busy={ctx.savedBusy}
              onLoad={() => {
                ctx.applySaved(saved);
                setName(saved.name);
                setNote(saved.description ?? "");
                close();
              }}
              onDelete={() => setDeleting(saved.id)}
            />
          ))}

          {ctx.savedLoaded && ctx.saved.length === 0 && <NoSavedExports />}

          {!ctx.savedLoaded && ctx.savedBusy && (
            <div className="py-6 text-center text-[12.5px] text-content/95">
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
