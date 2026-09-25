import { useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import Modal from "../../../components-dev/Modal";
import TextField from "../../../components-dev/inputs/TextField";
import SelectFilter from "../../../components-dev/filters/SelectFilter";
import { openNew } from "../../../features/dev/devTicketsSlice";
import type { TicketPriority } from "../../../api/tickets";
import type { TicketsCtx } from "./hooks";
import { attachmentProblem, fileSize } from "./ticketsUtils";

/**
 * Filing one.
 *
 * Two fields are required and the rest the queue works out for itself. There
 * is no company picker: the ticket's company is derived from whoever is
 * filing, and sending one that is not their own is a 400 rather than a silent
 * misfiling — so offering the choice would only be a way to fail.
 *
 * No assignee either. It lands in the queue and a tech takes it.
 */
const NewTicketModal = ({ ctx }: { ctx: TicketsCtx }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [category, setCategory] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const limits = ctx.lookups?.attachments;

  /**
   * Take what the picker gave, minus what it cannot send.
   *
   * De-duplicated by name because a picker can be opened repeatedly, and
   * checked here as well as by the endpoint — a ticket should not end up
   * filed with half its evidence missing.
   */
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const chosen = Array.from(list);
    const problem = chosen.map((f) => attachmentProblem(f, limits)).find(Boolean);
    setFileError(problem ?? null);
    const good = chosen.filter((f) => !attachmentProblem(f, limits));
    setFiles((have) => {
      const names = new Set(have.map((f) => f.name));
      return [...have, ...good.filter((f) => !names.has(f.name))];
    });
    // Without this, picking the same file twice fires no change event.
    if (picker.current) picker.current.value = "";
  };

  const close = () => ctx.dispatch(openNew(false));
  const ready = title.trim() !== "" && description.trim() !== "";

  const priorities = (ctx.lookups?.priorities ?? [
    "low",
    "normal",
    "high",
    "urgent",
  ]).map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }));

  const categories = [
    { value: "", label: "None" },
    ...(ctx.lookups?.categories ?? []).map((c) => ({
      value: String(c.id),
      label: c.name,
    })),
  ];

  return (
    <Modal
      isOpen
      onClose={close}
      modalClassName="bg-card_bg w-[620px] max-w-[94vw]"
    >
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-[17px] font-semibold">New ticket</h2>
          <p className="text-[12.5px] text-content/85 mt-1">
            Two fields are needed. Everything else the help desk works out.
          </p>
        </div>

        <TextField
          label="Title"
          value={title}
          placeholder="Printer jam at lane 3"
          onChange={setTitle}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium">What is happening</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Receipt printer stops after about ten receipts..."
            className="w-full border border-brand_line rounded-lg px-3 py-2 text-[13.5px] resize-none bg-custom-white"
          />
          <span className="text-[11px] text-content/85">
            This becomes the first message in the thread, so the tech reads it
            where the conversation is.
          </span>
        </label>

        <div className="flex gap-3">
          <label className="flex-1 flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium">Priority</span>
            <SelectFilter
              plain
              options={priorities}
              value={priority}
              onChange={(value) => setPriority((value || "normal") as TicketPriority)}
              className="w-full"
            />
          </label>
          <label className="flex-1 flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium">Category</span>
            <SelectFilter
              plain
              searchable
              searchPlaceholder="Find a category..."
              placeholder="None"
              options={categories}
              value={category}
              onChange={setCategory}
              className="w-full"
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[12.5px] font-medium">Screenshots</span>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={picker}
              type="file"
              multiple
              accept={limits?.extensions.join(",")}
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => picker.current?.click()}
              className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
            >
              Choose files
            </button>
            <span className="text-[11.5px] text-content/85">
              {limits
                ? `${limits.extensions.join(" ")} · up to ${fileSize(limits.maxBytes)}`
                : "A screenshot is usually the most useful thing you can send."}
            </span>
          </div>

          {files.map((one) => (
            <div
              key={one.name}
              className="flex items-center gap-2 bg-custom-white border border-brand_line rounded-lg px-3 py-1.5"
            >
              <span className="font-mono text-[12px] flex-1 min-w-0 truncate">
                {one.name}
              </span>
              <span className="text-[11.5px] text-content/85">
                {fileSize(one.size)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setFiles((have) => have.filter((f) => f.name !== one.name))
                }
                aria-label={`Remove ${one.name}`}
                className="text-content/85 hover:text-content transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}

          {fileError && (
            <span className="text-[11.5px] text-amber-900">{fileError}</span>
          )}
        </div>

        <p className="text-[11.5px] text-content/85 bg-custom-white border border-brand_line rounded-lg px-3 py-2 m-0">
          It files under your own company and lands in the queue unassigned.
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="text-[12.5px] font-medium px-4 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              void ctx.file(
                {
                  title,
                  description,
                  priority,
                  category_id: category ? Number(category) : null,
                },
                files,
              )
            }
            disabled={!ready || ctx.working}
            className="text-[12.5px] font-semibold px-5 py-1.5 rounded-lg bg-brand_navy text-custom-white hover:bg-brand_navy_hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ctx.working
              ? files.length
                ? "Sending and attaching..."
                : "Sending..."
              : "Send it"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NewTicketModal;
