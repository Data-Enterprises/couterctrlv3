// Hooks
import { useNewTicketForm } from "./hooks/newTicket";

// Redux

// API
import { type TicketPriority } from "../../../../../api/tickets";

// Utils
import { groupAsFile } from "../../../../../utils/pageCalls";
import { scopeLine, scopeOf } from "./utils/ticketOrigin";

// Components
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Modal from "../../../../../components-dev/Modal";
import Checkbox from "../../../../../components-dev/Checkbox";
import TextField from "../../../../../components-dev/inputs/TextField";
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";
import StoreChecklist from "../StoreChecklist";
import NewTicketAttachments from "./components/NewTicketAttachments";

interface NewTicketModalProps {
  /** Where the reporter was when they raised it. Absent when the form is
   *  opened from the help desk itself, which is nowhere in particular. */
  from?: { from: string; page?: string; area?: string } | null;
  /** Filing from another page closes back to that page rather than to the
   *  queue, so the caller says what closing means. */
  onClose?: () => void;
}

/**
 * Filing: two fields are required and the queue works out the rest. No
 * company picker: the server takes the filer's company and refuses any other.
 */
const NewTicketModal = ({ from, onClose }: NewTicketModalProps) => {
  const {
    ctx,
    origin,
    search,
    summary,
    list,
    optionsError,
    listed,
    narrowedTo,
    onlyStore,
    accessPage,
    chosen,
    picker,
    limits,
    addFiles,
    close,
    ready,
    priorities,
    categories,
    skip,
    setSkip,
    picked,
    setPicked,
    notAbout,
    setNotAbout,
    setShowAllStores,
    evidenceOpen,
    setEvidenceOpen,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    category,
    setCategory,
    files,
    setFiles,
    fileError,
    sendError,
    setSendError,
    kept,
    dropped,
  } = useNewTicketForm({ from, onClose });

  return (
    <Modal
      isOpen
      onClose={close}
      modalClassName="bg-card_bg w-[620px] max-w-[94vw] max-h-[88vh] flex flex-col"
    >
      <div className="flex-shrink-0 px-4 pt-4 pb-2.5">
        <h2 className="text-[17px] font-semibold">New ticket</h2>
        <p className="text-[12.5px] text-content/95 mt-1">
          {origin?.page
            ? `About ${origin.page}. Two fields are needed; the rest is filled in.`
            : "Two fields are needed. Everything else the help desk works out."}
        </p>
      </div>

      <div className="flex cc-scroll flex-col gap-3.5 px-4 pb-4">
        {/** What came with you from the page. */}
        {origin && (summary || kept.length > 0) && (
          <div className="rounded-lg border border-brand_line bg-bkg px-3 py-2.5">
            <div className="cc-caps-mono text-[9.5px]">
              From {origin.area ? `${origin.area} · ` : ""}
              {origin.page ?? origin.href}
            </div>

            {summary && (
              <div className="mt-1 text-[12.5px] font-medium">{summary}</div>
            )}

            {kept.length > 0 && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setEvidenceOpen((v) => !v)}
                  aria-expanded={evidenceOpen}
                  className="flex w-full items-center gap-1.5 text-left text-[11.5px] text-content/95"
                >
                  <span className="flex-1">
                    Attach what this page loaded ({chosen.length} of{" "}
                    {kept.length})
                  </span>
                  <ChevronDownIcon
                    className={`h-4 w-4 flex-none transition-transform duration-200 motion-reduce:transition-none ${
                      evidenceOpen ? "" : "-rotate-90"
                    }`}
                  />
                </button>

                {/* Its own capped scroll, so many datasets never push the
                    description field out of reach. */}
                {evidenceOpen && (
                  <div className="mt-1.5 flex max-h-[168px] flex-col gap-1 overflow-y-auto thin-scrollbar pr-1">
                    {kept.map((group) => (
                      <Checkbox
                        key={group.key}
                        checked={!skip.has(group.key)}
                        onChange={(on) =>
                          setSkip((have) => {
                            const next = new Set(have);
                            if (on) next.delete(group.key);
                            else next.add(group.key);
                            return next;
                          })
                        }
                        label={
                          <span className="min-w-0 truncate text-[12px] text-content">
                            {group.label}
                          </span>
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Named rather than silently dropped, so a tech knows something
                    was too big to send. */}
                {dropped.length > 0 && (
                  <div className="mt-1.5 text-[11px] text-content/95">
                    Too large to send — {dropped.map((g) => g.label).join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <TextField
          label="Title"
          value={title}
          placeholder="Printer jam at lane 3"
          onChange={setTitle}
        />

        <div className="flex gap-3">
          <label className="flex-1 flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium">Priority</span>
            <SelectFilter
              plain
              options={priorities}
              value={priority}
              onChange={(value) =>
                setPriority((value || "normal") as TicketPriority)
              }
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

        {onlyStore ? (
          <p className="m-0 text-[12.5px] text-content/95">
            About{" "}
            <span className="font-medium text-content">
              {onlyStore.store_name}
            </span>
            , your store.
          </p>
        ) : (
          <StoreChecklist
            options={listed}
            picked={picked}
            onPicked={setPicked}
            notAbout={notAbout}
            onNotAbout={setNotAbout}
            searchable={list.length > 12}
            loadError={optionsError}
            extra={
              <>
                {listed && listed.length < list.length && (
                  <button
                    type="button"
                    onClick={() => setShowAllStores(true)}
                    className="self-start text-[11.5px] font-medium text-brand_navy_hover underline underline-offset-2"
                  >
                    Showing the stores in this group. Show all {list.length} of
                    yours
                  </button>
                )}
                {accessPage && (
                  <span className="text-[11.5px] text-content/95">
                    About someone&apos;s access? Tick the store they work at, so
                    its manager sees this too.
                  </span>
                )}
              </>
            }
          />
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium">What is happening</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Receipt printer stops after about ten receipts..."
            className="w-full border border-brand_line rounded-lg px-3 py-2 text-[13.5px] resize-none bg-custom-white"
          />
          <span className="text-[11px] text-content/95">
            This becomes the first message in the thread, so the tech reads it
            where the conversation is.
          </span>
        </label>

        <NewTicketAttachments
          picker={picker}
          limits={limits}
          addFiles={addFiles}
          files={files}
          setFiles={setFiles}
          fileError={fileError}
        />

        <p className="text-[11.5px] text-content/95 bg-custom-white border border-brand_line rounded-lg px-3 py-2 m-0">
          It files under your own company and lands in the queue unassigned.
        </p>
      </div>

      {/* Section: Send/Cancel Buttons, own components? */}
      <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-brand_line px-4 py-3">
        <button
          type="button"
          onClick={close}
          className="text-[12.5px] cc-btn-outline"
        >
          Cancel
        </button>
        {sendError && (
          <p
            role="alert"
            className="mr-auto text-[11.5px] text-brand_danger m-0"
          >
            {sendError}
          </p>
        )}
        <button
          type="button"
          onClick={async () => {
            setSendError(null);
            const why = await ctx.file(
              {
                title,
                /** The scope goes under what they wrote, not over it. It is the first message in the thread, so a tech reads. */
                description: origin
                  ? `${description}

—
${scopeLine(search, origin, narrowedTo)}`
                  : description,
                priority,
                category_id: category ? Number(category) : null,
                // The stores are on the ticket as data now
                storeids: notAbout ? [] : picked,
              },
              origin
                ? [
                    ...files,
                    ...chosen.map(groupAsFile),
                    // The page, the search and the dates as a record. The
                    // stores ride on the ticket; this says what was on screen.
                    new File(
                      [
                        JSON.stringify(
                          scopeOf(search, origin, narrowedTo),
                          null,
                          2,
                        ),
                      ],
                      "scope.json",
                      { type: "application/json" },
                    ),
                  ]
                : files,
              // Filed from another page: there is no pane here to open it into, so the form closes and the toast is the receipt.
              onClose,
            );
            // A user with no company is told why, and that a manager can fix it (the server's own words).
            if (why) setSendError(why);
          }}
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
    </Modal>
  );
};

export default NewTicketModal;
